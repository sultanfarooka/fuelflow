# Fuel Flow – Filling Station Management System

> A comprehensive application for managing filling stations in Pakistan, covering fuel sales, inventory, accounts, and operations.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Core Modules](#core-modules)
3. [Module 1: User & Access Management](#module-1-user--access-management)
4. [Module 2: Fuel Inventory & Tank Control](#module-2-fuel-inventory--tank-control)
5. [Module 3: Pump & Nozzle Operations](#module-3-pump--nozzle-operations)
6. [Module 4: Shift Management](#module-4-shift-management)
7. [Module 5: Finance & Accounts](#module-5-finance--accounts)
8. [Module 6: Pricing & Rate Management](#module-6-pricing--rate-management)
9. [Module 7: Reporting & Analytics](#module-7-reporting--analytics)
10. [Module 8: Settings & Configuration](#module-8-settings--configuration)
11. [Module 9: Lubricants / Oil Shop](#module-9-lubricants--oil-shop)
12. [Module 10: SMS / Notifications](#module-10-sms--notifications)
13. [Module 11: Subscription & Billing](#module-11-subscription--billing)

---

## Project Overview

**Fuel Flow** is a complete filling station management system designed for the Pakistani market. It enables station owners to manage multiple filling stations, track fuel inventory, handle credit customers (udhaar), manage shift-based operations, and generate comprehensive reports.

### Key Features

- Self-service registration with 14-day free trial
- Monthly/yearly subscription plans (Starter, Professional, Enterprise)
- Multi-station support under single ownership
- Granular role-based access control
- Real-time fuel inventory tracking with dip chart integration
- Nozzle-level sales tracking and shortage management
- Integrated ledger for credit customers and supplier payments
- OGRA-compliant pricing with history logs
- Bilingual support (English & Urdu)

### Target Users

- **Station Owners** – Full control over multiple stations
- **Station Managers** – Day-to-day operations management
- **Nozzlemen/Salesmen** – Shift operations and meter readings
- **Accountants** – Finance and ledger management

---

## Core Modules

|  #  | Module Name                   | Purpose                                                                |
| :-: | :---------------------------- | :--------------------------------------------------------------------- |
|  1  | User & Access Management      | Registration, login, roles, granular permissions, multi-station access |
|  2  | Fuel Inventory & Tank Control | Underground tanks, dip readings, stock levels, fuel receiving          |
|  3  | Pump & Nozzle Operations      | Meter readings, nozzle-level sales, shortage/excess tracking           |
|  4  | Shift Management              | Shift-wise cash collection, handover, nozzleman assignment             |
|  5  | Finance & Accounts            | Credit customers, supplier payables, daily expenses                    |
|  6  | Pricing & Rate Management     | Fuel prices, price history, dealer margins, promotions                 |
|  7  | Reporting & Analytics         | Daily/weekly/monthly reports, dashboards, exports                      |
|  8  | Settings & Configuration      | Station setup, tank/pump config, dip charts, preferences               |
|  9  | Lubricants / Oil Shop         | Oil inventory, sales, stock management                                 |
| 10  | SMS / Notifications           | Alerts for stock, prices, shortages, daily summaries                   |
| 11  | Subscription & Billing        | Trial management, plan tiers, payments, feature gating                 |

---

## Module 1: User & Access Management

### 1.1 Roles & Hierarchy

| Role         | Created By | Capabilities                                         |
| :----------- | :--------- | :--------------------------------------------------- |
| Owner        | System     | Full access, create Managers, configure all settings |
| Manager      | Owner      | Manage shifts, view reports, create other users      |
| Custom Users | Manager    | Configurable granular permissions                    |

### 1.2 Permissions System

- **Granular permissions** – Per-module access control (View / Edit / Delete / No Access)
- Manager can be assigned to **multiple stations**
- Owner sees **consolidated "All Stations" dashboard**

### 1.3 Authentication & Security

| Feature           | Specification                                                          |
| :---------------- | :--------------------------------------------------------------------- |
| Login Methods     | Username/Password + PIN-based quick login                              |
| Password Rules    | Minimum 6 characters, must include numbers                             |
| Session Timeout   | User-configurable idle timeout                                         |
| Password Recovery | Email OTP, SMS OTP, or Owner reset                                     |
| Multi-Device      | Simultaneous login on multiple devices allowed                         |
| Refresh Tokens    | DB-backed; rotation on each refresh; 7-day expiry (configurable later) |
| Session Tracking  | IP, User-Agent, optional DeviceId stored per refresh token for audit   |

### 1.4 Multi-Station Support

- One Owner can manage **multiple filling stations**
- Dashboard shows **all stations' stats** at a glance
- Click on a station to view detailed data
- Each station has **own branding** (name, logo)
- **Data isolation** – Station A cannot see Station B's data (except Owner's consolidated view)

### 1.5 Audit Trail

- **All sensitive actions logged**: price changes, user creation/deletion, stock adjustments, credit entry deletions
- Log retention period: **Owner-configurable**
- Logs include: user, action, timestamp, before/after values

### 1.6 Registration & Onboarding

- **Self-service registration** for station owners (public, no invitation required)
- Multi-step form: owner info → organization name → first station details
- Registration creates organization, owner user, and first station in one step
- **14-day free trial** starts automatically with Professional plan features
- Email verification (future enhancement: SMS OTP)
- After registration, owner is logged in and redirected to the dashboard

---

## Module 2: Fuel Inventory & Tank Control

### 2.1 Fuel Products Supported

- **PMG** – Petrol / Motor Spirit
- **HSD** – High Speed Diesel
- **HOBC** – Hi-Octane Blending Component

### 2.2 Supplier Tracking

- Track purchases from multiple OMCs (PSO, Shell, Total Parco, Attock, etc.)
- Separate purchase history per OMC

### 2.3 Underground Tank Management

| Attribute        | Description                                               |
| :--------------- | :-------------------------------------------------------- |
| Tank Name/Number | Unique identifier (e.g., Tank A, Tank 1)                  |
| Fuel Type        | Assigned product (PMG/HSD/HOBC) – normally not reassigned |
| Capacity         | Maximum capacity in liters                                |
| Dip Chart        | Unique mm-to-liters conversion table per tank             |
| Visual Display   | Show current stock level and **% full**                   |

- Multiple tanks can hold same fuel type – tracked **separately**

### 2.4 Dip Readings

| Feature            | Specification                                                |
| :----------------- | :----------------------------------------------------------- |
| Measurement        | Manual dip stick (mm)                                        |
| Dip Chart          | Upload paper-based chart (manual entry of mm → liters table) |
| Frequency          | Start of shift AND end of shift                              |
| Auto-Calculation   | System calculates liters from dip reading using chart        |
| Variance Threshold | Owner-configurable (e.g., 0.5% or 1% tolerance)              |
| Discrepancy Alert  | Flag when variance exceeds threshold                         |

### 2.5 Fuel Receiving (Tanker Delivery)

**Captured Details:**

- Delivery date/time
- Tanker number / vehicle registration
- Driver name
- Seal numbers (before breaking)
- Quantity ordered vs received
- Dip reading before & after unloading
- **Invoice image upload** (mandatory)

**Short Delivery Handling:**

- System logs the difference
- **Alert sent to Owner**

**Decanting Loss:**

- Owner-configurable expected loss % (e.g., 0.2% evaporation)

---

## Module 3: Pump & Nozzle Operations

### 3.1 Nozzle Setup

| Attribute          | Description                                         |
| :----------------- | :-------------------------------------------------- |
| Nozzle Name/Number | Unique identifier                                   |
| Linked Tank        | Which underground tank supplies this nozzle         |
| Meter Reading Type | Totalizer (cumulative) and/or resettable trip meter |
| Status             | Active / Inactive                                   |

- **Nozzle-level tracking** – Each nozzle tracked separately
- **Multi-product pumps** supported (e.g., Nozzle 1 = Petrol, Nozzle 2 = Diesel on same unit)
- All pumps are **electric**

### 3.2 Meter Reading Entry

| Feature       | Specification                          |
| :------------ | :------------------------------------- |
| Entry By      | Manager or Nozzleman                   |
| Photo Proof   | Optional – upload meter photo          |
| Reading Types | Supports both totalizer and trip meter |

### 3.3 Sales Calculation

- **Formula:** Sales = (Closing Reading – Opening Reading) × Fuel Price
- **Auto-calculated** by system
- **Manual override** allowed in special cases → triggers **alert to Owner**
- **Rate change mid-shift:** Sales split by time and calculated at respective rates

### 3.4 Shortage & Excess Tracking

| Feature           | Specification                                            |
| :---------------- | :------------------------------------------------------- |
| Auto-Calculate    | Yes – system compares cash collected vs calculated sales |
| Tolerance         | **No tolerance** – every rupee difference is flagged     |
| Shortage Recovery | Accumulated in **"balance due" ledger per nozzleman**    |

---

## Module 4: Shift Management

### 4.1 Shift Configuration

| Setting        | Value                                         |
| :------------- | :-------------------------------------------- |
| Shift Duration | Configurable (8 hrs, 12 hrs, custom)          |
| Shifts per Day | Configurable (2 or 3 shifts)                  |
| Shift Names    | Configurable (Morning/Evening/Night or A/B/C) |
| Shift Timing   | Flexible per station                          |

### 4.2 Nozzleman Assignment

- Each nozzleman assigned to **specific nozzles for entire shift**
- Multiple nozzlemen can work same shift – each responsible for their assigned nozzles
- No advance roster – **record who worked after shift ends**

### 4.3 Shift Opening Checklist

- [ ] Opening meter readings (all assigned nozzles)
- [ ] Opening tank dip readings
- [ ] Cash in hand from previous shift

### 4.4 Shift Closing Checklist

- [ ] Closing meter readings
- [ ] Closing tank dip readings
- [ ] Total cash collected
- [ ] Credit sales (udhaar)
- [ ] Card/digital payments
- [ ] Expenses paid during shift

### 4.5 Cash Collection

| Feature            | Specification                                                                  |
| :----------------- | :----------------------------------------------------------------------------- |
| Cash Denominations | Yes – record breakdown (5000s, 1000s, 500s, etc.)                              |
| Payment Methods    | Configurable: Cash, Credit (udhaar), Cards, JazzCash, Easypaisa, Bank Transfer |
| Cash Deposit       | Either daily bank deposit OR kept in safe – configurable                       |

---

## Module 5: Finance & Accounts

### 5.1 Credit Customers (Receivables / Udhaar)

**Customer Types:**

- Individual (personal udhaar)
- Fleet/Corporate (trucking companies, schools, factories)
- Government (police, military vehicles)

**Identification Methods (Initial Phase):**

- Physical slip/chit (signed by authorized person)
- Driver's name and signature

**Future Options:** Plastic cards, vehicle registration lookup

| Feature           | Specification                                       |
| :---------------- | :-------------------------------------------------- |
| Credit Limit      | Configurable per customer                           |
| Billing Cycle     | Configurable (weekly, fortnightly, monthly, custom) |
| Partial Payments  | Yes – track payments and carry forward balance      |
| Interest/Late Fee | No                                                  |

### 5.2 Supplier Payments (Payables)

**Supplier Types:**

- OMC (fuel supplier)
- Carriage contractor (tanker transport)
- Lubricant suppliers
- Utility companies (WAPDA, Sui Gas)
- Others as needed

| Feature       | Specification                               |
| :------------ | :------------------------------------------ |
| Payment Terms | Configurable (advance, on delivery, credit) |
| Payment Proof | Upload receipt/voucher/bank slip image      |

### 5.3 Daily Expenses

**Expense Categories:**

- Salaries / wages
- Electricity bill
- Generator fuel (testing diesel)
- Repairs & maintenance
- Staff tea/food
- Stationery
- _Custom categories can be added_

| Feature             | Specification                  |
| :------------------ | :----------------------------- |
| Entry By            | Any user can add expense entry |
| Approval Required   | No                             |
| Petty Cash Tracking | No                             |

### 5.4 Bank Accounts

- Track deposits to **multiple bank accounts**
- Assign accounts for specific purposes (e.g., OMC payments, salaries)

---

## Module 6: Pricing & Rate Management

### 6.1 Price Configuration

| Feature             | Specification                        |
| :------------------ | :----------------------------------- |
| Price Entry         | Manual                               |
| Price per Station   | Yes – prices can vary by station     |
| Effective Date/Time | Specify when new price takes effect  |
| Price History       | Complete log with dates (for audits) |

### 6.2 Price Change Workflow

| Feature        | Specification                                     |
| :------------- | :------------------------------------------------ |
| Who Can Change | Owner and Manager                                 |
| Confirmation   | Type new price twice to confirm                   |
| Notification   | In-app notification to all Managers and Nozzlemen |

### 6.3 Margins & Discounts

| Feature                   | Specification                                       |
| :------------------------ | :-------------------------------------------------- |
| Dealer Margin             | Track margin per liter (OMC price vs selling price) |
| Nozzleman Commission      | No                                                  |
| Customer-Specific Pricing | Yes – special rates for fleets/corporates           |
| Discount Limits           | No maximum limit                                    |
| Promotional Pricing       | Supported – time-bound promotional rates            |

---

## Module 7: Reporting & Analytics

### 7.1 Daily Reports

**Daily Sales Report includes:**

- Total liters sold (per fuel type)
- Total revenue
- Payment breakdown (cash, credit, card, digital)
- Per-nozzle sales
- Per-nozzleman sales

**Daily Closing Report:**

- Total sales, expenses, cash collected, credit given, net position

**End of Day:** Configurable timing

### 7.2 Inventory Reports

- Current stock per tank
- Liters received, liters sold
- Variance (calculated vs dip)
- **Low stock alerts** when below configurable threshold

### 7.3 Financial Reports

| Report            | Description                                                  |
| :---------------- | :----------------------------------------------------------- |
| Profit & Loss     | Weekly/monthly: revenue, cost of goods, expenses, net profit |
| Receivables Aging | Shows overdue credit with days outstanding                   |
| Payables Report   | Pending supplier payments with due dates                     |

### 7.4 Export & Automation

| Feature           | Specification                            |
| :---------------- | :--------------------------------------- |
| Export Formats    | PDF, Excel (XLSX), Direct Print          |
| Scheduled Reports | Auto-email daily/weekly reports to Owner |

### 7.5 Dashboard Widgets

- **Today's total sales** with comparison (vs yesterday / vs last week)
- **Current stock levels**
- **Recent alerts/notifications**

---

## Module 8: Settings & Configuration

### 8.1 Station Profile

| Field             | Required |
| :---------------- | :------- |
| Station Name      | Yes      |
| Address           | Yes      |
| Phone Number      | Yes      |
| Number of Tanks   | Yes      |
| Number of Nozzles | Yes      |

- Operating hours: **Assumed 24/7**

### 8.2 Tank Configuration

| Attribute         | Description                      |
| :---------------- | :------------------------------- |
| Tank Name/Number  | Unique identifier                |
| Fuel Type         | PMG / HSD / HOBC                 |
| Capacity (liters) | Maximum capacity                 |
| Dip Chart         | Upload unique mm-to-liters table |

### 8.3 Nozzle Configuration

| Attribute             | Description                     |
| :-------------------- | :------------------------------ |
| Nozzle Name/Number    | Unique identifier               |
| Linked Tank           | Which tank supplies this nozzle |
| Initial Meter Reading | Starting totalizer value        |
| Status                | Active / Inactive               |

### 8.4 Dip Chart Management

- Format: **Paper-based** (manual entry of mm → liters table)
- Each tank has a **unique dip chart**

### 8.5 System Preferences

| Setting           | Value                       |
| :---------------- | :-------------------------- |
| Currency Format   | Pakistani (Rs. 1,25,000)    |
| Language          | English & Urdu              |
| Date Format       | DD/MM/YYYY                  |
| Fiscal Year Start | Custom (Owner-configurable) |

### 8.6 Backup & Data

- **Auto-backup:** Server-side daily backup
- **Data security:** Application ensures data is always backed up

---

## Module 9: Lubricants / Oil Shop

### 9.1 Product Inventory

**Product Types:**

- Engine oils (various grades: 20W-50, 10W-40, etc.)
- Gear oils
- Brake fluid
- Coolant
- Filters (oil, air, fuel)
- Other accessories (wipers, bulbs, etc.)

**Brands:** Multiple brands supported (ZIC, Castrol, Shell Helix, PSO Deo, etc.)

**Stock Tracking per Product:**

- Current quantity
- Purchase price (cost)
- Selling price
- Minimum stock level (for alerts)

### 9.2 Sales

| Feature         | Specification                                       |
| :-------------- | :-------------------------------------------------- |
| Sales Recording | Configurable (separate or combined with fuel shift) |
| Credit Sales    | Yes – same ledger as fuel credit customers          |
| Receipts        | Generate receipt/invoice for purchases              |
| Discounts       | No discounts allowed                                |
| Price Updates   | Owner or Manager can update                         |

### 9.3 Stock Management

**Stock Receiving captures:**

- Product name
- Quantity
- Purchase price
- Supplier name
- Invoice number/image

**Alerts:** Low stock alert when quantity falls below minimum

### 9.4 Reporting

- Daily sales report
- Stock inventory report
- Profit margin per product
- **Combined with fuel P&L** for overall station profitability

---

## Module 10: SMS / Notifications

### 10.1 Notification Events

| Event               | Triggered When                      |
| :------------------ | :---------------------------------- |
| Low Stock           | Tank falls below threshold          |
| Fuel Delivery       | Tanker delivery received            |
| Price Change        | Fuel price updated                  |
| Shift Started/Ended | Shift opens or closes               |
| Large Credit Sale   | Credit sale above configured amount |
| Payment Received    | Credit customer makes payment       |
| Shortage Detected   | Nozzleman shortage at shift end     |
| Daily Summary       | End of day report                   |
| System Errors       | Any system failures                 |

### 10.2 Recipients

| Role      | Receives                                |
| :-------- | :-------------------------------------- |
| Owner     | All critical alerts                     |
| Manager   | Operational alerts for their station(s) |
| Nozzleman | Own shift-related notifications only    |

### 10.3 Notification Channels

- **Configurable per user:** In-app, SMS, Email, WhatsApp
- SMS provider: **Owner-configurable** (Telenor, Jazz, custom API)
- SMS cost control: Owner can enable/disable SMS per alert type

### 10.4 Notification Behavior

| Feature       | Specification                      |
| :------------ | :--------------------------------- |
| Quiet Hours   | Not supported                      |
| Repeat Alerts | Once only (no repeated reminders)  |
| Read Receipts | Not initially (future enhancement) |

### 10.5 Summary Reports

- **Daily summary** notification to Owner
- **Weekly digest** with performance across all stations

---

## Module 11: Subscription & Billing

### 11.1 Subscription Plans

| Plan         | Stations  | Users     | Price (Monthly) | Price (Yearly) | Features                                        |
| :----------- | :-------- | :-------- | :-------------- | :------------- | :---------------------------------------------- |
| Starter      | 1         | 5         | TBD             | TBD (~17% off) | Core modules only                               |
| Professional | 3         | 15        | TBD             | TBD (~17% off) | All modules + SMS + report exports              |
| Enterprise   | Unlimited | Unlimited | TBD             | TBD (~17% off) | Everything + priority support + custom branding |

- Prices to be finalized based on market research
- Annual billing gives approximately 2 months free (~17% discount)

### 11.2 Trial Period

- **Duration**: 14 days from registration
- **Plan**: Professional features (so users experience the full product)
- **Limits**: 1 station, 2 users (owner + 1 manager)
- **Expiry**: Account goes to read-only mode (can view data, cannot create/edit)
- **No credit card required** to start trial

### 11.3 Payment & Verification

| Feature         | Specification                                          |
| :-------------- | :----------------------------------------------------- |
| Payment Methods | Bank transfer (v1), JazzCash/Easypaisa (v2)            |
| Verification    | Manual — admin reviews uploaded receipt and approves   |
| Activation      | Subscription activates only after payment is verified  |
| Grace Period    | 3 days after expiry before read-only mode              |
| Currency        | PKR (Pakistani Rupees)                                 |
| Receipts        | Upload bank transfer receipt image as proof of payment |

### 11.4 Feature Gating

- **Station limit**: Cannot create more stations than plan allows
- **User limit**: Cannot create more users than plan allows
- **Module access**: Certain modules (SMS, Lubricants, Report Export) restricted by plan
- **Enforcement**: Enforced at both API level and UI level
- **Upgrade prompts**: Locked features show "Upgrade to unlock" with link to subscription page

### 11.5 Billing History

- View all past payments with status (pending, verified, rejected)
- Download receipts
- View subscription timeline (trial → active → renewed)

---

## Use Cases Summary

### Owner Use Cases

1. Register new account with first station (trial)
2. View subscription status and plan details
3. Submit payment proof for subscription
4. Upgrade/downgrade plan
5. View consolidated dashboard for all stations
6. Add/remove stations
7. Create/manage Managers
8. Set prices per station
9. Configure credit limits and billing cycles
10. View all reports (sales, P&L, receivables, payables)
11. Configure system settings and preferences
12. Receive all critical alerts

### Manager Use Cases

1. Open/close shifts
2. Assign nozzlemen to nozzles
3. Enter/verify meter readings
4. Record fuel deliveries
5. Manage credit customers
6. Add daily expenses
7. View station reports
8. Update prices (with Owner notification)

### Nozzleman Use Cases

1. View assigned shift and nozzles
2. Enter opening/closing meter readings
3. Record sales (cash/credit)
4. Submit cash collection
5. View own balance due (shortages)

---

## Technical Considerations

### Platform

- **Web Application** (responsive for desktop and tablet)
- **Mobile App** (future phase – for nozzleman quick entry)

### Backend Architecture

- **Clean Architecture** — 4-layer structure (Domain, Application, Infrastructure, Api)
- **CQRS + MediatR** — Commands and queries are dispatched via MediatR; controllers stay thin and handlers contain business logic
- **Result pattern** — Operations return `Result<T>` for explicit success/failure handling

### Data & Security

- Server-side database with daily auto-backup
- Role-based access control
- Audit trail for all sensitive operations
- Secure authentication with session management

### Localization

- Bilingual: English and Urdu
- Pakistani date format (DD/MM/YYYY)
- Pakistani currency format (Rs. with lakhs notation)

---

_Document Version: 1.2_  
_Created: February 2026_  
_Last Updated: 2026-02-10_  
_Project: Fuel Flow – Filling Station Management System_
