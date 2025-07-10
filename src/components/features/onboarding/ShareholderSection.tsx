import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, User, Trash2, Plus, ChevronUp, ChevronDown, Edit2 } from 'lucide-react';
import { Shareholder } from '@/types/company.types';
import { ShareholderForm } from './ShareholderForm';

interface ShareholderSectionProps {
  shareholders: Shareholder[];
  onAdd: (shareholder: Shareholder) => void;
  onRemove: (index: number) => void;
  onEdit: (index: number, shareholder: Shareholder) => void;
}

export const ShareholderSection: React.FC<ShareholderSectionProps> = ({
  shareholders,
  onAdd,
  onRemove,
  onEdit
}) => {
  const [showForm, setShowForm] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const totalOwnership = shareholders.reduce((total, s) => total + s.ownershipPercent, 0);

  const handleAdd = (shareholder: Shareholder) => {
    if (editingIndex !== null) {
      onEdit(editingIndex, shareholder);
      setEditingIndex(null);
    } else {
      onAdd(shareholder);
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
            <Users className="h-5 w-5 mr-2 text-blue-600" />
            <div className="flex items-center">
              <span>Shareholders</span>
              <span className="ml-2 text-sm text-gray-500 font-normal">(optional)</span>
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
          Add company shareholders and their ownership percentages
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(shareholders.length > 0 || isOpen) && (
          <div>
            {/* Current Shareholders List */}
            <div className="space-y-4 mb-6">
              {shareholders.map((shareholder, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium">{shareholder.firstName} {shareholder.lastName}</h4>
                        <p className="text-sm text-gray-600">{shareholder.email}</p>
                        <p className="text-sm text-blue-600 font-medium">{shareholder.ownershipPercent}% ownership</p>
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

              {shareholders.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No shareholders added yet</p>
                </div>
              )}
            </div>

            {/* Total Ownership Display */}
            {shareholders.length > 0 && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Ownership:</span>
                  <span className={`font-bold ${totalOwnership > 100 ? 'text-red-600' : totalOwnership === 100 ? 'text-green-600' : 'text-blue-600'}`}>
                    {totalOwnership}%
                  </span>
                </div>
                {totalOwnership > 100 && (
                  <p className="text-sm text-red-600 mt-1">⚠️ Total ownership exceeds 100%</p>
                )}
              </div>
            )}

            {/* Add/Edit Shareholder Form */}
            {showForm ? (
              <ShareholderForm 
                onAdd={handleAdd} 
                onCancel={handleCancel}
                initialData={editingIndex !== null ? shareholders[editingIndex] : undefined}
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
                Add Shareholder
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};