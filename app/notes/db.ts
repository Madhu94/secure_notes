'use server';
import {cookies} from 'next/headers';
import {getIronSession} from 'iron-session';
import {insertNote } from '../db';


// TODO: What does this return for a user who isn't logged in?
// TODO: Move this to utils
export const getUser = async () => {
    const store = await cookies();
    const password = process.env.NEXT_PUBLIC_SESSION_SECRET ?? 'mysecretsession';
    const session = await getIronSession<{username: string}>(store, {password, cookieName: 'session'});
    return session.username;
}

interface INote {
    label: string;
    description: string;
    username: string;
  }
  
  interface ISavedNote extends INote {
      id: number;
  }
  
  export async function addNote (state: any, formData: FormData | null) {
      if (!formData) {
          return '';
      }
      const username = await getUser();
      const note: INote = {
          label: formData.get('label') as string,
          description: formData.get('description') as string,
          username
      }
      try {
          await insertNote(note);
          return '';
      } catch (e) {
          return `Failed to upsert note - ${e}`;
      }
  }
  
  