import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useCompanyOnboardingDB } from '@/hooks/useCompanyOnboardingDB';
import { CompanySetupStep } from './CompanySetupStep';
import { BusinessDetailsStep } from './BusinessDetailsStep';
import { OwnersRepresentativesStep } from './OwnersRepresentativesStep';
import { ReviewStep } from './ReviewStep';
import { WelcomeStep } from './WelcomeStep';

interface OnboardingWizardProps {
  editingCompanyId?: string | null;
  initialStep?: string | null;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ editingCompanyId, initialStep }) => {
  const {
    // Current state
    currentStep,
    setCurrentStep,
    formData,
    logoPreview,
    isLoading,
    
    // Navigation
    nextStep,
    prevStep,
    canProceed,
    goToStep,
    
    // Form handling
    updateFormData,
    handleLogoUpload,
    removeLogo,
    
    // Submission
    submitCompany,
    
    // Validation
    getStepErrors
  } = useCompanyOnboardingDB(editingCompanyId, initialStep);

  const renderStepIndicator = () => {
    const steps = [
      { id: 'company', label: 'Company Info', number: 1 },
      { id: 'business', label: 'Business Details', number: 2 },
      { id: 'owners', label: 'Owners & Reps', number: 3 },
      { id: 'review', label: 'Review', number: 4 },
      ...(editingCompanyId ? [] : [{ id: 'complete', label: 'Complete', number: 5 }])
    ];

    const currentStepIndex = steps.findIndex(step => step.id === currentStep);

    const handleStepClick = (stepId: string, stepIndex: number) => {
      // Only allow navigation to previous steps or current step
      if (stepIndex <= currentStepIndex) {
        setCurrentStep(stepId as any);
      }
    };

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <div 
              className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                currentStepIndex >= index
                  ? 'bg-lime-400 text-gray-900 cursor-pointer hover:bg-lime-500'
                  : 'bg-gray-200 text-gray-600'
              } ${index <= currentStepIndex ? 'cursor-pointer' : ''}`}
              onClick={() => handleStepClick(step.id, index)}
            >
              {step.number}
            </div>
            <div className="hidden sm:block ml-2 mr-4 text-sm font-medium text-gray-700">
              {step.label}
            </div>
            {index < steps.length - 1 && (
              <div className={`h-1 w-8 sm:w-16 mx-2 ${
                currentStepIndex > index
                  ? 'bg-lime-400'
                  : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  const renderCurrentStep = () => {
    const stepProps = {
      formData,
      logoPreview,
      isLoading,
      onUpdateFormData: updateFormData,
      onLogoUpload: handleLogoUpload,
      onRemoveLogo: removeLogo,
      onNext: nextStep,
      onPrev: prevStep,
      onSubmit: submitCompany,
      canProceed,
      errors: getStepErrors()
    };

    switch (currentStep) {
      case 'company':
        return <CompanySetupStep {...stepProps} isEditing={!!editingCompanyId} />;
      case 'business':
        return <BusinessDetailsStep {...stepProps} />;
      case 'owners':
        return <OwnersRepresentativesStep {...stepProps} />;
      case 'review':
        return <ReviewStep {...stepProps} onGoToStep={goToStep} isEditing={!!editingCompanyId} />;
      case 'complete':
        return <WelcomeStep {...stepProps} />;
      default:
        return <CompanySetupStep {...stepProps} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Indicator */}
      {renderStepIndicator()}

      {/* Current Step Content */}
      <Card>
        <CardContent className="p-6 sm:p-8">
          {renderCurrentStep()}
        </CardContent>
      </Card>
    </div>
  );
};