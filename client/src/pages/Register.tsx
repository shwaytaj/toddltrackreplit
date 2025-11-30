import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';

export default function Register() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, isLoading: userLoading } = useUser();

  useEffect(() => {
    if (!userLoading && user) {
      setLocation('/home');
    }
  }, [user, userLoading, setLocation]);

  const handleRegister = async () => {
    if (!email || !password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/auth/register', { email, password });
      await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      setLocation('/onboarding');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '';
      
      if (errorMessage.includes('Email already exists')) {
        toast({
          title: "Account exists",
          description: "You already have an account. Please sign in instead.",
        });
        setLocation('/login');
      } else {
        toast({
          title: "Signup failed",
          description: errorMessage || "Failed to create account",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full justify-center">
        <div className="mb-12">
          <Logo />
        </div>

        <h1 className="text-2xl font-semibold mb-8">Create your account</h1>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="input-email"
            />
          </div>

          <div className="space-y-2">
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="Choose a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="input-password"
            />
          </div>

          <Button
            className="w-full rounded-full"
            size="lg"
            onClick={handleRegister}
            disabled={isLoading}
            data-testid="button-create-account"
          >
            {isLoading ? "Creating account..." : "Create your account"}
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setLocation('/login')}
            data-testid="button-go-to-login"
          >
            Already have an account? Sign in
          </Button>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Your data is securely stored in the United States with GDPR-compliant protections. 
            By signing up, you consent to international data transfer under EU Standard 
            Contractual Clauses.
          </p>
        </div>
      </div>
    </div>
  );
}
