import Link from 'next/link';
import { Button } from '@mui/material';

const Header = () => {
  return (
    <div className='navbar'>
      <Button variant='contained' style={{ backgroundColor: '#bfd6d2' }}>
        <Link href='/login'>Login</Link>
      </Button>
    </div>
  )
}

export default function Home() {
  return (
    <div>
      <Header />
      <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <h2>Welcome to the Secure Notes app!</h2>
      </div>
    </div>
  );
}
