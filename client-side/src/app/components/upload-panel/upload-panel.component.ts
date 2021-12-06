import { Component, OnInit, Injectable, Input, Output, EventEmitter, Optional, Inject } from '@angular/core';
import { assetProcess } from 'src/app/common/assets-service';

@Component({
    selector: 'upload-panel',
    templateUrl: './upload-panel.component.html',
    styleUrls: ['./upload-panel.component.scss']
})

@Injectable()
export class UploadPanelComponent implements OnInit {
    
    public folderName: string = '';

    @Input() assetsList: Array<assetProcess> = [];
    
    constructor() {
       
    }
    ngOnInit(): void {
 
    }

    closeClick(event){

    }


}