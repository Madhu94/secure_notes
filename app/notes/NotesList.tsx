'use client';
import {useState, useEffect} from 'react';

interface INote {
    label: string;
    description: string;
    username: string;
  }
  
  interface ISavedNote extends INote {
      id: number;
  }
  

export function NotesList() {
    const [notes, setNotes] = useState<ISavedNote[]>([]);

    useEffect(() => {
      fetch('/api/notes').then((res) => res.json()).then((res) => {
        setNotes(res.notes);
      });
    }, [setNotes])

    return (
      <div className="notes-list">
        <h2> Notes </h2>
        {notes.map((note: ISavedNote) => {
          return (<div className="note" key={note.id}>
            <div className="label">{note.label}</div>
            <div className="description">{note.description}</div>
          </div>)
})}
      </div>
    );
  }
  