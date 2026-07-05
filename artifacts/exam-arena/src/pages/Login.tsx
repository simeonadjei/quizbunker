import { Layout } from '@/components/Layout';
import { useLoginUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required")
});

export default function Login() {
  const login = useLoginUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    login.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        setLocation('/dashboard');
      },
      onError: (err: any) => {
        toast({
          title: "Login Failed",
          description: err.error || "Check your credentials.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card/80 backdrop-blur-xl border border-primary/30 p-8 rounded-2xl shadow-[0_0_30px_-5px_hsl(var(--primary)/0.3)] animate-in zoom-in-95 duration-300 relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black uppercase tracking-tight text-primary glow-text">Player Login</h1>
            <p className="text-muted-foreground mt-2 font-mono text-sm">ACCESS YOUR SAVE DATA</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary font-mono text-xs uppercase tracking-wider">Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="player@example.com" 
                        className="bg-background/50 border-primary/20 focus-visible:ring-primary font-mono" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-primary font-mono text-xs uppercase tracking-wider">Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        className="bg-background/50 border-primary/20 focus-visible:ring-primary font-mono" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full neon-button bg-primary text-primary-foreground hover:bg-primary font-bold uppercase tracking-wider py-6"
                disabled={login.isPending}
              >
                {login.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Initialize"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground border-t border-border pt-6">
            New challenger?{' '}
            <Link href="/register" className="text-secondary hover:text-secondary/80 font-bold uppercase transition-colors">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
