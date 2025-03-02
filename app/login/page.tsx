'use client';
import { Tab, Tabs, TextField, InputLabel, Button } from "@mui/material";
import React, { useState, useCallback, useActionState, useContext } from "react";
import { getExportedKey, getKey } from '../crypto';
import { createInvalidEmailError, createMandatoryFieldError, FormError, IError, KEY_GENERATION_FAILED } from "../errors";
import { signup, login } from "../login";
import { ISession, ISignupData, ILoginData } from "../types";
import ShowKey from "./ShowKey";
import { useRouter } from "next/navigation";
import EnterKey from "./EnterKey";

interface IField {
  name: string;
  type: string;
  label: string;
  placeholder: string;
}

interface HasError {
  error?: IError;
}

// Loose pattern validation
const validateEmail = (email: string) => email.match(/(.*)@(.*)/);

const validateMandatoryFields = <T extends object,>(fdata: T, allFields: string[]) => {
  const missing = [];
  for (let field of allFields) {
    if (!Object.keys(fdata).includes(field)) {
      missing.push(field);
    }
  }
  if (missing.length > 0) {
    return createMandatoryFieldError(missing);
  }
  // no errors
  return null;
}

const validateBasicForm = <T extends object,>(fdata: T, fields: IField[]) => {
  // Let's do mandatory field
  let invalid = validateMandatoryFields(fdata, fields.map((f: IField) => f.name));
  if (invalid) {
    return invalid;
  }
  // we know its available
  for (let field of fields) {
    if (field.type === 'email') {
      // TODO: Type error
      if (!validateEmail(fdata[field.name] as string)) {
        return createInvalidEmailError(fdata[field.name] as string);
      }
    }
  }
}

// TODO: Type the action state better
function LoginLike<T extends HasError>(props: {
  state: Partial<T & { session: ISession }>, name: string, fields: IField[],
  succeeded: boolean,
  onSuccess: (state: any, fstate: T, setError: (e: IError) => void) => Promise<void>, action: (fd: FormData) => Promise<T>
}) {

  const [state, action, isPending] = useActionState(props.action, props.state, 'n/a');
  const [clientError, setClientError] = useState<IError | null>(null);
  const [formState, setFormState] = useState<Partial<T>>({});

  const onSubmit = function (evt: React.FormEvent) {
    const invalid = validateBasicForm(formState, props.fields);
    if (invalid !== undefined) {
      setClientError(invalid as IError);
      // Form has errors, don't submit
      evt.preventDefault();
      evt.stopPropagation();
    } else {
      setClientError(null);
    }
  }

  const onFieldChange = useCallback((fieldName: string, evt: React.ChangeEvent<HTMLInputElement>) => {
    const updated = { ...formState, [fieldName]: evt.target.value };
    setFormState(updated);
  }, [formState, setFormState])

  if (!isPending && state.session && !props.succeeded) {
    // we do the type cast because we have validated this has to be mandatory fields
    props.onSuccess(state?.session as ISession, formState as T, setClientError);
  }

  return (
    <form key={props.name} onSubmit={onSubmit} className="loginlike-layout" action={action}>
      {props.fields.map((field: IField) => {
        return (
          <div key={field.name} className='row'>
            <InputLabel className="label">{field.label}</InputLabel>
            <TextField
              className="input"
              name={field.name}
              placeholder={field.placeholder}
              variant="outlined"
              type={field.type}
              disabled={props.succeeded}
              value={formState[field.name] ?? ''}
              onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
                onFieldChange(field.name, evt);
              }}
            />
          </div>
        )
      })}
      <Button disabled={isPending || props.succeeded} className="submit" type='submit' variant="contained">
        Submit
      </Button>
      {clientError && <FormError error={clientError} />}
      {state.error && <FormError error={state.error} />}
    </form>
  )
}


const signupFields: IField[] = [
  { type: 'email', name: 'email', placeholder: 'Enter Email', label: 'Email' },
  { type: 'text', name: 'name', placeholder: 'Enter Name', label: 'Name' },
  { type: 'password', name: 'password', placeholder: 'Enter Password', label: 'Password' },
];

function Signup(props: { onSuccess: () => void, succeeded: boolean }) {
  const [key, setKey] = useState<string | null>(null);

  const onSuccess = async (session: ISession, formState: ISignupData, setError: (error: IError) => void) => {
    try {
      const sKey = await getExportedKey(formState.password, session.email);
      setKey(sKey);
      props.onSuccess();
    } catch (e) {
      console.error(`Error generating key - ${e}`);
      setError({
        title: KEY_GENERATION_FAILED,
        message: (e as Error).toString()
      });
    }
  }
  return (
    <div>
      <LoginLike<ISignupData>
        state={{}} name='signup' fields={signupFields} succeeded={props.succeeded}
        action={signup} onSuccess={onSuccess} />
      {props.succeeded && <ShowKey sKey={key as string} />}
    </div>
  );
}

const loginFields: IField[] = [
  { type: 'email', name: 'email', placeholder: 'Enter Email', label: 'Email' },
  { type: 'password', name: 'password', placeholder: 'Enter Password', label: 'Password' },
]

function Login(props: { onSuccess: () => void, succeeded: boolean }) {
  const router = useRouter();
  const [session, setSession] = useState<ISession|null>(null);
  const [sKey, setsKey] = useState<CryptoKey | null>(null);

  const onSuccess = async (session: ISession) => {
    const key = await getKey(session.email);
    if (key) {
      setsKey(key);
      router.push('/notes');
    }
    props.onSuccess();
    setSession(session);
  }

  return (
    <div>
      <LoginLike<ILoginData> action={login} fields={loginFields} succeeded={props.succeeded} name='login'
        state={{}} onSuccess={onSuccess} />
      {props.succeeded && !sKey && <EnterKey email={(session as ISession).email} />}
    </div>
  );
}

export default function App() {
  const [selectedTab, setSelectedTab] = useState("login");
  const [done, setDone] = useState(false);

  const onChange = useCallback(
    (evt: any, value: any) => {
      setSelectedTab(value);
    },
    [setSelectedTab]
  );
  const onSuccess = useCallback(() => {
    setDone(true);
  }, [done, setDone]);

  return (
    <div className="login-page container">
      <div>
        <Tabs
          value={selectedTab}
          onChange={onChange}
        >
          <Tab label="Login" value={"login"} disabled={done} />
          <Tab label="Signup" value={"signup"} disabled={done} />
        </Tabs>
        {selectedTab === "login" && <Login onSuccess={onSuccess} succeeded={done} />}
        {selectedTab === "signup" && <Signup onSuccess={onSuccess} succeeded={done} />}
      </div>
    </div>
  );
}
