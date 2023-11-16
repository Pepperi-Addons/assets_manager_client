import { PapiClient } from "@pepperi-addons/papi-sdk";
import { Client, Request } from '@pepperi-addons/debug-server';

export const schedulerMasterTenantAddonUUID = "f3ae6445-d9a6-4437-8045-623ea89902f1"

//sends "get by key" request to master tenant scheduler addon
export  async function getAssets(client: Client, request: Request): Promise<any>{

    const ret: string[] = [];

    let papiClient = new PapiClient({
        baseURL: client.BaseURL,
        token: client.OAuthAccessToken,
        addonUUID: client.AddonUUID,
        addonSecretKey: client.AddonSecretKey,
        actionUUID: client.ActionUUID
    });
    
    const queryString = encodeQueryParams(request.query, ret);
    console.log(`***********About to call masterTenant Assets with query: ${queryString}***********`);

    const addonURL = `/addons/pfs/${client.AddonUUID}/Assets`;
    let url =  queryString ? `${addonURL}?${queryString}`  : addonURL;
    //let url = addonURL;
    const res = await papiClient.get(encodeURI(url));
    return res;
}

export async function get_codejob_master_tenant_key(client: Client, request: Request) {
    const ret: string[] = [];

    let papiClient = new PapiClient({
        baseURL: client.BaseURL,
        token: client.OAuthAccessToken,
        addonUUID: client.AddonUUID,
        addonSecretKey: client.AddonSecretKey,
        actionUUID: client.ActionUUID
    });

    const queryString = encodeQueryParams(request.query, ret)

    try {
        console.log(`About to call masterTenantScheduler with query: ${queryString}`)
        const masterTenantSchedulerResponse = await papiClient.get(`/addons/api/${schedulerMasterTenantAddonUUID}/api/call_var_api_get_key?${queryString}`);
        console.log(`Succeeded to get codeJobs from Scheduler table`)

        return masterTenantSchedulerResponse;
    }
    catch (error) {
        console.error(JSON.stringify(error))
        throw error
    }
}


// Sends GET request to master tenant scheduler addon
export async function get_codejob_master_tenant_query(client: Client, request: Request) {
    const ret: string[] = [];
    const papiClient = new PapiClient({
        baseURL: client.BaseURL,
        token: client.OAuthAccessToken,
        addonUUID: client.AddonUUID,
        addonSecretKey: client.AddonSecretKey,
        actionUUID: client.ActionUUID
    });

    const queryString = encodeQueryParams(request.query, ret)

    try {
        console.log(`About to call masterTenant Assets with query: ${queryString}`)
        const masterTenantSchedulerResponse = await papiClient.get(`/addons/api/${schedulerMasterTenantAddonUUID}/api/call_var_api_get_query?${queryString}`);
        console.log(`Succeeded to get codeJobs from masterTenant assets`)

        return masterTenantSchedulerResponse;
    }
    catch (error) {
        console.error(JSON.stringify(error))
        throw error
    }
}

function encodeQueryParams(query, ret) {
    // verify distributorUUID is present
    console.log(`Master tenant query: ${query}`)
    if (!query['distributor_uuid']) {
        throw new Error("distributor_uuid parameter is missing")
    }
    // stringify query params
    Object.keys(query).forEach((key) => {
        if (key == "distributor_uuid") {
            ret.push("DistributorUUID='" + encodeURIComponent(query[key]) + "'");
        } else {
            ret.push(key + '=' + encodeURIComponent(query[key]));
        }
    });
    return ret.join('&');
}



