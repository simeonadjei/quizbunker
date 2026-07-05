import { Layout } from '@/components/Layout';
import { useRegisterUser, getGetCurrentUserQueryKey } from '@workspace/api-client-react';
import { Link, useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, UserPlus } from 'lucide-react';

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
        <div className="w-full max-w-md card-game border-l-4 border-t-4 border-secondary p-8 md:p-10 animate-in zoom-in-95 duration-300 relative overflow-hidden">
          
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-secondary/20 blur-[50px] rounded-full pointer-events-none" />
          
          <div className="text-center mb-8 relative z-10">
            <div className="mx-auto w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-4 shadow-[0_6px_0_hsl(175,80%,25%)] border-2 border-white/50 transform rotate-3">
              <UserPlus className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <h1 className="text-4xl font-display uppercase tracking-wider text-outline text-white">New Challenger</h1>
            <p className="text-white/80 mt-2 font-bold bg-black/30 inline-block px-4 py-1 rounded-full border border-white/10">CREATE YOUR PROFILE</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 relative z-10">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-display text-sm uppercase tracking-wider drop-shadow-md">Player Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Player One" 
                        className="bg-black/40 border-2 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-secondary focus-visible:border-secondary font-bold h-12 rounded-xl text-lg" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-accent font-bold" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-display text-sm uppercase tracking-wider drop-shadow-md">Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="player@example.com" 
                        className="bg-black/40 border-2 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-secondary focus-visible:border-secondary font-bold h-12 rounded-xl text-lg" 
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
                        className="bg-black/40 border-2 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-secondary focus-visible:border-secondary font-bold h-12 rounded-xl text-lg tracking-widest" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage className="text-accent font-bold" />
                  </FormItem>
                )}
              />

              <button 
                type="submit" 
                className="w-full btn-game-secondary py-4 text-xl mt-4 flex items-center justify-center"
                disabled={register.isPending}
              >
                {register.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : "Join Tournament"}
              </button>
            </form>
          </Form>

          <div className="mt-8 text-center text-sm font-bold text-white/80 border-t-2 border-white/10 pt-6 relative z-10">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:text-white uppercase text-outline drop-shadow-md transition-colors ml-2 text-base">
              Login Here
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
