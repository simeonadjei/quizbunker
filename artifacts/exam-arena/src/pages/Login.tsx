import { Layout } from '@/components/Layout';
import { useLoginUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, KeyRound } from 'lucide-react';

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
        <div className="w-full max-w-md card-game border-l-4 border-t-4 border-primary p-8 md:p-10 animate-in zoom-in-95 duration-300 relative overflow-hidden">
          
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-[50px] rounded-full pointer-events-none" />
          
          <div className="text-center mb-8 relative z-10">
            <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-[0_6px_0_hsl(32,95%,35%)] border-2 border-white/50 transform -rotate-6">
              <KeyRound className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-4xl font-display uppercase tracking-wider text-outline text-white">Player Login</h1>
            <p className="text-white/80 mt-2 font-bold bg-black/30 inline-block px-4 py-1 rounded-full border border-white/10">ACCESS YOUR SAVE DATA</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 relative z-10">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-display text-sm uppercase tracking-wider drop-shadow-md">Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="player@example.com" 
                        className="bg-black/40 border-2 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-primary focus-visible:border-primary font-bold h-12 rounded-xl text-lg" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-accent font-bold" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-display text-sm uppercase tracking-wider drop-shadow-md">Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        className="bg-black/40 border-2 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-primary focus-visible:border-primary font-bold h-12 rounded-xl text-lg tracking-widest" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-accent font-bold" />
                  </FormItem>
                )}
              />

              <button 
                type="submit" 
                className="w-full btn-game py-4 text-xl mt-4 flex justify-center items-center"
                disabled={login.isPending}
              >
                {login.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Initialize"}
              </button>
            </form>
          </Form>

          <div className="mt-8 text-center text-sm font-bold text-white/80 border-t-2 border-white/10 pt-6 relative z-10">
            New challenger?{' '}
            <Link href="/register" className="text-accent hover:text-white uppercase text-outline drop-shadow-md transition-colors ml-2 text-base">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
