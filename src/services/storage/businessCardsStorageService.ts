import { BusinessCard } from '@/types/businessCards.types';

export class BusinessCardsStorageService {
  private static readonly STORAGE_KEY = 'app-business-cards';

  static getBusinessCards(): BusinessCard[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (!saved) return [];
      
      const parsed = JSON.parse(saved);
      return parsed.map((card: unknown) => ({
        ...card,
        createdAt: new Date(card.createdAt)
      }));
    } catch (error) {
      console.error('Error loading business cards:', error);
      return [];
    }
  }

  static saveBusinessCards(cards: BusinessCard[]): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cards));
      return true;
    } catch (error) {
      console.error('❌ Failed to save business cards:', error);
      return false;
    }
  }

  static clearBusinessCards(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('❌ Failed to clear business cards:', error);
      return false;
    }
  }
}