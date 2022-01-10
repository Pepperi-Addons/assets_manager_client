import { UrlResolver } from "@angular/compiler";
import { Injectable } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { PepDialogActionButton, PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { AddonService } from '../../app/components/assets-manager/addon.service';
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
    Thumbnails: [ // optional
        {
            Size: string, // '200x200', // Only for image type
            URL: string, // readonly "http://cdn.pepperi.com/private_pfs/dakhdakhd_200x200.jpg"
        }
    ];
    Sync: syncOption = 'None'; // optional
    URL: string = ""; // Read only. the CDN URL
    URI: string = ""; // mandatory on create/update , empty "URI" means a creation of a folder , Can be a http URL or base64 data URI


    creationDate: number;
    modificationDate: number;
    hidden: boolean = false;
    
    ownerUUID : string = '';
    url: string  = '';
    thumbnail : boolean = false;
    thumbnailSrc: string = '';
    
    fileSize: string = '0';
    dimension: string = '';

    constructor(mimeType = null){
        //this.mimeType = mimeType;
    }
}

@Injectable({
    providedIn: 'root',
})
export class AssetsService {

    constructor(public dialogService: PepDialogService, private addonService: AddonService){
        
    }

    getAssets(query?: string) {
        let url = `/addons/files/${'714671a5-5274-4668-97fa-e122dd3fc542'}`
       
       if (query) {
            url = url + query;
        }
        // https://papi.pepperi.com/V1.0/addons/files/714671a5-5274-4668-97fa-e122dd3fc542?folder='/'
        return this.addonService.papiClient.get(encodeURI(url));
        //return this.addonService.pep pepGet(encodeURI(url)).toPromise();
    }

    createAsset(asset: IAsset, query?: string){
        let url = `/addons/files/${'714671a5-5274-4668-97fa-e122dd3fc542'}`
       
        let body = {
                Key: asset.Key,
                Description: asset.Description,
                MIME: asset.MIME,
                Sync: asset.Sync,
                Thumbnails: asset.Thumbnails,
                URI: asset.URI
        };
        
        this.addonService.papiClient.post(encodeURI(url),body);
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