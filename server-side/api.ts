import MyService from './my.service'
import { Client, Request } from '@pepperi-addons/debug-server'

// add functions here
// this function will run on the 'api/foo' endpoint
// the real function is runnning on another typescript file
export async function assets(client: Client, request: Request) {
    
    const service = new MyService(client)

    if (request.method === 'GET') {
        return await service.getAssets(request?.query || '');
    }
    else if (request.method === 'POST') {
        try {
            return await service.upsertAsset(request.body);
            
        } catch (err) {
            throw new Error(`Failed with error - ${err}`);
        }
    }
    else {
        throw new Error(`Method ${request.method} not supportded`);
    }
}

export async function getAssets(client: Client, request: Request) {
    const service = new MyService(client)
    const res = await service.getAssets(request?.query || '');
    return res
};

export async function getVarIcons(client: Client, request: Request) {
    const service = new MyService(client);
    const res = await service.getVarIcons(request?.query?.url || '');
    return res
};

export async function upsert_asset(client: Client, request: Request) {
    const service = new MyService(client)
    const res = await service.upsertAsset(request.body);
    
    return res
};

export async function temporary_file(client: Client, request: Request) {
    const service = new MyService(client)
    const res = await service.temporaryFile(request.body);
    
    return res
};

export async function invalidate_asset(client: Client, request: Request) {
    const service = new MyService(client)
    const res = await service.invalidateAsset(request.body)
    return res
};

export function import_fix_object(client: Client, request: Request) {

    if (request.method == 'POST') {
        let object = request.body['Object'];
        //need to return the object & not the body.Object
        console.log(`import assets: ${JSON.stringify(object)}`);
        return object; 
    }
    else if (request.method == 'GET') {
        throw new Error(`Method ${request.method} not supported`);       
    }
}

