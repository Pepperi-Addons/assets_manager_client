import { Component, OnInit, Injectable, Input, Output, EventEmitter, Optional, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PepAddonService } from '@pepperi-addons/ngx-lib';
import { config } from '../../addon/addon.config';
import { Asset } from 'src/app/addon/addon.model';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'add-icon',
    templateUrl: './add-icon.component.html',
    styleUrls: ['./add-icon.component.scss']
})

@Injectable()
export class AddIconComponent implements OnInit {
    
    public varIcons;
    public dlgTitle: string = '';
    public selectedIcons: Record<string, Asset> = {};
    
    constructor(private dialogRef: MatDialogRef<AddIconComponent>,
                private addonService:  PepAddonService,
                public translate: TranslateService,
                @Inject(MAT_DIALOG_DATA) public data: any) 
                {
                    this.dlgTitle = this.translate.instant('ADD_ICON.TITLE');
       
                }

    ngOnInit(): void {
        this.varIcons = this.data.icons;
        if(!this.varIcons){
            this.getVarIcons();
        }
        
    }

    async getVarIcons(){
        const body = {
            
        };
  
        this.varIcons = await this.addonService.postAddonApiCall(config.AddonUUID, 'api', 'getVarIcons', body).toPromise();
    }

    close(event){
        this.dialogRef?.close({selectedIcons: null, varIcons: this.varIcons});
    }

    selectImage(icon){
        if(this.selectedIcons[icon.Name]){
            delete this.selectedIcons[icon.Name];
        }
        else{
            this.selectedIcons[icon.Name] = icon;
        }

        const numOfSelected = Object.keys(this.selectedIcons).length;
        const title = this.translate.instant('ADD_ICON.TITLE');
        this.dlgTitle =  title + (numOfSelected > 0 ? ` (${numOfSelected})` : '');
    }

    
    uploadIcons(event){
        this.dialogRef?.close({selectedIcons: this.selectedIcons, varIcons: this.varIcons});
    }

}