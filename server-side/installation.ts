
/*
The return object format MUST contain the field 'success':
{success:true}

If the result of your code is 'false' then return:
{success:false, erroeMessage:{the reason why it is false}}
The error Message is importent! it will be written in the audit log and help the user to understand what happen
*/

import { Client, Request } from '@pepperi-addons/debug-server'
import { Relation } from '@pepperi-addons/papi-sdk';
import MyService from './my.service';

const blockName = 'Assets';

export async function install(client: Client, request: Request): Promise<any> {
   
    const assetsRelationsRes = await addAddonBlockRelation(client);
    const dimxImportRes = await addDimxImportRelation(client);
    const dimxExportRes = await addDimxExportRelation(client);
   
    return {
        success: assetsRelationsRes.success && dimxImportRes.success && dimxExportRes.success,
        errorMessage: `assetsRelationsRes: ${assetsRelationsRes.errorMessage}, dimxImportRes: ${dimxImportRes.errorMessage}, dimxExportRes: ${dimxExportRes.errorMessage}`
    };
}

export async function uninstall(client: Client, request: Request): Promise<any> {
    return {success:true,resultObject:{}}
}

export async function upgrade(client: Client, request: Request): Promise<any> {
    return {success:true,resultObject:{}}
}

export async function downgrade(client: Client, request: Request): Promise<any> {
    return {success:true,resultObject:{}}
}

async function addAddonBlockRelation(client) {
    try {
        const filename = `file_${client.AddonUUID.replace(/-/g, '_').toLowerCase()}`;

        const addonBlockRelation: Relation = {
            RelationName: "AddonBlock",
            Name: blockName,
            Description: `${blockName} addon block`,
            Type: "NgComponent",
            SubType: "NG11",
            AddonUUID: client.AddonUUID,
            AddonRelativeURL: filename,
            ComponentName: `${blockName}Component`,
            ModuleName: `${blockName}Module`,
        }; 
        
        const service = new MyService(client);
        const result = await service.upsertRelation(addonBlockRelation);
        return {success:true, errorMessage: {result} };
    } catch(e) {
        return { success: false, errorMessage: {e} };
    }
}

async function addDimxImportRelation(client) {
    try {
        const importRelation: Relation = {
            RelationName: 'DataImportResource',
            Name: blockName,
            Description: `${blockName} import`,
            Type: 'AddonAPI',
            AddonUUID: client.addonUUID,
            AddonRelativeURL: '/api/import_fix_object',
            MappingRelativeURL: ''
        }; 

        const service = new MyService(client);
        const result = await service.upsertRelation(importRelation);
        return {success:true, errorMessage: {result} };
    } catch(e) {
        return { success: false, errorMessage: {e} };
    }
}

async function addDimxExportRelation(client) {
    try {

        const exportRelation: Relation = {
            RelationName: 'DataExportResource',
            Name: blockName,
            Description: `${blockName} export`,
            Type: 'AddonAPI',
            AddonUUID: client.addonUUID,
            AddonRelativeURL: ''
        };

        const service = new MyService(client);
        const result = await service.upsertRelation(exportRelation);
        return {success:true, errorMessage: {result} };
    } catch(e) {
        return { success: false, errorMessage: {e} };
    }
}

