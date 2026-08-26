import { redirect } from 'next/navigation';

// Root → the broker portal (the only external actor live in v1).
export default function Home() {
  redirect('/broker');
}
