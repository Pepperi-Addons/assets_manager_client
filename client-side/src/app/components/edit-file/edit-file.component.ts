import { Component, OnInit, Injectable, Input, Output, EventEmitter, Optional, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PepBreadCrumbItem } from '@pepperi-addons/ngx-lib/bread-crumbs';
import { AddonService } from 'src/app/addon/addon.service';
import { Asset } from '../../addon/addon.model';

@Component({
    selector: 'edit-file',
    templateUrl: './edit-file.component.html',
    styleUrls: ['./edit-file.component.scss']
})

@Injectable()
export class EditFileComponent implements OnInit {
    
    @Input() breadCrumbsItems: Array<PepBreadCrumbItem> = [];

    assetNmae: string = '';
    creationDate: string = '';
    isImageFile = false;
    fileSize = '';
    uploadedBy = '';

    constructor(
        private addonService: AddonService,
        private dialogRef: MatDialogRef<EditFileComponent>, 
        @Inject(MAT_DIALOG_DATA) public data: any) {
       
                    
    }

    ngOnInit(): void  {
        this.uploadedBy = '';
        this.breadCrumbsItems = this.data?.breadCrumbs || [];
        this.isImageFile = this.data?.asset?.MIME.toLowerCase().indexOf('image') > -1 ? true : false;
        this.assetNmae = this.data?.asset?.Key || '';
        this.creationDate = new Date(this.data.asset.ModificationDateTime).toUTCString() || '';
        
        
        if (this.data?.asset?.FileSize > 0) {
            this.fileSize = this.addonService.formatFileSize(this.data?.asset?.FileSize, 2);
        }
    }

    async ngAfterViewInit(): Promise<void> {
        const details = await this.addonService.getUserDetailsByUUID(this.data.asset.UploadedBy);
        this.uploadedBy = details?.FirstName != null ? `${details.FirstName} ${details.LastName}` : ''; 
    }

    close(event) {
        this.dialogRef?.close(null);
    }

    assetsElementClick(event) {

    }

    assetsFileChange(event) {
        this.data.asset.URI = event?.fileStr || '';
        //we dont change the file name , this is the key by now
        //this.data.asset.Key = event.fileName;
        this.data.asset.ModificationDateTime = new Date();
        this.data.asset.MIME = event?.fileStr.match(/[^:]\w+\/[\w-+\d.]+(?=;|,)/)[0] || '';
    }

    updateAssetInfo(event) {
        if(event.source.key == 'delete') {
            this.data.asset.Hidden = true;
        }

        this.dialogRef?.close(this.data.asset);
    }

    syncValueChange(event){
        this.data.asset.Sync = event ? "Device" : 'None';
    }
}