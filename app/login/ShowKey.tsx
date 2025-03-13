'use client';
import Link from 'next/link';
import { ContentCopy} from '@mui/icons-material';
import {Popper} from '@mui/material';
import {useCallback, useState, useRef} from 'react';

export default function ShowKey (props: {sKey: string}) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const onClick = useCallback(async () => {
        await navigator.clipboard.writeText(props.sKey);
        setOpen(true);
        setTimeout(() => {
            setOpen(false);
        }, 3000);
    }, [setOpen, props.sKey]);

    return (
        <div className='container'>
            <div className='key'>
                <div>Copy this key <em className='keyval'>{props.sKey}</em></div>
                <ContentCopy ref={ref} onClick={onClick} />
            </div>
            <Popper id={'copyshown'} open={open} anchorEl={ref?.current} placement='right' className='popper'>Copied!</Popper>
            <Link href='/notes'><strong><u>Go to Notes App!</u></strong></Link>
            <Link href='/about'><strong><u>Learn more on the encryption</u></strong></Link>
        </div>
    )
}