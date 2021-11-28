import { Component, OnInit, Injectable, Input, Output, EventEmitter, Optional, Inject } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'add-folder',
    templateUrl: './add-folder.component.html',
    styleUrls: ['./add-folder.component.scss']
})

@Injectable()
export class AddFolderComponent implements OnInit {
    
    public folderName: string = '';
    constructor(private dialogRef: MatDialogRef<AddFolderComponent>) {
       
    }
    ngOnInit(): void {
 
    }

    close(event){
        this.dialogRef?.close();
    }

    addFolder(event){
        this.dialogRef?.close(this.folderName);
    }

}