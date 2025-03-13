'use server';
import {compare, hash} from 'bcryptjs';
import { init, addUser, hasUser, getUser} from './db';
import { DB_ERROR, NO_USER, WRONG_PASSWORD, DUPLICATE_EMAIL, IError, createMandatoryFieldError} from './errors';
import { ISignupData, ILoginData, ISession } from '@@/app/types';
import { setSessionCookie } from '@@/app/cookies';

const SALT_ROUNDS = 2;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function signup(state: any, fdata: FormData): Promise<{error: IError} | ({session: ISession})> {
    const data: ISignupData = {
        name: fdata.get('name') as string,
        email: fdata.get('email') as string,
        password: fdata.get('password') as string
    }

    try {
        await init();
    } catch (e) {
        console.error(`DB Connection Error - ${e}`);
        return {error: { message: (e as Error).toString(), title: DB_ERROR}};
    }

    // Check if the user email exists in table.
    const userExists = await hasUser(data.email);
    if (userExists) {
        return {error: {title: DUPLICATE_EMAIL, message: `${data.email} already exists`}};
    }

    const pwhash = await hash(fdata.get('password')?.toString() ?? '', SALT_ROUNDS);
    try {
        const id = await addUser({ name: data.name, pwhash, email: data.email });
        const session = await setSessionCookie(id, data.name, data.email);
        return JSON.parse(JSON.stringify({session}));
    } catch (e) {
        return {error: {title: DB_ERROR, message: (e as Error).toString()}};
    } 
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function login(state: any, fdata: FormData): Promise<{error: IError} | {session: ISession}> {
    // Do not trust the client. 
    const fields = ['email', 'password'];
    for (const field of fields) {
        if (!fdata.get(field)) {
            console.error(`${field} is missing.`);
            return {error: createMandatoryFieldError([field])};
        }
    }
    const data: ILoginData = {
        email: fdata.get('email') as string,
        password: fdata.get('password') as string
    };
    // get user data hashed password for user email.
    const user = await getUser(data.email);
    if (!user) {
        return {error: {title: NO_USER, message: `User with email ${data.email} does not exist`}};
    }
    // check password
    const res = await compare(data.password, user.pwhash);
    // check and return error if password didn't match
    if (res === false) {
        return {error: {title: WRONG_PASSWORD, message: `Password does not match for user ${data.email}`}};
    }

    const session = await setSessionCookie(user.id, user.username, data.email);
    return JSON.parse(JSON.stringify({session}));
}