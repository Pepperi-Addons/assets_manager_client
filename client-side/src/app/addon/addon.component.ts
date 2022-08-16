import { Component, ElementRef, EventEmitter, Input, OnInit, Output, Renderer2, ViewChild } from "@angular/core";
import { FIELD_TYPE, PepAddonService, PepLayoutService, PepScreenSizeType, PepSessionService } from '@pepperi-addons/ngx-lib';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { IPepGenericListDataSource, IPepGenericListPager, IPepGenericListActions, IPepGenericListInitData, GenericListComponent } from "@pepperi-addons/ngx-composite-lib/generic-list";
import { AddFolderComponent } from '../components/add-folder/add-folder.component';
import { EditFileComponent } from '../components/edit-file/edit-file.component';
import { AddonService, IUploadFilesWorkerResult } from "./addon.service";
import { PepBreadCrumbItem } from "@pepperi-addons/ngx-lib/bread-crumbs";
import { allowedAssetsTypes, assetProcess, Asset, selectionType, Thumbnails } from '../addon/addon.model';
import { IPepMenuItemClickEvent, PepMenuItem } from "@pepperi-addons/ngx-lib/menu";
import { PepDialogData, PepDialogService } from "@pepperi-addons/ngx-lib/dialog";
import { HttpClient } from "@angular/common/http";
import { PepSelectionData } from "@pepperi-addons/ngx-lib/list";
import { IPepFormFieldClickEvent } from "@pepperi-addons/ngx-lib/form";
import { PepImageService } from "@pepperi-addons/ngx-lib/image";

@Component({
    selector: 'assets-manager-addon',
    templateUrl: './addon.component.html',
    styleUrls: ['./addon.component.scss'],
    providers: [TranslatePipe,AddFolderComponent,EditFileComponent]
})
export class AssetsComponent implements OnInit {
    @ViewChild('genericList') genericList: GenericListComponent | undefined;
    @ViewChild('uploaderCont', { static: false }) uploaderCont: ElementRef;
    @ViewChild('toggleBtn', { static: false }) toggleBtn: ElementRef;
    
    @Input() hostObject: any;
    @Input() currentFolder: PepBreadCrumbItem;
    @Input() maxFileSize: number = 10000000;
    @Input() inDialog: boolean = false;
    @Input() allowedAssetsTypes: allowedAssetsTypes = 'images';
    @Input() selectionType: selectionType = 'multiple';

    @Output() hostEvents: EventEmitter<any> = new EventEmitter<any>();

    screenSize: PepScreenSizeType;
    
    dataSource: IPepGenericListDataSource = null;
    public pager: IPepGenericListPager;

    imagesPath = '';
    breadCrumbsItems = new Array<PepBreadCrumbItem>();

    menuActions: Array<PepMenuItem>;
    stackIndex: number = 0;
    linkURL: string = '';
    popUplinkURL: string = '';
    validateMsg: string = '';
    urlValidateMsg = '';
    assetsHeaderTitle = '';
    selectedAssets: Array<Asset> = [];
    assetsList: Array<any>;
    mimeFilterItems = new Array<PepMenuItem>();
    mimeFilter = "all";
    softFilesCountLimit = 10;

    constructor(
        public addonService: AddonService,
        private imageService: PepImageService,
        public layoutService: PepLayoutService,
        private pepAddonService: PepAddonService,
        public translate: TranslateService,
        public dialogService: PepDialogService,
        private httpClient: HttpClient,
        private renderer: Renderer2
    ) {
        this.imagesPath = this.pepAddonService.getAddonStaticFolder() + 'assets/images/';
        this.layoutService.onResize$.subscribe(size => {
            this.screenSize = size;
        });

        this.addonService.workerResultChange$.subscribe((workerResult: IUploadFilesWorkerResult) => {
            if (workerResult?.isFinish) {
                this.linkURL = this.popUplinkURL = '';
                this.setDataSource();   
            }
        });
    }

    async ngOnInit() {

        if(this.hostObject){
            this.inDialog = this.hostObject.inDialog || this.inDialog;
            this.maxFileSize = this.hostObject.maxFileSize || this.maxFileSize;
            this.allowedAssetsTypes = this.hostObject.allowedAssetsTypes || this.allowedAssetsTypes;
            this.selectionType = this.hostObject.selectionType || this.selectionType;
            this.currentFolder = this.hostObject.currentFolder || this.currentFolder;
        }

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

    private checkFileSize(size: number) {
        if(size > this.maxFileSize){
            this.validateMsg = this.translate.instant('EDIT_FILE.MAXIMUM_FILE_SIZE');
            return false;
        }
        else{
            this.validateMsg = '';
            return true;
        }
    }

    private checkFileType(type, showMsgOnModal: boolean = false) {
        //Check mime types is allowed
        this.validateMsg = '';
        let tmpMsg = '';

        if(type?.indexOf('image/') > -1){
            if(!['images', 'all'].includes(this.allowedAssetsTypes)){
                tmpMsg = this.translate.instant('EDIT_FILE.NOT_ALLOWED_MIME_TYPE');
            }
        }
        else if(!['documents', 'all'].includes(this.allowedAssetsTypes)){
            tmpMsg = this.translate.instant('EDIT_FILE.NOT_ALLOWED_MIME_TYPE');
        }
        
        if(!showMsgOnModal){
            this.validateMsg = tmpMsg;
            return this.validateMsg === '';
        }
        else{
            if(tmpMsg !== ''){
                const dialogData = new PepDialogData({
                    content: tmpMsg,
                    showHeader: false,
                    actionsType: 'close',
                    showClose: false
                });
        
                this.dialogService.openDefaultDialog(dialogData);
            }

            return tmpMsg === '';
        
        }

    }

    private async uploadMultiFiles(files: File[]) {
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
                    this.addonService.runUploadWorker({ files, assetsKeyPrefix});
            }
        } else {
            // Show limit error msg.
            const dialogData = new PepDialogData({
                content: this.translate.instant('ASSETS_PANEL.FILES_COUNT_LIMIT_MESSAGE', { files_limit: this.softFilesCountLimit}),
                showHeader: false,
                showClose: false,
            });

            this.dialogService.openDefaultDialog(dialogData);
        }
    }
    
    private getEditDialogConfig() {
        const config = this.dialogService.getDialogConfig({}, 'inline');
        config.disableClose = true;
        config.minWidth = '29rem'; // THE EDIT MODAL WIDTH

        return config;
    }

    private convertURLToBase64(url: string) {
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

    private updateAssetInfo(asset: Asset, isUpdate = false) {
        if(asset?.Hidden == true) {
            this.showDeleteAssetMSG(asset);
        }
        else {
            asset.Key = this.getCurrentURL() + asset.Name;
            asset.isUpdateAsset = true;
            this.addonService.runUploadWorker({ assets: [asset] });
        }
    }

    // private getFileFromBase64(string64:string, fileName:string) {
       
    //     const trimmedString = string64.replace('data:image/jpeg;base64,', '');
    //     const imageContent = atob(trimmedString);
    //     const buffer = new ArrayBuffer(imageContent.length);
    //     const view = new Uint8Array(buffer);
      
    //     for (let n = 0; n < imageContent.length; n++) {
    //       view[n] = imageContent.charCodeAt(n);
    //     }
    //     const type = 'image/jpeg';
    //     const blob = new Blob([buffer], { type });
    //     return new File([blob], fileName, { lastModified: new Date().getTime(), type });
    //   }

    private setBreadCrumbs() {
        if(this.currentFolder.key === 'new') {
            this.currentFolder.key = (this.breadCrumbsItems.length).toString();
            this.breadCrumbsItems.push( new PepBreadCrumbItem({key: this.currentFolder.key, 
                                                                text: this.cleanFolderName(this.currentFolder.text), 
                                                                title: this.cleanFolderName(this.currentFolder.title)}));
        }
        else {
            const folderIndex = this.currentFolder.key === '/' ? 0 : parseInt(this.currentFolder.key);
            this.breadCrumbsItems.length = (folderIndex + 1);
        }
        
        this.setDataSource();
    }

    private cleanFolderName (folderName: string) : string {
        return folderName.replace(/\/$/, '');
    }

    private setWhereClauseSTR(state) {
        // + " AND MIME LIKE '%folder%'"
        // "&where="
        let whereCluse = state.searchString  ? "Name LIKE '%" + state.searchString + "%'" : '';
            whereCluse +=  this.mimeFilter != 'all' ? ((whereCluse == '' ? '' : " AND ") + "MIME LIKE '%" + this.mimeFilter + "%'") : '';
            whereCluse = whereCluse !== '' ? "&where=" + whereCluse : '';

            // todo - sort is not supportoted on this version
            whereCluse += state.sorting ? ("&order_by=" + state.sorting.sortBy + " " + state.sorting.isAsc ? 'ASC' : 'DESC') : '';
        return whereCluse;
    }

    private getCurrentURL() {
       
        let path = '';
        if(this.breadCrumbsItems.length > 1){
            for (let i=1 ; i <= this.breadCrumbsItems.length; i++) {
                path += (i !== this.breadCrumbsItems.length ?   this.breadCrumbsItems[i].text + '/' : '');
            }
        }
        
        return path;
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
        let folder = this.currentFolder.key === '/' ? '/' : this.getCurrentURL();

        this.dataSource = {
            init: async (state) => {
                this.assetsList = await this.addonService.getAssets("?folder=" + folder + this.setWhereClauseSTR(state));
                
                this.assetsList.forEach( (asset, index) =>  {
                            asset.Name = asset.MIME === 'pepperi/folder' && asset.Key !== '/' ? this.cleanFolderName(asset.Name) : asset.Name;

                            const assetURL = asset.URL + (asset.FileVersion ?  '?versionId=' + asset.FileVersion : '');

                            asset.Thumbnail = asset.MIME === 'pepperi/folder' ?  this.imagesPath + 'system-folder.svg' : 
                                              asset.MIME.toLowerCase().indexOf('application/') > -1 ? this.imagesPath + 'system-doc.svg'  : assetURL; 
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
      
    onSelectedRowChange(event) {
        this.menuActions = event?.length ? event : [];
    }
    
    async assetURLChange(url: string = '') {
        this.urlValidateMsg = '';
       
        if(url !== '') {
            try {
                let filename = new URL(url).pathname.split('/').pop();
                let blob = await fetch(url).then(r => r.blob());

                let asset: Asset = new Asset();

                asset.Key = this.getCurrentURL() + filename;
                asset.URI = await this.convertURLToBase64(url) as string;
                // asset.fileSize = this.formatFileSize(blob.size,2);
                asset.fileSize = blob.size;
                asset.MIME = blob.type;

                this.addonService.runUploadWorker({ assets: [asset] });
            }
            catch (e){
                this.urlValidateMsg = e.message;
            }  
        }
    }

    assetLinkURLChange(event) {
        // emit the new url - the addon/component user need to get the url and use it like a URL ( without upload a file)
        this.hostEvents.emit({
            action: 'link-url',
            url: event
        });
    }
    
    doneAssetsClick(event){
        const selectedAssets = this.getSelectedAsset(this.genericList.getSelectedItems().rows[0]);
        if(selectedAssets){
            let isValid = this.checkFileType(selectedAssets.MIME,true);
            if(isValid){
                    this.hostEvents.emit({
                    action: 'link-url',
                    url: selectedAssets.URL,
                    key: selectedAssets.Key
                });
            }
        }
        else{
            const dialogData = new PepDialogData({
                content: this.translate.instant('EDIT_FILE.PLEASE_CHOOSE_ASSET'),
                showHeader: false,
                showClose: false,
            });
            this.dialogService.openDefaultDialog(dialogData);
        }
       
    }

    closeDialogClick(event){
        this.hostEvents.emit({
            action: 'close-dialog'
        });
    }

    onMenuItemClicked(action: IPepMenuItemClickEvent) {
        this.mimeFilter = action.source.key;
        this.setDataSource();
    }

    onBreadCrumbItemClick(event) {
        if(this.currentFolder.text === event.source.text) {
            return false;
        }

        this.currentFolder = event.source;
        this.setBreadCrumbs();
    }

    onSearchAutocompleteChanged(value) {
        console.log(value);
    }

    // onSearchStateChanged(searchStateChangeEvent: IPepSearchStateChangeEvent) {

    // }
  

    // sortToggle(event){
    //     this.sortBy = this.sortBy === 'ascending' ? 'ascending' : 'descending';
    //     // TODO -  SORTING IMPLEMENTATION
    // }
     
    // viewsToggle(event){
    //     this.currentView = this.currentView === 'list' ? 'thumbnail' : 'list';
    //     // TODO - REPLACE BETWEEN THE VIEWS IMPLEMENTATION
    // }
    toggleContentView(event){

        let btnElem = (this.toggleBtn['element']).nativeElement;

        if(btnElem.className.indexOf('rotate') > -1){
            this.renderer.removeClass(this.uploaderCont.nativeElement,'collapse');
            this.renderer.removeClass( btnElem,'rotate');
            this.renderer.addClass(this.uploaderCont.nativeElement,'expand');
        }
        else{
            this.renderer.addClass(this.uploaderCont.nativeElement,'collapse');
            this.renderer.addClass( btnElem,'rotate');
            this.renderer.removeClass(this.uploaderCont.nativeElement,'expand');
        }
       
       
        //this.renderer.removeClass(this.uploaderCont.nativeElement,'collapse');


    }

    onAddFolderClick(event) {
        let config = this.getEditDialogConfig();
        this.dialogService.openDialog(AddFolderComponent, {}, config).afterClosed().subscribe((value) => {
            if (value) {
                this.addNewFolder(value);
            }
        });
    }

    editAsset(key) {
        let asset = this.getSelectedAsset(key);
        
        if(asset) {
            let config = this.getEditDialogConfig();
            const data = { 
                'asset': asset ,
                'breadCrumbs': this.breadCrumbsItems
            };

            this.dialogService.openDialog(EditFileComponent, data, config).afterClosed().subscribe((value) => {
                if (value) {
                    this.updateAssetInfo(value,true);
                }
            });
        }
    }

    getSelectedAsset(key?: string) {      
        return this.assetsList.find(asset => asset.Key === key);
    }
    
    onCustomizeFieldClick(fieldClickEvent: IPepFormFieldClickEvent) {
       
        const asset: any = this.getSelectedAsset(fieldClickEvent.id);

        if(asset.MIME?.indexOf('application/') > -1 && fieldClickEvent.fieldType !== 26) {
            return false;
        }   
        else if(asset?.MIME && asset.MIME === 'pepperi/folder') {
            this.currentFolder = { key: 'new', text: asset.Name, title: asset.Name};
            this.setBreadCrumbs();
            return false;
        }
        else if(fieldClickEvent.fieldType == FIELD_TYPE.Image) {
            this.imageService.openImageDialog( fieldClickEvent.otherData.imageSrc, [], asset.Key );
        }
        else { 
            this.editAsset(fieldClickEvent.id);
        }
    }

    showDeleteAssetMSG(asset: Asset = null) {
        const dialogData = new PepDialogData({
            content: this.translate.instant('GRID.CONFIRM_DELETE'),
            showHeader: false,
            actionsType: 'cancel-delete',
            showClose: false,
        });

        this.dialogService.openDefaultDialog(dialogData).afterClosed()
            .subscribe((isDeletePressed) => {
                if (isDeletePressed) {
                    this.deleteAssets(asset)
                }
        });
    }

    deleteAssets(asset: Asset = null) {
        // TODO - NEED FIX THIS WHEN CHANGING TO MULTIPLE SELECTION MODE 
        asset = asset !== null ? asset : 
                this.getSelectedAsset(this.genericList.getSelectedItems().rows[0]);
        if(asset){
            asset.Hidden = true;

            this.addonService.runUploadWorker({ status: 'deleting', assets: [asset] });
        }
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

    // convertFileToBase64(file : File) : Observable<string> {
    //     const result = new ReplaySubject<string>(1);
    //     const reader = new FileReader();
    //     reader.readAsDataURL(file);
    //     reader.onload = (event) => result.next(event.target.result.toString());
    //     return result;
    // }
    
    getThumbnails(url) : Array<Thumbnails> {
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

    async addNewFolder(data) {
        let folder = new Asset();
        folder.MIME = 'pepperi/folder';
        folder.URI = ''; // should be empty for folder
        folder.Key = this.getCurrentURL() + data + "/";

        this.addonService.runUploadWorker({ assets: [folder] });
    }

}
// async function uploadTest(bufferFile: String | ArrayBuffer, preSignedURL: string, mimeType: string) {
//     var buffer = new Uint8Array(bufferFile as ArrayBuffer);

//         var requestOptions = {
//             method: 'PUT',
//             body: buffer,
//             headers: {
//                 "Content-Type": mimeType,
//                 "Content-Length": buffer.length.toString()
//             }
//         };
       
//         await fetch( preSignedURL, requestOptions)
//             .then(response => {
//                 console.log(response);
//                 alert(JSON.stringify(response));
//             })
//             .catch(error => {
//                 console.log('error', error)
//             });
// }

