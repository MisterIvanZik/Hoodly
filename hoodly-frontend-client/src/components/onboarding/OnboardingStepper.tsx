interface OnboardingStepperProps {
  currentStep: number
  totalSteps: number
}

const STEP_TITLES = ['Informations', 'Localisation', 'Validation']

function OnboardingStepper({ currentStep, totalSteps }: OnboardingStepperProps) {
  return (
    <div className="flex flex-col items-center py-8 bg-slate-50/50 border-b border-slate-100">
      <div className="flex items-center justify-center gap-2 md:gap-4 max-w-lg w-full px-4">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
          const title = STEP_TITLES[step - 1]
          const isCompleted = step < currentStep
          const isActive = step === currentStep

          return (
            <div key={step} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center relative">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                    isActive
                      ? 'bg-[#0c3383] text-white ring-4 ring-blue-100'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-400'
                  }`}
                >
                  {isCompleted ? '✓' : step}
                </div>

                <span
                  className={`absolute -bottom-6 text-[10px] whitespace-nowrap font-bold tracking-wider uppercase transition-colors duration-300 ${
                    isActive ? 'text-[#0c3383]' : 'text-gray-400'
                  }`}
                >
                  {title}
                </span>
              </div>

              {step < totalSteps && (
                <div className="flex-1 mx-2 md:mx-4 h-0.5 relative overflow-hidden bg-gray-200 rounded">
                  <div
                    className={`absolute inset-y-0 left-0 transition-all duration-500 rounded bg-[#0c3383] ${
                      step < currentStep ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
      <div className="h-4" />
    </div>
  )
}

export default OnboardingStepper
