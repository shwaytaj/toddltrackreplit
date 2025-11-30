import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';

export default function Login() {
  const [, setLocation] = useLocation();
  const [showEmailForm, setShowEmailForm] = useState(true);
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, isLoading: userLoading } = useUser();

  // Redirect to home if already authenticated
  useEffect(() => {
    if (!userLoading && user) {
      setLocation('/home');
    }
  }, [user, userLoading, setLocation]);

  const handleEmailAuth = async () => {
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
      if (isSignup) {
        await apiRequest('POST', '/api/auth/register', { email, password });
        // Invalidate auth query so Home page sees the new user
        await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        setLocation('/onboarding');
      } else {
        await apiRequest('POST', '/api/auth/login', { email, password });
        // Invalidate auth query so Home page sees the new user
        await queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
        setLocation('/home');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '';
      
      if (isSignup && errorMessage.includes('Email already exists')) {
        setIsSignup(false);
        toast({
          title: "Account exists",
          description: "You already have an account. Please sign in instead.",
        });
      } else if (!isSignup && errorMessage.includes('Invalid email or password')) {
        toast({
          title: "Login failed",
          description: "The email or password you entered is incorrect. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: isSignup ? "Signup failed" : "Login failed",
          description: errorMessage || (isSignup ? "Failed to create account" : "Please check your email and password"),
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };


  if (showEmailForm) {
    return (
      <div className="flex flex-col min-h-screen bg-background p-6">
        <div className="flex-1 flex flex-col max-w-md mx-auto w-full justify-center">
          <div className="mb-12">
            <Logo />
          </div>

          <h1 className="text-2xl font-semibold mb-8">{isSignup ? 'Create your account' : 'Welcome back'}</h1>

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
              {!isSignup && (
                <p className="text-sm text-muted-foreground">
                  Can't access your account? Create a new account with a different email address.
                </p>
              )}
            </div>

            <Button
              className="w-full rounded-full"
              size="lg"
              onClick={handleEmailAuth}
              disabled={isLoading}
              data-testid="button-create-account"
            >
              {isLoading ? (isSignup ? "Creating account..." : "Signing in...") : (isSignup ? "Create your account" : "Sign in")}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setLocation('/register')}
              data-testid="button-toggle-mode"
            >
              Need an account? Sign up
            </Button>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full justify-center">
        <div className="mb-12">
          <Logo />
        </div>

        <h1 className="text-2xl font-semibold mb-8">Setup your account</h1>

        <div className="space-y-4">
          <Button
            className="w-full rounded-full"
            size="lg"
            onClick={() => setShowEmailForm(true)}
            data-testid="button-signup-email"
          >
            Create your account
          </Button>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setIsSignup(false);
              setShowEmailForm(true);
            }}
            data-testid="button-go-to-login"
          >
            Already have an account? Sign in
          </Button>
        </div>
      </div>
    </div>
  );
}
