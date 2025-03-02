import {IError} from './errors';

export interface INote {
    label: string;
    description: string;
    fnames: string[];
    created_at?: string;
    updated_at?: string;
}
  
export interface ISavedNote extends INote {
    id: number;
}

export interface ISession {
    name: string;
    email: string;
    id: number;
}

export interface ISignupData {
    email: string;
    name: string;
    password: string;
    error?: IError;
}

export interface ILoginData {
    email: string;
    password: string;
    error?: IError;
}

export interface IUser {
    name: string;
    email: string;
    pwhash: string;
}

export enum ISyncStatus {
    REJECTED = 1,
    FULFILLED = 2,
    PENDING = 3
}

export interface DownloadableFile {
    syncStatus: {status: ISyncStatus.FULFILLED} | {status: ISyncStatus.PENDING} | 
                {status: ISyncStatus.REJECTED, error: string} | null,
}

export interface IState {
    notes: {
        syncStatus: {status: ISyncStatus.FULFILLED} | {status: ISyncStatus.PENDING} | 
                    {status: ISyncStatus.REJECTED, error: string} | null,
        data: ISavedNote[]
    },
    activeNote: {
        data: INote | ISavedNote;
        syncStatus: {status: ISyncStatus.FULFILLED} | {status: ISyncStatus.PENDING} | 
                    {status: ISyncStatus.REJECTED, error: string} | null,
        // this can be pared down to just files sync statuses.
        files: DownloadableFile[];
        downloadables: string[];
    },
    session: {
        syncStatus: {status: ISyncStatus.FULFILLED} | {status: ISyncStatus.PENDING} | 
                 {status: ISyncStatus.REJECTED, error: string} | null,
        data?: ISession
    }
}