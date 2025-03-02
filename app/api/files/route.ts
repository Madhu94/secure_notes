import { getUser } from "@@/app/notes/db";
import { ISession } from "@@/app/types";
import { NextRequest } from "next/server";
import path from 'path';
import fs from 'fs/promises';

export async function GET(req:NextRequest) {
    const session: ISession = await getUser();
    const id = session.id;
    const noteId = req.nextUrl.searchParams.get('noteId');
    const fileName = req.nextUrl.searchParams.get('fileName');
    const fullFilename = `${noteId}_${fileName}`;
    const filePath = path.join(path.resolve('public'), 'attachments', id.toString(), fullFilename);
    const buffer = await fs.readFile(filePath);
    const arrayView = new Uint8Array(buffer);
    const blob = new Blob([arrayView]);
    // Since we are downloading as attachment, this doesn't matter
    return new Response(blob, {status: 200}); 
}
