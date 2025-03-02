'use client';
import { useEffect } from 'react';
import { ISavedNote, ISyncStatus } from '../types';
import { Mode, Delete } from '@mui/icons-material';
import {useDispatch, useSelector} from 'react-redux';
import {AppDispatch, getNotes, selectNotesStatus, selectNotes, setActiveNote, deleteNote} from './state'; 
import {Accordion, AccordionSummary, AccordionDetails} from '@mui/material';
import {styled} from '@mui/system';
import {DownloadsList} from './Downloads';


const ToolBar = styled('div')({display: 'flex', gap: '10px'});

const SavedNote = (props: {note: ISavedNote, onEdit: () => void}) => {
  const dispatch = useDispatch<AppDispatch>();

  return (
    <div className="note">
      <Accordion>
        <AccordionSummary sx={{backgroundColor: 'var(--primary-color)', fontSize: '20px'}}>
          <div className="note-header">
            <div>{props.note.label}</div>
            <ToolBar>
                <Mode onClick={props.onEdit} />
                <Delete onClick={() => dispatch(deleteNote({id: props.note.id}))} />
            </ToolBar>
          </div>
        </AccordionSummary>
      <AccordionDetails className="description">
        <div>
          {props.note.description}
        </div>
        <div>{props.note.fnames.length > 0 && <DownloadsList downloads={props.note.fnames} noteId={props.note.id}  />}</div>
      </AccordionDetails>
      </Accordion>
    </div>
  )
}


export function NotesList() {
  const dispatch = useDispatch<AppDispatch>();
  const notes = useSelector(selectNotes);
  const notesStatus = useSelector(selectNotesStatus);

  useEffect(() => {
    dispatch(getNotes());
  }, [getNotes, dispatch]);

  if (notesStatus === ISyncStatus.PENDING) {
    return <em>Loading Notes</em>
  }

  if (notesStatus === ISyncStatus.REJECTED) {
    return <em>Error loading Notes.</em>;
  }

  return (
    <div className="notes-list">
      {notes.length > 0 && <div className='header'> Notes <hr /></div>}
      {notes.map((note: ISavedNote) => (
        <SavedNote
            key={note.id} 
            note={note}
            onEdit={() => dispatch(setActiveNote(note))} />))}
    </div>
  )
}

