'use client';
import { TextField, Button } from "@mui/material";
import {addNote} from './db'; 
import { useActionState } from 'react';

export function AddNotes() {
  const [state, action] = useActionState(addNote, null);
  return (
    <form className="add-note" action={action}>
      <TextField type="text" className="input" label="Label" name="label" />
      <TextField
        className="input description"
        type="text"
        label="Description"
        name="description"
        multiline
        rows={3}
      />
      <Button type="submit" variant="contained">
        Add Note
      </Button>
    </form>
  );
}
