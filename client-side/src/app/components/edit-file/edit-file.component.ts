import { Component, OnInit, Injectable, Input, Output, EventEmitter, Optional, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PepBreadCrumbItem } from '@pepperi-addons/ngx-lib/bread-crumbs';
import { IAsset } from '../../addon/addon.model';

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

    constructor(private dialogRef: MatDialogRef<EditFileComponent>, 
                @Inject(MAT_DIALOG_DATA) public data: any) {
       
                    
    }
    ngOnInit(): void {
        this.breadCrumbsItems = this.data?.breadCrumbs || [];
        this.assetNmae = this.data?.asset?.Key || '';
        //this.creationDate = new Date(this.data.asset.creationDate).toUTCString() || '';
        this.creationDate = new Date(this.data.asset.ModificationDateTime).toUTCString() || '';
    }

    close(event){
        this.dialogRef?.close(this.data.asset);
    }


    assetsElementClick(event){

    }

    assetsFileChange(event){
       // TODO - NEED TO CHANGE THE uri ... UPLOAD THE IMAGE AND GET IT LIKE BASE 64 
    }

    updateAssetInfo(event){
        if(event.source.key == 'delete'){
            this.data.asset.Hidden = true;
        }

        this.dialogRef?.close(this.data.asset);
    }
}