import { ReactNode } from 'react';
import Logo from './Logo';
import ProgressDots from './ProgressDots';
import { Button } from '@/components/ui/button';

interface OnboardingStepProps {
  currentStep: number;
  totalSteps: number;
  children: ReactNode;
  onContinue: () => void;
  continueDisabled?: boolean;
}

export default function OnboardingStep({
  currentStep,
  totalSteps,
  children,
  onContinue,
  continueDisabled = false
}: OnboardingStepProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background p-6">
      <div className="flex-1 flex flex-col">
        <div className="mb-8">
          <Logo />
        </div>
        
        <div className="mb-8">
          <ProgressDots total={totalSteps} current={currentStep} />
        </div>

        <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full">
          <div className="space-y-6">{children}</div>
          
          <div className="mt-8 space-y-4">
            <Button 
              className="w-full rounded-full"
              size="lg"
              onClick={onContinue}
              disabled={continueDisabled}
              data-testid="button-continue"
            >
              Continue
            </Button>
            
            <p className="text-xs text-muted-foreground text-center leading-relaxed">
              Toddl is here to support you, but it can make mistakes. Always double-check any advice or actions with a Public Health Nurse, GP, or Paediatrician if you're unsure.
              <br /><br />
              Toddl is not a substitute for professional medical advice. If you ever have concerns about your child's health, please contact a qualified healthcare professional right away.
              <br /><br />
              Your information is not stored or shared for our own use. It's only used to improve the app and tailor it for you and your family.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
