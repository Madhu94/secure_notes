import Link from 'next/link';

export default function Page() {
    return (
        <div className='container'>
            <div><h3>About the Secure notes App</h3></div>
            <div>
                <p>
                    The Secure Notes App encrypts your data using <a href='https://en.wikipedia.org/wiki/Symmetric-key_algorithm'>Symmetric Key Cryptography</a>.
                    A key is derived from your password, shared with you and used to encrypt your data before sending it to the server.
                    This key is not sent to the server at any point. If you lose this key, your data will be lost and there is currently
                    no way to recover it. For convenience, this key is stored in your local browser. <a href='https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API'>IndexDB API</a>.
                    This means anyone who has access to your system can compromise it.
                    Use a <a href='https://en.wikipedia.org/wiki/Password_manager'>Password Manager</a> to safely store your key.
                </p>
            </div>
            <Link href='/'>Back to home</Link>
        </div>
    )
}