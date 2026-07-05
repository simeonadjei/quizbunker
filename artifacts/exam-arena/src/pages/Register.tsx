import { Layout } from '@/components/Layout';
import { useRegisterUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
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

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export default function Register() {
  const register = useRegisterUser();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' }
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    register.mutate({ data: values }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        toast({ title: "Account Created", description: "Welcome to the Arena!" });
        setLocation('/dashboard');
      },
      onError: (err: any) => {
        toast({
          title: "Registration Failed",
          description: err.error || "Could not create account.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md bg-card/80 backdrop-blur-xl border border-secondary/30 p-8 rounded-2xl shadow-[0_0_30px_-5px_hsl(var(--secondary)/0.3)] animate-in zoom-in-95 duration-300 relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary to-transparent opacity-50" />
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black uppercase tracking-tight text-secondary glow-text">New Challenger</h1>
            <p className="text-muted-foreground mt-2 font-mono text-sm">CREATE YOUR PROFILE</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-secondary font-mono text-xs uppercase tracking-wider">Player Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Player One" 
                        className="bg-background/50 border-secondary/20 focus-visible:ring-secondary font-mono" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-secondary font-mono text-xs uppercase tracking-wider">Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="player@example.com" 
                        className="bg-background/50 border-secondary/20 focus-visible:ring-secondary font-mono" 
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
                    <FormLabel className="text-secondary font-mono text-xs uppercase tracking-wider">Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        className="bg-background/50 border-secondary/20 focus-visible:ring-secondary font-mono" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full neon-button bg-secondary text-secondary-foreground hover:bg-secondary font-bold uppercase tracking-wider py-6 mt-2"
                disabled={register.isPending}
              >
                {register.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Join Tournament"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm text-muted-foreground border-t border-border pt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-primary/80 font-bold uppercase transition-colors">
              Login Here
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
