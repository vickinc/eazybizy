import { NoteFormData } from '@/types/calendar.types';

export interface NotesValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class NotesValidationService {
  /**
   * Validates note form data
   */
  static validateNoteForm(formData: NoteFormData): NotesValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!formData.title.trim()) {
      errors.push('Note title is required');
    }

    if (!formData.content.trim()) {
      errors.push('Note content is required');
    }

    // Title length validation
    if (formData.title.length > 200) {
      errors.push('Note title must be less than 200 characters');
    }

    // Content length validation
    if (formData.content.length > 5000) {
      errors.push('Note content must be less than 5000 characters');
    }

    // Event-related validation
    if (!formData.isStandalone) {
      if (!formData.eventId || formData.eventId === "none") {
        warnings.push('Consider selecting a related event for event-related notes');
      }
    }

    // Tags validation
    if (formData.tags.trim()) {
      const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
      
      if (tagsArray.length > 10) {
        warnings.push('Consider using fewer than 10 tags for better organization');
      }

      // Check for very long individual tags
      const longTags = tagsArray.filter(tag => tag.length > 30);
      if (longTags.length > 0) {
        warnings.push('Some tags are very long. Consider shorter, more concise tags.');
      }
    }

    // Company validation
    if (formData.companyId && formData.companyId !== "none") {
      try {
        const companyIdNum = parseInt(formData.companyId);
        if (isNaN(companyIdNum) || companyIdNum <= 0) {
          errors.push('Invalid company selection');
        }
      } catch {
        errors.push('Invalid company selection');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Quick validation for real-time form updates
   */
  static validateField(fieldName: string, value: string | boolean): string[] {
    const errors: string[] = [];

    switch (fieldName) {
      case 'title':
        if (!value || (typeof value === 'string' && !value.trim())) {
          errors.push('Title is required');
        } else if (typeof value === 'string' && value.length > 200) {
          errors.push('Title must be less than 200 characters');
        }
        break;

      case 'content':
        if (!value || (typeof value === 'string' && !value.trim())) {
          errors.push('Content is required');
        } else if (typeof value === 'string' && value.length > 5000) {
          errors.push('Content must be less than 5000 characters');
        }
        break;

      case 'tags':
        if (typeof value === 'string' && value.trim()) {
          const tagsArray = value.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
          if (tagsArray.length > 10) {
            errors.push('Maximum 10 tags allowed');
          }
        }
        break;

      case 'companyId':
        if (typeof value === 'string' && value && value !== "none") {
          try {
            const companyIdNum = parseInt(value);
            if (isNaN(companyIdNum) || companyIdNum <= 0) {
              errors.push('Invalid company selection');
            }
          } catch {
            errors.push('Invalid company selection');
          }
        }
        break;
    }

    return errors;
  }

  /**
   * Validate note data consistency
   */
  static validateNoteConsistency(formData: NoteFormData): string[] {
    const warnings: string[] = [];

    // Check if standalone note has event assigned
    if (formData.isStandalone && formData.eventId && formData.eventId !== "none") {
      warnings.push('Standalone notes typically should not have events assigned');
    }

    // Check if event-related note has no event
    if (!formData.isStandalone && (!formData.eventId || formData.eventId === "none")) {
      warnings.push('Event-related notes should have an event assigned');
    }

    return warnings;
  }

  /**
   * Sanitize and format form data
   */
  static sanitizeFormData(formData: NoteFormData): NoteFormData {
    return {
      title: formData.title.trim(),
      content: formData.content.trim(),
      eventId: formData.isStandalone ? "none" : formData.eventId,
      companyId: formData.companyId,
      tags: formData.tags.trim(),
      priority: formData.priority,
      isStandalone: formData.isStandalone
    };
  }
}