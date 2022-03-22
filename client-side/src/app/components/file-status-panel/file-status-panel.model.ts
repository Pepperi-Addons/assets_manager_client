export type fileStatus = 'uploading' | 'downloading' | 'done' | 'failed' | 'hidden' | 'deleting';

export class IFile {
    key = 0;
    name = '';
    status: fileStatus = 'uploading';
    statusMessage = '';
}