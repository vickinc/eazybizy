import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck, Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { Representative } from '@/types/company.types';
import { RepresentativeForm } from './RepresentativeForm';

interface RepresentativeSectionProps {
  representatives: Representative[];
  onAdd: (representative: Representative) => void;
  onRemove: (index: number) => void;
}

export const RepresentativeSection: React.FC<RepresentativeSectionProps> = ({
  representatives,
  onAdd,
  onRemove
}) => {
  const [showForm, setShowForm] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleAdd = (representative: Representative) => {
    onAdd(representative);
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
  };

  return (
    <Card 
      onClick={() => {
        if (!showForm) {
          setIsOpen(!isOpen);
        }
      }}
      className="cursor-pointer"
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <UserCheck className="h-5 w-5 mr-2 text-purple-600" />
            <div className="flex items-center">
              <span>Company Representatives</span>
              <span className="ml-2 text-sm text-gray-500 font-normal">(at least one required)</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="h-8"
          >
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </CardTitle>
        <CardDescription>
          Add company representatives and their roles
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(representatives.length > 0 || isOpen) && (
          <div>
            {/* Current Representatives List */}
            <div className="space-y-4 mb-6">
              {representatives.map((representative, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <UserCheck className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{representative.firstName} {representative.lastName}</h4>
                        <p className="text-sm text-gray-600">{representative.email}</p>
                        <p className="text-sm text-purple-600 font-medium">
                          {representative.role === 'Other' ? representative.customRole : representative.role}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemove(index)}
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {representatives.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No representatives added yet</p>
                </div>
              )}
            </div>

            {/* Add Representative Form */}
            {showForm ? (
              <RepresentativeForm onAdd={handleAdd} onCancel={handleCancel} />
            ) : (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowForm(true);
                }}
                className="w-full !bg-gray-900 hover:!bg-white !text-white hover:!text-black !border-0 transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Representative
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};