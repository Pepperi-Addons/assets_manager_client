import { AddonDataScheme } from "@pepperi-addons/papi-sdk";
export const assetsBlockName = 'Assets';
export const AssetsSchemeName = 'Assets';


export const AssetsScheme: AddonDataScheme = {
    Name: `${AssetsSchemeName}`,
    Type: 'pfs' as any,
        Fields: {
            Key: {
                Type: 'String'
            } 
        }
};