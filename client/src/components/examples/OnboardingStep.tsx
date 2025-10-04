import OnboardingStep from '../OnboardingStep'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function OnboardingStepExample() {
  return (
    <OnboardingStep
      currentStep={0}
      totalSteps={5}
      onContinue={() => console.log('Continue clicked')}
    >
      <div className="space-y-2">
        <Label>What do we call you?</Label>
        <Input placeholder="e.g: Radhika, Mommy ... etc." data-testid="input-parent-name" />
      </div>
    </OnboardingStep>
  )
}
