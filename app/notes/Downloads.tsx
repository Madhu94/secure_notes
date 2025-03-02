'use client';
import {useMemo, useEffect, useState} from 'react';
import {decryptFile} from '../crypto';
import {useDispatch, useSelector} from 'react-redux';
import {selectEmail, AppDispatch, selectFileSyncStatus, filePending, fileFulfilled, fileRejected} from './state';
import {IState, ISyncStatus} from '../types';
import {Delete} from '@mui/icons-material';

export const downloadFile = async (args: {idx: number, name: string, noteId: number, email: string}) => {
      const res = await fetch(`/api/files?fileName=${args.name}&noteId=${args.noteId}`, { method: 'GET' });
      if (!res.ok || !res.body) {
          throw new Error(`Failed to download error - ${res.statusText}`);
      }
      const buffer = await res.body.getReader().read();
      if (!buffer.value) {
          throw new Error(`Failed to download any data for ${args.name}`);
      }
      const blob = new Blob([buffer.value]);
      const decrArray = await decryptFile(blob, args.email as string);
      return decrArray;
};

export const Download = (props: { name: string, noteId: number, idx: number, onDelete?: (idx: number) => void, setData?: (blob: Blob, name: string) => void}) => {
    const dispatch = useDispatch<AppDispatch>();
    const syncStatus = useSelector((state: IState) => selectFileSyncStatus(state, {idx: props.idx}));
    const email = useSelector(selectEmail) as string;
    const [data, setData] = useState<Blob | null>(null);
    
    const objectUrl = useMemo(() => {
      if (!data) {
        return '';
      }
      return window.URL.createObjectURL(data)
    }, [data])
  
    useEffect(() => {
        dispatch(filePending(props.idx));
        const prom = downloadFile({idx: props.idx, noteId: props.noteId, name: props.name, email});
        prom.then((d) => {
          if (props.setData) {
            props.setData(d, props.name);
          }
          setData(d);
          dispatch(fileFulfilled(props.idx))
        }, (err) => {
          dispatch(fileRejected(props.idx, (err as Error).toString()));
        })
    }, [dispatch, props.idx, props.noteId, props.name]);
  
    if (syncStatus?.status === ISyncStatus.PENDING || !syncStatus?.status) {
      return <em>Loading file data</em>;
    } else if (syncStatus.status === ISyncStatus.REJECTED) {
      return <em>Something went wrong...</em>;
    }
    return (
      <div className='download'>
        <a href={objectUrl} download={props.name}>{props.name}</a>
        {props.onDelete && <Delete onClick={() => props.onDelete(props.idx)} />}
      </div>
    )
}
  
export const DownloadsList = (props: { downloads: string[], noteId: number, onDelete?: (idx: number) => void, setData?: (data: Blob, name: string) => void}) => {
    return (
      <div className='downloads'>
        {props.downloads.map((download: string, idx: number) => (<Download idx={idx} 
            key={download} 
            name={download}
            noteId={props.noteId}
            onDelete={props.onDelete}
            setData={props.setData}
         />))}
      </div>
    )
}