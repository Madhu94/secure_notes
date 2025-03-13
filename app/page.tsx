import Link from 'next/link';


export default function Home() {
  return (
      <div className="container">
        <div>
            <h3>Welcome to the Secure Notes app!</h3>
            <p>Click <Link href='/about'>here</Link> to understand more or <Link href='/login'>login</Link></p>
        </div>
      </div>
  );
}
