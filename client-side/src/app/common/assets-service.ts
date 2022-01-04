import { UrlResolver } from "@angular/compiler";
import { Injectable } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { PepDialogActionButton, PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';

/*  None - the asset will not be included in the sync process thus will not be accessible
    Device - the asset will be synced to the device and will be available offline 
    Device Thumbnail - only the thumbnail version of the asset will be synced to the device. If the asset does not support thumbnail (PDFs etc.) then this option is the same as 'Device' 
    Always - always */

export type syncOption = 'none' | 'device' | 'deviceThumbnail' | 'always';
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
    key: string = '';
    creationDate: number;
    modificationDate: number;
    hidden: boolean = false;
    description: string = '';
    ownerUUID : string = '';
    sync: syncOption = 'none'; 
    url: string  = '';
    thumbnail : boolean = false;
    thumbnailSrc: string = '';
    mimeType: string  = '';
    fileSize: string = '0';
    dimension: string = '';

    constructor(mimeType = null){
        this.mimeType = mimeType;
    }
}

@Injectable({
    providedIn: 'root',
})
export class AssetsService {

    constructor(public dialogService: PepDialogService){


    }

    getAssets(query?: string) {
        // let url = `/addons/api/${this.addonService.addonUUID}/api/collections`
        // if (query) {
        //     url = url + query;
        // }
        // return this.addonService.pepGet(encodeURI(url)).toPromise();
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