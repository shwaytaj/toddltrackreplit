import { useState } from 'react';
import { useLocation } from 'wouter';
import Logo from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SiGoogle, SiFacebook, SiApple } from 'react-icons/si';
import { Mail } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [, setLocation] = useLocation();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [isSignup, setIsSignup] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
        await apiRequest('/api/auth/register', 'POST', { email, password });
        setLocation('/onboarding');
      } else {
        await apiRequest('/api/auth/login', 'POST', { email, password });
        setLocation('/home');
      }
    } catch (error) {
      toast({
        title: isSignup ? "Signup failed" : "Login failed",
        description: error instanceof Error ? error.message : isSignup ? "Failed to create account" : "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = (provider: string) => {
    toast({
      title: "Coming soon",
      description: `${provider} signup will be available soon`,
    });
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
            </div>

            <Button
              className="w-full rounded-full bg-[#2C3E50] hover:bg-[#2C3E50]/90"
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
              onClick={() => setIsSignup(!isSignup)}
              data-testid="button-toggle-mode"
            >
              {isSignup ? "Already have an account? Sign in" : "Need an account? Sign up"}
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setShowEmailForm(false)}
              data-testid="button-back"
            >
              Back to options
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      <div className="flex-1 flex flex-col max-w-md mx-auto w-full justify-center">
        <h1 className="text-2xl font-semibold mb-8">Setup your account</h1>

        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-start gap-3 rounded-full py-6"
            onClick={() => handleSocialSignup('Google')}
            data-testid="button-signup-google"
          >
            <SiGoogle className="w-5 h-5" />
            Sign up with Google
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 rounded-full py-6"
            onClick={() => handleSocialSignup('Facebook')}
            data-testid="button-signup-facebook"
          >
            <SiFacebook className="w-5 h-5" />
            Sign up with Facebook
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 rounded-full py-6"
            onClick={() => handleSocialSignup('Apple')}
            data-testid="button-signup-apple"
          >
            <SiApple className="w-5 h-5" />
            Sign up with Apple
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-3 rounded-full py-6"
            onClick={() => setShowEmailForm(true)}
            data-testid="button-signup-email"
          >
            <Mail className="w-5 h-5" />
            Sign up with Email
          </Button>
        </div>
      </div>
    </div>
  );
}
