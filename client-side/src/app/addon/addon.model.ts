import { FileStatusType } from "@pepperi-addons/ngx-composite-lib/file-status-panel";

export type syncOption = "None" | "Device" | "DeviceThumbnail" | "Always";
export type allowedAssetsTypes = 'images' | 'documents' | 'all';
export type selectionType = 'single' | 'multiple';
export type assetsView = 'list' | 'thumbnail';
export type sortBy = 'ascending' | 'descending' ;
// export type uploadStatus = 'uploading' | 'done' | 'failed' | 'hidden' | 'deleting';

export class Thumbnails { 
    Size: string = '200x200';
    URL: string = '';
}

export class assetProcess {
    key?: number;
    name = '';
    status: FileStatusType = 'uploading';
}
export class Asset {
    Key: string = ''; // mandatory, unique, /my-images/7535.jpg /'s in the name will organize the files in folders
    Folder: ""; // readonly,
    Name: ""; // readonly,
    Description: string = ''; // optional
    MIME: string  = ''; //image/jpeg... (file type) or "pepperi/folder"
    Thumbnails: Array<Thumbnails> = [ // optional
        {
            Size: '', // '200x200', // Only for image type
            URL: '', // readonly "http://cdn.pepperi.com/private_pfs/dakhdakhd_200x200.jpg"
        }
    ];
    Sync: syncOption = 'Always'; // optional
    URL: string = ""; // Read only. the CDN URL
    URI: string = ""; // mandatory on create/update , empty "URI" means a creation of a folder , Can be a http URL or base64 data URI
    Hidden: boolean = false;
    creationDate: number;
    modificationDate: number;
    ownerUUID : string = '';
    // fileSize: string = '0';
    fileSize: number = 0;
    isUpdateAsset: boolean = false;
    TemporaryFileURL: string = '';

    constructor(mimeType = null){
        //this.mimeType = mimeType;
    }
}