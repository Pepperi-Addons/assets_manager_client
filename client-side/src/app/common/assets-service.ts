import { UrlResolver } from "@angular/compiler";
import { Injectable } from "@angular/core";
import { PepDialogActionButton, PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';

/*
    None - the asset will not be included in the sync process thus will not be accessible
    Device - the asset will be synced to the device and will be available offline 
    Device Thumbnail - only the thumbnail version of the asset will be synced to the device. If the asset does not support thumbnail (PDFs etc.) then this option is the same as 'Device' 
    Always - always
*/
export type syncOption = 'none' | 'device' | 'deviceThumbnail' | 'always';

export class IAsset {
    key: string;
    creationDate: string;
    modificationDate: string;
    hidden: boolean = false;
    description: string;
    ownerUUID : string;
    sync: syncOption;  
    url: string;
    thumbnail : boolean;
    mimeType: string;
}

@Injectable({
    providedIn: 'root',
})
export class AssetsService {

    constructor(public dialogService: PepDialogService){


    }
openDialog(comp: any){
    const config = this.dialogService.getDialogConfig({}, 'inline');
    this.dialogService.openDialog(comp, { object: null}, config);
}
openDialogMsg(title: string, content: string, callback?: any) {
    const actionButton: PepDialogActionButton = {
      title: "OK",
      className: "",
      callback: callback,
    };

    const dialogData = new PepDialogData({
      title: title,
      content: content,
      actionButtons: [actionButton],
      actionsType: "custom",
      showClose: false,
    });

    this.dialogService.openDefaultDialog(dialogData);
}
// cancelClicked() {
//     this.goBack();
// }
}