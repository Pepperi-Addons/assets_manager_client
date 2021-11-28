import {  map } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { AddonService } from '.';
import { Observable } from 'rxjs';
import { GenericListComponent, GenericListDataSource } from '../generic-list/generic-list.component';
import { PepBreadCrumbItem } from '@pepperi-addons/ngx-lib/bread-crumbs';
import { IPepSearchStateChangeEvent } from '@pepperi-addons/ngx-lib/search';
import { AssetsService, assetsView, IAsset, sortBy } from '../../common/assets-service';
import { AddFolderComponent } from '../add-folder/add-folder.component';
import { EditFileComponent } from '../edit-file/edit-file.component';
import { IPepMenuItemClickEvent, PepMenuItem } from '@pepperi-addons/ngx-lib/menu';
import { PepDialogActionButton, PepDialogData } from '@pepperi-addons/ngx-lib/dialog';

@Component({
  selector: 'addon-module',
  templateUrl: './addon.component.html',
  styleUrls: ['./addon.component.scss'],
  providers: [TranslatePipe,AddFolderComponent,EditFileComponent]
})
export class AddonComponent implements OnInit {

    PepScreenSizeType = PepScreenSizeType;
    screenSize: PepScreenSizeType;
    // options: {key:string, value:string}[] = [];
    dataSource$: Observable<any[]>
    displayedColumns = ['Name', 'Description'];
    
    @ViewChild(GenericListComponent) assetsList: GenericListComponent;

    @Input() hostObject: any;
    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();

    breadCrumbsItems: Array<PepBreadCrumbItem> = [{key: '1', text: 'Main', title: 'Main'},
                                                  {key: '2', text: 'Sub folder', title: 'Sub folder'}];
    isOnPopUp: boolean = false;
    assetsHeaderTitle = '';
    searchString = '';
    searchAutoCompleteValues = [];
    
    currentView: assetsView = 'list';
    sortBy: sortBy = 'ascending';
    menuActions: Array<PepMenuItem>;
    selectedAssets :Array<IAsset> = [];
    assets: Array<IAsset> = [];

   constructor(
        public addonService: AddonService,
        public layoutService: PepLayoutService,
        public translate: TranslateService,
        public assetsService: AssetsService
    ) {

        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });
    }
    
    assetsDataSource: GenericListDataSource = {
        getList: async (state) => {
            const desktopTitle = await this.translate.get('SLIDESHOW.HEIGHTUNITS_REM').toPromise();
            this.assetsHeaderTitle = this.translate.instant('GRID.DEFAULT_TITLE');
             //let res: Promise<any[]> = this.json((pages) => {
              let  res =  this.assets.map(asset => ({
                Key: asset.key,
                Thumbnail: asset.thumbnailSrc,
                FileName: asset.key,
                Type: asset.mimeType, 
                Description: asset.description  
            }));

            return res;
        },

        getDataView: async () => {
            return {
                Context: {
                    Name: '',
                    Profile: { InternalID: 0 },
                    ScreenSize: 'Landscape'
                },
                Type: 'Grid',
                Title: '',
                Fields: [
                    {
                        FieldID: 'Thumbnail',
                        Type: "Image",
                        Title: this.translate.instant('GRID.COLUMN.THUMBNAIL'),
                        Mandatory: false,
                        ReadOnly: true
                    },
                    {
                        FieldID: 'FileName',
                        Type: 'TextBox',
                        Title: this.translate.instant('GRID.COLUMN.FILENAME'),
                        Mandatory: false,
                        ReadOnly: true
                    },
                    {
                        FieldID: 'Type',
                        Type: 'TextBox',
                        Title: this.translate.instant('GRID.COLUMN.TYPE'),
                        Mandatory: false,
                        ReadOnly: true
                    },
                    {
                        FieldID: 'Description',
                        Type: 'TextBox',
                        Title: this.translate.instant('GRID.COLUMN.DESCRIPTION'),
                        Mandatory: false,
                        ReadOnly: true
                    }
                ],
                Columns: [
                    { Width: 2 },
                    { Width: 15 },
                    { Width: 5 },
                    { Width: 78 },
                ],
                FrozenColumnsCount: 0,
                MinimumColumnWidth: 0
            }
        },

        getActions: async (objs) => {
            this.selectedAssets = objs.length > 0 ? objs  : [];
            return objs.length === 1 ? [
                {
                    action: 'edit',
                    title: this.translate.instant("ACTIONS.EDIT"),
                    handler: async (objs) => {
                        //this.editAsset(objs);
                        //this.navigationService.navigateToPage([objs[0].Key].toString());
                    }
                },
                {
                    title: this.translate.instant("ACTIONS.DELETE"),
                    handler: async (objs: IAsset[]) => {
                        if (objs.length > 0) {
                            //this.deletePage(objs[0].Key);
                        }
                    }
                }
            ] : 
            objs.length > 1 ? [{
                title: this.translate.instant("ACTIONS.DELETE"),
                handler: async (objs: IAsset[]) => {
                    if (objs.length > 0) {
                        //this.deletePage(objs[0].Key);
                    }
                }
            }
            ] : []
        }
    }
    
    ngOnInit(){
        for(var i=0; i<3 ; i ++){
            let asset = new IAsset('folder');
            asset.key = "Folder-"+ i.toString();
            this.assets.push(asset);
        }

        this.assetsList?.reload();
    }

    onSelectedRowChange(event){
        this.menuActions = event?.length ? event : [];
    }

    upload(e) {
        const fileListAsArray = Array.from(e);
        fileListAsArray.forEach((item, i) => {
          const file = (e as HTMLInputElement);
          //const url = URL.createObjectURL(file[i]);

          this.addNewFile(file[0]);
          //this.imgArr.push(url);
          //this.fileArr.push({ item, url: url });
        });    
    }
  
    assetURLChange(event){

    }

    buttonClick(event){
        
    }

    onMenuItemClicked(action: IPepMenuItemClickEvent){
        switch (action.source.text.toLowerCase()) {
            case "edit": {
               this.editAsset();
               break; 
            }
            case "delete": {
                this.showDeleteAssetMSG();
                break; 
             }
        }  
    }

    onBreadCrumbItemClick(event){

    }

    onSearchStateChanged(searchStateChangeEvent: IPepSearchStateChangeEvent) {
        // debugger;
    }

    onSearchChanged(search: any) {
        console.log(search);
        // debugger;
    }

    onSearchAutocompleteChanged(value) {
        console.log(value);
        // debugger;
    }

    sortToggle(event){
        this.sortBy = this.sortBy === 'ascending' ? 'ascending' : 'descending';
        // TODO -  SORTING IMPLEMENTATION
    }
     
    viewsToggle(event){
        this.currentView = this.currentView === 'list' ? 'thumbnail' : 'list';
        // TODO - REPLACE BETWEEN THE VIEWS IMPLEMENTATION
    }

    onAddFolderClick(event){
        this.assetsService.openDialog(AddFolderComponent,(data) => {
        this.addNewFolder(data)});
    }
    editAsset(){
        const asset = this.getSelectedAsset();
        if(asset){
        this.assetsService.openDialog(EditFileComponent,(res) => {
        this.updateAssetInfo(res)}, {'asset': asset , 'breadCrumbs': this.breadCrumbsItems});
        }
    }

    updateAssetInfo(iasset: IAsset){
        this.assets.forEach(asset => {
            if(asset.key === this.selectedAssets[0]['Key']){
                asset = iasset;
            }
        });

        this.assetsList.reload();
    }

    getSelectedAsset(){
        let retAsset = null;
        this.assets.forEach(asset => {
            if(asset.key === this.selectedAssets[0]['Key']){
                retAsset =  asset;
            }
        });

        return retAsset;
    }
    showDeleteAssetMSG(){
      
          const dialogData = new PepDialogData({
            content: 'Sure you want to delete these files?',
            showHeader: false,
            actionsType: 'cancel-delete',
            showClose: false,
          });

         this.assetsService.openDialogMsg(dialogData,() => {
             this.deleteAssets()});  
    }

    deleteAssets(){
        
    }

    addNewFile(f){
        let file = new IAsset('file');
        
        file.key = f.name;
        file.creationDate = new Date().getTime(); 
        file.modificationDate = f.lastModified;
        file.fileSize = f.size;
        file.mimeType = f.type;
        file.thumbnailSrc = 'https://images.squarespace-cdn.com/content/v1/5c8b13db65019feb12921ef4/1574655836868-D27Y5RC9J18111KAMD2C/Tilicho+Lake+1080x1080.jpg?format=1000w';
        this.assets.push(file);
        this.assetsList.reload();
    }

    addNewFolder(data){
        let folder = new IAsset(this.translate.instant('folder'));
        folder.key = data;
                        
        this.assets.push(folder);
        this.assetsList.reload();
        // TODO - NEED TO ADD A CALL TO ADD A NEW FOLDER
    };
   





}
