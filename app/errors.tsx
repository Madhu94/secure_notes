/**
 * A react component to display error messages
 */

export const FormError = (props: {error: IError}) => {
    return (
        <div className='error'>
            {props.error.title && <div className='header'>{props.error.title}</div>}
            <div className='message'>{props.error.message}</div>
        </div>
    );
}

/**
 * Server side errors related to login validation 
 */

export const INVALID_EMAIL = 'Invalid Email';
export const DUPLICATE_EMAIL = 'Duplicate Email';
export const INCORRECT_PASSWORD = 'Incorrect Password';
const MANDATORY_FIELDS = 'Mandatory Fields Missing';
export const DB_ERROR = 'Database Error';
export const KEY_GENERATION_FAILED = 'Key Generation Failed';
export const NO_USER = 'No Such User';
export const WRONG_PASSWORD = 'Wrong Password';
export const NO_COOKIE_ERROR = 'Session Retrieval Failed';

export type LoginError =  typeof INVALID_EMAIL | typeof DUPLICATE_EMAIL | typeof INCORRECT_PASSWORD | typeof MANDATORY_FIELDS | typeof NO_USER | typeof WRONG_PASSWORD;
export type ServerError = typeof DB_ERROR;

export type EncryptionFailedError = typeof KEY_GENERATION_FAILED | 'KeySaveFailure';

export const isServerSideError = (title: ErrorCategory) => {
    return [DB_ERROR].includes(title);
}

export const createInvalidEmailError = (email: string) => ({
    title: INVALID_EMAIL,
    message: `Invalid email - ${email}`,
});

export const createMandatoryFieldError = (missing: string[]) => ({
    title: MANDATORY_FIELDS,
    message: `${missing.join(', ')} are required fields`
} as IError);

export type ErrorCategory = LoginError | EncryptionFailedError | ServerError;
  
export interface IError {
    title: ErrorCategory;
    message: string;
}