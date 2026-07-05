import { Link } from 'wouter';
import { Layout } from '@/components/Layout';
import { ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="card-game p-10 max-w-sm w-full flex flex-col items-center">
          <ShieldAlert className="w-14 h-14 text-destructive mb-4" />
          <h1 className="text-game-title text-4xl mb-2">404</h1>
          <p className="text-white/60 font-bold text-sm mb-6 leading-snug">
            This page doesn't exist in the Bunker.
          </p>
          <Link href="/" className="btn-game px-6 py-3 text-sm inline-flex justify-center">
            Back to Home
          </Link>
        </div>
      </div>
    </Layout>
  );
}
