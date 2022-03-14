import { PapiClient, InstalledAddon } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';

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

    async createAsset(body: Object) {
        let url = `/addons/files/${this.addonUUID}`
        const headers = {
            'X-Pepperi-SecretKey' :  this.addonSecretKey,      
        }
        const res = await this.papiClient.post(encodeURI(url),body, headers );
        return res;
    }
  
    getAddons(): Promise<InstalledAddon[]> {
        return this.papiClient.addons.installedAddons.find({});
    }
}

export default MyService;