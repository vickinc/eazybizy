import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle, 
  Building2, 
  Users, 
  FileText, 
  Package, 
  ArrowRight,
  Home,
  Plus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CompanyFormData } from '@/services/business/companyValidationService';

interface WelcomeStepProps {
  formData: CompanyFormData;
  logoPreview: string | null;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({
  formData,
  logoPreview
}) => {
  const router = useRouter();

  const handleGoToCompanies = () => {
    router.push('/companies');
  };

  const handleAddAnotherCompany = () => {
    // Force a page reload to ensure fresh state for new company creation
    window.location.href = '/companies/company-onboarding';
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  const quickActions = [
    {
      title: 'Add Clients',
      description: 'Start building your client database',
      icon: Users,
      color: 'bg-blue-100 text-blue-600',
      action: () => router.push('/sales/clients')
    },
    {
      title: 'Create Products',
      description: 'Set up your product catalog',
      icon: Package,
      color: 'bg-green-100 text-green-600',
      action: () => router.push('/sales/products')
    },
    {
      title: 'Generate Invoice',
      description: 'Create your first invoice',
      icon: FileText,
      color: 'bg-purple-100 text-purple-600',
      action: () => router.push('/sales/invoices')
    }
  ];

  return (
    <div className="space-y-8">
      {/* Success Message */}
      <div className="text-center">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-green-100 rounded-full">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 Welcome On Board!
        </h2>
        <p className="text-lg text-gray-600 mb-2">
          Your company has been successfully created
        </p>
        <p className="text-gray-500">
          You're all set to start managing your business operations
        </p>
      </div>

      {/* Company Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            {logoPreview ? (
              <img 
                src={logoPreview} 
                alt="Company logo" 
                className="w-16 h-16 object-cover rounded-lg border shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                {formData.tradingName.substring(0, 2).toUpperCase() || 'CO'}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-gray-900">{formData.tradingName}</h3>
              <p className="text-gray-600">{formData.email}</p>
              <p className="text-sm text-gray-500">{formData.industry} • {formData.status}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Options */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button 
          onClick={handleGoToDashboard}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Go to Dashboard
        </Button>
        <Button 
          onClick={handleGoToCompanies}
          className="flex-1 bg-blue-600 hover:bg-black text-white"
        >
          View All Companies
        </Button>
        <Button 
          onClick={handleAddAnotherCompany}
          className="flex-1 bg-blue-600 hover:bg-black text-white"
        >
          Add Another Company
        </Button>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Next Steps</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer" onClick={action.action}>
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${action.color}`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">{action.title}</h4>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Features Overview */}
      <Card>
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
          <CardDescription>
            Here's what you can do with your new company setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Sales Management</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Create and manage clients
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Build your product catalog
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Generate professional invoices
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Track payments and revenue
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Business Operations</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Manage vendors and suppliers
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Track business expenses
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Monitor cash flow
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Generate financial reports
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};