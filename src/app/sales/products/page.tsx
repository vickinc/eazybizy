"use client";

import React, { Suspense } from "react";
import { ProductsPageContent } from "./ProductsPageContent";
import { LoadingScreen } from "@/components/ui/LoadingScreen";

function ProductsPageFallback() {
  return <LoadingScreen />;
}

export default function ProductListPage() {
  return (
    <Suspense fallback={<ProductsPageFallback />}>
      <ProductsPageContent />
    </Suspense>
  );
}