import { BusinessCard, BusinessCardFormData, FormattedBusinessCard, PassKitData } from '@/types/businessCards.types';
import { Company } from '@/types';
import { formatDateForDisplay } from '@/utils';

export class BusinessCardsBusinessService {
  
  static createBusinessCard(formData: BusinessCardFormData, companies: Company[]): BusinessCard {
    const selectedCompany = companies.find(c => c.id === formData.companyId);
    if (!selectedCompany) {
      throw new Error('Selected company not found');
    }

    const qrValue = formData.qrType === "website" 
      ? selectedCompany.website.startsWith('http') ? selectedCompany.website : `https://${selectedCompany.website}`
      : `mailto:${selectedCompany.email}`;

    return {
      id: Date.now().toString(),
      companyId: formData.companyId,
      company: selectedCompany,
      personName: formData.personName,
      position: formData.position,
      qrType: formData.qrType,
      qrValue,
      template: formData.template,
      createdAt: new Date(),
      isArchived: false
    };
  }

  static formatBusinessCardForDisplay(card: BusinessCard): FormattedBusinessCard {
    // Generate QR code dynamically based on current data
    const qrValue = card.qrType === 'website' 
      ? card.company.website 
      : (card.personEmail || card.company.email);
      
    return {
      ...card,
      formattedCreatedAt: formatDateForDisplay(card.createdAt.toISOString().split('T')[0]),
      qrCodeUrl: BusinessCardsBusinessService.generateQRCodeUrl(qrValue)
    };
  }

  static generateQRCodeUrl(text: string): string {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`;
  }

  static archiveCard(card: BusinessCard): BusinessCard {
    return {
      ...card,
      isArchived: true
    };
  }

  static unarchiveCard(card: BusinessCard): BusinessCard {
    return {
      ...card,
      isArchived: false
    };
  }

  static filterBusinessCards(cards: BusinessCard[], selectedCompany: string | number): BusinessCard[] {
    if (selectedCompany === 'all') {
      return cards;
    }
    return cards.filter(card => card.companyId === selectedCompany);
  }

  static getVisibleCards(cards: BusinessCard[], showArchived: boolean): BusinessCard[] {
    return cards.filter(card => showArchived ? card.isArchived : !card.isArchived);
  }

  static createPassKitData(card: BusinessCard): PassKitData {
    return {
      formatVersion: 1,
      passTypeIdentifier: "pass.com.example.businesscard",
      serialNumber: card.id,
      teamIdentifier: "YOUR_TEAM_ID",
      organizationName: "Your Company Name",
      description: `Business Card - ${card.company.tradingName}`,
      logoText: card.company.tradingName,
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: card.template === "modern" ? "rgb(59, 130, 246)" : 
                      card.template === "classic" ? "rgb(255, 255, 255)" : 
                      card.template === "eazy" ? "rgb(217, 249, 157)" : "rgb(243, 244, 246)",
      labelColor: card.template === "classic" ? "rgb(75, 85, 99)" : "rgb(255, 255, 255)",
      webServiceURL: "https://api.example.com/passes/",
      authenticationToken: `auth_${card.id}`,
      relevantDate: new Date().toISOString(),
      generic: {
        primaryFields: [
          {
            key: "name",
            label: "Contact",
            value: card.personName || card.company.tradingName
          }
        ],
        secondaryFields: [
          {
            key: "company",
            label: "Company",
            value: card.company.tradingName
          },
          {
            key: "position",
            label: "Position", 
            value: card.position || card.company.industry
          }
        ],
        auxiliaryFields: [
          {
            key: "email",
            label: "Email",
            value: card.personEmail || card.company.email
          },
          {
            key: "website",
            label: "Website",
            value: card.company.website
          }
        ],
        backFields: [
          {
            key: "phone",
            label: "Phone",
            value: card.personPhone || card.company.phone
          },
          {
            key: "email_back",
            label: "Email",
            value: card.personEmail || card.company.email
          },
          {
            key: "website_back", 
            label: "Website",
            value: card.company.website
          },
          {
            key: "address",
            label: "Address",
            value: card.company.address
          },
          {
            key: "industry",
            label: "Industry",
            value: card.company.industry
          }
        ]
      },
      barcode: {
        message: card.qrType === 'website' 
          ? card.company.website 
          : (card.personEmail || card.company.email),
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1"
      }
    };
  }

  static downloadPassKit(card: BusinessCard): void {
    const passData = BusinessCardsBusinessService.createPassKitData(card);
    const passJson = JSON.stringify(passData, null, 2);
    const blob = new Blob([passJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${card.company.tradingName.replace(/[^a-zA-Z0-9]/g, '-')}.passkit.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  static generateBusinessCardImageBlob(card: BusinessCard): Promise<Blob> {
    return new Promise((resolve, reject) => {
      // Create a new element specifically for blob generation
      const blobElement = document.createElement('div');
      const templateStyles = BusinessCardsBusinessService.getTemplateStyles(card.template);
      
      // Set fixed dimensions and styling
      blobElement.style.width = '400px';
      blobElement.style.height = '250px';
      blobElement.style.position = 'relative';
      blobElement.style.borderRadius = '8px';
      blobElement.style.padding = '24px';
      blobElement.style.boxSizing = 'border-box';
      blobElement.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      
      // Apply template background
      if (templateStyles.background) {
        blobElement.style.background = templateStyles.background;
      }
      if (templateStyles.backgroundColor) {
        blobElement.style.backgroundColor = templateStyles.backgroundColor;
      }
      if (templateStyles.border) {
        blobElement.style.border = templateStyles.border;
      }
      
      // Build the HTML structure (same as download method)
      blobElement.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px;">
          <div style="width: 48px; height: 48px; background: white; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden;">
            ${card.company.logo && (card.company.logo.startsWith('data:') || card.company.logo.includes('http')) 
              ? `<img src="${card.company.logo}" alt="Logo" style="width: 100%; height: 100%; border-radius: 4px; object-fit: cover;">`
              : `<span style="color: #2563eb; font-weight: bold; font-size: 14px;">${card.company.logo || card.company.tradingName.substring(0, 2).toUpperCase()}</span>`
            }
          </div>
          <div style="flex: 1; min-width: 0;">
            <h3 style="margin: 0; font-size: 18px; font-weight: bold; color: ${templateStyles.textColor}; line-height: 1.2;">${card.company.tradingName}</h3>
            <p style="margin: 2px 0 0 0; font-size: 14px; opacity: 0.75; color: ${templateStyles.textColor}; line-height: 1.2;">${card.company.industry}</p>
          </div>
        </div>
        
        ${card.personName ? `
          <div style="margin-bottom: 20px;">
            <p style="margin: 0; font-size: 20px; font-weight: bold; color: ${templateStyles.textColor}; line-height: 1.2;">${card.personName}</p>
            ${card.position ? `<p style="margin: 4px 0 0 0; font-size: 16px; opacity: 0.85; color: ${templateStyles.textColor}; line-height: 1.2;">${card.position}</p>` : ''}
          </div>
        ` : ''}
        
        <div style="position: absolute; bottom: 24px; left: 24px; right: 100px;">
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: ${templateStyles.textColor};">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.75;">
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                <path d="m22 7-10 5L2 7"></path>
              </svg>
              <span>${card.personEmail || card.company.email}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: ${templateStyles.textColor};">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.75;">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                <path d="M2 12h20"></path>
              </svg>
              <span>${card.company.website}</span>
            </div>
            ${(card.personPhone || card.company.phone) ? `
              <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: ${templateStyles.textColor};">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.75;">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>${card.personPhone || card.company.phone}</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div style="position: absolute; bottom: 24px; right: 24px; width: 70px; height: 70px; background: white; border-radius: 4px; display: flex; align-items: center; justify-content: center; padding: 5px;">
          <img src="${BusinessCardsBusinessService.generateQRCodeUrl(
            card.qrType === 'website' 
              ? card.company.website 
              : (card.personEmail || card.company.email)
          )}" alt="QR Code" style="width: 100%; height: 100%;">
        </div>
      `;
      
      // Temporarily add to DOM for rendering
      blobElement.style.position = 'absolute';
      blobElement.style.left = '-9999px';
      blobElement.style.top = '-9999px';
      document.body.appendChild(blobElement);
      
      import('html2canvas').then(({ default: html2canvas }) => {
        html2canvas(blobElement, {
          backgroundColor: templateStyles.backgroundColor || templateStyles.background || '#ffffff',
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          width: 400,
          height: 250,
          x: 0,
          y: 0
        } as any).then(canvas => {
          // Remove from DOM
          document.body.removeChild(blobElement);
          
          if (canvas.width === 0 || canvas.height === 0) {
            reject(new Error('Canvas has zero dimensions'));
            return;
          }
          
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to generate blob'));
            }
          }, 'image/png');
        }).catch(error => {
          // Remove from DOM in case of error
          if (document.body.contains(blobElement)) {
            document.body.removeChild(blobElement);
          }
          console.error('html2canvas error:', error);
          reject(error);
        });
      }).catch(error => {
        // Remove from DOM in case of error
        if (document.body.contains(blobElement)) {
          document.body.removeChild(blobElement);
        }
        console.error('Failed to import html2canvas:', error);
        reject(error);
      });
    });
  }

  static downloadBusinessCardImage(card: BusinessCard): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create a new element specifically for download
      const downloadElement = document.createElement('div');
      const templateStyles = BusinessCardsBusinessService.getTemplateStyles(card.template);
      
      // Set fixed dimensions and styling
      downloadElement.style.width = '400px';
      downloadElement.style.height = '250px';
      downloadElement.style.position = 'relative';
      downloadElement.style.borderRadius = '8px';
      downloadElement.style.padding = '24px';
      downloadElement.style.boxSizing = 'border-box';
      downloadElement.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      
      // Apply template background
      if (templateStyles.background) {
        downloadElement.style.background = templateStyles.background;
      }
      if (templateStyles.backgroundColor) {
        downloadElement.style.backgroundColor = templateStyles.backgroundColor;
      }
      if (templateStyles.border) {
        downloadElement.style.border = templateStyles.border;
      }
      
      // Build the HTML structure
      downloadElement.innerHTML = `
        <div style="display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px;">
          <div style="width: 48px; height: 48px; background: white; border-radius: 4px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden;">
            ${card.company.logo && (card.company.logo.startsWith('data:') || card.company.logo.includes('http')) 
              ? `<img src="${card.company.logo}" alt="Logo" style="width: 100%; height: 100%; border-radius: 4px; object-fit: cover;">`
              : `<span style="color: #2563eb; font-weight: bold; font-size: 14px;">${card.company.logo || card.company.tradingName.substring(0, 2).toUpperCase()}</span>`
            }
          </div>
          <div style="flex: 1; min-width: 0;">
            <h3 style="margin: 0; font-size: 18px; font-weight: bold; color: ${templateStyles.textColor}; line-height: 1.2;">${card.company.tradingName}</h3>
            <p style="margin: 2px 0 0 0; font-size: 14px; opacity: 0.75; color: ${templateStyles.textColor}; line-height: 1.2;">${card.company.industry}</p>
          </div>
        </div>
        
        ${card.personName ? `
          <div style="margin-bottom: 20px;">
            <p style="margin: 0; font-size: 20px; font-weight: bold; color: ${templateStyles.textColor}; line-height: 1.2;">${card.personName}</p>
            ${card.position ? `<p style="margin: 4px 0 0 0; font-size: 16px; opacity: 0.85; color: ${templateStyles.textColor}; line-height: 1.2;">${card.position}</p>` : ''}
          </div>
        ` : ''}
        
        <div style="position: absolute; bottom: 24px; left: 24px; right: 100px;">
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: ${templateStyles.textColor};">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.75;">
                <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                <path d="m22 7-10 5L2 7"></path>
              </svg>
              <span>${card.personEmail || card.company.email}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: ${templateStyles.textColor};">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.75;">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
                <path d="M2 12h20"></path>
              </svg>
              <span>${card.company.website}</span>
            </div>
            ${(card.personPhone || card.company.phone) ? `
              <div style="display: flex; align-items: center; gap: 8px; font-size: 13px; color: ${templateStyles.textColor};">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.75;">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
                <span>${card.personPhone || card.company.phone}</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div style="position: absolute; bottom: 24px; right: 24px; width: 70px; height: 70px; background: white; border-radius: 4px; display: flex; align-items: center; justify-content: center; padding: 5px;">
          <img src="${BusinessCardsBusinessService.generateQRCodeUrl(
            card.qrType === 'website' 
              ? card.company.website 
              : (card.personEmail || card.company.email)
          )}" alt="QR Code" style="width: 100%; height: 100%;">
        </div>
      `;
      
      // Temporarily add to DOM for rendering
      downloadElement.style.position = 'absolute';
      downloadElement.style.left = '-9999px';
      downloadElement.style.top = '-9999px';
      document.body.appendChild(downloadElement);
      
      import('html2canvas').then(({ default: html2canvas }) => {
        html2canvas(downloadElement, {
          backgroundColor: null,
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true,
          width: 400,
          height: 250
        } as any).then(canvas => {
          // Remove from DOM
          document.body.removeChild(downloadElement);
          
          if (canvas.width === 0 || canvas.height === 0) {
            reject(new Error('Canvas has zero dimensions'));
            return;
          }
          
          const link = document.createElement('a');
          link.download = `${card.company.tradingName.replace(/[^a-zA-Z0-9]/g, '-')}-business-card.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
          resolve();
        }).catch(error => {
          // Remove from DOM in case of error
          if (document.body.contains(downloadElement)) {
            document.body.removeChild(downloadElement);
          }
          console.error('html2canvas error:', error);
          reject(error);
        });
      }).catch(error => {
        // Remove from DOM in case of error
        if (document.body.contains(downloadElement)) {
          document.body.removeChild(downloadElement);
        }
        console.error('Failed to import html2canvas:', error);
        reject(error);
      });
    });
  }

  private static storeOriginalStyles(element: HTMLElement): Map<HTMLElement, any> {
    const originalStyles = new Map();
    const allElements = [element, ...element.querySelectorAll('*')] as HTMLElement[];
    
    allElements.forEach(el => {
      originalStyles.set(el, {
        backgroundColor: el.style.backgroundColor,
        background: el.style.background,
        color: el.style.color,
        borderColor: el.style.borderColor,
        border: el.style.border,
        cssText: el.style.cssText
      });
    });
    
    return originalStyles;
  }

  private static applyRgbOverrides(element: HTMLElement): void {
    const allElements = [element, ...element.querySelectorAll('*')] as HTMLElement[];
    
    allElements.forEach(el => {
      const computedStyle = window.getComputedStyle(el);
      
      // Don't override template styles that are already set as inline styles
      const hasInlineBackground = el.style.background || el.style.backgroundColor;
      const hasInlineColor = el.style.color;
      const hasInlineBorder = el.style.border || el.style.borderColor;
      
      // Only convert OKLCH colors if no template styles are present
      if (!hasInlineBackground) {
        const bgColor = computedStyle.backgroundColor;
        if (bgColor && bgColor.includes('oklch')) {
          el.style.backgroundColor = BusinessCardsBusinessService.oklchToRgb(bgColor);
        }
        
        const background = computedStyle.background;
        if (background && background.includes('oklch')) {
          el.style.background = BusinessCardsBusinessService.convertOklchInString(background);
        }
      }
      
      if (!hasInlineColor) {
        const textColor = computedStyle.color;
        if (textColor && textColor.includes('oklch')) {
          el.style.color = BusinessCardsBusinessService.oklchToRgb(textColor);
        }
      }
      
      if (!hasInlineBorder) {
        const borderColor = computedStyle.borderColor;
        if (borderColor && borderColor.includes('oklch')) {
          el.style.borderColor = BusinessCardsBusinessService.oklchToRgb(borderColor);
        }
      }
    });
  }

  private static restoreOriginalStyles(element: HTMLElement, originalStyles: Map<HTMLElement, any>): void {
    const allElements = [element, ...element.querySelectorAll('*')] as HTMLElement[];
    
    allElements.forEach(el => {
      const original = originalStyles.get(el);
      if (original) {
        // Restore the complete CSS text to ensure everything is restored
        el.style.cssText = original.cssText;
      }
    });
  }

  private static convertOklchInString(cssString: string): string {
    // Convert any OKLCH colors found in CSS strings (like gradients)
    return cssString.replace(/oklch\([^)]+\)/g, (match) => {
      return BusinessCardsBusinessService.oklchToRgb(match);
    });
  }

  private static oklchToRgb(oklchColor: string): string {
    // Simple fallback mapping for common OKLCH colors to RGB
    const oklchToRgbMap: { [key: string]: string } = {
      'oklch(0.974 0.044 125.71)': 'rgb(247, 253, 243)',
      'oklch(0.141 0.005 285.823)': 'rgb(35, 35, 37)',
      'oklch(0.989 0.002 286.067)': 'rgb(252, 252, 253)',
      'oklch(0.21 0.006 285.885)': 'rgb(52, 52, 55)',
      'oklch(0.985 0 0)': 'rgb(250, 250, 250)',
      'oklch(0.922 0.006 286.067)': 'rgb(234, 234, 237)',
      'oklch(0.967 0.001 286.375)': 'rgb(246, 246, 247)',
      'oklch(0.552 0.016 285.938)': 'rgb(140, 140, 143)',
      'oklch(0.577 0.245 27.325)': 'rgb(185, 81, 48)',
      'oklch(0.92 0.004 286.32)': 'rgb(233, 233, 236)',
      'oklch(0.705 0.015 286.067)': 'rgb(179, 179, 183)',
      'oklch(0.954 0.077 125.71)': 'rgb(236, 252, 220)',
      'oklch(0.843 0.175 120.76)': 'rgb(186, 232, 172)'
    };
    
    // Try exact match first
    if (oklchToRgbMap[oklchColor]) {
      return oklchToRgbMap[oklchColor];
    }
    
    // If no exact match, try to extract and convert manually or use a fallback
    // For now, return a safe fallback
    if (oklchColor.includes('oklch')) {
      // Extract lightness value to determine if it's light or dark
      const lightnessMatch = oklchColor.match(/oklch\(([\d.]+)/);
      if (lightnessMatch) {
        const lightness = parseFloat(lightnessMatch[1]);
        if (lightness > 0.5) {
          return 'rgb(240, 240, 240)'; // Light fallback
        } else {
          return 'rgb(60, 60, 60)'; // Dark fallback
        }
      }
    }
    
    return oklchColor; // Return original if not OKLCH
  }

  static getTemplateStyles(template: "modern" | "classic" | "minimal" | "eazy" | "bizy") {
    switch (template) {
      case "modern":
        return {
          background: "#667eea",
          color: "#ffffff",
          textColor: "#ffffff"
        };
      case "classic":
        return {
          background: "#ffffff",
          color: "#1f2937",
          border: "1px solid #d1d5db",
          textColor: "#1f2937"
        };
      case "minimal":
        return {
          background: "#f9fafb",
          color: "#374151",
          border: "1px solid #e5e7eb",
          textColor: "#374151"
        };
      case "eazy":
        return {
          background: "#d9f99d",
          color: "#365314",
          border: "1px solid #a3e635",
          textColor: "#365314"
        };
      case "bizy":
        return {
          background: "#ffcc66",
          backgroundColor: "#ffcc66",
          color: "#000000",
          textColor: "#000000"
        };
      default:
        return {
          background: "#ffffff",
          color: "#1f2937",
          textColor: "#1f2937"
        };
    }
  }
}