'use client';
import { Tab, Tabs, TextField, InputLabel, Button } from "@mui/material";
import { useState, useCallback, useActionState } from "react";
import Form from 'next/form';
import { login } from '../api/login/login_actions';
import Link from 'next/link';
import { useRouter } from "next/navigation";

const getKeys = async (password: string) => {
  return ['', ''];
}

function Signup() {
  const [password, setPassword] = useState('');
  const [plainKey, setPlainKey] = useState('');
  const [succeeded, setSucceeded] = useState<boolean | null>(null);

  const action = useCallback(async (formData: FormData) => {
    // The plain key is never sent to server
    const [encrKey, pk] = await getKeys(password);
    setPlainKey(pk);
    // the encrypted key is sent to server and stored there. 
    formData.set('encrKey', encrKey);
    const res = await fetch('/api/login', { method: 'POST', body: formData });
    if (res.status == 200) {
      setSucceeded(true);
    } else {
      setSucceeded(false);
    }
  }, [plainKey, password, setPlainKey]);

  if (succeeded) {
    return (
      <div>
        <div>Copy this key: {plainKey} </div>
        <Link href='/notes'>Go to Notes App!</Link>
      </div>
    )
  } else {
    // TODO: Validate form before submission  
    return (
      <Form key='signup' className="signup-layout" action={action}>
        <InputLabel className="label">Email</InputLabel>
        <TextField
          className="input"
          name="email"
          placeholder="Enter email"
          variant="outlined"
        />
        <InputLabel className="label">Name</InputLabel>
        <TextField
          className="input"
          name="name"
          placeholder="Enter name"
          variant="outlined"
        />
        <InputLabel className="label">Password</InputLabel>
        <TextField
          type="password"
          className="input"
          name="password"
          placeholder="Enter password"
          variant="outlined"
          value={password}
          onChange={(evt) => {
            setPassword(evt.target.value);
          }}
        />
        <Button className="submit" type='submit' variant="contained">
          Submit
        </Button>
      </Form>
    );
  }
}

function Login() {
  const router = useRouter();
  const [error, setError] = useState('');
  
  const action = useCallback(async function(formdata: FormData) {
    const res: string | boolean = await login(formdata);
    if (res === true) {
      router.push('/notes');
    } else if (typeof res === 'string') {
      setError(res);
    }
  }, []);

  return (
    <Form key='login' className="login-layout" action={action}>
      <InputLabel className="label">Email</InputLabel>
      <TextField
        className="input"
        name="email"
        placeholder="Enter email"
        variant="outlined"
      />
      <InputLabel className="label">Password</InputLabel>
      <TextField
        type="password"
        className="input"
        name="password"
        placeholder="Enter password"
        variant="outlined"
      />
      <Button className="submit" variant="contained" type='submit'>
        Submit
      </Button>
      {error}
    </Form>
  );
}

export default function App() {
  const [selectedTab, setSelectedTab] = useState("login");
  const onChange = useCallback(
    (evt: any, value: any) => {
      setSelectedTab(value);
    },
    [setSelectedTab]
  );
  return (
    <div className="login-page">
      <div>
        <Tabs
          value={selectedTab}
          onChange={onChange}
          aria-label="basic tabs example"
        >
          <Tab label="Login" value={"login"} />
          <Tab label="Signup" value={"signup"} />
        </Tabs>
        {selectedTab === "login" && <Login />}
        {selectedTab === "signup" && <Signup />}
      </div>
    </div>
  );
}
