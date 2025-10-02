# 🚗 Online Vehicle Rental System

**🔑 Admin Login (for testing)**  
```
Email: admin@example.com  
Password: Admin@123
```

---

## 📌 Project Overview
The Online Vehicle Rental System is a full-stack MERN application designed to simplify the process of renting vehicles.  
Users can browse available vehicles, book rentals, make payments securely, and share reviews.  
Admins can manage vehicle listings, bookings, and user accounts through a dedicated dashboard.  

---

## ✨ Features Implemented

### 🔑 Authentication & User Accounts
- Secure **user registration and login** system using JWT.  
- Passwords are hashed and stored securely.  
- Authenticated users can access a personal dashboard.  
- Users can manage their bookings, payment history, and reviews.  

### 🚙 Vehicle Listings
- Vehicle listing page displays all available vehicles.  
- Each vehicle includes:
  - Make, model, year
  - Price per day
  - Availability status
  - High-quality images and description  
- Vehicle detail pages show extended information with booking options.  

### 📅 Booking Management
- Calendar integration using **react-day-picker** to select rental dates.  
- Backend validation prevents **double bookings** for the same vehicle.  
- Users can **modify or cancel** their bookings through the dashboard.  
- Booking confirmation emails are triggered via the backend (basic setup implemented).  

### 💳 Payment Processing
- Integrated **Razorpay** as a secure payment gateway.  
- Payments are tied to booking records in the database.  
- Users can view their **payment history** in the dashboard.  

### ⭐ User Reviews
- Users can submit **reviews and ratings** for vehicles they have rented.  
- Reviews are displayed on vehicle detail pages for transparency.  
- Basic review submission flow is implemented (no moderation system yet).  

### 👤 Admin Features
- **Admin dashboard** for managing:
  - Vehicle listings (add/update/remove)  
  - User accounts  
  - Bookings overview  
- Pre-configured admin account (see credentials above).  

---

## 🛠️ Tech Stack

### Frontend
- React (Vite)  
- TailwindCSS for styling  
- React Router for navigation  

### Backend
- Node.js + Express.js  
- MongoDB + Mongoose ORM  
- JWT for authentication  
- Nodemailer for email handling  

### Payments
- Razorpay integration for rental payments  

---

## 🚀 Deployment
- **Frontend**: Deployable on [Netlify](https://www.netlify.com)  
- **Backend**: Deployable on [Render](https://www.render.com)  
- Environment variables required:
  - `MONGODB_URI` – MongoDB connection string  
  - `JWT_SECRET` – secret for authentication  
  - `RAZORPAY_KEY_ID` and `RAZORPAY_SECRET` – payment keys  
  - `SMTP_*` – for email notifications  

---

## 📂 Project Setup

### Frontend
```bash
cd myvehiclerental
npm install
npm run dev
```

### Backend
```bash
cd server
npm install
npm run dev
```

---

## 🧪 Test Admin Account
For testing purposes, use the following admin credentials:

```
Email: admin@example.com
Password: Admin@123
```

---

## 📋 Notes
- Only core features are implemented as of now (listings, bookings, payments, reviews, admin dashboard).  
- Features like **maintenance records, review moderation, detailed invoices, and advanced reporting** are not yet implemented.  
- This project is built strictly for learning and assessment purposes.  
