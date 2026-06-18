# Nudge — Appointment Booking with Automated WhatsApp Reminders

A full-stack booking system built for small service businesses (salons, clinics, gyms, tutors) that manage appointments manually and forget to follow up with customers. Customers book a slot through a simple public page; the business gets an instant WhatsApp confirmation, and a reminder goes out automatically the day before — no manual tracking required.

## Features
- Public booking page with live available time slots
- Instant WhatsApp confirmation on booking (via Twilio)
- Automated day-before WhatsApp reminders (cron job)
- Lightweight admin dashboard to manage appointments and services
- Conflict prevention for double-booked slots

## Tech stack
- **Frontend:** React (Vite), Tailwind CSS, React Router
- **Backend:** Node.js, Express, MongoDB (Mongoose)
- **Messaging:** Twilio WhatsApp API
- **Scheduling:** node-cron

## Project structure
\`\`\`
nudge-booking/
├── backend/   — Express API, MongoDB models, WhatsApp + reminder logic
└── frontend/  — React booking page + admin dashboard
\`\`\`

## Running locally
1. Clone the repo
2. In `backend/`: `npm install`, copy `.env.example` to `.env` and fill in your MongoDB Atlas URI, Twilio credentials, and admin passcode, then `npm run dev`
3. In `frontend/`: `npm install`, set `VITE_API_URL` in `.env` to your backend's URL, then `npm run dev`

## Live demo
_Coming soon_

---
Built by Shaalik Tiwari.