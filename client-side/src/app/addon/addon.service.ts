import { Observable } from 'rxjs';
import jwt from 'jwt-decode';
import { PapiClient } from '@pepperi-addons/papi-sdk';
import { Injectable } from '@angular/core';

import { PepHttpService, PepSessionService } from '@pepperi-addons/ngx-lib';
import { HttpClient } from '@angular/common/http';
import { config } from './addon.config';
import { IAsset } from './addon.model';

@Injectable({ providedIn: 'root' })
export class AddonService {

    addonURL = '';
    accessToken = '';
    parsedToken: any
    papiBaseURL = ''
    addonUUID;

    get papiClient(): PapiClient {
        return new PapiClient({
            baseURL: this.papiBaseURL,
            token: this.session.getIdpToken(),
            addonUUID: this.addonUUID,
            suppressLogging:true
        })
    }

    constructor(
        public session:  PepSessionService,
        private httpClient: HttpClient,
        private httpService: PepHttpService
    ) {
        this.addonUUID = config.AddonUUID;
        this.addonURL = `/addons/files/${this.addonUUID}`;
        this.accessToken = this.session.getIdpToken();
        this.parsedToken = jwt(this.accessToken);
        this.papiBaseURL = this.parsedToken["pepperi.baseurl"];
    }

    getAssets(query?: string) {
        let url = `/addons/files/${this.addonUUID}`
       //query = '?order_by="UID"';
       if (query) {
            url = url + query;
        }
        // https://papi.pepperi.com/V1.0/addons/files/714671a5-5274-4668-97fa-e122dd3fc542?folder='/'
        return this.papiClient.get(encodeURI(url));
        //return this.pepGet(encodeURI(url)).toPromise();
    }

    async createAsset(asset: IAsset, query?: string, callback = null){
    return new Promise(async (resolve, reject) => {
        let body = {
                Key: asset.Key,
                Description: asset.Description,
                MIME: asset.MIME,
                Sync: asset.Sync,
                //Thumbnails: asset.Thumbnails,
                URI: asset.URI || '',
                Hidden: asset.Hidden
        };

        //let res = await this.papiClient.addons.api.uuid(this.addonUUID).file('api').func('create_asset').post(undefined, body);
       // work on prod
        await this.httpService.postPapiApiCall(`/addons/api/${this.addonUUID}/api/create_asset`, body).subscribe((res) => {
            if(callback){
                callback(res);
            }
        });
        //await this.httpClient.post('http://localhost:4500/api/create_asset', body, {
    //     headers: {
    //         'Authorization': 'Bearer ' + this.accessToken
    //     }
    //    })
    });
        //this.papiClient.post(encodeURI(url),body);
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

}
