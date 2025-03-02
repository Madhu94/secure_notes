'use client';
import Link from 'next/link';
import { NoteEditor } from './NoteEditor';
import { NotesList } from './NotesList';
import { useEffect } from 'react';
import { ISyncStatus } from '../types';
import { useRouter } from 'next/navigation';
import {Provider} from 'react-redux';
import {getUser, store, selectUserStatus} from './state';
import { useDispatch, useSelector } from 'react-redux';

type AppDispatch = typeof store.dispatch;

function Notes() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const sessionStatus = useSelector(selectUserStatus);

    useEffect(() => {
        // fetch user info
        dispatch(getUser());
    }, [dispatch]);

    if (sessionStatus === ISyncStatus.REJECTED) {
        
        return <em>Session retrieval failed. Return to <Link href='/login'>login </Link> page.</em>;
    }

    if (sessionStatus === ISyncStatus.PENDING) {
        return <em>Loading User session</em>;
    }

    if (sessionStatus === ISyncStatus.FULFILLED) {
        return (
            <div className='container'>
                <NoteEditor  />
                <NotesList  />
            </div>
        )
    }
}

export default function App() {
    return (
        <Provider store={store}>
            <Notes />
        </Provider>
    )
}