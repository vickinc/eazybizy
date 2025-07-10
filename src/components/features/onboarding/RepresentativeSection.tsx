import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck, Trash2, Plus, ChevronUp, ChevronDown, Edit2 } from 'lucide-react';
import { Representative } from '@/types/company.types';
import { RepresentativeForm } from './RepresentativeForm';

interface RepresentativeSectionProps {
  representatives: Representative[];
  onAdd: (representative: Representative) => void;
  onRemove: (index: number) => void;
  onEdit: (index: number, representative: Representative) => void;
}

export const RepresentativeSection: React.FC<RepresentativeSectionProps> = ({
  representatives,
  onAdd,
  onRemove,
  onEdit
}) => {
  const [showForm, setShowForm] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAdd = (representative: Representative) => {
    if (editingIndex !== null) {
      onEdit(editingIndex, representative);
      setEditingIndex(null);
    } else {
      onAdd(representative);
    }
    setShowForm(false);
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingIndex(null);
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
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(index);
                      }}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(index);
                      }}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {representatives.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No representatives added yet</p>
                </div>
              )}
            </div>

            {/* Add/Edit Representative Form */}
            {showForm ? (
              <RepresentativeForm 
                onAdd={handleAdd} 
                onCancel={handleCancel}
                initialData={editingIndex !== null ? representatives[editingIndex] : undefined}
                isEditing={editingIndex !== null}
              />
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