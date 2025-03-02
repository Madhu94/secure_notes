/**
 * Utiliites for secure notes
 */
import { get, set } from 'idb-keyval';

// Set Crypto key inside
export async function setKey(key: CryptoKey, userEmail: string) {
    return set(`${userEmail}-key`, key);
}

// Get Crypto Key
export async function getKey(userEmail: string) {
    return await get(`${userEmail}-key`);
}


export const generateKey = async (password: string) => {
    // get password in bytes
    const pwdInBytes = (new TextEncoder()).encode(password);
    // make it into a crypto key
    const passWordKey = await window.crypto.subtle.importKey(
        'raw',
        pwdInBytes,
        'PBKDF2',
        false,
        ['deriveKey'],
    );
    // use pbkdf2 to get a real derive key.
    // The password doesn't have sufficient randomness.
    const key = await window.crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: window.crypto.getRandomValues(new Uint8Array(12)),
            iterations: 10000,
            hash: 'SHA-256'
        },
        passWordKey,
        { name: 'AES-GCM', length: 128 },
        true,
        ['encrypt', 'decrypt']
    )

    return (key);
}

export const importKey = async (k: string) => {
    const jwkFormat = {
        k,
        kty: 'oct',
        key_ops: ['encrypt', 'decrypt'],
        ext: true,
        alg: 'A128GCM'
    }
    const key = await window.crypto.subtle.importKey('jwk', jwkFormat, { name: 'AES-GCM', length: 128 }, true, ['encrypt', 'decrypt']);
    return key;
}


export const encryptNote = async (note: string, email: string) => {
    // Get the key 
    const key = await getKey(email);
    // Get IV of 12 random bytes
    const IV = window.crypto.getRandomValues(new Uint8Array(12));
    // Get notes in bytes
    const noteInBytes = (new TextEncoder()).encode(note);
    // encrypt! Secret stuff!
    try {
        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: IV },
            key,
            noteInBytes
        );
        const encrArray = new Uint8Array(encrypted);
        // Payload = IV + noteInBytes
        const payload = new Uint8Array(IV.length + encrArray.length);
        payload.set(IV)
        payload.set(encrArray, IV.length);
        const transmit = String.fromCharCode(...(new Uint8Array(payload)));
        // base64 encode before storing in server
        return btoa(transmit);
    } catch (e) {
        console.log(e);
        throw e;
    }
}

export const decryptNote = async (cipher: string, email: string) => {
    // Get the key
    const key = await getKey(email);
    // base64 to charcodes.
    const payload = new Uint8Array(Array.from(atob(cipher)).map((letter) => letter.charCodeAt(0)));
    // Get IV
    const IV = payload.slice(0, 12);
    const cipherNoteInBytes = payload.slice(12);
    // Get payload
    const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: IV },
        key,
        cipherNoteInBytes
    );
    // decode to string
    return (new TextDecoder()).decode(decrypted);
}



export const encryptFile = async (blob: Blob, email: string) => {
    // Get the key 
    const key = await getKey(email);
    const buffer = await blob.arrayBuffer();
    const noteInBytes: Uint8Array = new Uint8Array(buffer);
    // Get IV of 12 random bytes
    const IV = window.crypto.getRandomValues(new Uint8Array(12));
    // encrypt! Secret stuff!
    try {
        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'AES-GCM', iv: IV },
            key,
            noteInBytes
        );
        const encrArr = new Uint8Array(encrypted);
        // Get notes in bytes
        // Payload = IV + noteInBytes
        const payload = new Uint8Array(IV.length + encrArr.length);
        payload.set(IV)
        payload.set(encrArr, IV.length);
        return new Blob([payload]);
    } catch (e) {
        console.log(e);
        throw e;
    }
}

export const decryptFile = async (blob: Blob, email: string) => {
    // Get the key
    const key = await getKey(email);
    const buffer = await blob.arrayBuffer();
    const payload = new Uint8Array(buffer);
    // Get IV
    const IV = payload.slice(0, 12);
    const cipherNoteInBytes = payload.slice(12);
    // Get payload
    const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: IV },
        key,
        cipherNoteInBytes
    );
    // decode to string
    const decrArray = new Uint8Array(decrypted);
    return new Blob([decrArray]);
}



export const getExportedKey = async function (password: string, userEmail: string) {
    // The plain key is never sent to server
    const key = await generateKey(password);
    try {
        await setKey(key, userEmail);
    } catch (e) {
        console.error(`Failed to store key in indexdb - ${(e as Error).toString()}`);
    }
    const sKey = await crypto.subtle.exportKey('jwk', key);
    return sKey.k as string;
};