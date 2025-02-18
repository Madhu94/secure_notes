import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import {getNotes} from '../../db';


interface INote {
    label: string;
    description: string;
    username: string;
}
  
interface ISavedNote extends INote {
    id: number;
}

// TODO: What does this return for a user who isn't logged in?
// TODO: Move this to utils
export async function GET() {
    const store = await cookies();
    const password = process.env.NEXT_PUBLIC_SESSION_SECRET ?? 'mysecretsession';
    const {username} = await getIronSession<{username: string}>(store, {password, cookieName: 'session'});
    
    let notes: any[] = [];
    try {
        notes = await getNotes(username);
        console.log(notes);
    } catch (e) {
        console.log(`Error fetching notes - ${e}`);
    }
    return Response.json({"A": "B", username, notes});
}