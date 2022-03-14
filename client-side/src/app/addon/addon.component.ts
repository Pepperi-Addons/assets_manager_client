import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { FIELD_TYPE, PepAddonService, PepLayoutService, PepScreenSizeType } from '@pepperi-addons/ngx-lib';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IPepGenericListDataSource, IPepGenericListPager, IPepGenericListActions, IPepGenericListInitData, PepGenericListService } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { AddFolderComponent } from '../components/add-folder/add-folder.component';
import { EditFileComponent } from '../components/edit-file/edit-file.component';
import { AddonService } from "./addon.service";
import { PepBreadCrumbItem } from "@pepperi-addons/ngx-lib/bread-crumbs";
import { allowedAssetsTypes, assetProcess, IAsset, selectionType, Thumbnails, uploadStatus } from '../addon/addon.model';
import { IPepMenuItemClickEvent, PepMenuItem } from "@pepperi-addons/ngx-lib/menu";
import { PepDialogData, PepDialogService } from "@pepperi-addons/ngx-lib/dialog";
import { MatDialogRef } from "@angular/material/dialog";
import { HttpClient } from "@angular/common/http";
import { Observable, ReplaySubject } from "rxjs";
import { PepSelectionData } from "@pepperi-addons/ngx-lib/list";
import { IPepFormFieldClickEvent } from "@pepperi-addons/ngx-lib/form";
import { PepImageService } from "@pepperi-addons/ngx-lib/image";
import { MatSnackBar } from "@angular/material/snack-bar";

@Component({
    selector: 'addon-module',
    templateUrl: './addon.component.html',
    styleUrls: ['./addon.component.scss'],
    providers: [TranslatePipe,AddFolderComponent,EditFileComponent]
})
export class AddonComponent implements OnInit {
    @Input() hostObject: any;
    
    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();
    
    screenSize: PepScreenSizeType;
    
    dataSource: IPepGenericListDataSource = null;
    public pager: IPepGenericListPager;

    imagesPath = '';
    breadCrumbsItems = new Array<PepBreadCrumbItem>();
    searchString: string = '';
    menuActions: Array<PepMenuItem>;
    assetsStack: Array<assetProcess> = [];
    stackIndex: number = 0;
    linkURL: string = '';
    validateMsg: string = '';
    assetsHeaderTitle = '';
    selectedAssets: Array<IAsset> = [];
    assetsList: Array<any>;
    mimeFilterItems = new Array<PepMenuItem>();

    @Input() currentFolder: PepBreadCrumbItem;
    @Input() maxFileSize: number = 1250000;
    @Input() isOnPopUp: boolean = false;
    @Input() allowedAssetsTypes: allowedAssetsTypes = 'all';
    @Input() selectionType: selectionType = 'multiple';
    
    constructor(
        public addonService: AddonService,
        private imageService: PepImageService,
        public layoutService: PepLayoutService,
        private genericListService: PepGenericListService,
        private pepAddonService: PepAddonService,
        public translate: TranslateService,
        public dialogService: PepDialogService,
        private httpClient: HttpClient,
        private _snackBar: MatSnackBar
    ) {
        this.imagesPath = this.pepAddonService.getAddonStaticFolder() + 'assets/images/';
        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });
    }

    async ngOnInit(){

        this.pager = {
            type: 'pages',
            size: 10,
            index: 0
        };
        const folder = await this.translate.get('ADD_FOLDER.FOLDER').toPromise();

        this.mimeFilterItems= [{ key: 'all', text: this.translate.instant('TOP_BAR.FILTER_TYPE.ALL') },
                               { key: 'images', text: this.translate.instant('TOP_BAR.FILTER_TYPE.IMG')},
                               { key: 'doc', text: this.translate.instant('TOP_BAR.FILTER_TYPE.DOC')}];

        
        this.breadCrumbsItems = new Array<PepBreadCrumbItem>();
        this.currentFolder = new PepBreadCrumbItem({key: '/', text: 'Main', title: 'Main'});
        this.breadCrumbsItems.push(this.currentFolder); 

        this.setDataSource();
        
        this._snackBar.open('Cannonball!!', 'Splash', {
            horizontalPosition: 'end',
            verticalPosition: 'bottom',
        });
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
            
            this.setDataSource();
    }

    cleanFolderName (folderName: string) : string{
            return folderName.replace(/\/$/, '');
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

    setDataSource() {
        this.dataSource = {
            init: async (state) => {
                let folder = this.currentFolder.key === '/' ? '/' : this.currentFolder.text;
                const whereCluse = this.searchString !== '' ? "&where=Name LIKE '%" + this.searchString + "%'" : '';//  '&where=Name LIKE "%25"' +  this.searchString + '%25"': '';
                this.assetsList = await this.addonService.getAssets("?folder=" + folder + whereCluse);
                
                this.assetsList.forEach( (asset, index) =>  {
                            asset.Name = asset.MIME === 'pepperi/folder' && asset.Key !== '/' ? this.cleanFolderName(asset.Key) : asset.Name;
                            asset.Thumbnail = asset.MIME === 'pepperi/folder' ?  this.imagesPath + 'system-folder.svg' : 
                                              asset.MIME.indexOf('application/') > -1 ? this.imagesPath + 'system-doc.svg'  : asset.URL; 
                });

                if (state.searchString != "") {
                  //res = res.filter(collection => collection.Name.toLowerCase().includes(state.searchString.toLowerCase()))
                }
                return {
                    items: this.assetsList,
                    totalCount: this.assetsList.length,
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
                                Type: 'Link',
                                Title: this.translate.instant('GRID.COLUMN.FILENAME'),
                                Mandatory: false,
                                ReadOnly: true,
                                
                            },
                            {
                                FieldID: 'Thumbnail',
                                Type: "Image",
                                Title: this.translate.instant('GRID.COLUMN.THUMBNAIL'),
                                Mandatory: false,
                                ReadOnly: true
                            },
                            {
                                FieldID: 'MIME',
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
                            { Width: 15 },
                            { Width: 10 },
                            { Width: 15 },
                            { Width: 60 }
                        ],
                        FrozenColumnsCount: 0,
                        MinimumColumnWidth: 0
                    }
                } as IPepGenericListInitData;
            }  
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
        asset.fileSize = this.formatFileSize(blob.size,2);
        asset.MIME = blob.type;
        
        this.createAsset(asset);
    }

    buttonClick(event){
        
    }

    onMenuItemClicked(action: IPepMenuItemClickEvent){
        debugger;
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

    // onSearchStateChanged(searchStateChangeEvent: IPepSearchStateChangeEvent) {

    // }

    onSearchChanged(search: any) {
        //this.searchString = "&Name=" + search;
        this.searchString = search?.value || '';
        this.setDataSource();
    }

    onSearchAutocompleteChanged(value) {
        console.log(value);
    }

    // sortToggle(event){
    //     this.sortBy = this.sortBy === 'ascending' ? 'ascending' : 'descending';
    //     // TODO -  SORTING IMPLEMENTATION
    // }
     
    // viewsToggle(event){
    //     this.currentView = this.currentView === 'list' ? 'thumbnail' : 'list';
    //     // TODO - REPLACE BETWEEN THE VIEWS IMPLEMENTATION
    // }

    onAddFolderClick(event){
        this.openDialog(AddFolderComponent,(data) => {
        this.addNewFolder(data)});
    }

    editAsset(key){
        
        let asset = this.getSelectedAsset(key);
        
        if(asset){
        this.openDialog(EditFileComponent,(res) => {
        this.updateAssetInfo(res)}, {'asset': asset , 'breadCrumbs': this.breadCrumbsItems});
        }
    }

    async updateAssetInfo(asset: IAsset){
       
        if(asset?.Hidden == true){
            this.showDeleteAssetMSG(asset);
        }
        else{
            this.createAsset(asset);
           
        }
    }

    getSelectedAsset(key?: string){      
        return this.assetsList.find(asset => asset.Key === key) || new IAsset();
    }
    
    onCustomizeFieldClick(fieldClickEvent: IPepFormFieldClickEvent){
       
        const asset: any = this.getSelectedAsset(fieldClickEvent.id);

        if(asset?.MIME && asset.MIME.indexOf('application/') > -1){
            return false;
        }   
        else if(asset?.MIME && asset.MIME === 'pepperi/folder'){
            this.currentFolder = { key: 'new', text: asset.Key, title: asset.Key};
            this.setBreadCrumbs();
            return false;
        }
        else if(fieldClickEvent.fieldType == FIELD_TYPE.Image){
            this.imageService.openImageDialog( fieldClickEvent.otherData.imageSrc, [], asset.Key );
        }
        else { 
            this.editAsset(fieldClickEvent.id);
        }
    }

    showDeleteAssetMSG(asset: IAsset = null){
          const dialogData = new PepDialogData({
            content: this.translate.instant('GRID.CONFIRM_DELETE'),
            showHeader: false,
            actionsType: 'cancel-delete',
            showClose: false,
          });

         this.openDialogMsg(dialogData,() => {
             this.deleteAssets(asset)});  
    }

    deleteAssets(asset: IAsset = null){
        // TODO - NEED FIX THIS WHEN CHANGING TO MULTIPLE SELECTION MODE 
        asset = asset !== null ? asset : 
                this.getSelectedAsset(this.genericListService.getSelectedItems().rows[0]);
        
        asset.Hidden = true;

        this.createAsset(asset,null,'deleting');
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
            asset.Key = (this.currentFolder.key === '/' ? '' : this.breadCrumbsItems[1].text) + '/' +  f.name;
            asset.MIME = f.type;
            asset.creationDate = new Date().getTime(); 
            asset.modificationDate = f.lastModified;
            asset.fileSize = f.size; //this.assetsService.formatFileSize(f.size,2);

            // if(asset.MIME.indexOf('image/') > -1){ 
            //     const url = URL.createObjectURL(f);
            //     asset.Thumbnails = await this.getThumbnails(url);
            // }
            //this.setAssetsStack(asset);
            this.createAsset(asset);
            
       
        });
    }
    createAsset(asset, query = null,status: uploadStatus = 'uploading'){
        this.setAssetsStack(asset,status);
        this.addonService.createAsset(asset).then((res)=> {
            if(res){
                this.setAssetsStack(asset,'done');
                this.setDataSource();
            }
        }); 
    }
    
    setAssetsStack(asset: IAsset, status: uploadStatus = "uploading"){
        let isExist = false;
        this.assetsStack.forEach(file => {
            if(file.name == asset.Key){
                file.status = status;
                isExist = true;
            }
        });
        
        if(!isExist){
            this.assetsStack.push({'name': asset.Key, 'status': status});
        }
        
    }

    async addNewFolder(data){
        let folder = new IAsset();
        folder.MIME = 'pepperi/folder';
        
        folder.URI = ''; // should be empty for folder

        folder.Key = this.getCurrentURL() + data + "/";

        this.createAsset(folder);
    };

    getCurrentURL(){
        let path = '/';
        for(let i=1 ; i < this.breadCrumbsItems.length; i++){
            path += this.breadCrumbsItems[i].text;
        }
        
        return path === "/" ? '' : path;
    }

    formatFileSize(bytes,decimalPoint) {
        if(bytes == 0) return '0 Bytes';
        var k = 1000,
            dm = decimalPoint || 2,
            sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    openDialog(comp: any, callBack, data = {}){
    
        let config = this.dialogService.getDialogConfig({}, 'inline');
            config.disableClose = true;
            config.minWidth = '29rem'; // THE EDIT MODAL WIDTH

        let dialogRef: MatDialogRef<any> = this.dialogService.openDialog(comp, data, config);

        dialogRef.afterClosed().subscribe((value) => {
            if (value !== undefined && value !== null) {
            callBack(value);
            }
        });
    }

    openDialogMsg(dialogData: PepDialogData, callback?: any) {
    
    this.dialogService.openDefaultDialog(dialogData).afterClosed()
            .subscribe((isDeletePressed) => {
                if (isDeletePressed) {
                    callback();
                }
        });
    }
}
