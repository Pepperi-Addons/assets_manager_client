import { PapiClient, InstalledAddon } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { AssetsScheme } from '../shared/metadata';

class MyService {

    papiClient: PapiClient
    addonUUID;
    addonSecretKey;
    constructor(private client: Client) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client["ActionUUID"]
        });
        this.addonUUID = client.AddonUUID;
        this.addonSecretKey = client.AddonSecretKey
    }

    async upsertAsset(body: Object) {
        let url = `/addons/pfs/${this.addonUUID}/${AssetsScheme.Name}`
        const headers = {
            'X-Pepperi-SecretKey' :  this.addonSecretKey,      
        }
        const res = await this.papiClient.post(encodeURI(url),body, headers );
        return res;
    }

    upsertRelation(relation): Promise<any> {
        return this.papiClient.post('/addons/data/relations', relation);
    }
  
    getAddons(): Promise<InstalledAddon[]> {
        return this.papiClient.addons.installedAddons.find({});
    }

    async createSchemes() {
        await this.upsertScheme(AssetsScheme)
    }
    private async upsertScheme(schemes) {
        await this.papiClient.addons.data.schemes.post(schemes);
    }

    
}

export default MyService;