import AssetsService from './my.service'
import { Client, Request } from '@pepperi-addons/debug-server'

// add functions here
// this function will run on the 'api/foo' endpoint
// the real function is runnning on another typescript file
export async function foo(client: Client, request: Request) {
    const service = new AssetsService(client)
    const res = await service.getAddons()
    return res
};

export async function create_asset(client: Client, request: Request) {
    const service = new AssetsService(client)
    const res = await service.createAsset(request.body)
    return res
};

