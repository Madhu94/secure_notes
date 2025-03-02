import { importKey, setKey } from "../crypto";
import { InputLabel, TextField, Button } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function (props: {email: string}) {
    const router = useRouter();

    const onSubmit = async (evt: any) => {
        const keyS = evt.currentTarget.value;
        const key = await importKey(keyS);
        await setKey(key, props.email);
        router.push('/notes');
        evt.preventDefault();
    };

    return (
        <form onSubmit={onSubmit} className='keyform'>
            <div className='message'>Key is not stored in browser web storage. Please enter again</div>
            <div className='row'>
                <InputLabel className="label">Key</InputLabel>
                <TextField
                    className="input"
                    name='key'
                    placeholder='Enter Key'
                    variant="outlined"
                    type='text'
                />
            </div>
            <Button type='submit' variant='contained'>Submit</Button>
        </form>
    )
}