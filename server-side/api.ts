import MyService from './my.service'
import { Client, Request } from '@pepperi-addons/debug-server'

// add functions here
// this function will run on the 'api/foo' endpoint
// the real function is runnning on another typescript file
export async function foo(client: Client, request: Request) {
    const service = new MyService(client)
    const res = await service.getAddons()
    return res
};

export async function upsert_asset(client: Client, request: Request) {
    const service = new MyService(client)
    const res = await service.upsertAsset(request.body)
    return res
};

export function import_fix_object(client: Client, request: Request) {

    if (request.method == 'POST') {
        let object = request.body['Object'];
        //need to return the object & not the body.Object
        console.log(`import gallery: ${JSON.stringify(object)}`);
        return object; 
    }
    else if (request.method == 'GET') {
        throw new Error(`Method ${request.method} not supported`);       
    }
}

