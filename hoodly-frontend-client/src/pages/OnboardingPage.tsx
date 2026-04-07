import { useState } from 'react'
import OnboardingStepper from '../components/OnboardingStepper'
import StepPersonalInfo from '../components/StepPersonalInfo'
import StepZoneSelection from '../components/StepZoneSelection'

function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)

  return (
    <div className="min-h-screen bg-[#f5f3ed]">

      <OnboardingStepper currentStep={currentStep} totalSteps={2} />

      <div className="px-4 py-6">
        {currentStep === 1 && (
          <StepPersonalInfo onNext={() => setCurrentStep(2)} />
        )}

        {currentStep === 2 && <StepZoneSelection />}
      </div>
    </div>
  )
}

export default OnboardingPage
