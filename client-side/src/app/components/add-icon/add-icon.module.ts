import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AddIconComponent } from './add-icon.component';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepSkeletonLoaderModule } from '@pepperi-addons/ngx-lib/skeleton-loader';

@NgModule({
    declarations: [
        AddIconComponent
    ],
    imports: [
        CommonModule,
        PepTopBarModule,
        PepTextboxModule,
        PepButtonModule,
        PepDialogModule,
        PepSkeletonLoaderModule,
        TranslateModule.forChild()
    ],
    exports: [AddIconComponent]
})
export class AddIconModule { }