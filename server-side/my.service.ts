import { PapiClient, InstalledAddon } from '@pepperi-addons/papi-sdk'
import { Client } from '@pepperi-addons/debug-server';
import { AssetsScheme, AssetsSchemeName } from '../shared/metadata';
import { Relation } from '@pepperi-addons/papi-sdk';
import { assetsBlockName, assetsPickerkName } from '../shared/metadata';

class MyService {
    papiClient: PapiClient
    addonUUID;
    addonSecretKey;
    bundleFileName;

    constructor(private client: Client) {
        this.papiClient = new PapiClient({
            baseURL: client.BaseURL,
            token: client.OAuthAccessToken,
            addonUUID: client.AddonUUID,
            addonSecretKey: client.AddonSecretKey,
            actionUUID: client.ActionUUID
        });
        this.addonUUID = client.AddonUUID;
        this.addonSecretKey = client.AddonSecretKey;
        this.bundleFileName = `file_${this.addonUUID}`;
    }

    private async upsertScheme(schemes) {
        await this.papiClient.addons.data.schemes.post(schemes);
    }
    
    private upsertAddonBlockRelation() {
        const addonBlockRelation: Relation = {
            RelationName: "AddonBlock",
            Name: assetsBlockName,
            Description: `${assetsBlockName} addon block`,
            Type: "NgComponent",
            SubType: "NG14",
            AddonUUID: this.addonUUID,
            AddonRelativeURL: this.bundleFileName,
            ComponentName: `${assetsBlockName}Component`,
            ModuleName: `${assetsBlockName}Module`,
            ElementsModule: 'WebComponents',
            ElementName: `assets-element-${this.addonUUID}`,
        }; 
        
        this.upsertRelation(addonBlockRelation);
    }

    private upsertAddonPickerBlockRelation() {
        const addonBlockRelation: Relation = {
            RelationName: "AddonBlock",
            Name: assetsPickerkName,
            Description: `${assetsPickerkName} addon block`,
            Type: "NgComponent",
            SubType: "NG14",
            AddonUUID: this.addonUUID,
            AddonRelativeURL: this.bundleFileName,
            ComponentName: `${assetsPickerkName}Component`,
            ModuleName: `${assetsPickerkName}Module`,
            ElementsModule: 'WebComponents',
            ElementName: `assets-element-${this.addonUUID}`,
        }; 
        
        this.upsertRelation(addonBlockRelation);
    }

    private upsertSettingsRelation() {
        const addonBlockRelation: Relation = {
            RelationName: "SettingsBlock",
            GroupName: 'Pages',
            SlugName: 'assets_manager',
            Name: assetsBlockName,
            Description: 'New Assets Manager',
            Type: "NgComponent",
            SubType: "NG14",
            AddonUUID: this.addonUUID,
            AddonRelativeURL: this.bundleFileName,
            ComponentName: `${assetsBlockName}Component`,
            ModuleName: `${assetsBlockName}Module`,
            ElementsModule: 'WebComponents',
            ElementName: `settings-element-${this.addonUUID}`,
        }; 
        
        this.upsertRelation(addonBlockRelation);
    }

    private async addDimxImportRelation() {
        const importRelation: Relation = {
            AddonUUID: this.addonUUID,
            RelationName: 'DataImportResource',
            Source: 'pfs',
            Name: `${assetsBlockName}`,
            Description: `${assetsBlockName} Import Relation`,
            Type: 'AddonAPI',
            AddonRelativeURL: '',//'/api/import_fix_object',
            MappingRelativeURL: ''
            //FixRelativeURL: '/api/dimx_import',
        }; 

        this.upsertRelation(importRelation);
    }

    private async addDimxExportRelation() {
        const exportRelation: Relation = {
            AddonUUID: this.addonUUID,
            RelationName: 'DataExportResource',
            Source: 'pfs',
            Name: `${assetsBlockName}`,
            Description: `${assetsBlockName} Export Relation`,
            Type: 'AddonAPI',
            AddonRelativeURL: ''
        };

        this.upsertRelation(exportRelation);
    }

    private upsertRelation(relation): Promise<any> {
        return this.papiClient.post('/addons/data/relations', relation);
    }

    createRelationsAndScheme(): void {
        
        this.upsertScheme(AssetsScheme);
        this.upsertAddonBlockRelation();
        this.upsertAddonPickerBlockRelation();
        this.upsertSettingsRelation();
        this.addDimxImportRelation();
        this.addDimxExportRelation();
    }

    updateRelationsAndScheme(): void {
        this.upsertScheme(AssetsScheme);
        this.upsertAddonBlockRelation();
        this.upsertAddonPickerBlockRelation();
        this.upsertSettingsRelation();
        this.addDimxImportRelation();
        this.addDimxExportRelation();
    }

    getAddons(): Promise<InstalledAddon[]> {
        return this.papiClient.addons.installedAddons.find({});
    }

    async upsertAsset(body: Object) {
        let url = `/addons/pfs/${this.addonUUID}/${AssetsScheme.Name}`
        const headers = {
            'X-Pepperi-SecretKey' :  this.addonSecretKey,      
        }
        
        let res = await this.papiClient.post(encodeURI(url),body, headers );
        
        if(body['isUpdateAsset']=== true){
             res = await this.invalidateAsset(body);
        }

        return res;
    }

    async invalidateAsset(body: any) {
        let url = `/addons/pfs/${this.addonUUID}/${AssetsScheme.Name}/${body.Key}/invalidate`;
        const headers = {
            'X-Pepperi-SecretKey' :  this.addonSecretKey,      
        }
        const res = await this.papiClient.post(encodeURI(url),body, headers );
        return res;
    }
}

export default MyService;