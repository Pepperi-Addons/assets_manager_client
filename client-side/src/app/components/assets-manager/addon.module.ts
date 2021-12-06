import { MatCardModule } from '@angular/material/card';
import { PepListModule } from '@pepperi-addons/ngx-lib/list';
import { AddonService } from './addon.service';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
// import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { MultiTranslateHttpLoader } from 'ngx-translate-multi-http-loader';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepHttpService, PepFileService, PepNgxLibModule, PepAddonService, PepCustomizationService } from '@pepperi-addons/ngx-lib';
import { AddonComponent } from './index';
import {PepperiTableComponent} from '../addon/pepperi-table.component'
import { MatDialogModule } from '@angular/material/dialog';
import { PepDialogService } from '@pepperi-addons/ngx-lib/dialog';

import { GenericListModule } from '../generic-list/generic-list.module';
import { pepIconArrowTwoWaysVerT, PepIconModule, PepIconRegistry, pepIconSystemDoc, pepIconSystemFolder, pepIconViewCardSm, pepIconViewLine, pepIconViewTable } from '@pepperi-addons/ngx-lib/icon';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';
import { PepBreadCrumbsModule } from '@pepperi-addons/ngx-lib/bread-crumbs';
import { PepSearchModule } from '@pepperi-addons/ngx-lib/search';
import { AddFolderModule } from '../add-folder/add-folder.module';
import { UploadPanelModule } from '../upload-panel/upload-panel.module';
import { EditFileModule } from '../edit-file/edit-file.module';
const pepIcons = [
    pepIconViewTable,
    pepIconViewCardSm,
    pepIconArrowTwoWaysVerT,
    pepIconSystemFolder,
    pepIconSystemDoc,
];

export function createTranslateLoader(http: HttpClient, fileService: PepFileService, addonService: PepAddonService) {
    const translationsPath: string = fileService.getAssetsTranslationsPath();
    const translationsSuffix: string = fileService.getAssetsTranslationsSuffix();
    const addonStaticFolder = addonService.getAddonStaticFolder();

    return new MultiTranslateHttpLoader(http, [
        {
            prefix:
                addonStaticFolder.length > 0
                    ? addonStaticFolder + translationsPath
                    : translationsPath,
            suffix: translationsSuffix,
        },
        {
            prefix:
                addonStaticFolder.length > 0
                    ? addonStaticFolder + "assets/i18n/"
                    : "/assets/i18n/",
            suffix: ".json",
        },
    ]);
}

@NgModule({
    declarations: [
        AddonComponent,
        PepperiTableComponent
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        MatDialogModule,
        MatCardModule,
        //// When not using module as sub-addon please remark this for not loading twice resources
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: createTranslateLoader,
                deps: [HttpClient, PepFileService, PepAddonService]
            }, isolate: false
        }),
        //// Example for importing tree-shakeable @pepperi-addons/ngx-lib components to a module
        PepNgxLibModule,
        PepButtonModule,
        PepSelectModule,
        PepTopBarModule,
        PepListModule,

        GenericListModule,
        PepIconModule,
        PepTextboxModule,
        PepMenuModule,
        PepBreadCrumbsModule,
        PepSearchModule,
        AddFolderModule,
        UploadPanelModule,
        EditFileModule


    ],
    exports:[AddonComponent],
    providers: [
        AddonService,
        HttpClient,
        TranslateStore,
        PepHttpService,
        PepAddonService,
        PepFileService,
        PepCustomizationService,
        PepDialogService
    ]
})
export class AddonModule {
    constructor(
        private pepperiIconRegistry: PepIconRegistry,
          translate: TranslateService
      ) {

        this.pepperiIconRegistry.registerIcons(pepIcons);

        let userLang = 'en';
        translate.setDefaultLang(userLang);
        userLang = translate.getBrowserLang().split('-')[0]; // use navigator lang if available

        if (location.href.indexOf('userLang=en') > -1) {
            userLang = 'en';
        }
        // the lang to use, if the lang isn't available, it will use the current loader to get them
        translate.use(userLang).subscribe((res: any) => {
            // In here you can put the code you want. At this point the lang will be loaded
        });
    }
}
