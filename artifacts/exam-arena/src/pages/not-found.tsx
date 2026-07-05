import { Link } from 'wouter';
import { Layout } from '@/components/Layout';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center animate-in zoom-in-95">
        <ShieldAlert className="w-24 h-24 text-destructive mb-6 drop-shadow-[0_0_15px_rgba(255,50,80,0.5)]" />
        <h1 className="text-6xl font-black uppercase text-destructive glow-text mb-4">404 - SECTOR NOT FOUND</h1>
        <p className="text-muted-foreground font-mono text-lg max-w-md mb-8">
          The coordinates you entered don't exist in this arena. The sector may have been wiped.
        </p>
        <Link href="/">
          <Button className="neon-button font-bold uppercase tracking-widest px-8 bg-primary text-primary-foreground hover:bg-primary py-6">
            Return to Base
          </Button>
        </Link>
      </div>
    </Layout>
  );
}
