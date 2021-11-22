import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddFolderComponent } from './add-folder.component';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';


@NgModule({
    declarations: [
        AddFolderComponent
    ],
    imports: [
        CommonModule,
        PepTextboxModule,
    ],
    exports: [AddFolderComponent]
})
export class AddFolderModule { }