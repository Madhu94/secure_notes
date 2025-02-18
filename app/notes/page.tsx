'use server';
import {AddNotes} from './AddNotes';
import {NotesList} from './NotesList';

export default async function Notes() {
    // TODO: Trigger noteslist refresh when
    // Add notes happens
    return (
        <div>
            <AddNotes />
            <NotesList />
        </div>
    )
}