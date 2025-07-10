"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Building2, Edit } from "lucide-react";
import { OnboardingWizard } from "@/components/features/onboarding/OnboardingWizard";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { useCompanyOnboardingDB } from "@/hooks/useCompanyOnboardingDB";

function CompanyOnboardingContent() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get('edit');
  const initialStep = searchParams.get('step');
  const isEditing = !!companyId;

  // Get loading state from the onboarding hook
  const { isLoading } = useCompanyOnboardingDB(companyId);
  
  // Use delayed loading to prevent flash for cached data
  const showLoader = useDelayedLoading(isLoading);

  // Handle loading state
  if (showLoader) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              {isEditing ? (
                <Edit className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              ) : (
                <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              )}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {isEditing ? 'Edit Company' : 'Company Onboarding'}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {isEditing 
                  ? 'Update your company information with our guided wizard'
                  : 'Set up your new company with our guided wizard'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Onboarding Wizard */}
        <OnboardingWizard editingCompanyId={companyId} initialStep={initialStep} />
      </div>
    </div>
  );
}

export default function CompanyOnboardingPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <CompanyOnboardingContent />
    </Suspense>
  );
}