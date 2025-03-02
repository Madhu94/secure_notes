import { ISavedNote, ISession, IState, INote, ISyncStatus } from '../types';
import { decryptNote, encryptNote, encryptFile } from '../crypto';
import {createAsyncThunk, createAction, createReducer, configureStore } from '@reduxjs/toolkit';

const initialState: IState = {
    notes: {
        data: [],
        syncStatus: null
    },
    activeNote: {
        data: {
            label: '',
            description: '',
            fnames: []
        },
        syncStatus: null,
        files: [],
        downloadables: []
    },
    session: {
        syncStatus: null,
    }
}

const decrypt = async ({ label, description, id, fnames }: ISavedNote, email: string) => {
    const decrLabel = await decryptNote(label, email);
    const decrDescription = await decryptNote(description, email);
    return ({ label: decrLabel, description: decrDescription, id, fnames });
};


export const getNotes = createAsyncThunk('setNotes', async (_,  thunkAPI) => {
    const res = await fetch('/api/notes');
    if (!res.ok) {
        throw new Error(`Failed error - ${res.statusText}`);
    }
    const encrNotes = await res.json();
    const state = thunkAPI.getState() as IState;
    const notes = await Promise.all((encrNotes as ISavedNote[]).map((note) => decrypt(note, selectEmail(state) as string)));
    return notes;
});

export const deleteNote = createAsyncThunk('deleteNote', async (arg: {id: number}) => {
    const res = await fetch('/api/notes', {method: 'DELETE', body: JSON.stringify({id: arg.id})});
    const {deleted} = await res.json();
    return {id: deleted};
});

export const getUser = createAsyncThunk<ISession | Error>('setSession', async () => {
    const res = await fetch('/api/me');
    if (!res.ok) {
        throw new Error(`Failed error - ${res.statusText}`);
    }
    const session: ISession = await res.json();
    return session;
});

export const setActiveNote = createAction('setNotes', (note: INote | ISavedNote) => ({payload: note}));

export const setDownloadables = createAction('unsetDownloads', (downloads: string[]) => ({payload: downloads}));

export const filePending = createAction('downloadFile/pending', (idx: number) => (
    {payload: {idx}}
));

export const fileFulfilled = createAction('downloadFile/fulfilled', (idx: number) => (
    {payload: {idx}}
));

export const fileRejected = createAction('downloadFile/rejected', (idx: number, error: string) => (
    {payload: {idx, error}}
));


async function encryptData(blobs: [string, Blob][], email: string) {
    const encryptedBlobs = await Promise.all(blobs.map((blob) => encryptFile(blob[1], email)));
    return encryptedBlobs.map((blob, idx) => {
      return [blobs[idx][0], blob];
    })
}

async function loadData(files: File[]) {
    const promises: Promise<[string, Blob]>[] = files.map((file) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      return new Promise((resolve, reject) => {
        reader.onload = () => {
          resolve([file.name, new Blob([new Uint8Array(reader.result as ArrayBuffer)])]);
        }
  
        reader.onerror = () => {
          reject(reader.error);
        }
      });
    })
    return Promise.all(promises);
}

export const saveNote = createAsyncThunk('saveNote', async (arg: {formData: FormData, allowedFiles: string[], filesData: any}, thunkAPI) => {
    const {formData, allowedFiles, filesData} = arg;
    const label: string = formData.get('label') as string;
    const description: string = formData.get('description') as string;
    const state = thunkAPI.getState() as IState;
    const email = selectEmail(state) as string;

    const files: File[] = [];
    Array.from(formData.entries()).map((entry) => {
        const [k, v] = entry;
        if (k === 'files' && (v as File).size !== 0) {
            files.push(v as File);
        }
    });

    const blobs = await loadData(files);
    formData.delete('files');
    
    
    allowedFiles.map((fname: string) => {
        formData.append(fname, filesData[fname] as Blob);
        blobs.push([fname, filesData[fname] as Blob]);
    });
    
    const encryptedBlobs = await encryptData(blobs, email);

    encryptedBlobs.forEach((res) => {
      const [name, blob] = res;
      formData.set(`file_${name}`, blob);
    });

    const encryptedLabel = await encryptNote(label, email);
    const encryptedDescription = await encryptNote(description, email);
    formData.set('label', encryptedLabel);
    formData.set('description', encryptedDescription);

    const method = !!formData.get('id') ? 'PUT' : 'POST';
    const res: Response = await fetch('/api/notes', { method, body: formData });
    const newNote = await res.json();
    return decrypt(newNote, email);
});


const reducer = createReducer(initialState, (builder) => {
    builder.addCase(getUser.pending, (state, action) => {
        state.session.syncStatus = {status: ISyncStatus.PENDING};
    });
    builder.addCase(getUser.rejected, (state, action) => {
        state.session.syncStatus = {status: ISyncStatus.REJECTED, error: (action.error as Error).toString()};
    });
    builder.addCase(getUser.fulfilled, (state, action) => {
        state.session.syncStatus = {status: ISyncStatus.FULFILLED};
        state.session.data = action.payload as ISession;
    });
    builder.addCase(getNotes.pending, (state, action) => {
        state.notes.syncStatus = {status: ISyncStatus.PENDING};     
    });
    builder.addCase(getNotes.fulfilled, (state, action) => {
        state.notes.syncStatus = {status: ISyncStatus.FULFILLED};
        state.notes.data = action.payload;
    });
    builder.addCase(getNotes.rejected, (state, action) => {
        state.notes.syncStatus = {status: ISyncStatus.REJECTED, error: (action.error as Error).toString()};
    });
    builder.addCase(setActiveNote, (state, action) => {
        state.activeNote.data = action.payload;
        state.activeNote.downloadables = action.payload.fnames;
    });
    builder.addCase(saveNote.pending, (state, action) => {
        state.activeNote.syncStatus = {status: ISyncStatus.PENDING};
    });
    builder.addCase(saveNote.fulfilled, (state, action) => {
        state.activeNote.syncStatus = {status: ISyncStatus.FULFILLED};
        // add the new note to noteslist.
        const note = action.payload;
        const idx = state.notes.data.findIndex((n: ISavedNote) => n.id === note.id);
        if (idx === -1) {
            state.notes.data = (state.notes.data).concat(note);
        } else {
            const notes = state.notes.data;
            state.notes.data = notes.slice(0, idx).concat(note).concat(notes.slice(idx + 1));
        }
        state.activeNote.data = {label: '', description: '', fnames: []};
    });
    builder.addCase(saveNote.rejected, (state, action) => {
        state.activeNote.syncStatus = {status: ISyncStatus.REJECTED, error: (action.error as Error).toString()};
    });
    builder.addCase(filePending, (state, action) => {
        const {idx} = action.payload;
        state.activeNote.files[idx] = {syncStatus: {status: ISyncStatus.PENDING}};
    });
    builder.addCase(fileRejected, (state, action) => {
        const {idx} = action.payload;
        state.activeNote.files[idx] = {
            syncStatus: {status: ISyncStatus.REJECTED, error: action.payload.error}};
    });
    builder.addCase(fileFulfilled, (state, action) => {
        const {idx} = action.payload;
        state.activeNote.files[idx] = {
            syncStatus: {status: ISyncStatus.FULFILLED}
        }
    });
    builder.addCase(deleteNote.fulfilled, (state, action) => {
        const {id} = action.payload;
        state.notes.data = state.notes.data.filter((note: ISavedNote) => note.id !== id);
    });
    // TODO: Handle delete note failed.

    builder.addCase(setDownloadables, (state, action) => {
        state.activeNote.downloadables = action.payload;
    });
});

export const store = configureStore({reducer});

export type AppDispatch = typeof store.dispatch;

// selectors
export const selectEmail = (state: IState) => state?.session?.data?.email ?? null;
export const selectNotes = (state: IState) => state?.notes?.data;
export const selectActiveNote = (state: IState) => state?.activeNote?.data; 
export const selectDownloadables = (state: IState) => state?.activeNote?.downloadables;

export const selectNotesStatus = (state: IState) => state?.notes?.syncStatus?.status;
export const selectUserStatus = (state: IState) => state?.session?.syncStatus?.status;

// Files
export const selectFileSyncStatus = (state: IState, {idx}: {idx: number}) => state.activeNote.files?.[idx]?.syncStatus;
