# Submission

## Links

- **GitHub repository:** https://github.com/shimpi789/clinic-appointment-scheduling
- **Live application:** https://clinic-appointment-scheduling-nine.vercel.app

## Notes for the reviewer

The frontend is deployed on Vercel and the backend is deployed on Render.
The backend uses MongoDB Atlas.

The Render free service may sleep when idle, so the first API request after inactivity may take some time.

## Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Front Desk | frontdesk@clinic.com | Clinic@123 |
| Provider | provider@clinic.com | Clinic@123 |

## Stack

| Layer | What you used | Why |
|-------|---------------|-----|
| Frontend | React + Vite | Simple component-based UI and fast development |
| Backend | Node.js + Express | REST API with clear server-side business rules |
| Database | MongoDB Atlas + Mongoose | Flexible document storage with schema definitions and indexes |
| Hosting | Vercel + Render + MongoDB Atlas | Free deployment for frontend, backend and database |

## Goal checklist

| # | Goal | Status | Notes |
|---|------|--------|-------|
| 1 | Accounts and roles | Done | Front-desk and provider roles with server-side authorization |
| 2 | Appointment slots and booking | Done | Availability creation, booking, editing, archive and restore |
| 3 | Visit notes | Done | Providers can add/edit their own notes and view notes in appointment history |
| 4 | Appointment status workflow | Done | Valid transitions, cancellation rules and no-show timing are enforced server-side |
| 5 | Care team | Done | Scheduling provider plus supporting providers with role-based permissions |
| 6 | Finding appointments | Done | Server-side search, filtering, sorting and pagination with total matches |
| 7 | Bulk availability and CSV | Done | Recurring weekly availability, collision reporting and one-day CSV export |
| 8 | Dashboard | Done | Today's appointments, checked-in, no-shows, upcoming appointments and weekly no-show rate |
| 9 | Immutable history | Done | Status changes, provider changes, cancellations and visit-note events are recorded |
| 10 | Alerts | Done | Requested appointments within 24h, front-desk dismissal and 1-hour reappearance rule |

## How much time did you actually spend?

Approximately 12 hours.

## What would you do next, with another 12 hours?

- Add automated backend/API tests for all role and workflow rules.
- Improve validation and error handling coverage.
- Add more polished responsive UI states and loading feedback.
- Add email/SMS notifications.
- Add stronger user administration and production security controls.

## What are you least happy with in this codebase, and why?

The project was built under a short deadline, so some areas could be refactored further for better reuse and test coverage. In particular, more automated tests around permission checks and appointment state transitions would make the system easier to maintain and safer to change.