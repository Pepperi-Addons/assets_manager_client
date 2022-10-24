import { AddonDataScheme } from '@pepperi-addons/papi-sdk';
export const assetsBlockName = 'Assets';
export const AssetsSchemeName = 'Assets';
export const assetsPickerkName = 'AssetPicker';


export const AssetsScheme: AddonDataScheme = {
    Name: `${AssetsSchemeName}`,
    Type: 'pfs',
    SyncData: {
        Sync: true
    }
};