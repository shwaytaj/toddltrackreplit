import { useState } from 'react';
import { useLocation } from 'wouter';
import OnboardingStep from '@/components/OnboardingStep';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import Logo from '@/components/Logo';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [childName, setChildName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleContinue = async () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      setIsLoading(true);
      try {
        // Create child profile
        await apiRequest('POST', '/api/children', {
          name: childName,
          dueDate,
          medicalHistory: medicalHistory.trim() ? { notes: medicalHistory.trim() } : undefined,
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

  const handleSkip = () => {
    setStep(step + 1);
  };

  const isStepValid = () => {
    switch (step) {
      case 0: return childName.trim().length > 0;
      case 1: return dueDate.length > 0;
      case 2: return true; // Medical history is optional
      default: return true;
    }
  };

  return (
    <>
      {step === 0 && (
        <OnboardingStep
          currentStep={step}
          totalSteps={3}
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
            <p className="text-xs text-muted-foreground">
              Nicknames are better from a privacy perspective. You can still use your child's name if you want. If you have more than one child you can add them later.
            </p>
          </div>
        </OnboardingStep>
      )}

      {step === 1 && (
        <OnboardingStep
          currentStep={step}
          totalSteps={3}
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

      {step === 2 && (
        <OnboardingStep
          currentStep={step}
          totalSteps={3}
          onContinue={handleContinue}
          continueDisabled={false}
          showSkip={true}
          onSkip={handleSkip}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-lg font-semibold">Your medical history</Label>
              <p className="text-sm text-muted-foreground">
                Share as much as you can about your medical history like any known genetic disorders, developmental diagnosis etc.{' '}
                <Popover>
                  <PopoverTrigger asChild>
                    <button 
                      className="text-primary underline underline-offset-2 hover:text-primary/80"
                      data-testid="button-why-medical-history"
                    >
                      Why do we need this?
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 text-sm" align="start">
                    <div className="space-y-3">
                      <p className="font-semibold">Why your medical history matters?</p>
                      <p className="text-muted-foreground">
                        By sharing basic health information about you (and your partner), the app can better understand your unique background and provide hyper-personalised, relevant, and timely guidance and activities tailored to your child's needs.
                      </p>
                      <p className="text-muted-foreground">Some examples of useful information include:</p>
                      <ul className="text-muted-foreground list-disc list-inside space-y-1">
                        <li><span className="font-medium">Pregnancy:</span> complications, or NICU stay.</li>
                        <li><span className="font-medium">Family history:</span> known genetic or developmental conditions (e.g., Down syndrome, Fragile X, speech or motor delays).</li>
                      </ul>
                      <p className="text-xs text-muted-foreground italic">
                        *Note: All information you provide is private, confidential, and used only to personalise your experience and support your child's growth.
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </p>
            </div>
            <Textarea
              placeholder="E.g., First pregnancy. Have ADHD, managed without medication. Had mild anaemia during pregnancy and gestational diabetes controlled with diet. No family history of major genetic conditions or developmental disorders."
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              className="min-h-[150px] resize-none"
              data-testid="textarea-medical-history"
            />
          </div>
        </OnboardingStep>
      )}

      {step === 3 && (
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
