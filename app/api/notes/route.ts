import { getUser } from "@@/app/notes/db";
import {getNotes, deleteNote} from '../../db';
import {addNote} from "@@/app/notes/db";
import { NextRequest } from "next/server";
import {deleteFiles} from '../../db';
import {ISavedNote} from '../../types';

export async function GET() {
    const {email} = await getUser();
    
    let notes: ISavedNote[] = [];
    try {
        notes = await getNotes(email);
        console.log(notes);
        return Response.json(notes);
    } catch (e) {
        console.log(`Error fetching notes - ${e}`);
        return new Response(JSON.stringify(notes), {status: 500});
    }
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const note = await addNote(formData);
        return Response.json(note);
    } catch (e) {
        console.log(`Error inserting notes - ${e}`);
        return new Response("Error inserting notes", {status: 500});
    }
}

export async function PUT(req: Request) {
    try {
        const formData = await req.formData();
        const note = await addNote(formData, true);
        return Response.json(note);
    } catch (e) {
        console.log(`Error upsert notes - ${e}`);
        return new Response("Error upserting notes", {status: 500});
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const body = await req.json();
        const noteId = parseInt(body.id, 10);
        const {id} = await getUser();
        await deleteNote(noteId, id);
        await deleteFiles(noteId, id);
        return new Response(JSON.stringify({'deleted': noteId}), {status: 200});
    } catch (e) {
        console.log(`Error deleting notes - ${e}`);
        return new Response("Error deleting notes", {status: 500});
    }
}