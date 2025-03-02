'use server';
import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import {ISession } from '@@/app/types';

export async function setSessionCookie(id: number, name: string, email: string): Promise<ISession> {
    const secret = process.env.NEXT_PUBLIC_SESSION_SECRET ?? 'mysecretsession';
    const cookieName = 'session';
    const cook = await cookies();
    const session = await getIronSession<ISession>(cook, { password: secret, cookieName, cookieOptions: { sameSite: 'Lax', secure: true } });
    session.name = name;
    session.email = email;
    session.id = id;
    await session.save();
    return session;
}
