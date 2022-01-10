import { map } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2, ViewChild } from "@angular/core";
import { PepAddonService, PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { AddonService } from '.';
import { Observable } from 'rxjs';
import { GenericListComponent, GenericListDataSource } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { PepBreadCrumbItem } from '@pepperi-addons/ngx-lib/bread-crumbs';
import { IPepSearchStateChangeEvent } from '@pepperi-addons/ngx-lib/search';
import { allowedAssetsTypes, assetProcess, AssetsService, assetsView, IAsset, selectionType, sortBy } from '../../common/assets-service';
import { AddFolderComponent } from '../add-folder/add-folder.component';
import { EditFileComponent } from '../edit-file/edit-file.component';
import { IPepMenuItemClickEvent, PepMenuItem } from '@pepperi-addons/ngx-lib/menu';
import { PepDialogActionButton, PepDialogData } from '@pepperi-addons/ngx-lib/dialog';
import { IPepFormFieldClickEvent } from '@pepperi-addons/ngx-lib/form';

@Component({
  selector: 'addon-module',
  templateUrl: './addon.component.html',
  styleUrls: ['./addon.component.scss'],
  providers: [TranslatePipe,AddFolderComponent,EditFileComponent]
})
export class AddonComponent implements OnInit {

    PepScreenSizeType = PepScreenSizeType;
    screenSize: PepScreenSizeType;

    dataSource$: Observable<any[]>
    
    @ViewChild(GenericListComponent) assetsList: GenericListComponent;
    @ViewChild('breadCrumbs') breadCrumbs: ElementRef;
    @ViewChild('pepFileStatus') pepFileStatus: ElementRef;
    
    @Input() currentFolder: string = '/';
    @Input() maxFileSize: number = 100000;
    @Input() isOnPopUp: boolean = false;
    @Input() allowedAssetsTypes: allowedAssetsTypes = 'all';
    @Input() selectionType: selectionType = 'multiple';

    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();

    imagesPath = '';
    breadCrumbsItems: Array<PepBreadCrumbItem> = [];
    validateMsg: string = '';
    assetsHeaderTitle = '';
    searchString = '';
    searchAutoCompleteValues = [];
    
    currentView: assetsView = 'list';
    sortBy: sortBy = 'ascending';
    menuActions: Array<PepMenuItem>;
    selectedAssets: Array<IAsset> = [];
    assets: Array<IAsset> = [];
    assetsStack: Array<assetProcess> = [];
    stackIndex: number = 0;

   constructor(
        public addonService: AddonService,
        public layoutService: PepLayoutService,
        private pepAddonService: PepAddonService,
        public translate: TranslateService,
        public assetsService: AssetsService,
        private renderer: Renderer2,
    ) {
        this.imagesPath = this.pepAddonService.getAddonStaticFolder() + 'assets/images/';
        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });
        
    }  

    async ngOnInit(){
        const folder = await this.translate.get('ADD_FOLDER.FOLDER').toPromise();

        this.setBreadCrumbs();
    }
    
    setBreadCrumbs(){
        if(this.breadCrumbsItems.length === 0){
            this.breadCrumbsItems =  [{key: "/", text: "Main", title: "Main"}] ;
        }
        else{

            let folderIndex : number = this.breadCrumbsItems.map((item,index) => {
                if(item.key == this.currentFolder)
                    return index;
            })[0];

            if(folderIndex === undefined){
                this.breadCrumbsItems.push({key: this.currentFolder, text: this.currentFolder, title: this.currentFolder}) ;
            }
            else{
                this.breadCrumbsItems.length = (folderIndex + 1);
            }
        }

        
        this.assetsList.reload();
    }
    assetsDataSource: GenericListDataSource = {
 
        getList: async (state) => {
            const desktopTitle = await this.translate.get('SLIDESHOW.HEIGHTUNITS_REM').toPromise();
            this.assetsHeaderTitle = this.translate.instant('GRID.DEFAULT_TITLE');

            let res = await this.assetsService.getAssets("?folder=" + this.currentFolder);
            if (state.searchString != "") {
              //res = res.filter(collection => collection.Name.toLowerCase().includes(state.searchString.toLowerCase()))
            }
            
            res.forEach( (row, index) =>  {
                res[index].Thumbnail = row.MIME === 'pepperi/folder' ?  this.imagesPath + 'system-folder.svg' : row.URL; 
             });
             
            this.assets = res;
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
                        Title: 'GRID.COLUMN.THUMBNAIL',
                        Mandatory: false,
                        ReadOnly: true
                    },
                    {
                        FieldID: 'Name',
                        Type: 'TextBox',
                        Title: 'GRID.COLUMN.FILENAME',
                        Mandatory: false,
                        ReadOnly: true,
                      
                    },
                    {
                        FieldID: 'MIME',
                        Type: 'TextBox',
                        Title: 'GRID.COLUMN.TYPE',
                        Mandatory: false,
                        ReadOnly: true
                    },
                    {
                        FieldID: 'Description',
                        Type: 'TextBox',
                        Title: 'GRID.COLUMN.DESCRIPTION',
                        Mandatory: false,
                        ReadOnly: true
                    }
                ],
                Columns: [
                    { Width: 7 },
                    { Width: 18 },
                    { Width: 15 },
                    { Width: 60 }
                ],
                FrozenColumnsCount: 0,
                MinimumColumnWidth: 0
            }
        },

        getActions: async (objs) => {
            this.selectedAssets = objs.length > 0 ? objs  : [];
            const actions = [];
            if (objs.length === 1) {
              actions.push({
                title: this.translate.instant("ACTIONS.EDIT"),
                handler: async (objs) => {
                    if(objs[0].MIME === 'pepperi/folder'){
                        this.onAddFolderClick(null);
                        //this.addNewFolder(objs[0]);
                    }
                    else{
                        this.editAsset(objs[0]);
                    }
                }
              });
            }
            if (objs.length >= 1) {
              actions.push({
                title: this.translate.instant("ACTIONS.DELETE"),
                handler: async (objs) => {
                    if (objs.length > 0) {
                        this.showDeleteAssetMSG();
                     }
                }
              });
            }
      
            return actions;
          }
    }
    

    onSelectedRowChange(event){
        this.menuActions = event?.length ? event : [];
    }

    upload(e) {
        const fileListAsArray = Array.from(e);
        fileListAsArray.forEach((item, i) => {
          const file = (e as HTMLInputElement);
          
          this.addNewFile(file[0]);

        });    
    }
  
    assetURLChange(event){

    }

    buttonClick(event){
        
    }

    onMenuItemClicked(action: IPepMenuItemClickEvent){
  
        switch (action.source.text.toLowerCase()) {
            case "edit asset info": {
               //this.editAsset();
               break; 
            }
            case "delete": {
                //this.showDeleteAssetMSG();
                break; 
             }
        }  
    }

    onBreadCrumbItemClick(event){
        if(this.currentFolder === event.source.key){
            return false;
        }

        this.currentFolder = event.source.key;
        this.setBreadCrumbs();
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
    editAsset(asset){
        
        asset = this.getSelectedAsset(asset.UID)[0];

        if(asset){
        this.assetsService.openDialog(EditFileComponent,(res) => {
        this.updateAssetInfo(res)}, {'asset': asset , 'breadCrumbs': this.breadCrumbsItems});
        }
    }

    updateAssetInfo(iasset: IAsset){
        this.assets.forEach(asset => {
            if(asset.Key === this.selectedAssets[0]['Key']){
                asset = iasset;
            }
        });

        this.assetsList.reload();
    }

    getSelectedAsset(uuid?: string){

        return this.assets.filter(row => row['UID']  == uuid );

    }

    onCustomizeFieldClick(fieldClickEvent: IPepFormFieldClickEvent){
        const asset = (this.getSelectedAsset(fieldClickEvent.id))[0];
        if( asset.MIME === 'pepperi/folder'){
            this.currentFolder = asset.Key;
            this.setBreadCrumbs();
            return false;
        }
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

    onDragOver(event) {
        event.preventDefault();
    }
    
    // From drag and drop
    onDropSuccess(event) {
        event.preventDefault();
        if(event?.dataTransfer?.files){
            Array.from(event.dataTransfer.files).forEach(file => {
                this.addNewFile(file);
            });
        }
    }

    toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    async addNewFile(f){
        var self = this;
        let file = new IAsset('file');

        //Check mime types is allowed
        if(f && f.type.indexOf('image/') > -1){
            if(['images', 'all'].includes(this.allowedAssetsTypes)){
                const url = URL.createObjectURL(f);
                
                // get the base 64 string;
                file.URI = (await this.toBase64(f)) as string;
                file.Thumbnails = [
                    {
                        "Size": '200x200' as string,
                        "URL": ""
                    }
                ];
                var img = new Image();
                    img.src = url;
                    img.onload = function(image: any)
                    {
                        file.dimension = img.width.toString() + '/' + img.height.toString();
                        file.URL = file.thumbnailSrc = 'https://images.squarespace-cdn.com/content/v1/5c8b13db65019feb12921ef4/1574655836868-D27Y5RC9J18111KAMD2C/Tilicho+Lake+1080x1080.jpg?format=1000w';
                       
                    //Check if file size is allowed
                    if(f.size > self.maxFileSize){
                        self.validateMsg = self.translate.instant('EDIT_FILE.MAXIMUM_FILE_SIZE');
                        return;
                    }
                    else{
                        self.validateMsg = '';
                    }
                    
                    file.Thumbnails = [{
                        Size: '200x200',
                        URL: file.url
                    }]

                    file.Key = (self.currentFolder === '/' ? '' : self.currentFolder) +  f.name;
                    file.MIME = f.type;
                    file.creationDate = new Date().getTime(); 
                    file.modificationDate = f.lastModified;
                    file.fileSize = self.assetsService.formatFileSize(f.size,2);
                    
                
                    self.setAssetsStack(file);

                    self.assetsService.createAsset(file);
                    
                    }
                    img.onerror = function(err){
                        file.dimension = self.translate.instant('EDIT_FILE.N_A');
                    }
                    img.remove();
            }
            else{
                this.validateMsg = self.translate.instant('EDIT_FILE.NOT_ALLOWED_MIME_TYPE');
                return;
            }
        }
        else{
            //TODO - NEED TO CHECK IF FILE IS ALLOWED 
            file.URL = this.imagesPath + 'system-doc.svg';
            file.dimension = self.translate.instant('EDIT_FILE.N_A');
        }
        
        //reload the grild list
        //this.assetsList.reload();

    }

    setAssetsStack(asset: IAsset){
        this.assetsStack.push({'name': asset.Key, 'status': 'uploading', 'key': this.stackIndex});
        const currKey = this.stackIndex;
        var self = this;
        setTimeout(() => {
                self.assetsStack[currKey]['status'] = 'done';
                setTimeout(() => {
                    self.assetsStack[currKey]['status'] = 'hidden';
                    
            }, 7000);
        }, 2000);

        this.stackIndex ++ ;
    }

    addNewFolder(data){
        let folder = new IAsset(this.translate.instant('ADD_FOLDER.FOLDER'));
        folder.url = this.imagesPath + 'system-folder.svg';
        folder.Key = data;
                        
        this.assets.push(folder);
        this.assetsList.reload();
        // TODO - NEED TO ADD A CALL TO ADD A NEW FOLDER
    };
}
