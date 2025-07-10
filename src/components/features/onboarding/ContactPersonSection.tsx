import React, { useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, User, UserCheck } from 'lucide-react';
import { Shareholder, Representative, ContactPerson } from '@/types/company.types';

interface ContactPersonSectionProps {
  shareholders: Shareholder[];
  representatives: Representative[];
  mainContactPerson?: ContactPerson;
  onSelectContact: (person: ContactPerson) => void;
}

export const ContactPersonSection: React.FC<ContactPersonSectionProps> = ({
  shareholders,
  representatives,
  mainContactPerson,
  onSelectContact
}) => {
  const contactPersons = useMemo((): ContactPerson[] => {
    const shareholderContacts: ContactPerson[] = shareholders.map((s, index) => ({
      type: 'shareholder' as const,
      id: index,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      phoneNumber: s.phoneNumber || '',
      displayRole: `${s.ownershipPercent}% Owner`
    }));

    const representativeContacts: ContactPerson[] = representatives.map((r, index) => ({
      type: 'representative' as const,
      id: index,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      phoneNumber: r.phoneNumber || '',
      displayRole: r.role === 'Other' ? r.customRole || 'Other' : r.role
    }));

    // Put representatives first, then shareholders - this matches the UI order
    return [...representativeContacts, ...shareholderContacts];
  }, [shareholders, representatives]);

  const handleSelectContact = useCallback((person: ContactPerson) => {
    // Pass the full ContactPerson object to parent component
    onSelectContact(person);
  }, [onSelectContact]);

  // Auto-select first person if no main contact is selected
  React.useEffect(() => {
    if (contactPersons.length > 0 && !mainContactPerson) {
      // Select first representative if exists, otherwise first shareholder
      const firstRepresentative = contactPersons.find(p => p.type === 'representative');
      const firstPerson = firstRepresentative || contactPersons[0];
      handleSelectContact(firstPerson);
    }
  }, [contactPersons, mainContactPerson, handleSelectContact]);

  if (contactPersons.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="h-5 w-5 mr-2 text-green-600" />
          Main Contact Person
        </CardTitle>
        <CardDescription>
          Select the primary contact person from shareholders or representatives
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {contactPersons.map((person) => {
            const isSelected = mainContactPerson && 
              mainContactPerson.email === person.email &&
              mainContactPerson.type === person.type;
            
            return (
              <div
                key={`${person.type}-${person.email}`}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  isSelected
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSelectContact(person)}
              >
              <div className="flex items-center space-x-4">
                <div className={`p-2 rounded-lg ${
                  person.type === 'shareholder' ? 'bg-blue-100' : 'bg-purple-100'
                }`}>
                  {person.type === 'shareholder' ? (
                    <User className="h-4 w-4 text-blue-600" />
                  ) : (
                    <UserCheck className="h-4 w-4 text-purple-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium">{person.firstName} {person.lastName}</h4>
                  <p className="text-sm text-gray-600">{person.email}</p>
                  <p className={`text-sm font-medium ${
                    person.type === 'shareholder' ? 'text-blue-600' : 'text-purple-600'
                  }`}>
                    {person.displayRole}
                  </p>
                </div>
                {isSelected && (
                  <div className="text-green-600 font-medium text-sm">✓ Main Contact</div>
                )}
              </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};