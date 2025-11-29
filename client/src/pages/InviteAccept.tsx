import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { UserPlus, Users, Baby, Clock, AlertCircle, Check } from 'lucide-react';

interface InvitationValidation {
  valid: boolean;
  email?: string;
  inviterName?: string;
  childNames?: string[];
  childCount?: number;
  error?: string;
}

export default function InviteAccept() {
  const [, params] = useRoute('/invite/:token');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const token = params?.token || '';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    medicalNotes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data: validation, isLoading, error } = useQuery<InvitationValidation>({
    queryKey: ['/api/invitations/validate', token],
    queryFn: async () => {
      const response = await fetch(`/api/invitations/validate/${token}`);
      return response.json();
    },
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (validation?.email) {
      setFormData(prev => ({ ...prev, email: validation.email || '' }));
    }
  }, [validation?.email]);

  const registerMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/auth/register-invited', {
        token,
        email: data.email,
        password: data.password,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        medicalHistory: data.medicalNotes ? { notes: data.medicalNotes } : undefined,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/children'] });
      toast({
        title: 'Welcome to the family!',
        description: `You now have access to ${data.childCount} child profile(s).`,
      });
      setLocation('/home');
    },
    onError: (error: Error) => {
      toast({
        title: 'Registration failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.email || !formData.email.includes('@')) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.password || formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      registerMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              <p className="text-muted-foreground">Validating invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!validation?.valid || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              {validation?.error || 'This invitation link is not valid or has expired.'}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Button onClick={() => setLocation('/login')} data-testid="button-back-to-login">
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <UserPlus className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>You're Invited!</CardTitle>
          <CardDescription>
            <strong>{validation.inviterName}</strong> has invited you to join their family on Toddl.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Baby className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">You'll have access to:</span>
            </div>
            <ul className="space-y-1 text-sm text-muted-foreground ml-6">
              {validation.childNames?.map((name, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-500" />
                  {name}
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                disabled
                className="bg-muted"
                data-testid="input-invite-register-email"
              />
              <p className="text-xs text-muted-foreground">
                This email was used for the invitation
              </p>
              {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Your name"
                  data-testid="input-invite-first-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Optional"
                  data-testid="input-invite-last-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Create Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="At least 6 characters"
                data-testid="input-invite-password"
              />
              {formErrors.password && <p className="text-xs text-destructive">{formErrors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="Confirm your password"
                data-testid="input-invite-confirm-password"
              />
              {formErrors.confirmPassword && <p className="text-xs text-destructive">{formErrors.confirmPassword}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="medicalNotes">Family Medical History (Optional)</Label>
              <Textarea
                id="medicalNotes"
                value={formData.medicalNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, medicalNotes: e.target.value }))}
                placeholder="Any relevant medical history, genetic conditions, or health information..."
                rows={3}
                data-testid="input-invite-medical-notes"
              />
              <p className="text-xs text-muted-foreground">
                This helps provide personalized developmental recommendations
              </p>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={registerMutation.isPending}
              data-testid="button-complete-registration"
            >
              {registerMutation.isPending ? 'Creating account...' : 'Join Family'}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center text-sm text-muted-foreground">
          <p>
            Already have an account?{' '}
            <a href="/login" className="text-primary hover:underline">
              Sign in
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
