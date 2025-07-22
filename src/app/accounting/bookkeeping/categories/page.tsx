import { Metadata } from 'next';
import CategoriesClient from './CategoriesClient';

export const metadata: Metadata = {
  title: 'Chart of Accounts | EazyBizy',
  description: 'Manage your accounting categories and financial structure',
};

export default function CategoriesPage() {
  return <CategoriesClient />;
}