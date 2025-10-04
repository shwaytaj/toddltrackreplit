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
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import Logo from '@/components/Logo';

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(0);
  const [parentName, setParentName] = useState('');
  const [childName, setChildName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [isPremature, setIsPremature] = useState(false);

  const handleContinue = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      console.log('Onboarding complete', { parentName, childName, relationship, birthDate, isPremature });
      setLocation('/home');
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 0: return parentName.trim().length > 0;
      case 1: return childName.trim().length > 0;
      case 2: return relationship.length > 0;
      case 3: return birthDate.length > 0;
      default: return true;
    }
  };

  return (
    <>
      {step === 0 && (
        <OnboardingStep
          currentStep={step}
          totalSteps={5}
          onContinue={handleContinue}
          continueDisabled={!isStepValid()}
        >
          <div className="space-y-2">
            <Label>What do we call you?</Label>
            <Input
              placeholder="e.g: Radhika, Mommy ... etc."
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              data-testid="input-parent-name"
            />
          </div>
        </OnboardingStep>
      )}

      {step === 1 && (
        <OnboardingStep
          currentStep={step}
          totalSteps={5}
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

      {step === 2 && (
        <OnboardingStep
          currentStep={step}
          totalSteps={5}
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
          totalSteps={5}
          onContinue={handleContinue}
          continueDisabled={!isStepValid()}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Child's date of birth</Label>
              <Input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                data-testid="input-birth-date"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="premature"
                checked={isPremature}
                onCheckedChange={(checked) => setIsPremature(checked as boolean)}
                data-testid="checkbox-premature"
              />
              <label
                htmlFor="premature"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Was baby born prematurely
              </label>
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
              data-testid="button-get-started"
            >
              Get Started
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
