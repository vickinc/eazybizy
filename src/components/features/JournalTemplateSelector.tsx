import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { JournalTemplateService } from '@/services/business/journalTemplateService';
import { 
  JournalEntryTemplate, 
  TemplateCategory,
  JournalTemplateFormData 
} from '@/types/journalTemplates.types';
import FileText from "lucide-react/dist/esm/icons/file-text";
import Users from "lucide-react/dist/esm/icons/users";
import TrendingDown from "lucide-react/dist/esm/icons/trending-down";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Settings from "lucide-react/dist/esm/icons/settings";
import RotateCw from "lucide-react/dist/esm/icons/rotate-cw";
import Clock from "lucide-react/dist/esm/icons/clock";
import Star from "lucide-react/dist/esm/icons/star";
import Search from "lucide-react/dist/esm/icons/search";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";

interface JournalTemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateSelect: (templateData: JournalTemplateFormData) => void;
}

export const JournalTemplateSelector: React.FC<JournalTemplateSelectorProps> = ({
  open,
  onOpenChange,
  onTemplateSelect
}) => {
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [popularTemplates, setPopularTemplates] = useState<JournalEntryTemplate[]>([]);
  const [recentTemplates, setRecentTemplates] = useState<JournalEntryTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<JournalEntryTemplate | null>(null);
  const [templateVariables, setTemplateVariables] = useState<Record<string, string | number>>({});

  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open]);

  const loadTemplates = () => {
    setCategories(JournalTemplateService.getTemplatesByCategory());
    setPopularTemplates(JournalTemplateService.getPopularTemplates());
    setRecentTemplates(JournalTemplateService.getRecentTemplates());
  };

  const getCategoryIcon = (icon: string) => {
    switch (icon) {
      case 'Users': return <Users className="h-5 w-5" />;
      case 'TrendingDown': return <TrendingDown className="h-5 w-5" />;
      case 'Calendar': return <Calendar className="h-5 w-5" />;
      case 'Settings': return <Settings className="h-5 w-5" />;
      case 'RotateCw': return <RotateCw className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const handleTemplateSelect = (template: JournalEntryTemplate) => {
    setSelectedTemplate(template);
    
    // Initialize variables with default values
    const variables: Record<string, string | number> = {};
    
    // Extract variables from template lines
    template.templateData.lines.forEach(line => {
      if (line.isVariable) {
        if (line.debitFormula?.includes('{')) {
          const matches = line.debitFormula.match(/\{(\w+)\}/g);
          matches?.forEach(match => {
            const varName = match.slice(1, -1);
            if (!(varName in variables)) {
              variables[varName] = '';
            }
          });
        }
        if (line.creditFormula?.includes('{')) {
          const matches = line.creditFormula.match(/\{(\w+)\}/g);
          matches?.forEach(match => {
            const varName = match.slice(1, -1);
            if (!(varName in variables)) {
              variables[varName] = '';
            }
          });
        }
      }
    });

    // Also check description for variables
    if (template.templateData.description.includes('{')) {
      const matches = template.templateData.description.match(/\{(\w+)\}/g);
      matches?.forEach(match => {
        const varName = match.slice(1, -1);
        if (!(varName in variables)) {
          variables[varName] = '';
        }
      });
    }

    setTemplateVariables(variables);
  };

  const handleVariableChange = (variableName: string, value: string | number) => {
    setTemplateVariables(prev => ({
      ...prev,
      [variableName]: value
    }));
  };

  const handleUseTemplate = () => {
    if (!selectedTemplate) return;

    const templateData: JournalTemplateFormData = {
      templateId: selectedTemplate.id,
      description: selectedTemplate.templateData.description,
      reference: selectedTemplate.templateData.reference,
      date: new Date().toISOString().split('T')[0],
      variables: templateVariables
    };

    onTemplateSelect(templateData);
    onOpenChange(false);
    setSelectedTemplate(null);
    setTemplateVariables({});
  };

  const filteredCategories = categories.map(category => ({
    ...category,
    templates: category.templates.filter(template =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.templates.length > 0);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex h-full">
          {/* Template Selection Panel */}
          <div className="w-2/3 border-r border-gray-200 flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Journal Entry Templates</h2>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  ✕
                </Button>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <Tabs defaultValue="categories" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="categories">Categories</TabsTrigger>
                  <TabsTrigger value="popular">Popular</TabsTrigger>
                  <TabsTrigger value="recent">Recent</TabsTrigger>
                </TabsList>

                <TabsContent value="categories" className="space-y-6 mt-6">
                  {filteredCategories.map(category => (
                    <div key={category.id}>
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="text-blue-600">
                          {getCategoryIcon(category.icon)}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                        <Badge variant="secondary">{category.templates.length}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {category.templates.map(template => (
                          <Card 
                            key={template.id}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                            }`}
                            onClick={() => handleTemplateSelect(template)}
                          >
                            <CardHeader className="pb-2">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              </div>
                              <CardDescription className="text-xs">
                                {template.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{template.templateData.lines.length} lines</span>
                                {template.usageCount > 0 && (
                                  <span>Used {template.usageCount} times</span>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </TabsContent>

                <TabsContent value="popular" className="mt-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 mb-4">
                      <Star className="h-5 w-5 text-yellow-500" />
                      <h3 className="text-lg font-semibold">Most Used Templates</h3>
                    </div>
                    
                    {popularTemplates.map(template => (
                      <Card 
                        key={template.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                        }`}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{template.name}</h4>
                              <p className="text-sm text-gray-600">{template.description}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary">{template.usageCount} uses</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="recent" className="mt-6">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 mb-4">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <h3 className="text-lg font-semibold">Recently Used</h3>
                    </div>
                    
                    {recentTemplates.map(template => (
                      <Card 
                        key={template.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                        }`}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium">{template.name}</h4>
                              <p className="text-sm text-gray-600">{template.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">
                                {template.lastUsed && new Date(template.lastUsed).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Template Configuration Panel */}
          <div className="w-1/3 flex flex-col">
            {selectedTemplate ? (
              <>
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {selectedTemplate.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    {selectedTemplate.description}
                  </p>
                  
                  <Badge className="mb-4">
                    {selectedTemplate.category.charAt(0).toUpperCase() + selectedTemplate.category.slice(1)}
                  </Badge>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900">Template Variables</h4>
                    
                    {Object.keys(templateVariables).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(templateVariables).map(([variableName, value]) => (
                          <div key={variableName}>
                            <Label htmlFor={variableName} className="text-sm font-medium">
                              {variableName.charAt(0).toUpperCase() + variableName.slice(1)}
                            </Label>
                            <Input
                              id={variableName}
                              type={variableName.toLowerCase().includes('amount') ? 'number' : 'text'}
                              value={value}
                              onChange={(e) => handleVariableChange(
                                variableName, 
                                e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                              )}
                              placeholder={`Enter ${variableName}`}
                              className="mt-1"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        This template has no configurable variables.
                      </p>
                    )}

                    {/* Template Preview */}
                    <div className="mt-6">
                      <h4 className="font-medium text-gray-900 mb-3">Template Preview</h4>
                      <div className="bg-gray-50 p-3 rounded border text-sm">
                        <div className="font-medium mb-2">
                          {selectedTemplate.templateData.description}
                        </div>
                        <div className="space-y-1">
                          {selectedTemplate.templateData.lines.map((line, index) => (
                            <div key={line.id} className="flex justify-between text-xs">
                              <span className="truncate">{line.accountName}</span>
                              <span className="ml-2">
                                {line.debitFormula && 'DR'} {line.creditFormula && 'CR'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <Button 
                      onClick={handleUseTemplate}
                      className="flex-1"
                      disabled={Object.values(templateVariables).some(v => v === '' || v === 0)}
                    >
                      Use Template
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setSelectedTemplate(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="text-center">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a Template
                  </h3>
                  <p className="text-sm text-gray-600">
                    Choose a template from the left panel to configure and use it.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};