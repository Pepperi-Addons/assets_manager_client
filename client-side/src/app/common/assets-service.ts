import { UrlResolver } from "@angular/compiler";
import { Injectable } from "@angular/core";
import { MatDialogRef } from "@angular/material/dialog";
import { PepDialogActionButton, PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';

/*  None - the asset will not be included in the sync process thus will not be accessible
    Device - the asset will be synced to the device and will be available offline 
    Device Thumbnail - only the thumbnail version of the asset will be synced to the device. If the asset does not support thumbnail (PDFs etc.) then this option is the same as 'Device' 
    Always - always */

export type syncOption = 'none' | 'device' | 'deviceThumbnail' | 'always';
export type assetsView = 'list' | 'thumbnail';
export type sortBy = 'ascending' | 'descending' ;

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
    fileSize: number = 0;

    constructor(mimeType = null){
        this.mimeType = mimeType;
        this.thumbnailSrc = mimeType === 'folder' ? 'https://upload.wikimedia.org/wikipedia/commons/5/59/OneDrive_Folder_Icon.svg' : '';
    }
}

@Injectable({
    providedIn: 'root',
})
export class AssetsService {

    constructor(public dialogService: PepDialogService){


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
// cancelClicked() {
//     this.goBack();
// }
}