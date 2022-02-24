import { UrlResolver } from "@angular/compiler";
import jwt from 'jwt-decode';
import { Injectable } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { PepDialogActionButton, PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { PapiClient } from "@pepperi-addons/papi-sdk";
import { HttpClient } from '@angular/common/http'
import { PepHttpService, PepSessionService } from "@pepperi-addons/ngx-lib";
import { Observable } from "rxjs";
import { config } from "../addon.config";

/*  None - the asset will not be included in the sync process thus will not be accessible
    Device - the asset will be synced to the device and will be available offline 
    Device Thumbnail - only the thumbnail version of the asset will be synced to the device. If the asset does not support thumbnail (PDFs etc.) then this option is the same as 'Device' 
    Always - always */

export type syncOption = "None" | "Device" | "DeviceThumbnail" | "Always";
export type allowedAssetsTypes = 'images' | 'documents' | 'all';
export type selectionType = 'single' | 'multiple';
export type assetsView = 'list' | 'thumbnail';
export type sortBy = 'ascending' | 'descending' ;
export type uploadStatus = 'uploading' | 'done' | 'failed' | 'hidden';

export class Thumbnails { 
    Size: string = '200x200';
    URL: string = '';
}

export class assetProcess {
    key: number;
    name = '';
    status: uploadStatus = 'uploading';
}

export class IAsset {

    Key: string = ''; // mandatory, unique, /my-images/7535.jpg /'s in the name will organize the files in folders
    Folder: ""; // readonly,
    Name: ""; // readonly,
    Description: string = ''; // optional
    MIME: string  = ''; //image/jpeg... (file type) or "pepperi/folder"
    Thumbnails: Array<Thumbnails> = [ // optional
        {
            Size: '', // '200x200', // Only for image type
            URL: '', // readonly "http://cdn.pepperi.com/private_pfs/dakhdakhd_200x200.jpg"
        }
    ];
    Sync: syncOption = 'None'; // optional
    URL: string = ""; // Read only. the CDN URL
    URI: string = ""; // mandatory on create/update , empty "URI" means a creation of a folder , Can be a http URL or base64 data URI
    Hidden: string = 'false';

    creationDate: number;
    modificationDate: number;
    
    ownerUUID : string = '';
    fileSize: string = '0';

    constructor(mimeType = null){
        //this.mimeType = mimeType;
    }
}

@Injectable({
    providedIn: 'root',
})
export class AssetsService {
    
    addonURL = '';
    accessToken = '';
    parsedToken: any
    papiBaseURL = ''
    addonUUID;

    get papiClient(): PapiClient {
        return new PapiClient({
            baseURL: this.papiBaseURL,
            token: this.session.getIdpToken(),
            addonUUID: this.addonUUID,
            suppressLogging:true,
    
        })
    }
    
    constructor(
        public session:  PepSessionService,
        public dialogService: PepDialogService,
        private httpClient: HttpClient,
        private pepHttp: PepHttpService
    ) {
        this.addonUUID = config.AddonUUID;
        this.addonURL = `/addons/files/${this.addonUUID}`;
        const accessToken = this.session.getIdpToken();
        this.parsedToken = jwt(accessToken);
        this.papiBaseURL = this.parsedToken["pepperi.baseurl"];
    }

     getAssets(query?: string) {
        let url = `/addons/files/${this.addonUUID}`
       //query = '?order_by="UID"';
       if (query) {
            url = url + query;
        }
        // https://papi.pepperi.com/V1.0/addons/files/714671a5-5274-4668-97fa-e122dd3fc542?folder='/'
        return this.papiClient.get(encodeURI(url));
        //return this.pepGet(encodeURI(url)).toPromise();
    }

    async createAsset(asset: IAsset, query?: string, callback = null){
    return new Promise(async (resolve, reject) => {
        let body = {
                Key: asset.Key,
                Description: asset.Description,
                MIME: asset.MIME,
                Sync: asset.Sync,
                Thumbnails: asset.Thumbnails,
                URI: asset.URI || '',
                Hidden: asset.Hidden
        };

        //let res = await this.papiClient.addons.api.uuid(this.addonUUID).file('api').func('create_asset').post(undefined, body);
       await this.httpClient.post('http://localhost:4500/api/create_asset', body, {
        headers: {
            'Authorization': 'Bearer ' + this.accessToken
        }
       }).subscribe((res) => {
            //resolve(res);
            if(callback){
                callback(res);
            }
        });
    });
        //this.papiClient.post(encodeURI(url),body);
    }

    async get(endpoint: string): Promise<any> {
        return await this.papiClient.get(endpoint);
    }

    async post(endpoint: string, body: any): Promise<any> {
        return await this.papiClient.post(endpoint, body);
    }

    pepGet(endpoint: string): Observable<any> {
        return this.pepHttp.getPapiApiCall(endpoint);
    }

    pepPost(endpoint: string, body: any): Observable<any> {
        return this.pepHttp.postPapiApiCall(endpoint, body);

    }

    openDialog(comp: any, callBack, data = {}){
    
        let config = this.dialogService.getDialogConfig({}, 'inline');
            config.disableClose = true;
            config.minWidth = '29rem'; // THE EDIT MODAL WIDTH

        let dialogRef: MatDialogRef<any> = this.dialogService.openDialog(comp, data, config);

        dialogRef.afterClosed().subscribe((value) => {
            if (value !== undefined && value !== null) {
            callBack(value);
            }
        });
    }

    openDialogMsg(dialogData: PepDialogData, callback?: any) {
    
    this.dialogService.openDefaultDialog(dialogData).afterClosed()
            .subscribe((isDeletePressed) => {
                if (isDeletePressed) {
                    callback();
                }
        });
    }

    formatFileSize(bytes,decimalPoint) {
        if(bytes == 0) return '0 Bytes';
        var k = 1000,
            dm = decimalPoint || 2,
            sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }
}