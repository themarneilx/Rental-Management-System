# **Nicarjon Apartment System**

A modern, full-stack rental management solution designed for efficient property administration and tenant convenience. This system features a robust Admin Dashboard for property managers and a dedicated Tenant Portal for residents.

## **🚀 Overview**

The **Nicarjon Apartment System** automates the complexities of rental management. It handles split-period billing, utility calculations (water/electricity), room occupancy tracking, and tenant archives. It uses a custom billing engine to ensure accurate financial records, accounting for previous balances, penalties, and credits.

### **Key Features**

#### **🛡️ Admin Dashboard**

* **Billing Engine:** Automatic calculation of utilities based on meter readings with configurable dynamic rates.
  * Electricity Rate: ₱21.00 / kWh  
  * Water Rate: ₱70.00 / m³  
* **Smart Invoicing:** Handles split billing periods (Rent Period vs. Utility Period) in a single invoice.  
* **Room Management:** Track occupancy status (Vacant, Occupied, Maintenance) automatically.  
* **Tenant Management:** Active tenant tracking with history archival for moved-out residents.  
* **Financial Tracking:** Monitor payments, overdue bills, and revenue reports.

#### **👤 Tenant Portal**

* **Secure Login:** Individual access for residents.  
* **Bill Viewing:** View detailed invoice breakdowns (Rent \+ Utilities \+ Adjustments).  
* **Payment Submission:** Upload proof of payment (bank transfer receipts) directly through the app.  
* **Profile Management:** View lease details and assigned unit information.

## **🛠️ Tech Stack**

This project is built using a modern, type-safe stack:

* **Framework:** [Next.js 16+](https://nextjs.org/) (App Router)  
* **Language:** [TypeScript](https://www.typescriptlang.org/)  
* **Database:** [PostgreSQL](https://www.postgresql.org/)  
* **ORM:** [Drizzle ORM](https://orm.drizzle.team/)  
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)  
* **Icons:** [Lucide React](https://lucide.dev/)  
* **Authentication:** Custom JWT (Access/Refresh Tokens) \+ bcrypt  
* **HTTP Client:** Axios

## **⚙️ Installation & Setup**

### **Prerequisites**

* Node.js (v18 or higher)  
* PostgreSQL Database URL

### **1\. Clone the repository**

git clone \[https://github.com/yourusername/nicarjon-apartment-system.git\](https://github.com/yourusername/nicarjon-apartment-system.git)  
cd nicarjon-apartment-system

### **2\. Install dependencies**

npm install  
\# or  
yarn install

### **3\. Environment Configuration**

Create a .env file in the root directory:  
\# Database  
DATABASE\_URL="postgresql://user:password@localhost:5432/nicarjon\_db"

\# Authentication  
JWT\_SECRET="your-super-secret-jwt-key"  
JWT\_REFRESH\_SECRET="your-super-secret-refresh-key"

\# App  
NEXT\_PUBLIC\_API\_URL="http://localhost:3000/api"  
ALLOWED\_ORIGIN="http://localhost:3000"

### **4\. Database Setup (Drizzle)**

Push the schema to your PostgreSQL database:  
npx drizzle-kit push:pg

### **5\. Run the development server**

npm run dev

Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) with your browser to see the result.

## **🧮 Billing Logic**

The system uses the following formula to calculate the total due for an invoice:  
Total \= Base Rent \+ (Elec Usage × 21.00) \+ (Water Usage × 70.00) \+ Penalty \+ Prev Balance \- Credit

* **Rent Period:** Specifies the month the rent pays for (e.g., February).  
* **Utility Period:** Specifies the date range of the meter reading (e.g., Jan 15 \- Feb 15).  
* **Automation:**  
  * If an invoice is Pending and the Rent Period is in the past, status becomes Overdue.  
  * Previous readings are auto-fetched from the last recorded invoice.

## **📂 Project Structure**

├── src/  
│   ├── app/                 \# Next.js App Router pages  
│   │   ├── (admin)/         \# Protected Admin Routes  
│   │   ├── (tenant)/        \# Protected Tenant Routes  
│   │   └── api/             \# Backend API Endpoints  
│   ├── components/          \# Reusable UI components  
│   ├── db/  
│   │   ├── schema.ts        \# Drizzle ORM Schema  
│   │   └── index.ts         \# DB Connection  
│   ├── lib/  
│   │   ├── auth.ts          \# JWT Utilities  
│   │   └── utils.ts         \# Helper functions  
│   └── middleware.ts        \# Auth & Role protection  
├── public/  
└── drizzle.config.ts        \# Drizzle Configuration

## **🤝 Contributing**

Contributions are welcome\! Please feel free to submit a Pull Request.

## **📄 License**

This project is licensed under the MIT License \-