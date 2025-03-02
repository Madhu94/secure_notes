'use client';
import { TextField, Button } from "@mui/material";
import React, { useCallback, useMemo, useRef} from 'react';
import {ISavedNote} from '../types';
import {useSelector, useDispatch} from 'react-redux';
import {AppDispatch, selectActiveNote, saveNote, setActiveNote, selectDownloadables, setDownloadables} from './state';
import {DownloadsList} from './Downloads'; 

export function NoteEditor() {
  const note = useSelector(selectActiveNote);
  const downloadables = useSelector(selectDownloadables);
  // Re upload files that are old attachments.
  const filesRef = useRef<any>({});

  const dispatch = useDispatch<AppDispatch>();

  const action = useCallback(async function (formData: FormData) {
    dispatch(saveNote({formData, allowedFiles: downloadables, filesData: filesRef.current}));
  }, [dispatch, saveNote, downloadables, filesRef.current]);

  const onChangeFiles = useCallback((evt: React.ChangeEvent<HTMLInputElement>) => {
    if (evt.target.files !== null) {
      const f: File[] = [];
      const fnames: string[] = [];
      for (let file of evt.target.files) {
        f.push(file);
        fnames.push(file.name);
      }
      // All old files get reset
      dispatch(setActiveNote({...note, fnames}));
      dispatch(setDownloadables([]));
    }
    // for each of these files, read as datauri.
  }, [dispatch, setActiveNote, note]);
  
  // You can only delete downloadables
  const onDelete = useCallback((idx: number) => {
    const names = downloadables;
    const nfnames = names.slice(0, idx).concat(names.slice(idx + 1));
    dispatch(setDownloadables(nfnames));
  }, [downloadables, dispatch, setDownloadables]);

  const onSetData = useCallback((data: Blob, name: string) => {
    filesRef.current[name] = data; 
  }, [filesRef]);

  return (
    <form className="add-note" action={action}>
      <TextField type="text" className="input" label="Label" name="label" value={note.label} 
          slotProps={{ inputLabel: { shrink: !!(note.label)  } }} 
          onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
            dispatch(setActiveNote({...note, label: evt.target.value}));
          }}
          />
      <TextField
        className="input description"
        type="text"
        label="Description"
        name="description"
        multiline
        rows={3}
        value={note.description}
        onChange={(evt: React.ChangeEvent<HTMLInputElement>) => dispatch(setActiveNote({...note, description: evt.target.value}))}
        slotProps={{ inputLabel: {shrink: !!(note.description)} }}
      />
      {(note as ISavedNote).id && <input type='hidden' name='id' value={(note as ISavedNote).id} />}
      <div><input type='file' name='files' className="input" multiple onChange={onChangeFiles} /></div>
      <div>
          {(note as ISavedNote).id && <DownloadsList noteId={(note as ISavedNote).id} downloads={downloadables} onDelete={onDelete} setData={onSetData} />}
      </div>
      <Button type="submit" className='submit' variant="contained">
        Save Note
      </Button>
    </form>
  );
}
