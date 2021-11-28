import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateLoader, TranslateService, TranslateStore } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { PepFileService, PepAddonService, PepNgxLibModule } from '@pepperi-addons/ngx-lib';
import { config } from '../../addon.config';
import { MultiTranslateHttpLoader } from 'ngx-translate-multi-http-loader';
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
        PepTextareaModule,
        
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (http: HttpClient, fileService: PepFileService, addonService: PepAddonService) => 
                    PepAddonService.createDefaultMultiTranslateLoader(http, fileService, addonService, config.AddonUUID),
                deps: [HttpClient, PepFileService, PepAddonService],
            }, isolate: false
        }),
    ],
    exports: [EditFileComponent]
})
export class EditFileModule { }