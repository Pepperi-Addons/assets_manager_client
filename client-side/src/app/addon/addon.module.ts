import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { PepNgxLibModule, PepAddonService, PepFileService } from '@pepperi-addons/ngx-lib';
import { PepTopBarModule } from '@pepperi-addons/ngx-lib/top-bar';
import { PepSizeDetectorModule } from '@pepperi-addons/ngx-lib/size-detector';
import { PepPageLayoutModule } from '@pepperi-addons/ngx-lib/page-layout';
import { PepButtonModule } from '@pepperi-addons/ngx-lib/button';
import { PepDialogModule } from '@pepperi-addons/ngx-lib/dialog';
import { PepMenuModule } from '@pepperi-addons/ngx-lib/menu';
import { PepDraggableItemsModule } from '@pepperi-addons/ngx-lib/draggable-items';
import { PepTextboxModule } from '@pepperi-addons/ngx-lib/textbox';
import { PepSelectModule } from '@pepperi-addons/ngx-lib/select';
import { PepListModule } from '@pepperi-addons/ngx-lib/list';
import { PepBreadCrumbsModule } from '@pepperi-addons/ngx-lib/bread-crumbs';
import { PepSearchModule } from '@pepperi-addons/ngx-lib/search';
import { PepSnackBarModule } from '@pepperi-addons/ngx-lib/snack-bar';
import { pepIconSystemClose, pepIconArrowDownAlt, pepIconSystemBin,PepIconModule, pepIconArrowTwoWaysVerT, PepIconRegistry, pepIconSystemDoc, pepIconSystemFolder, pepIconViewCardSm, pepIconViewLine, pepIconViewTable, pepIconSystemImage } from '@pepperi-addons/ngx-lib/icon';

import { PepGenericListModule } from '@pepperi-addons/ngx-composite-lib/generic-list';
import { PepFileStatusPanelModule }  from '@pepperi-addons/ngx-composite-lib/file-status-panel';

import { TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

import { AddonService } from './addon.service';
import { AssetsComponent } from './index';
import { config } from './addon.config';

import { AddFolderModule } from '../components/add-folder/add-folder.module';
import { AddIconModule } from '../components/add-icon/add-icon.module';
import { EditFileModule } from '../components/edit-file/edit-file.module';


const pepIcons = [
    pepIconViewTable,
    pepIconViewCardSm,
    pepIconSystemImage,
    pepIconArrowTwoWaysVerT,
    pepIconSystemFolder,
    pepIconSystemDoc,
    pepIconSystemClose, 
    pepIconArrowDownAlt, 
    pepIconSystemBin
];

export const routes: Routes = [
    {
        path: '',
        component: AssetsComponent
    }
];

@NgModule({
    declarations: [
        AssetsComponent,
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        MatSnackBarModule,
        MatTabsModule,
        PepNgxLibModule,
        PepListModule,
        PepBreadCrumbsModule,
        PepSizeDetectorModule,
        PepTopBarModule,
        PepPageLayoutModule,
        PepButtonModule,
        PepMenuModule,
        PepDialogModule,
        PepDraggableItemsModule,
        PepGenericListModule,
        PepTextboxModule,
        PepSelectModule,
        AddFolderModule,
        AddIconModule,
        PepFileStatusPanelModule,
        EditFileModule,
        PepIconModule,
        PepSearchModule,
        PepSnackBarModule,
        TranslateModule.forChild({
            loader: {
                provide: TranslateLoader,
                useFactory: (addonService: PepAddonService) => 
                    PepAddonService.createMultiTranslateLoader(config.AddonUUID, addonService, ['ngx-lib', 'ngx-composite-lib']),
                deps: [PepAddonService]
            }, isolate: false
        }),
        RouterModule.forChild(routes)
    ],
    exports:[AssetsComponent],
    providers: [
        TranslateStore,
        // When loading this module from route we need to add this here (because only this module is loading).
        AddonService
    ]
})
export class AssetsModule {
    constructor(
        translate: TranslateService,
        private pepIconRegistry: PepIconRegistry,
        private pepAddonService: PepAddonService
    ) {
        this.pepAddonService.setDefaultTranslateLang(translate);
        this.pepIconRegistry.registerIcons(pepIcons);
    }
}
