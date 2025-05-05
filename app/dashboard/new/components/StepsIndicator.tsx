type StepsIndicatorProps = {
  currentStep: number;
};

export default function StepsIndicator({ currentStep }: StepsIndicatorProps) {
  const steps = [
    { id: 1, name: "Add site" },
    { id: 2, name: "Install script" },
  ];

  return (
    <div className="flex justify-center mb-8">
      <div className="flex items-center space-x-2">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                  currentStep === step.id 
                    ? "bg-[#39a276] text-white" 
                    : currentStep > step.id 
                      ? "bg-[#39a276] text-white" 
                      : "bg-[#1f1f1f] border border-[#444444] text-gray-400"
                }`}
              >
                {currentStep > step.id ? (
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-4 w-4" 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path 
                      fillRule="evenodd" 
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                      clipRule="evenodd" 
                    />
                  </svg>
                ) : (
                  step.id
                )}
              </div>
              <span 
                className={`text-xs ${
                  currentStep === step.id 
                    ? "text-white font-medium" 
                    : "text-gray-400"
                }`}
              >
                {step.name}
              </span>
            </div>
            
            {index < steps.length - 1 && (
              <div 
                className={`h-0.5 w-12 mx-2 ${
                  currentStep > index + 1 
                    ? "bg-[#39a276]" 
                    : "bg-[#2a2a2a]"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 