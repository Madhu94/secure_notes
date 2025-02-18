import {Client} from 'pg';

let client: Client | null = null;

export const init = async () => {
    if (client === null) {
        try {
            client = new Client({
                user: 'madhu',
                password: 'password',
                database: 'notes',
                host: '127.0.0.1',
                port: 5432
            })
            await client.connect();
        } catch(e) {
            console.error(`Error creating client ${e}`);
        }
    }
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

interface IUser {
    name: string;
    email: string;
    pwhash: string;
}

export async function addUser(user: IUser) {
    const client = await init();
    if (!client) {
        return;
    }
    await client.query(`insert into users (username, email, pwhash) values ('${user.name}', '${user.email}', '${user.pwhash}')`);
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

export async function getHash(email: string) {
    const client = await init();
    if (!client) {
        return;
    }
    console.log('Fetching users with email ...', email);
    const res = await client.query(`select pwhash from users where email='${email}';`);
    return res.rows?.[0]?.pwhash ?? null;
}


interface INote {
    label: string;
    description: string;
    username: string;
}


interface ISavedNote extends INote {
    id: number;
}

export async function getNotes(user: string) {
    const client = await init();
    if (!client) {
        console.log('Failed to initialize client...');
        return [];
    }
    console.log('Fetching users with name...', user);

    // TODO: Make this part of session
    const r = await client.query(`select id from users where username='${user}'`);
    const id = r.rows[0].id;
    const res = await client.query(`select * from secure_notes where owner=${id}`);
    return res.rows.map((row: any) => (
        {id: row.id, label: row.label, description: row.description, username: user, created_at: row.created_at}
    )) as ISavedNote[];
}

export async function insertNote(note: INote) {
    const client = await init();
    if (!client) {
        return;
    }
    // TODO: Make this part of session
    const res = await client.query(`select id from users where username='${note.username}'`);
    const id = res.rows[0].id;
    await client.query(`insert into secure_notes (label, description, created_at, owner) 
        values ('${note.label}', '${note.description}', '${new Date().toISOString()}', ${id})`);
}