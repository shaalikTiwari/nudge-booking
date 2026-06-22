# Nudge — WhatsApp Appointment Booking Platform

A multi-tenant SaaS booking platform for small service businesses (salons, clinics, gyms, tutors). Each business gets their own account, a unique public booking page they can share with customers, instant WhatsApp confirmations on every booking, and automated day-before reminders — all without any manual work.

## How it works

1. A business registers at nudge-booking.vercel.app and gets a unique booking link (e.g. `/book/priya-salon`)
2. They add their services to their dashboard
3. They share their booking link with customers
4. Customers book a slot — get an instant WhatsApp confirmation
5. The next day, Nudge automatically sends a reminder to every customer with an appointment the following day

## Features
- Multi-tenant: unlimited businesses, each fully isolated
- JWT authentication for business owners
- Per-business configurable services, working hours, and slot lengths
- Public booking page per business at `/book/:slug`
- Instant WhatsApp confirmation on booking (Twilio)
- Automated day-before WhatsApp reminders (node-cron)
- Admin dashboard: view, complete, or cancel appointments
- Double-booking prevention

## Tech stack
- **Frontend:** React (Vite), Tailwind CSS, React Router
- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT (jsonwebtoken), bcryptjs
- **Messaging:** Twilio WhatsApp API
- **Scheduling:** node-cron
- **Deployment:** Vercel (frontend), Render (backend), MongoDB Atlas

## Live demo
- App: https://nudge-booking.vercel.app
- Demo booking page: https://nudge-booking.vercel.app/book/nudge-demo
- API: https://nudge-booking.onrender.com

## Local setup
1. Clone the repo
2. `cd backend` → `npm install` → copy `.env.example` to `.env` and fill in values → `npm run dev`
3. `cd frontend` → `npm install` → set `VITE_API_URL` in `.env` → `npm run dev`

---
Built by Shaalik Tiwari