import {signup, login} from './login_actions';

export async function POST(req: Request) {
    const body = await req.formData();
    const res = await signup(body);
    if (res === false) {
        return new Response('User exists!', {
            status: 400,
        });
    }
    return Response.json(body);
}

