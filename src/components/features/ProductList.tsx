import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductListItem } from "./ProductListItem";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  cost: number;
  costCurrency: string;
  marginPercentage: number;
  marginColor: string;
  isActive: boolean;
  companyName: string;
  companyTradingName: string;
  companyLogo: string;
  vendorName?: string;
  formattedCreatedAt: string;
  formattedUpdatedAt: string;
}

interface ProductListProps {
  products: Product[];
  expandedProducts: Set<string>;
  highlightedProductId: string | null;
  onToggleExpansion: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (id: string) => void;
  formatCurrency: (amount: number, currency: string) => string;
  getCompanyName: (companyId: number) => string;
  getVendorName: (vendorId: string | null) => string;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  expandedProducts,
  highlightedProductId,
  onToggleExpansion,
  onToggleStatus,
  onEdit,
  onDelete,
  onDuplicate,
  formatCurrency,
  getCompanyName,
  getVendorName
}) => {
  const getEmptyStateMessage = () => {
    return products.length === 0 ? 'No products yet. Add your first product!' : 'No products match your filters';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Products & Services</CardTitle>
        <CardDescription>Manage your product catalog for invoicing</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {getEmptyStateMessage()}
            </div>
          ) : (
            products.map((product) => (
              <ProductListItem
                key={product.id}
                product={product}
                isExpanded={expandedProducts.has(product.id)}
                isHighlighted={highlightedProductId === product.id}
                onToggleExpansion={onToggleExpansion}
                onToggleStatus={onToggleStatus}
                onEdit={onEdit}
                onDelete={onDelete}
                onDuplicate={onDuplicate}
                formatCurrency={formatCurrency}
                getCompanyName={getCompanyName}
                getVendorName={getVendorName}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};