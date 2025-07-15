"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import Users from "lucide-react/dist/esm/icons/users";
import Calculator from "lucide-react/dist/esm/icons/calculator";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Shield from "lucide-react/dist/esm/icons/shield";
import Zap from "lucide-react/dist/esm/icons/zap";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Star from "lucide-react/dist/esm/icons/star";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      icon: Building2,
      title: "Company Management",
      description: "Manage multiple companies with ease. Track registration details, business licenses, and key information.",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: Users,
      title: "Sales & Client Management",
      description: "Manage products, vendors, clients, and invoices all in one place. Streamline your sales process.",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: Calculator,
      title: "Accounting & Bookkeeping",
      description: "Complete accounting solution with journal entries, transactions, and financial reporting.",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: TrendingUp,
      title: "Financial Reporting",
      description: "Generate comprehensive financial reports, profit & loss statements, and balance sheets.",
      color: "bg-orange-100 text-orange-600"
    }
  ];

  const benefits = [
    "Centralized business management",
    "Professional financial reporting",
    "Streamlined client relationships",
    "Automated bookkeeping processes",
    "Real-time business insights",
    "Secure data management"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-lime-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-lime-100 rounded-lg">
                <Building2 className="h-8 w-8 text-lime-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">EazyBizy</h1>
                <p className="text-sm text-gray-600">Business Management Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="outline" className="hidden sm:inline-flex">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-lime-600 hover:bg-lime-700">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6">
            <Badge className="bg-lime-100 text-lime-800 hover:bg-lime-200">
              <Star className="h-4 w-4 mr-1" />
              New Business Management Platform
            </Badge>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-8">
            Manage Your Business
            <span className="text-lime-600 block">Made Easy</span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Streamline your business operations with our comprehensive platform. 
            Manage companies, sales, accounting, and financials all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-lime-600 hover:bg-lime-700 text-lg px-8 py-6">
                Start Free Trial
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                Sign In to Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Run Your Business
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform provides all the tools you need to manage your business efficiently and professionally.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className={`p-3 rounded-lg w-fit ${feature.color}`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Why Choose EazyBizy?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Built for entrepreneurs managing multiple businesses, our platform combines 
                powerful features with intuitive design to help you succeed.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-5 w-5 text-lime-600 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <Card className="p-6">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">Secure</h3>
                      <p className="text-sm text-gray-600">Bank-level security</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center space-x-3">
                    <Zap className="h-8 w-8 text-yellow-600" />
                    <div>
                      <h3 className="font-semibold">Fast</h3>
                      <p className="text-sm text-gray-600">Lightning speed</p>
                    </div>
                  </div>
                </Card>
              </div>
              <div className="space-y-4 mt-8">
                <Card className="p-6">
                  <div className="flex items-center space-x-3">
                    <Users className="h-8 w-8 text-green-600" />
                    <div>
                      <h3 className="font-semibold">Collaborative</h3>
                      <p className="text-sm text-gray-600">Team-friendly</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                    <div>
                      <h3 className="font-semibold">Scalable</h3>
                      <p className="text-sm text-gray-600">Grows with you</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-lime-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-lime-100 mb-8 max-w-2xl mx-auto">
            Join thousands of entrepreneurs who trust EazyBizy to manage their business operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-lime-600 hover:bg-gray-100 text-lg px-8 py-6">
                Get Started Free
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-lime-600 text-lg px-8 py-6">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="p-2 bg-lime-100 rounded-lg">
                <Building2 className="h-6 w-6 text-lime-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">EazyBizy</h3>
                <p className="text-gray-400 text-sm">Business Management Platform</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400 text-sm">
                © 2024 EazyBizy. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}