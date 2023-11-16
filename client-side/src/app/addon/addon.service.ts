import { BehaviorSubject, Observable } from 'rxjs';
import jwt from 'jwt-decode';
import { PapiClient } from '@pepperi-addons/papi-sdk';
import { Injectable } from '@angular/core';
import { AssetsSchemeName } from '../../../../shared/metadata';

import { PepAddonService, PepHttpService, PepSessionService } from '@pepperi-addons/ngx-lib';
import { PepSnackBarService } from '@pepperi-addons/ngx-lib/snack-bar';
import { HttpClient } from '@angular/common/http';
import { config } from './addon.config';
import { assetProcess, Asset } from './addon.model';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { InlineWorker } from '../inline-worker';
import { FileStatusType, FileStatusPanelComponent, FileStatus } from '@pepperi-addons/ngx-composite-lib/file-status-panel';
import { TranslateService } from '@ngx-translate/core';
import { file } from 'jszip';
import { PepDialogData, PepDialogService } from '@pepperi-addons/ngx-lib/dialog';
import { ThisReceiver } from '@angular/compiler';

export interface IUploadFilesWorkerOptions {
    status?: FileStatusType;
    files?: File[];
    assetsKeyPrefix?: string;
    assets?: Asset[];
}

export interface IUploadFilesWorkerData {
    baseServerUrl: string;
    token: string;
    workerOptions: IUploadFilesWorkerOptions;
}

export interface IUploadFilesWorkerResult {
    filesStatus?: Array<FileStatus>;
    isFinish?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AddonService {

    smallFileLimit = 150000;
    addonURL = '';
    accessToken = '';
    parsedToken: any
    papiBaseURL = ''
    addonUUID;
    currentSnackBar: MatSnackBarRef<FileStatusPanelComponent>;

    get papiClient(): PapiClient {
        return new PapiClient({
            baseURL: this.papiBaseURL,
            token: this.sessionService.getIdpToken(),
            addonUUID: this.addonUUID,
            suppressLogging:true
        })
    }

    // This subject is for worker result change.
    private _workerResultSubject: BehaviorSubject<IUploadFilesWorkerResult> = new BehaviorSubject<IUploadFilesWorkerResult>(null);
    get workerResultChange$(): Observable<IUploadFilesWorkerResult> {
        return this._workerResultSubject.asObservable();
    }
    
    constructor(
        public sessionService:  PepSessionService,
        private addonService:  PepAddonService,
        private httpService: PepHttpService,
        private pepSnackBarService: PepSnackBarService,
        private translate: TranslateService,
        private dialogService: PepDialogService
    ) {
        this.addonUUID = config.AddonUUID;
        this.addonURL = `/addons/pfs/${this.addonUUID}/${AssetsSchemeName}`;
        this.accessToken = this.sessionService.getIdpToken();
        this.parsedToken = jwt(this.accessToken);
        this.papiBaseURL = this.parsedToken["pepperi.baseurl"];

    }
    getUserDetailsByUUID(uuid: string){
        const endpoint = `/users/UUID/${uuid}`;
        return this.papiClient.get(endpoint);
    }

    getAssets(query?: string) {
        let url =  query ? this.addonURL + query : this.addonURL;
        return this.papiClient.get(encodeURI(url));
        //return this.pepGet(encodeURI(url)).toPromise();  
    }

    async invalidateAsset(asset: Asset){
        
        const body = {
            Key: asset.Key
        };
       
        return this.addonService.postAddonApiCall(this.addonUUID, 'api', 'invalidate_asset', body).toPromise();
    }
    
    async get(endpoint: string): Promise<any> {
        return await this.papiClient.get(endpoint);
    }

    async post(endpoint: string, body: any): Promise<any> {
        return await this.papiClient.post(endpoint, body);
    }

    pepGet(endpoint: string): Observable<any> {
        return this.httpService.getPapiApiCall(endpoint);
    }

    pepPost(endpoint: string, body: any): Observable<any> {
        return this.httpService.postPapiApiCall(endpoint, body);

    }

    showSnackBar(title, assetsStack) {
        if (this.currentSnackBar?.instance) {
            this.currentSnackBar.instance.data = {
                title: title, 
                content: assetsStack
            }
        } else {
            this.currentSnackBar = this.pepSnackBarService.openSnackBarFromComponent(FileStatusPanelComponent, {
                title: title, 
                content: assetsStack
            });
            
            this.currentSnackBar.instance.closeClick.subscribe(() => {
                this.currentSnackBar = null;
            });
        }
    }

    formatFileSize(bytes, decimalPoint) {
        if (bytes == 0) return '0 Bytes';
        var k = 1000,
            dm = decimalPoint || 2,
            sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    runUploadWorker(options: IUploadFilesWorkerOptions) {
        const worker = new InlineWorker(() => {
            // START OF WORKER THREAD CODE
            console.log('Start worker thread, wait for postMessage: ');

            const getAsset = (data: IUploadFilesWorkerData, file: File, uri: string): Asset => {
                let asset: any = {};
                asset.Key = data.workerOptions.assetsKeyPrefix +  file.name;
                asset.URI =  uri;  
                asset.MIME = file.type;
                asset.fileSize = file.size;
                
                return asset;  
            };

            const getAssetBody = (asset: Asset): string => {
                return JSON.stringify({
                    Key:  asset.Key,
                    Description: asset.Description,
                    MIME: asset.MIME,
                    Sync: asset.Sync,
                    URI: asset.TemporaryFileURL?.length ? undefined : (asset.URI || ''),
                    Hidden: asset.Hidden,
                    isUpdateAsset: asset.isUpdateAsset || false,
                    TemporaryFileURLs: asset.TemporaryFileURL?.length ? [asset.TemporaryFileURL] : undefined

                });
            };

            const getTemporaryFilesURLRequest= (baseServerUrl: string, token: string, asset: Asset, helperObject: any, bufferFile: any) => {
                let xhr = new XMLHttpRequest();
                xhr.open('POST', `${baseServerUrl}/temporary_file`, true);
                xhr.setRequestHeader("Authorization", 'Bearer ' + token);
                xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                xhr.onreadystatechange = () => {
                    let fileStatus = helperObject['filesStatus'].find(fs => fs.name === asset.Key);
                    //console.log('XHR: ' + xhr.status + ' ' + xhr.readyState);
                    if (xhr.readyState === 4 && xhr.status === 200) {
                        const res = JSON.parse(xhr.responseText);

                        if(res?.PutURL){
                            asset['TemporaryFileURL'] = res.TemporaryFileURL;
                            var buffer = new Uint8Array(bufferFile as ArrayBuffer);

                            var requestOptions = {
                                method: 'PUT',
                                body: buffer,
                                headers: {
                                    "Content-Length": buffer.length.toString()
                                }
                            };
                           
                            fetch( res.PutURL, requestOptions)
                                .then(response => {
                                    if(response.status === 200)
                                    sendXMLHttpRequest(baseServerUrl, token, asset, helperObject);
                                        //requestSuccess(helperObject,asset,xhr);
                                    else{
                                        requestFailed(xhr, file);
                                    }
                                    
                                })
                                .catch(error => {
                                    requestFailed(xhr, file);
                                })
                                .finally(() => {
                                    console.log('file upload done');
                                });
                        } else{
                            requestSuccess(helperObject,asset,xhr);
                            
                        }
                    } else if (xhr.status !== 200) {
                        requestFailed(xhr, file);
                        // @ts-ignore   
                        if(xhr.status === 400){
                            fileStatus.statusText = JSON.parse(xhr.responseText).fault.faultstring || xhr.statusText;
                        // @ts-ignore   
                        this.postMessage({
                            filesStatus: helperObject['filesStatus'],
                            isFinish: true
                          });
                        }
                    }
                }

                //const body = getAssetBody(asset);
                const body = { 'TempFileName': asset.Key};
                xhr.send(JSON.stringify(body));
            };

            const requestSuccess = (helperObject: any, asset: Asset, xhr: XMLHttpRequest ) => {
                let fileStatus = helperObject['filesStatus'].find(fs => fs.name === asset.Key);
                
                helperObject['filesUploadedCount']++;
                console.log(`${asset.Key} is uploaded - index ${helperObject['fileIndex']}, files uploaded count ${helperObject['filesUploadedCount']}`);
                const isFinish = helperObject['filesUploadedCount'] === helperObject['filesToUploadLength'];
                fileStatus.status = 'done';
                fileStatus.statusMessage = xhr.statusText;

                // @ts-ignore
                this.postMessage({ filesStatus: helperObject['filesStatus'], isFinish: isFinish });

                // Close only if finish.
                if (isFinish) {
                    close();
                }
            }
            
            const requestFailed = (xhr: XMLHttpRequest, fileStatus: any) => {
                fileStatus.status = 'failed';
                fileStatus.statusMessage = xhr.statusText;
            }

            const sendXMLHttpRequest = (baseServerUrl: string, token: string, asset: Asset, helperObject: any) => {
                // Declare the XMLHttpRequest for upload the files.

                let xhr = new XMLHttpRequest();
                xhr.open('POST', `${baseServerUrl}/upsert_asset`, true);
                xhr.setRequestHeader("Authorization", 'Bearer ' + token);
                xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                xhr.onreadystatechange = () => {
                    let fileStatus = helperObject['filesStatus'].find(fs => fs.name === asset.Key);

                    if (xhr.readyState === 4 && xhr.status === 200) {
                        helperObject['filesUploadedCount']++;
                        console.log(`${asset.Key} is uploaded - index ${helperObject['fileIndex']}, files uploaded count ${helperObject['filesUploadedCount']}`);
                        const isFinish = helperObject['filesUploadedCount'] === helperObject['filesToUploadLength'];
                        fileStatus.status = 'done';
                        fileStatus.statusMessage = xhr.statusText;

                        // @ts-ignore
                        this.postMessage({ filesStatus: helperObject['filesStatus'], isFinish: isFinish });

                        // Close only if finish.
                        if (isFinish) {
                            close();
                        }
                    } else if (xhr.status !== 200) {
                        fileStatus.status = 'failed';
                        fileStatus.statusMessage = xhr.statusText;

                        if(xhr.status === 400 || xhr.status === 500){
                            fileStatus.statusMessage = JSON.parse(xhr.responseText).fault.faultstring || xhr.statusText;
                            // @ts-ignore   
                            this.postMessage({
                                filesStatus: helperObject['filesStatus'],
                                isFinish: true
                            });
                            this.showErrorMsg('',JSON.parse(xhr.response).message);
                        }
                    }
                }

                const body = getAssetBody(asset);
                xhr.send(body);
            };

            const uploadFiles = (data: IUploadFilesWorkerData) => {
                const helperObject = {};
                helperObject['filesStatus'] = [];
                helperObject['filesUploadedCount'] = 0;
                
                // If there is XMLHttpRequest and files length > 0.
                if (typeof XMLHttpRequest != 'undefined') {
                    if (data?.workerOptions?.assets?.length > 0) {
                        // Go for all the assets and upload each one.
                        for (let index = 0; index < data.workerOptions.assets.length; index++) {
                            const asset = data.workerOptions.assets[index];
                            helperObject['filesToUploadLength'] = data.workerOptions.assets.length;
                            helperObject['filesStatus'].push({ key: index, name: asset.Key, status: data.workerOptions.status || 'uploading' });
                            helperObject['fileIndex'] = index;

                            // @ts-ignore
                            this.postMessage({ filesStatus: helperObject['filesStatus'], isFinish: false });
                            sendXMLHttpRequest(data.baseServerUrl, data.token, asset, helperObject);
                        }
                    } else if (data?.workerOptions?.files?.length > 0) {
                        // Go for all the files and upload each one.
                        
                        for (let index = 0; index < data.workerOptions.files.length; index++) {
                            const file = data.workerOptions.files[index];
                            const reader = new FileReader();
                            
                            if(file.size <= 150000){ //this.smallFileLimit){
                                reader.readAsDataURL(file);
                                reader.onload = (event) => {
                                    if (event.target.result) {

                                        const asset = getAsset(data, file, event.target.result.toString());
                                        helperObject['filesToUploadLength'] = data.workerOptions.files.length;
                                        helperObject['filesStatus'].push({ key: index, name: asset.Key, status: data.workerOptions.status || 'uploading' });
                                        helperObject['fileIndex'] = index;

                                        // @ts-ignore
                                        this.postMessage({ filesStatus: helperObject['filesStatus'], isFinish: false });
                                        sendXMLHttpRequest(data.baseServerUrl, data.token, asset, helperObject);
                                    }
                                }
                            }
                            else{
                                reader.readAsArrayBuffer(file);
                                reader.onload = (event) => {
                                    if (event.target.result) {
                                        const asset = getAsset(data, file, '');
                                        helperObject['filesToUploadLength'] = data.workerOptions.files.length;
                                        helperObject['filesStatus'].push({ key: index, name: asset.Key, status: data.workerOptions.status || 'uploading' });
                                        helperObject['fileIndex'] = index;

                                        // @ts-ignore
                                        this.postMessage({ filesStatus: helperObject['filesStatus'], isFinish: false });

                                        getTemporaryFilesURLRequest(data.baseServerUrl, data.token, asset, helperObject, event.target.result);
                                    }
                                }
                            }
                        }
                    }
                }
            };
        
            // @ts-ignore
            this.onmessage = (event) => {
                console.log('Upload started: ' + new Date());
                uploadFiles(event.data);
            };
            // END OF WORKER THREAD CODE
        });
      
        const token = this.sessionService.getIdpToken();
        const baseServerUrl = this.addonService.getServerBaseUrl(this.addonUUID, 'api');
        worker.postMessage({
            baseServerUrl,
            token,
            workerOptions: options,
        });
      
        worker.onmessage().subscribe((workerRes) => {
           
            const res: IUploadFilesWorkerResult = workerRes.data;
            console.log(res.isFinish ? 'Upload done: ' : 'Upload updated: ', new Date() + ' ' + res);
            let assetsStack: Array<FileStatus> = res.filesStatus;
            this.showSnackBar(this.translate.instant('ASSETS_PANEL.TITLE'), assetsStack);
           
            if(res.filesStatus[0].status === 'failed' && res.isFinish){
                this.showErrorMsg(res.filesStatus[0].status,res.filesStatus[0].statusMessage);
            }

            if (res.isFinish) {
                worker.terminate();
            }

            this._workerResultSubject.next(res);
        });
      
        worker.onerror().subscribe((data) => {
            console.log(data);
        });
    }

    showErrorMsg(header: string = '',msg: string = '') {
            const dialogData = new PepDialogData({
                content: msg,
                showHeader: true,
                title: header,
                // actionsType: 'cancel-delete',
                showClose: false
            });
    
            this.dialogService.openDefaultDialog(dialogData);
            // .afterClosed()
            //     .subscribe((isDeletePressed) => {
            //         if (isDeletePressed) {
            //             this.deleteAssets(asset)
            //         }
            // });
    }

    getPeperiIcons(query?: null) {
        const body = {
            
        };

        return this.addonService.postAddonApiCall(this.addonUUID, 'api', 'getVarIcons', body).toPromise();
        //let url =  query ? this.addonURL + query : this.addonURL;
        //return this.papiClient.get(encodeURI(url));
    }
}
