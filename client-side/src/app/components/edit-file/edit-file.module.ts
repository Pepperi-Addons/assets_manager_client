import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { EditFileComponent } from './edit-file.component';
import { PepBreadCrumbsModule } from '@pepperi-addons/ngx-lib/bread-crumbs';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepTextareaModule } from '@pepperi-addons/ngx-lib/textarea';
import { PepCheckboxModule } from '@pepperi-addons/ngx-lib/checkbox';
import { PepSeparatorModule } from '@pepperi-addons/ngx-lib/separator';
import { PepAttachmentModule } from '@pepperi-addons/ngx-lib/attachment';
import { PepImageModule  } from '@pepperi-addons/ngx-lib/image';

@NgModule({
    declarations: [
        EditFileComponent
    ],
    imports: [
        CommonModule,
        PepTopBarModule,
        PepTextboxModule,
        PepButtonModule,
        PepBreadCrumbsModule,
        PepDialogModule,
        PepCheckboxModule,
        PepSeparatorModule,
        PepAttachmentModule,
        PepImageModule,
        PepTextareaModule,
        TranslateModule.forChild()
    ],
    exports: [EditFileComponent]
})
export class EditFileModule { }