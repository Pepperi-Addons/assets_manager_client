import { BehaviorSubject, Observable } from 'rxjs';
import jwt from 'jwt-decode';
import { PapiClient } from '@pepperi-addons/papi-sdk';
import { Injectable } from '@angular/core';

import { PepAddonService, PepHttpService, PepSessionService } from '@pepperi-addons/ngx-lib';
import { HttpClient } from '@angular/common/http';
import { config } from './addon.config';
import { assetProcess, Asset } from './addon.model';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { InlineWorker } from '../inline-worker';
import { fileStatus, FileStatusPanelComponent, IFile } from '../components/file-status-panel';
import { TranslateService } from '@ngx-translate/core';

export interface IUploadFilesWorkerOptions {
    status?: fileStatus;
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
    filesStatus?: Array<IFile>;
    isFinish?: boolean;
}

@Injectable({ providedIn: 'root' })
export class AddonService {

    addonURL = '';
    accessToken = '';
    parsedToken: any
    papiBaseURL = ''
    addonUUID;
    snackBarRef: MatSnackBarRef<TextOnlySnackBar>;
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
        private httpClient: HttpClient,
        private httpService: PepHttpService,
        private snackBar: MatSnackBar,
        private translate: TranslateService,
    ) {
        this.addonUUID = config.AddonUUID;
        this.addonURL = `/addons/files/${this.addonUUID}`;
        this.accessToken = this.sessionService.getIdpToken();
        this.parsedToken = jwt(this.accessToken);
        this.papiBaseURL = this.parsedToken["pepperi.baseurl"];

    }

    getAssets(query?: string) {
        let url = `/addons/files/${this.addonUUID}`
       //query = '?order_by="UID"';
       //query = '?folder=/&Name=orange.jpg';
       if (query) {
            url = url + query;
        }
        // https://papi.pepperi.com/V1.0/addons/files/714671a5-5274-4668-97fa-e122dd3fc542?folder='/'
        return this.papiClient.get(encodeURI(url));
        //return this.pepGet(encodeURI(url)).toPromise();
    }

    // async upsertAsset(asset: Asset, query?: string): Promise<any> {
    //     let body = {
    //             Key: asset.Key,
    //             Description: asset.Description,
    //             MIME: asset.MIME,
    //             Sync: asset.Sync,
    //             //Thumbnails: asset.Thumbnails,
    //             URI: asset.URI || '',
    //             Hidden: asset.Hidden
    //     };

    //     return this.addonService.postAddonApiCall(this.addonUUID, 'api', 'upsert_asset', body).toPromise();
    // }
    
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
            this.currentSnackBar.instance.title = title;
            this.currentSnackBar.instance.filesList = assetsStack;
        } else {
            this.currentSnackBar = this.snackBar.openFromComponent(FileStatusPanelComponent, {
                horizontalPosition: 'end',
                verticalPosition: 'bottom',
            });
            this.currentSnackBar.instance.title = title;
            this.currentSnackBar.instance.filesList = assetsStack;

            this.currentSnackBar.instance.closeClick.subscribe(() => {
                this.currentSnackBar.dismiss();
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
                asset.Key = data.workerOptions.assetsKeyPrefix + '/' +  file.name;
                asset.URI = uri;
                asset.MIME = file.type;
                asset.fileSize = file.size;

                return asset;
            };

            const getAssetBody = (asset: Asset): string => {
                return JSON.stringify({
                    Key: asset.Key,
                    Description: asset.Description,
                    MIME: asset.MIME,
                    Sync: asset.Sync,
                    //Thumbnails: asset.Thumbnails,
                    URI: asset.URI || '',
                    Hidden: asset.Hidden
                });
            };

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
            let assetsStack: Array<IFile> = res.filesStatus;
            this.showSnackBar(this.translate.instant('ASSETS_PANEL.TITLE'), assetsStack);
            
            if (res.isFinish) {
                worker.terminate();
            }

            this._workerResultSubject.next(res);
        });
      
        worker.onerror().subscribe((data) => {
            console.log(data);
        });
    }
}
