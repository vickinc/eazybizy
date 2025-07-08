# Product Requirements Document: Corporate Management SaaS

## 1. Introduction
This is a web-based Software-as-a-Service (SaaS) platform designed for entrepreneurs and business owners managing multiple companies. It provides a centralized, user-friendly hub to organize company information, manage corporate schedules, track finances, and generate key business assets. By integrating these functions into a single dashboard, the platform aims to dramatically improve administrative efficiency and provide clear, actionable insights across an owner's entire portfolio.

## 2. Goals and Objectives
**Primary Goal**: Provide entrepreneurs with a single, elegant platform to manage the core administrative, scheduling, and financial data for all their companies.

**Objectives**:
- Centralize all core company data for easy access and management.
- Provide a unified corporate calendar to track events, deadlines, and reminders across all entities.
- Streamline the creation of essential business documents like invoices and business cards.
- Offer simple yet powerful financial tracking, from basic accounting to SaaS-specific metrics (ARR).
- Deliver illustrative company valuations to help owners track growth and performance.
- Ensure a secure, intuitive, and aesthetically pleasing user experience, built with modern tools.

## 3. Target Audience
**Primary**: Entrepreneurs and small business owners who own and operate multiple distinct companies, particularly in tech, consulting, and holding structures.

**Characteristics**: Time-constrained, value efficiency and design, need high-level insights without the complexity of full-scale ERP systems.

## 4. UI/UX and Technical Framework
**UI Framework**: The entire user interface will be built using shadcn/ui, ensuring a modern, clean, and accessible design system with a focus on component-based architecture for consistency and scalability.

**Core Principles**: The UX will prioritize simplicity, clarity, and efficiency. Minimize clicks and use intelligent defaults to create a fast and intuitive workflow.

## 5. Phased Rollout Plan
The project will be developed in phases to deliver value quickly and build upon a solid foundation.

### Phase 1: The Foundation (Core Data & Scheduling)
- Secure User Authentication
- Company Data (List of Companies)
- Corporate Calendar (Events, Reminders, Notifications)
- Corporate Notes
- Business Card Generation

### Phase 2: The Financial Engine (Monetization & Tracking)
- Invoice Generation
- Simplified Accounting
- Templates (initial focus on invoice templates)

### Phase 3: Advanced Insights (Growth & Portfolio View)
- Virtual Holding (Combined Financials)
- Company ARR Dashboard
- Company Valuation (Standalone & Combined)

## 6. Product Features (Detailed by Phase)

### Phase 1: The Foundation

#### 6.1. User Authentication
**Description**: Secure user registration and login.

**Requirements**:
- Email/password registration, secure login, password recovery.

#### 6.2. Company Data (Company Management)
**Description**: A central repository for all company information.

**Requirements**:
- Add, edit, view, and delete company profiles.
- Data fields: Legal Name, Trading Name, Registration No., Address, Logo, Industry, etc.
- A dashboard view listing all companies.

**User Story**:
As an entrepreneur, I want to add all my companies with their key legal and contact details so I have a single source of truth.

#### 6.3. Corporate Calendar
**Description**: A unified calendar to manage events and deadlines across all companies.

**Requirements**:
- Visual calendar with Month, Week, and Day views.
- Create events (e.g., "Board Meeting," "Product Launch").
- Assign an event to one or multiple companies.
- Set deadlines (e.g., "Tax Filing Due," "License Renewal").
- Configure reminders for upcoming events/deadlines.
- Receive notifications (in-app and via email).
- Filter calendar view by company.

**User Story**:
As a manager of three companies, I want to view all my tax deadlines, contract renewals, and board meetings on a single calendar to ensure I never miss an important date.

#### 6.4. Corporate Notes
**Description**: A simple, organized note-taking feature within the platform.

**Requirements**:
- Create, edit, and delete notes.
- Associate each note with a specific company.
- Simple rich-text editor (bold, italics, lists).
- Search functionality to find notes by title or content.

**User Story**:
As an owner, I want to jot down notes from a meeting about Company A and easily retrieve them later by searching for that company.

#### 6.5. Business Card Generation
**Description**: A tool to quickly generate digital and print-ready business cards using company data.

**Requirements**:
- Select the company to auto-populate its logo, name, and address.
- Input individual details (Name, Title, Email, Phone, Website).
- Choose from a small selection of clean, professional templates (built-in shadcn style).
- Generate and download the business card as a high-quality PNG or a print-ready PDF.

**User Story**:
As a startup founder, I just hired a new salesperson and I want to generate a professional digital business card for them in under a minute.

### Phase 2: The Financial Engine

#### 6.6. Invoice Generation
**Description**: Create and manage professional invoices for any company.

**Requirements**:
- Builds on the features from the previous PRD (client management, tax, PDF download, status tracking).
- New: Ability to select and apply a pre-saved design from the "Templates" module.

**User Story**:
As a consultant, I want to bill a client from my consulting firm, using my standard invoice template, and track when it has been paid.

#### 6.7. Simplified Accounting
**Description**: A straightforward system for tracking income and expenses.

**Requirements**:
- Manual entry of income and expenses with categorization.
- Generate simplified Profit & Loss statements.
- Visualize expense breakdowns by category.

**User Story**:
As a business owner, I want to log all my revenues and costs for my e-commerce store to understand its monthly profitability.

#### 6.8. Templates
**Description**: A library for creating and storing reusable document templates.

**Requirements**:
- V1 (Phase 2): Focus on creating and managing different invoice design templates.
- V2 (Future): Expand to allow users to create/store simple text templates (e.g., for NDAs, meeting minutes) or upload their own files (.docx, etc.).

**User Story**:
As an agency owner, I want to create different invoice layouts for my various service types so I can maintain a consistent brand image.

### Phase 3: Advanced Insights

#### 6.9. Virtual Holding
**Description**: Group companies to view their combined financial performance.

**Requirements**:
- Create named groups of companies.
- View aggregated Profit & Loss and expense breakdowns for the group.
- Handle basic currency conversion with user-defined rates.

**User Story**:
As an investor, I want to group my real estate companies into a "Property Portfolio" to see the combined revenue and expenses.

#### 6.10. Company ARR Dashboard
**Description**: A dedicated dashboard for tracking Annual Recurring Revenue (ARR) and related SaaS metrics.

**Requirements**:
- Input fields within the accounting module for Monthly Recurring Revenue (MRR), New MRR, and Churned MRR.
- A dedicated dashboard per SaaS company showing:
  - Current ARR (MRR * 12).
  - ARR Growth Rate (MoM, YoY).
  - Net MRR Churn Rate.
  - Simple charts visualizing ARR trends over time.

**User Story**:
For my SaaS startup, I want to go to one dashboard and immediately see our current ARR and how it's trending, so I can report to my investors.

#### 6.11. Company Valuation
**Description**: An illustrative tool to estimate company valuation based on financial data.

**Requirements**:
- User can select a valuation method (e.g., Revenue Multiple, SDE Multiple).
- User inputs the multiplier (e.g., 5x for a 5x revenue multiple).
- The tool pulls financial data (Total Revenue, or a calculated Seller's Discretionary Earnings) from the accounting module.
- Displays an estimated valuation: Financial Metric * Multiplier.
- Can be calculated for a standalone company or a combined Virtual Holding.
- Disclaimer: A clear and prominent disclaimer must be displayed stating that this is a simplified estimate for illustrative purposes and not a certified financial valuation.

**User Story**:
As an entrepreneur, I want to apply a standard industry multiple to my company's revenue to get a rough, back-of-the-napkin estimate of its value and track how that changes over time.