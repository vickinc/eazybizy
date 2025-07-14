import React from 'react';
import Building2 from "lucide-react/dist/esm/icons/building-2";
import { Card } from "@/components/ui/card";
import { Company } from '@/types';
import { CompanyCard } from './CompanyCard';

interface CompanyListProps {
  activeCompanies: Company[];
  passiveCompanies: Company[];
  isLoaded: boolean;
  copiedFields: { [key: string]: boolean };
  handleEdit: (company: Company) => void;
  handleDelete: (id: number) => void;
  handleArchive: (company: Company) => void;
  copyToClipboard: (text: string, fieldName: string, companyId: number) => Promise<void>;
  handleWebsiteClick: (website: string, e: React.MouseEvent) => void;
  hasMoreActive?: boolean;
  hasMorePassive?: boolean;
  loadMoreActive?: () => void;
  loadMorePassive?: () => void;
  isLoadingActive?: boolean;
  isLoadingPassive?: boolean;
}

export const CompanyList: React.FC<CompanyListProps> = ({
  activeCompanies,
  passiveCompanies,
  isLoaded,
  copiedFields,
  handleEdit,
  handleDelete,
  handleArchive,
  copyToClipboard,
  handleWebsiteClick,
  hasMoreActive = false,
  hasMorePassive = false,
  loadMoreActive,
  loadMorePassive,
  isLoadingActive = false,
  isLoadingPassive = false
}) => {

  return (
    <>
      {/* Active Companies Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Active Companies 
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({isLoaded ? activeCompanies.length : '...'})
            </span>
          </h2>
        </div>
        
        {isLoaded && activeCompanies.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {activeCompanies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  copiedFields={copiedFields}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                  handleArchive={handleArchive}
                  copyToClipboard={copyToClipboard}
                  handleWebsiteClick={handleWebsiteClick}
                />
              ))}
            </div>
            
            {/* Load More Button for Active Companies */}
            {hasMoreActive && loadMoreActive && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMoreActive}
                  disabled={isLoadingActive}
                  className="px-6 py-3 bg-lime-300 text-black rounded-lg hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isLoadingActive ? 'Loading...' : 'Load More Active Companies'}
                </button>
              </div>
            )}
          </>
        ) : isLoaded ? (
          <Card className="p-8 text-center">
            <Building2 className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">No active companies yet</p>
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <div className="animate-pulse">
              <div className="h-8 w-8 mx-auto bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-32 mx-auto bg-gray-200 rounded"></div>
            </div>
          </Card>
        )}
      </div>

      {/* Passive Companies Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Passive Companies
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({isLoaded ? passiveCompanies.length : '...'})
            </span>
          </h2>
        </div>
        
        {isLoaded && passiveCompanies.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {passiveCompanies.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  copiedFields={copiedFields}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                  handleArchive={handleArchive}
                  copyToClipboard={copyToClipboard}
                  handleWebsiteClick={handleWebsiteClick}
                  isPassive={true}
                />
              ))}
            </div>
            
            {/* Load More Button for Passive Companies */}
            {hasMorePassive && loadMorePassive && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMorePassive}
                  disabled={isLoadingPassive}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isLoadingPassive ? 'Loading...' : 'Load More Passive Companies'}
                </button>
              </div>
            )}
          </>
        ) : isLoaded ? (
          <Card className="p-8 text-center">
            <Building2 className="h-8 w-8 mx-auto text-gray-400 mb-2" />
            <p className="text-gray-600">No passive companies</p>
          </Card>
        ) : (
          <Card className="p-8 text-center">
            <div className="animate-pulse">
              <div className="h-8 w-8 mx-auto bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-32 mx-auto bg-gray-200 rounded"></div>
            </div>
          </Card>
        )}
      </div>
    </>
  );
};