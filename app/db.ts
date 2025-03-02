import { Client } from 'pg';
import fs from 'fs/promises';
import path from 'path';
import {INote, ISavedNote, IUser} from './types';

// TODO: Make a DB Connection pool.
let client: Client | null = null;

export const init = async () => {
    if (client != null) {
        return client;
    }
    client = new Client({
        user: 'madhu',
        password: 'password',
        database: 'notes',
        host: '127.0.0.1',
        port: 5432
    });
    await client.connect();
    return client;
}

export const fetchNotes = async (user: number) => {
    if (!client) {
        init();
    }
    if (!client) {
        console.log(`Error in client initialization`);
        return [];
    }
    const query = `select * from secure_notes where owner=${user} order by created_at desc`;
    // Error just gets bubbled up
    const notes = await client.query(query);
    return notes.rows;
}



export async function addUser(user: IUser): number {
    const client = await init();
    const res = await client.query(`insert into users (username, email, pwhash) values ('${user.name}', '${user.email}', '${user.pwhash}') returning id`);
    return res.rows[0].id;
}


export async function hasUser(email: string) {
    const client = await init();
    if (!client) {
        return;
    }
    console.log('Fetching users with email ...', email);
    const res = await client.query(`select * from users where email='${email}';`);
    console.log(res.rows);
    return res.rows.length > 0;
}

export async function getUser(email: string) {
    const client = await init();
    if (!client) {
        return;
    }
    console.log('Fetching users with email ...', email);
    const res = await client.query(`select * from users where email='${email}';`);
    return res.rows?.[0] ?? null;
}


export async function getNotes(email: string) {
    const client = await init();
    if (!client) {
        console.log('Failed to initialize client...');
        return [];
    }
    console.log('Fetching users with email...', email);

    // TODO: Make this part of session
    const r = await client.query(`select id from users where email='${email}'`);
    const id = r.rows[0].id;
    const res = await client.query(`select * from secure_notes where owner=${id}`);
    return res.rows.map((row: any) => {
        const fnames = row.fnames ? row.fnames.split(',') : [];
        return (
            { id: row.id, label: row.label, description: row.description, created_at: row.created_at, fnames }
        )
    }) as ISavedNote[];
}

const PATH = path.resolve('public');

const uploadFiles = async (user: string, noteId: number, files: { [k: string]: File }) => {
    if (Object.keys(files).length == 0) {
        return Promise.resolve();
    }
    await fs.mkdir(`${PATH}/attachments/${user.toString()}`, {recursive: true});
    const promises = Object.entries(files).map((entry) => {
        const p = (async function (entry: [string, File]) {
            const [k, v] = entry;
            const data = new Uint8Array(await v.arrayBuffer());
            const filename = `${noteId}_${k}`;
            return fs.writeFile(`${PATH}/attachments/${user.toString()}/${filename}`, data);
        })(entry);
        return p;
    });
    return Promise.all(promises);
}

export const deleteFiles = async (noteId: number, id: number) => {
    const userFilePath = path.join(PATH, 'attachments', `${id}`);
    const userFiles = await fs.readdir(userFilePath);
    const deleteFiles = userFiles.filter((f) => f.startsWith(`${noteId}`));
    console.log(deleteFiles);
    const deletePromises = deleteFiles.map((f) => fs.rm(path.join(userFilePath, f)));
    return await Promise.all(deletePromises);
};

export async function insertNote(note: INote, files: { [k: string]: File }, email: string) {
    const client = await init();
    if (!client) {
        return;
    }
    // TODO: Make this part of session
    const res = await client.query(`select id from users where email='${email}'`);
    const id = res.rows[0].id;
    let fnames = note.fnames.join(',');
    if (!fnames) {
        fnames = 'NULL';
    } else {
        fnames = `'${fnames}'`;
    }
    const r = await client.query(`insert into secure_notes (label, description, created_at, updated_at, owner, fnames) 
        values ('${note.label}', '${note.description}', '${new Date().toISOString()}', '${new Date().toISOString()}', ${id}, ${fnames}) 
        returning *`);
    await uploadFiles(id, r.rows[0].id, files);
    
    const rfnames = r.rows[0].fnames ? r.rows[0].fnames.split(',') : []; 
    return {...r.rows[0], fnames: rfnames};
}


export async function updateNote(note: ISavedNote, files: { [k: string]: File }, email: string) {
    const client = await init();
    if (!client) {
        return;
    }
    // TODO: Make this part of session
    const res = await client.query(`select id from users where email='${email}'`);
    const id = res.rows[0].id;
    let fnames = note.fnames.join(',');
    if (fnames === '') {
        fnames = 'NULL';
    } else {
        fnames = `'${fnames}'`;
    }
    note.updated_at = (new Date()).toISOString();
    const updates: string[] = [];
    for (let field of ['label', 'description', 'updated_at', 'owner', 'fnames']) {
        if (field === 'owner') {
            updates.push(`${field}=${id}`)
        } else if (field === 'fnames') {
            updates.push(`${field}=${fnames}`);
        }else {
            updates.push(`${field}='${note[field as keyof INote]}'`);
        }
    }
    const r = await client.query(`update secure_notes set ${updates.join(',')} where id=${note.id} returning *`);
    await uploadFiles(id.toString(), note.id, files);
    const rfnames = r.rows[0].fnames  ? r.rows[0].fnames.split(',') : []; 
    return {...r.rows[0], fnames: rfnames};
}


export async function deleteNote(noteId: number, userId: number) {
    const client = await init();
    console.log(`delete from secure_notes where id=${noteId} and owner=${userId}`)
    await client.query(`delete from secure_notes where id=${noteId} and owner=${userId}`);
    return noteId;
}