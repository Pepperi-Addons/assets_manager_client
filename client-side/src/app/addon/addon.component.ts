import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from "@angular/core";
import { FIELD_TYPE, PepAddonService, PepLayoutService, PepScreenSizeType, PepSessionService } from '@pepperi-addons/ngx-lib';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IPepGenericListDataSource, IPepGenericListPager, IPepGenericListActions, IPepGenericListInitData, PepGenericListService } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { AddFolderComponent } from '../components/add-folder/add-folder.component';
import { EditFileComponent } from '../components/edit-file/edit-file.component';
import { AddonService, IUploadFilesWorkerResult } from "./addon.service";
import { PepBreadCrumbItem } from "@pepperi-addons/ngx-lib/bread-crumbs";
import { allowedAssetsTypes, assetProcess, IAsset, selectionType, Thumbnails, uploadStatus } from '../addon/addon.model';
import { IPepMenuItemClickEvent, PepMenuItem } from "@pepperi-addons/ngx-lib/menu";
import { PepDialogData, PepDialogService } from "@pepperi-addons/ngx-lib/dialog";
import { HttpClient } from "@angular/common/http";
import { Observable, ReplaySubject } from "rxjs";
import { PepSelectionData } from "@pepperi-addons/ngx-lib/list";
import { IPepFormFieldClickEvent } from "@pepperi-addons/ngx-lib/form";
import { PepImageService } from "@pepperi-addons/ngx-lib/image";
import { MatSnackBar } from "@angular/material/snack-bar";
import { InlineWorker} from '../inline-worker';

@Component({
    selector: 'addon-module',
    templateUrl: './addon.component.html',
    styleUrls: ['./addon.component.scss'],
    providers: [TranslatePipe,AddFolderComponent,EditFileComponent]
})
export class AddonComponent implements OnInit {
    @Input() hostObject: any;
    
    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();
    @Output() linkUrlClick: EventEmitter<any> = new EventEmitter();

    screenSize: PepScreenSizeType;
    
    dataSource: IPepGenericListDataSource = null;
    public pager: IPepGenericListPager;

    imagesPath = '';
    breadCrumbsItems = new Array<PepBreadCrumbItem>();

    menuActions: Array<PepMenuItem>;
    assetsStack: Array<assetProcess> = [];
    stackIndex: number = 0;
    linkURL: string = '';
    popUplinkURL: string = '';
    validateMsg: string = '';
    urlValidateMsg = '';
    assetsHeaderTitle = '';
    selectedAssets: Array<IAsset> = [];
    assetsList: Array<any>;
    mimeFilterItems = new Array<PepMenuItem>();
    mimeFilter = "all";
    softFilesCountLimit = 10;

    @Input() currentFolder: PepBreadCrumbItem;
    @Input() maxFileSize: number = 1250000;
    @Input() isOnPopUp: boolean = true;
    @Input() allowedAssetsTypes: allowedAssetsTypes = 'all';
    @Input() selectionType: selectionType = 'multiple';
    
    constructor(
        public addonService: AddonService,
        private sessionService: PepSessionService,
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

        this.addonService.workerResultChange$.subscribe((workerResult: IUploadFilesWorkerResult) => {
            if (workerResult?.isFinish) {
                this.setDataSource();
            }
        });
    }

    // result = 0;
    // runWorkerTest(event) {
       
    //     const worker = new InlineWorker(() => {
    //         // START OF WORKER THREAD CODE
    //         console.log('Start worker thread, wait for postMessage: ');
      
    //         const calculateCountOfPrimeNumbers = (seconds) => {
    //             let counter = 0;

    //             while (counter < seconds) {
    //                 // setTimeout(() => {
    //                     counter++;
    //                     // nowSeconds = new Date().getTime() / 1000;
                        
    //                     // @ts-ignore
    //                     this.postMessage({
    //                         primeNumbers: counter,
    //                         isFinish: false
    //                     });
    //                 // }, 1000);
    //             }
        
    //             // // @ts-ignore
    //             // this.worker.terminate();

    //             // // this is from DedicatedWorkerGlobalScope ( because of that we have postMessage and onmessage methods )
    //             // // and it can't see methods of this class
    //             // @ts-ignore
    //             this.postMessage({
    //                 primeNumbers: counter,
    //                 isFinish: true
    //             });
    //         };
      
    //         // @ts-ignore
    //         this.onmessage = (evt) => {
    //             console.log('Calculation started: ' + new Date());
    //             calculateCountOfPrimeNumbers(evt.data.limit);
    //         };
    //         // END OF WORKER THREAD CODE
    //     });
      
    //     const limit = 5000;
    //     // let nowSeconds = new Date().getTime() / 1000;
    //     // const limitSeconds = nowSeconds + limit;
    //     worker.postMessage({ limit: limit });
      
    //     worker.onmessage().subscribe((data) => {
    //         console.log('Calculation done: ', new Date() + ' ' + data.data);
    //         this.result = data.data.primeNumbers;

    //         this._snackBar?.open(this.result.toString(), 'Splash', {
    //             horizontalPosition: 'end',
    //             verticalPosition: 'bottom',
    //         });
            
    //         if (data.data.isFinish) {
    //             worker.terminate();
    //         }
    //     });
      
    //     worker.onerror().subscribe((data) => {
    //         console.log(data);
    //     });
    // }

    private uploadMultiFiles(files: any[]) {
        let isValid = files.length <= this.softFilesCountLimit;

        if (isValid) {
            for (let index = 0; index < files.length; index++) {
                const file = files[index];
                if(!this.checkFileSize(file.size) || !this.checkFileType(file.type)) {
                    isValid = false;
                    break;
                }
            }
            
            if (isValid) {
                const assetsKeyPrefix = (this.currentFolder.key === '/' ? '' : this.getCurrentURL());
                this.addonService.runUploadWorker(files, assetsKeyPrefix);
            }
        } else {
            // Show limit error msg.
            const dialogData = new PepDialogData({
                content: this.translate.instant('MESSAGES.FILES_COUNT_LIMIT_MESSAGE', { files_limit: this.softFilesCountLimit}),
                showHeader: false,
                showClose: false,
            });

            this.dialogService.openDefaultDialog(dialogData);
        }
    }

    async ngOnInit(){
        this.pager = {
            type: 'pages',
            size: 10,
            index: 0
        };
        const folder = await this.translate.get('ADD_FOLDER.FOLDER').toPromise();

        this.mimeFilterItems= [{ key: 'all', text: this.translate.instant('TOP_BAR.FILTER_TYPE.ALL') },
                               { key: 'image', text: this.translate.instant('TOP_BAR.FILTER_TYPE.IMG')},
                               { key: 'application', text: this.translate.instant('TOP_BAR.FILTER_TYPE.DOC')}];

        
        this.breadCrumbsItems = new Array<PepBreadCrumbItem>();
        this.currentFolder = new PepBreadCrumbItem({key: '/', text: 'Main', title: 'Main'});
        this.breadCrumbsItems.push(this.currentFolder); 

        this.setDataSource();
        
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
    setWhereClauseSTR(state){
        // + " AND MIME LIKE '%folder%'"
        // "&where="
        let whereCluse = state.searchString  ? "Name LIKE '%" + state.searchString + "%'" : '';
            whereCluse +=  this.mimeFilter != 'all' ? ((whereCluse == '' ? '' : " AND ") + "MIME LIKE '%" + this.mimeFilter + "%'") : '';
            whereCluse = whereCluse !== '' ? "&where=" + whereCluse : '';

            // todo - sort is not supportoted on this version
            whereCluse += state.sorting ? ("&order_by=" + state.sorting.sortBy + " " + state.sorting.isAsc ? 'ASC' : 'DESC') : '';
        return whereCluse;
    }

    setDataSource() {

        let folder = this.currentFolder.key === '/' ? '/' : this.getCurrentURL();

        this.dataSource = {
            init: async (state) => {
                this.assetsList = await this.addonService.getAssets("?folder=" + folder + this.setWhereClauseSTR(state));
                
                this.assetsList.forEach( (asset, index) =>  {
                            asset.Name = asset.MIME === 'pepperi/folder' && asset.Key !== '/' ? this.cleanFolderName(asset.Name) : asset.Name;
                            asset.Thumbnail = asset.MIME === 'pepperi/folder' ?  this.imagesPath + 'system-folder.svg' : 
                                              asset.MIME.toLowerCase().indexOf('application/') > -1 ? this.imagesPath + 'system-doc.svg'  : asset.URL; 
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
            }, 
            update: async (params: any) => {
                return await this.addonService.getAssets("?folder=" + folder + this.setWhereClauseSTR(params));
            }
        }
    }
      
    onSelectedRowChange(event){
        this.menuActions = event?.length ? event : [];
    }
    
    async assetURLChange(url: string = ''){

        this.urlValidateMsg = '';
       
        if(url !== ''){
            try {
                let filename = new URL(url).pathname.split('/').pop();
                let blob = await fetch(url).then(r => r.blob());

                let asset: IAsset = new IAsset();

                asset.Key = this.getCurrentURL() + '/' + filename;
                asset.URI = await this.convertURLToBase64(url) as string;
                asset.fileSize = this.formatFileSize(blob.size,2);
                asset.MIME = blob.type;
            
                this.upsertAsset(asset);
            }
            catch (e){
                this.urlValidateMsg = e.message;
            }  
        }
    }

    assetLinkURLChange(event){
        // emit the new url - the addon/component user need to get the url and use it like a URL ( without upload a file)
        this.linkUrlClick.emit({url: event});
    }    

    onMenuItemClicked(action: IPepMenuItemClickEvent){
        this.mimeFilter = action.source.key;
        this.setDataSource();
        
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
            asset.Key = this.getCurrentURL() + '/' + asset.Name;
            this.upsertAsset(asset);
           
        }
    }

    getSelectedAsset(key?: string){      
        return this.assetsList.find(asset => asset.Key === key) || new IAsset();
    }
    
    onCustomizeFieldClick(fieldClickEvent: IPepFormFieldClickEvent){
       
        const asset: any = this.getSelectedAsset(fieldClickEvent.id);

        if(asset.MIME?.indexOf('application/') > -1 && fieldClickEvent.fieldType !== 26){
            return false;
        }   
        else if(asset?.MIME && asset.MIME === 'pepperi/folder'){
            this.currentFolder = { key: 'new', text: asset.Name, title: asset.Name};
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
            this.deleteAssets(asset)
        });  
    }

    deleteAssets(asset: IAsset = null){
        // TODO - NEED FIX THIS WHEN CHANGING TO MULTIPLE SELECTION MODE 
        asset = asset !== null ? asset : 
                this.getSelectedAsset(this.genericListService.getSelectedItems().rows[0]);
        
        asset.Hidden = true;

        this.upsertAsset(asset, null, 'deleting');
    }

    onDragOver(event) {
        event.preventDefault();
    }
    
    // From drag and drop
    onDropSuccess(event) {
        event.preventDefault();
        if(event?.dataTransfer?.files) {
            this.uploadMultiFiles(event?.dataTransfer?.files);
        }
    }

    upload(e: FileList) {
        this.uploadMultiFiles(Array.from(e));
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

    // TODO: remove this
    // async addNewFile(f){
    //     //Check if file size & type are allowed
    //     if(!this.checkFileSize(f.size) || !this.checkFileType(f.type)){
    //         return false;
    //     }

    //     // create new asset object
    //     let asset = new IAsset('file');

    //     this.convertFileToBase64(f).subscribe(async base64 => {
    //         asset.URI = base64;
    //         asset.Key = (this.currentFolder.key === '/' ? '' : this.breadCrumbsItems[1].text) + '/' +  f.name;
    //         asset.MIME = f.type;
    //         asset.creationDate = new Date().getTime(); 
    //         asset.modificationDate = f.lastModified;
    //         asset.fileSize = f.size; //this.assetsService.formatFileSize(f.size,2);

    //         // if(asset.MIME.indexOf('image/') > -1){ 
    //         //     const url = URL.createObjectURL(f);
    //         //     asset.Thumbnails = await this.getThumbnails(url);
    //         // }
    //         //this.setAssetsStack(asset);
    //         this.upsertAsset(asset);
    //     });
    // }

    upsertAsset(asset: IAsset, query = null, status: uploadStatus = 'uploading') {
        // Show snack bar for the single asset
        let assetsStack: Array<assetProcess> = [];
        assetsStack.push({ 'name': asset.Key, 'status': status });
        this.addonService.showSnackBar('Uploading', assetsStack);
        
        this.addonService.upsertAsset(asset).then((res)=> {
            if(res) {
                this.linkURL = this.popUplinkURL = '';

                // Update asset status.
                assetsStack[0].status = 'done';
                this.addonService.showSnackBar('Uploading', assetsStack);
                
                this.setDataSource();

                // TODO: just update the data.
                // this.dataSource.update({
                //     fromIndex: 0,
                //     toIndex: 100,
                // });
            }
        });
    }
    
    // setAssetsStack(asset: IAsset, status: uploadStatus = "uploading") {
    //     let isExist = false;
    //     this.assetsStack.forEach(file => {
    //         if(file.name == asset.Key) {
    //             file.status = status;
    //             isExist = true;
    //         }
    //     });
        
    //     if(!isExist) {
    //         this.assetsStack.push({ 'name': asset.Key, 'status': status });
    //         this.addonService.showSnackBar(status, this.assetsStack);
    //     }
    // }

    async addNewFolder(data){
        let folder = new IAsset();
        folder.MIME = 'pepperi/folder';
        folder.URI = ''; // should be empty for folder
        folder.Key = this.getCurrentURL() + '/' + data + "/";

        this.upsertAsset(folder);
    };

    getCurrentURL(){
        let path = '';
        for(let i=1 ; i < this.breadCrumbsItems.length; i++){
            path += '/' + this.breadCrumbsItems[i].text;
        }
        
        return path;
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

        this.dialogService.openDialog(comp, data, config).afterClosed().subscribe((value) => {
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
