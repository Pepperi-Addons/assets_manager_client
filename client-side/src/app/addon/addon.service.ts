import { Observable } from 'rxjs';
import jwt from 'jwt-decode';
import { PapiClient } from '@pepperi-addons/papi-sdk';
import { Injectable } from '@angular/core';

import { PepAddonService, PepHttpService, PepSessionService } from '@pepperi-addons/ngx-lib';
import { HttpClient } from '@angular/common/http';
import { config } from './addon.config';
import { assetProcess, IAsset } from './addon.model';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar, MatSnackBarRef, TextOnlySnackBar } from '@angular/material/snack-bar';
import { InlineWorker } from '../inline-worker';
import { FileStatusPanelComponent, IFile } from '../components/file-status-panel';

export interface IUploadFilesWorker {
    baseServerUrl: string;
    token: string;
    assetsKeyPrefix: string;
    files: any[];
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

    constructor(
        public sessionService:  PepSessionService,
        private addonService:  PepAddonService,
        private httpClient: HttpClient,
        private httpService: PepHttpService,
        private snackBar: MatSnackBar,
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

    async upsertAsset(asset: IAsset, query?: string): Promise<any> {
        let body = {
                Key: asset.Key,
                Description: asset.Description,
                MIME: asset.MIME,
                Sync: asset.Sync,
                //Thumbnails: asset.Thumbnails,
                URI: asset.URI || '',
                Hidden: asset.Hidden
        };

        return this.addonService.postAddonApiCall(this.addonUUID, 'api', 'upsert_asset', body).toPromise();
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

    runUploadWorker(files, assetsKeyPrefix) {
        const worker = new InlineWorker(() => {
            // START OF WORKER THREAD CODE
            console.log('Start worker thread, wait for postMessage: ');
      
            const getAssetBody = (data: IUploadFilesWorker, file: any, assetUri: string): string => {
                return JSON.stringify({
                    Key: data.assetsKeyPrefix + '/' +  file.name,
                    // Description: '',
                    MIME: file.type,
                    // Sync: 'None',
                    //Thumbnails: asset.Thumbnails,
                    URI: assetUri,
                    Hidden: false
                });
            };

            const uploadFiles = (data: IUploadFilesWorker) => {
                const filesStatus: Array<IFile> = [];
                let filesUploadedCount = 0;
                
                // If there is XMLHttpRequest and files length > 0.
                if (typeof XMLHttpRequest != 'undefined' && data?.files?.length > 0) {
                    
                    // Go for all the files and upload each one.
                    for (let index = 0; index < data.files.length; index++) {
                        const file = data.files[index];
                        filesStatus.push({ key: index, name: file.name, status: 'uploading' });

                        // @ts-ignore
                        this.postMessage({ filesStatus: filesStatus, isFinish: false });

                        const reader = new FileReader();
                        reader.readAsDataURL(file);
                        reader.onload = (event) => {
                            // Declare the XMLHttpRequest for upload the files.
                            let xhr = new XMLHttpRequest();
                            xhr.open('POST', `${data.baseServerUrl}/upsert_asset`, true);
                            xhr.setRequestHeader("Authorization", 'Bearer ' + data.token);
                            xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                            xhr.onreadystatechange = () => {
                                if (xhr.readyState === 4 && xhr.status === 200) {
                                    filesUploadedCount++;
                                    console.log(`${file.name} is uploaded - index ${index}, files uploaded count ${filesUploadedCount}`);
                                    const isFinish = filesUploadedCount === data.files.length;
                                    filesStatus.find(fs => fs.name === file.name).status = 'done';

                                    // @ts-ignore
                                    this.postMessage({ filesStatus: filesStatus, isFinish: isFinish });

                                    // Close only if finish.
                                    if (isFinish) {
                                        close();
                                    }
                                }
                            }
        
                            const assetUri = event.target.result.toString();
                            const body = getAssetBody(data, file, assetUri);
                            xhr.send(body);
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
            assetsKeyPrefix,
            files,
        });
      
        worker.onmessage().subscribe((data) => {
            console.log(data.data.isFinish ? 'Upload done: ' : 'Upload updated: ', new Date() + ' ' + data.data);
            let assetsStack: Array<IFile> = data.data.filesStatus;
            this.showSnackBar('Uploading', assetsStack);
            
            if (data.data.isFinish) {
                worker.terminate();
            }
        });
      
        worker.onerror().subscribe((data) => {
            console.log(data);
        });
    }
}
