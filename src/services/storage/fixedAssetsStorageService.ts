import { FixedAsset } from '@/types/fixedAssets.types';

export class FixedAssetsStorageService {
  private static readonly STORAGE_KEY = 'app-fixed-assets';
  private static readonly TRANSACTIONS_KEY = 'app-fixed-asset-transactions';

  private static isLocalStorageAvailable(): boolean {
    try {
      return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  static getAssets(): FixedAsset[] {
    if (!this.isLocalStorageAvailable()) {
      return [];
    }
    
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading fixed assets from localStorage:', error);
      return [];
    }
  }

  static saveAssets(assets: FixedAsset[]): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(assets));
    } catch (error) {
      console.error('Error saving fixed assets to localStorage:', error);
    }
  }

  static addAsset(asset: FixedAsset): void {
    const assets = this.getAssets();
    assets.unshift(asset); // Add new assets at the beginning
    this.saveAssets(assets);
  }

  static updateAsset(updatedAsset: FixedAsset): void {
    const assets = this.getAssets();
    const index = assets.findIndex(asset => asset.id === updatedAsset.id);
    
    if (index !== -1) {
      assets[index] = updatedAsset;
      this.saveAssets(assets);
    }
  }

  static deleteAsset(id: string): void {
    const assets = this.getAssets();
    const filteredAssets = assets.filter(asset => asset.id !== id);
    this.saveAssets(filteredAssets);
  }

  static getAssetByCode(code: string): FixedAsset | null {
    const assets = this.getAssets();
    return assets.find(asset => asset.code === code) || null;
  }

  static getAssetById(id: string): FixedAsset | null {
    const assets = this.getAssets();
    return assets.find(asset => asset.id === id) || null;
  }

  static isCodeUnique(code: string, excludeId?: string): boolean {
    const assets = this.getAssets();
    return !assets.some(asset => 
      asset.code === code && asset.id !== excludeId
    );
  }

  static getActiveAssets(): FixedAsset[] {
    return this.getAssets().filter(asset => asset.isActive && asset.status === 'active');
  }

  static getAssetsByCategory(category: string): FixedAsset[] {
    return this.getAssets().filter(asset => asset.category === category);
  }

  static getAssetsByLocation(location: string): FixedAsset[] {
    return this.getAssets().filter(asset => asset.location === location);
  }

  static getAssetsByDepartment(department: string): FixedAsset[] {
    return this.getAssets().filter(asset => asset.department === department);
  }

  static clearAllAssets(): void {
    if (!this.isLocalStorageAvailable()) {
      return;
    }
    
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.TRANSACTIONS_KEY);
    } catch (error) {
      console.error('Error clearing fixed assets from localStorage:', error);
    }
  }

  static getAssetsCount(): number {
    return this.getAssets().length;
  }

  static hasInitialData(): boolean {
    return this.getAssetsCount() > 0;
  }

  // Helper method to get all unique locations
  static getAllLocations(): string[] {
    const assets = this.getAssets();
    const locations = assets
      .map(asset => asset.location)
      .filter((location): location is string => !!location);
    return [...new Set(locations)].sort();
  }

  // Helper method to get all unique departments
  static getAllDepartments(): string[] {
    const assets = this.getAssets();
    const departments = assets
      .map(asset => asset.department)
      .filter((dept): dept is string => !!dept);
    return [...new Set(departments)].sort();
  }

  // Helper method to backup data
  static exportData(): string {
    const assets = this.getAssets();
    return JSON.stringify({ assets, exportDate: new Date().toISOString() }, null, 2);
  }

  // Helper method to import data
  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      if (data.assets && Array.isArray(data.assets)) {
        this.saveAssets(data.assets);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing fixed assets data:', error);
      return false;
    }
  }
}