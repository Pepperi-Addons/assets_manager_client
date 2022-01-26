import { map } from 'rxjs/operators';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { FIELD_TYPE, PepAddonService, PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { Observable, ReplaySubject } from 'rxjs';
import { GenericListComponent, IPepGenericListDataSource, IPepGenericListPager, IPepGenericListActions } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { PepBreadCrumbItem } from '@pepperi-addons/ngx-lib/bread-crumbs';
import { IPepSearchStateChangeEvent } from '@pepperi-addons/ngx-lib/search';
import { allowedAssetsTypes, assetProcess, AssetsService, assetsView, IAsset, selectionType, sortBy, Thumbnails } from '../../common/assets-service';
import { AddFolderComponent } from '../add-folder/add-folder.component';
import { EditFileComponent } from '../edit-file/edit-file.component';
import { IPepMenuItemClickEvent, PepMenuItem } from '@pepperi-addons/ngx-lib/menu';
import { PepDialogActionButton, PepDialogData } from '@pepperi-addons/ngx-lib/dialog';
import { PepImageService } from '@pepperi-addons/ngx-lib/image';
import { IPepFormFieldClickEvent } from '@pepperi-addons/ngx-lib/form';
import { PepSelectionData } from '@pepperi-addons/ngx-lib/list';
import { HttpClient } from '@angular/common/http';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

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
    
    @Input() currentFolder: PepBreadCrumbItem;
    @Input() maxFileSize: number = 1250000;
    @Input() isOnPopUp: boolean = false;
    @Input() allowedAssetsTypes: allowedAssetsTypes = 'all';
    @Input() selectionType: selectionType = 'multiple';

    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();

    imagesPath = '';
    breadCrumbsItems = new Array<PepBreadCrumbItem>();
    pager: IPepGenericListPager = {
        type: 'pages',
        size: 10,
        index: 0
    };
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
    linkURL: string = '';
   constructor(
        private imageService: PepImageService,
        public layoutService: PepLayoutService,
        private pepAddonService: PepAddonService,
        public translate: TranslateService,
        public assetsService: AssetsService,
        private httpClient: HttpClient
    ) {
        this.imagesPath = this.pepAddonService.getAddonStaticFolder() + 'assets/images/';
        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });
        
    }  

    async ngOnInit(){
        const folder = await this.translate.get('ADD_FOLDER.FOLDER').toPromise();
        this.breadCrumbsItems = new Array<PepBreadCrumbItem>();
        this.currentFolder = new PepBreadCrumbItem({key: '/', text: 'Main', title: 'Main'});
        this.breadCrumbsItems.push(this.currentFolder); 
    }
    
    setBreadCrumbs(){

            if(this.currentFolder.key === 'new'){
                this.currentFolder.key = (this.breadCrumbsItems.length).toString();
                this.breadCrumbsItems.push( new PepBreadCrumbItem({key: this.currentFolder.key, 
                                                                   text: this.cleanFolderName(this.currentFolder.text), 
                                                                   title: this.cleanFolderName(this.currentFolder.title)}));
            }
            else{
                const folderIndex = this.currentFolder.key === '/' ? 0 : parseInt(this.currentFolder.key);
                this.breadCrumbsItems.length = (folderIndex + 1);
            }
            
        this.assetsList.reload();
    }

    cleanFolderName (folderName: string) : string{
            return folderName.replace(/\/$/, '');
    }

    assetsDataSource: IPepGenericListDataSource = {
        getList: async (state) => {
            const desktopTitle = await this.translate.get('SLIDESHOW.HEIGHTUNITS_REM').toPromise();
            this.assetsHeaderTitle = this.translate.instant('GRID.DEFAULT_TITLE');
            let folder = this.currentFolder.key === '/' ? '/' : this.currentFolder.text;
            let res = await this.assetsService.getAssets("?folder=" + folder);
            
            this.assetsList.data.totalCount = res.length;
            
            if (state.searchString != "") {
              res = res.filter(collection => collection.Name.toLowerCase().includes(state.searchString.toLowerCase()))
            }
            
            res.forEach( (row, index) =>  {
                res[index].Name = row.MIME === 'pepperi/folder' && row.Key !== '/' ? this.cleanFolderName(row.Key) : row.Key;
                res[index].Thumbnail = row.MIME === 'pepperi/folder' ?  this.imagesPath + 'system-folder.svg' : row.URL; 
             });
             
            this.assets = res;
            return res;
        },
        totalCount: 1, // TODO - SET THIS PARAM
        dataView: {
                Context: {
                    Name: '',
                    Profile: { InternalID: 0 },
                    ScreenSize: 'Landscape'
                },
                Type: 'Grid',
                Title: '',
                Fields: [
                    {
                        FieldID: 'Name',
                        Type: 'TextBox',
                        Title: 'GRID.COLUMN.FILENAME',
                        Mandatory: false,
                        ReadOnly: true,
                      
                    },
                    {
                        FieldID: 'Thumbnail',
                        Type: "Image",
                        Title: 'GRID.COLUMN.THUMBNAIL',
                        Mandatory: false,
                        ReadOnly: true
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
                    { Width: 15 },
                    { Width: 10 },
                    { Width: 15 },
                    { Width: 60 }
                ],
                FrozenColumnsCount: 0,
                MinimumColumnWidth: 0
        }
    }

    actions: IPepGenericListActions = {   
        get: async (data: PepSelectionData) => {
            const actions = [];
            this.selectedAssets = data.rows.length > 0 ? data.rows  : [];

            if (data?.selectionType === 0) {
                // const list = await this.assetsDataSource.getList({searchString: ''});   
                // if (list?.length === data?.rows.length) {
                //     return actions;
                // }                
            }
            if (data?.rows.length === 1 && data?.selectionType !== 0) {
                actions.push({
                        title: this.translate.instant("ACTIONS.EDIT"),
                        handler: async (objs) => {
                            if(objs.rows[0]?.MIME && objs.rows[0].MIME === 'pepperi/folder'){
                                this.onAddFolderClick(null);
                            }
                            else{
                                this.editAsset(objs.rows[0]);
                            }
                        }
                    });
            } 
            if (data?.rows.length >= 1 || data?.selectionType === 0) {
                actions.push({
                        title: this.translate.instant("ACTIONS.DELETE"),
                        handler: async (objs) => {
                                this.showDeleteAssetMSG();
                        }
                    });
            } else return []; 
            
            return actions;
        }
    }
      
    onSelectedRowChange(event){
        this.menuActions = event?.length ? event : [];
    }

    upload(e: FileList) {
        const fileListAsArray = Array.from(e);
        fileListAsArray.forEach((file, i) => {
          this.addNewFile(file);
        });    
    }
  
    async assetURLChange(event){

        let filename = '';
        try {
           filename = new URL(this.linkURL).pathname.split('/').pop();
        }
        catch (e){
            console.log(e);
        }

        let blob = await fetch(event).then(r => r.blob());

        let asset: IAsset = new IAsset();

        asset.Key = this.getCurrentURL() + filename;
        asset.URI = await this.convertURLToBase64(this.linkURL) as string;
        asset.fileSize = this.assetsService.formatFileSize(blob.size,2);
        asset.MIME = blob.type;
        
        this.assetsService.createAsset(asset, null, (res) => {
            this.assetsList.reload();
        });  
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
        if(this.currentFolder.text === event.source.text){
            return false;
        }

        this.currentFolder = event.source;
        this.setBreadCrumbs();
    }

    onSearchStateChanged(searchStateChangeEvent: IPepSearchStateChangeEvent) {

    }

    onSearchChanged(search: any) {
        console.log(search);
    }

    onSearchAutocompleteChanged(value) {
        console.log(value);
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

    editAsset(uuid){
        
        let asset = this.getSelectedAsset(uuid);
        
        if(asset){
        this.assetsService.openDialog(EditFileComponent,(res) => {
        this.updateAssetInfo(res)}, {'asset': asset , 'breadCrumbs': this.breadCrumbsItems});
        }
    }

    async updateAssetInfo(asset: IAsset){
       
        if(asset?.Hidden == 'True'){
            this.showDeleteAssetMSG();
        }
        else{
            
            asset.URI = await this.convertURLToBase64(asset.URL) as string;
           // this.assetsService.createAsset(asset,(res) = {
           //    this.assetsList.reload();
           //});
        }
    }

    getSelectedAsset(uuid?: string){

        let as: any = this.assetsList.customList.getItemDataByID(uuid).Fields;
        let asset: IAsset = new IAsset();
        
        if(as){
            asset.Key = as[0].FormattedValue;
            asset.URL = as[1].FormattedValue;
            asset.MIME = as[2].FormattedValue;
            asset.Description = as[3].FormattedValue;
        }

        return asset;
    }

    onCustomizeFieldClick(fieldClickEvent: IPepFormFieldClickEvent){

        const asset: any = this.getSelectedAsset(fieldClickEvent.id);
        if(asset?.MIME && asset.MIME === 'pepperi/folder'){
            this.currentFolder = { key: 'new', text: asset.Key, title: asset.Key};
            this.setBreadCrumbs();
            return false;
        }
        else if(fieldClickEvent.fieldType == FIELD_TYPE.Image){
            this.imageService.openImageDialog( fieldClickEvent.otherData.imageSrc, [], asset.Key );
        }
        else { 
            this.editAsset(fieldClickEvent.id);
            return false;
        }
    }

    showDeleteAssetMSG(){
          const dialogData = new PepDialogData({
            content: this.translate.instant('GRID.CONFIRM_DELETE'),
            showHeader: false,
            actionsType: 'cancel-delete',
            showClose: false,
          });

         this.assetsService.openDialogMsg(dialogData,() => {
             this.deleteAssets()});  
    }

    deleteAssets(){
        let data : PepSelectionData = this.assetsList.customList.getSelectedItemsData();
        data.rows.forEach( (row, index) =>  {
            let asset = this.getSelectedAsset(row);
            asset.Hidden = "true";
            this.assetsService.createAsset(asset,null, (res) => {
                if(res){
                    this.assetsList.reload();
                }
            });
        });
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

    convertURLToBase64(url: string) {
        return new Promise((resolve, reject) => {
        this.httpClient.get(url, { responseType: "blob" }).subscribe(blob => {
                const reader = new FileReader();
                const binaryString = reader.readAsDataURL(blob);
                reader.onload = (event: any) => {
                    resolve(event.target.result);
                };
                reader.onerror = (event: any) => {
                    reject( event.target.error.code);
                };
            });
        });
    }

    checkFileSize(size: number){
        
        if(size > this.maxFileSize){
            this.validateMsg = this.translate.instant('EDIT_FILE.MAXIMUM_FILE_SIZE');
            return false;
        }
        else{
            this.validateMsg = '';
            return true;
        }
    }

    checkFileType(type){
        //Check mime types is allowed
        this.validateMsg = '';

        if(type?.indexOf('image/') > -1){
            if(!['images', 'all'].includes(this.allowedAssetsTypes)){
                this.validateMsg = this.translate.instant('EDIT_FILE.NOT_ALLOWED_MIME_TYPE');
            }
        }
        else if(!['documents', 'all'].includes(this.allowedAssetsTypes)){
            this.validateMsg = this.translate.instant('EDIT_FILE.NOT_ALLOWED_MIME_TYPE');
        }
        
        return this.validateMsg === '';
    }

    convertFileToBase64(file : File) : Observable<string> {
        const result = new ReplaySubject<string>(1);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => result.next(event.target.result.toString());
        return result;
      }
    
    getThumbnails(url) : Array<Thumbnails>{

        let Thumbnails = [];

        var img = new Image();
            img.src = url;

            // load the file to get file size....
            img.onload = async function(image: any)
            {
                Thumbnails.push( {Size: img.width.toString() +'x' + img.height.toString() , URL: ''} );
            }
            img.onerror = function(err){ 
                        // TODO - SHOW ERROR
            }
            img.remove();
            return Thumbnails;
    }

    async addNewFile(f){
        
        //Check if file size & type are allowed
        if(!this.checkFileSize(f.size) || !this.checkFileType(f.type)){
            return false;
        }

        // create new asset object
        let asset = new IAsset('file');

        this.convertFileToBase64(f).subscribe(async base64 => {
            asset.URI = base64;
            asset.Key = (this.currentFolder.key === '/' ? '' : this.currentFolder) +  f.name;
            asset.MIME = f.type;
            asset.creationDate = new Date().getTime(); 
            asset.modificationDate = f.lastModified;
            asset.fileSize = f.size; //this.assetsService.formatFileSize(f.size,2);

            // if(asset.MIME.indexOf('image/') > -1){ 
            //     const url = URL.createObjectURL(f);
            //     asset.Thumbnails = await this.getThumbnails(url);
            // }

            this.assetsService.createAsset(asset,null, (res)=> {
                if(res){
                    this.assetsList.reload();
                }
            }); 
       
        });
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

    async addNewFolder(data){
        let folder = new IAsset();
        folder.MIME = 'pepperi/folder';
        folder.URI = ''; // should be empty for folder

        folder.Key = this.getCurrentURL() + data;

        this.assetsService.createAsset(folder, null, (res) => {
            this.assetsList.reload();
        }); 
    };

    getCurrentURL(){
        let path = '/';
        for(let i=1 ; i < this.breadCrumbsItems.length; i++){
            path += this.breadCrumbsItems[i].text;
        }
        
        return path === "/" ? '' : path;
    }
    
}
