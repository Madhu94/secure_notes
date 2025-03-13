'use server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { insertNote, updateNote } from '../db';
import {ISession} from '../types';
import { INote, ISavedNote } from '../types';

export const getUser = async () => {
    const store = await cookies();
    const password = process.env.NEXT_PUBLIC_SESSION_SECRET ?? 'mysecretsession';
    const session = await getIronSession<ISession>(store, { password, cookieName: 'session' });
    return session;
}

export async function addNote(formData: FormData, upsert: boolean = false) {
    const {email} = await getUser();
    const files: {[k: string]: File} = {};
    const fnames: string[] = []
    for (const entry of formData.entries()) {
        const [k, v] = entry;
        if (k.startsWith('file')) {
            const name = k.split('_').splice(1).join('');
            files[name] = v as File;
            fnames.push(name);
        }
    }
    if (!upsert) {
        const note: INote = {
            label: formData.get('label') as string,
            description: formData.get('description') as string,
            fnames: fnames
        }
        return await insertNote(note, files, email);
    } else {
        const note: ISavedNote = {
            label: formData.get('label') as string,
            description: formData.get('description') as string,
            fnames: fnames,
            id: parseInt(formData.get('id') as string, 10)
        }
        return await updateNote(note, files, email);
    }
}

