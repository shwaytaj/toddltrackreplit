import { useState } from 'react';
import { useLocation } from 'wouter';
import OnboardingStep from '@/components/OnboardingStep';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [childName, setChildName] = useState('');
  const [gender, setGender] = useState('');
  const [relationship, setRelationship] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleContinue = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      setIsLoading(true);
      try {
        // Create child profile
        await apiRequest('POST', '/api/children', {
          name: childName,
          dueDate,
          gender: gender || undefined,
        });
        
        // Invalidate user and children queries
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });
        queryClient.invalidateQueries({ queryKey: ['/api/children'] });
        
        setLocation('/home');
      } catch (error) {
        toast({
          title: "Setup failed",
          description: error instanceof Error ? error.message : "Failed to complete onboarding",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 0: return childName.trim().length > 0;
      case 1: return gender.length > 0;
      case 2: return relationship.length > 0;
      case 3: return dueDate.length > 0;
      default: return true;
    }
  };

  return (
    <>
      {step === 0 && (
        <OnboardingStep
          currentStep={step}
          totalSteps={4}
          onContinue={handleContinue}
          continueDisabled={!isStepValid()}
        >
          <div className="space-y-2">
            <Label>Child's name / nick name</Label>
            <Input
              placeholder="Enter here"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              data-testid="input-child-name"
            />
          </div>
        </OnboardingStep>
      )}

      {step === 1 && (
        <OnboardingStep
          currentStep={step}
          totalSteps={4}
          onContinue={handleContinue}
          continueDisabled={!isStepValid()}
        >
          <div className="space-y-2">
            <Label>Child's gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger data-testid="select-gender">
                <SelectValue placeholder="- select -" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </OnboardingStep>
      )}

      {step === 2 && (
        <OnboardingStep
          currentStep={step}
          totalSteps={4}
          onContinue={handleContinue}
          continueDisabled={!isStepValid()}
        >
          <div className="space-y-2">
            <Label>Relation with baby</Label>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger data-testid="select-relationship">
                <SelectValue placeholder="- select -" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mother">Mother</SelectItem>
                <SelectItem value="father">Father</SelectItem>
                <SelectItem value="guardian">Guardian</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </OnboardingStep>
      )}

      {step === 3 && (
        <OnboardingStep
          currentStep={step}
          totalSteps={4}
          onContinue={handleContinue}
          continueDisabled={!isStepValid()}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="due-date">Baby's due date</Label>
              <Input
                id="due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                data-testid="input-due-date"
                required
              />
              {dueDate && (
                <p className="text-xs font-medium text-primary">
                  {new Date(dueDate + 'T00:00:00').toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                The expected delivery date from your doctor. We'll use this to track milestones.
              </p>
            </div>
          </div>
        </OnboardingStep>
      )}

      {step === 4 && (
        <div className="flex flex-col min-h-screen bg-background p-6 justify-center items-center">
          <div className="max-w-md w-full text-center space-y-6">
            <Logo className="mb-8" />
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-accent-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold">All set up!</h2>
            <p className="text-muted-foreground">
              You're ready to start tracking {childName}'s developmental journey
            </p>
            <Button
              className="w-full rounded-full mt-8"
              size="lg"
              onClick={handleContinue}
              disabled={isLoading}
              data-testid="button-get-started"
            >
              {isLoading ? "Setting up..." : "Get Started"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
