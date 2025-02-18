'use server';

import {hash, compare} from 'bcryptjs';
import {init, addUser, hasUser, getHash} from '../../db';
import {redirect} from 'next/navigation';
import {getIronSession} from 'iron-session';
import {cookies} from 'next/headers';

const SALT_ROUNDS = 2;

interface ISignupData {
    email: string;
    name: string;
    password: string;
}

interface ILoginData {
    email: string;
    password: string;
}

export async function signup(fdata: FormData) {
    const password = process.env.NEXT_PUBLIC_SESSION_SECRET ?? 'mysecretsession';

    if (fdata === null) {
        return null;
    }
    const cookieName = 'session';
    const cook = await cookies();
    const session = await getIronSession<{username: string}>(cook, {password, cookieName, cookieOptions: {sameSite: 'Lax', secure: true}});
    session.username = fdata.get('name')?.toString() ?? '';
    await session.save();

    const data: ISignupData = {
        name: fdata.get('name') as string,
        email: fdata.get('email') as string,
        password: fdata.get('password') as string
    }
    // Check if the user email exists in table.
    const userExists = await hasUser(data.email);
    if (userExists) {
        return false;
    }

    const client = await init();
    if (client === null) {
        console.log('DB Connection Error');
        return null;
    }
    const pwhash = await hash(data.password, SALT_ROUNDS);
    await addUser({name: data.name, pwhash, email: data.email});
    return 'Success';
}


export async function login(fdata: FormData) {
    const data: ILoginData = {
        email: fdata.get('email') as string,
        password: fdata.get('password') as string
    }
    // get hashed password for user email.
    const pwhash = await getHash(data.email);
    if (!pwhash) {
        return `User with email ${data.email} does not exist`; 
    }
    // check password
    const res = await compare(data.password, pwhash);
    // check and return error if password didn't match
    if (res === false) {
        return 'Password does not match';
    }
    return true;
}