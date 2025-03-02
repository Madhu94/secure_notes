import { getUser } from "@@/app/notes/db";
import { NO_COOKIE_ERROR } from "@@/app/errors";
import { ISession } from "@@/app/types";

export async function GET() {
    const session: ISession = await getUser();
    console.log(`Session belongs to ...${JSON.stringify(session)}`);
    if (!session.name) {
        const res = JSON.stringify({title: NO_COOKIE_ERROR, message: 'Session retrieval is not possible, please login again'});
        return new Response(res, {status: 400})
    }
    return Response.json(session);
}
