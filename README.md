# **Rental-Management-System**

A modern, full-stack rental management solution designed for efficient property administration and tenant convenience. This system features a robust Admin Dashboard for property managers and a dedicated Tenant Portal for residents.

## **Overview**

The **Rental-Management-System** automates the complexities of rental management. It handles split-period billing, utility calculations (water/electricity), room occupancy tracking, and tenant archives. It uses a custom billing engine to ensure accurate financial records, accounting for previous balances, penalties, and credits.

### **Key Features**

#### ** Admin Dashboard** (`/adminlog`)
* **Billing Engine:** Automatic calculation of utilities based on meter readings with configurable dynamic rates.
  * Default Electricity Rate: ₱21.00 / kWh
  * Default Water Rate: ₱70.00 / m³
* **Smart Invoicing:** Handles split billing periods (Rent Period vs. Utility Period) in a single invoice.
* **Room Management:** Track occupancy status (Vacant, Occupied, Maintenance) automatically.
* **Tenant Management:** Active tenant tracking with history archival for moved-out residents.
* **Financial Tracking:** Monitor payments, overdue bills, and revenue reports.
* **Security:** Role-based access control (Super Admin, Property Manager, Billing Admin).

#### ** Tenant Portal** (`/login`)
* **Secure Login:** Individual access for residents.
* **Bill Viewing:** View detailed invoice breakdowns (Rent + Utilities + Adjustments).
* **Payment Submission:** Upload proof of payment (bank transfer receipts) directly through the app (Integrated with ImgBB).
* **Profile Management:** View lease details and assigned unit information.

## ** Tech Stack**

This project is built using a modern, type-safe stack:

* **Framework:** [Next.js 16+](https://nextjs.org/) (App Router)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Database:** [PostgreSQL](https://www.postgresql.org/) (Neon / Serverless compatible)
* **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Authentication:** Custom JWT (`jose`) + `bcryptjs`
* **Data Fetching:** SWR + Native Fetch
* **Email:** Nodemailer
* **File Storage:** ImgBB API

## ** Installation & Setup**

### **Prerequisites**

* Node.js (v18 or higher)
* PostgreSQL Database URL
* ImgBB API Key

### **1. Clone the repository**

```bash
git clone https://github.com/themarneilx/Rental-Management-System.git
cd Rental-Management-System
```

### **2. Install dependencies**

```bash
npm install
# or
yarn install
```

### **3. Environment Configuration**

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# Authentication
AUTH_SECRET="your-super-secret-jwt-key"

# Third Party Services
IMGBB_API_KEY="your-imgbb-api-key"

# App
NEXT_PUBLIC_API_URL="http://localhost:3000/api"
```

### **4. Database Setup (Drizzle)**

Push the schema to your PostgreSQL database:

```bash
npx drizzle-kit push
```

### **5. Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## ** Billing Logic**

The system uses the following formula to calculate the total due for an invoice:
`Total = Base Rent + (Elec Usage × Rate) + (Water Usage × Rate) + Penalty + Prev Balance - Credit`

* **Rent Period:** Specifies the month the rent pays for (e.g., February).
* **Utility Period:** Specifies the date range of the meter reading (e.g., Jan 15 - Feb 15).
* **Automation:**
  * If an invoice is Pending and the Rent Period is in the past, status becomes Overdue.
  * Previous readings are auto-fetched from the last recorded invoice.

## ** Project Structure**

```
src/
├── app/                 # Next.js App Router pages
│   ├── admin/           # Protected Admin Routes & Dashboard
│   ├── adminlog/        # Admin Login Page
│   ├── login/           # Tenant Login Page
│   ├── tenant/          # Protected Tenant Routes & Dashboard
│   └── api/             # Backend API Endpoints
├── components/          # Reusable UI components
├── db/
│   ├── schema.ts        # Drizzle ORM Schema
│   └── index.ts         # DB Connection
├── lib/
│   ├── auth.ts          # JWT Utilities
│   ├── imgbb.ts         # Image Upload Service
│   └── utils.ts         # Helper functions
└── middleware.ts        # Auth & Role protection
```

## ** Contributing**

Contributions are welcome! Please feel free to submit a Pull Request.

## **📄 License**

This project is licensed under the MIT License
