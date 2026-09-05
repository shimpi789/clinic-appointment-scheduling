# Plan

## 1. How did you break the work into sessions?

I broke the work into focused implementation sessions so that the core scheduling workflow was completed first, followed by supporting features, UI, and final cleanup.

### Session 1 — Setup and architecture
- Created the React client and Express server.
- Connected MongoDB Atlas.
- Set up the project structure and environment configuration.
- Added the initial architecture and planning documentation.

### Session 2 — Authentication and roles
- Added email/password authentication.
- Added JWT-based authentication.
- Implemented FRONT_DESK and PROVIDER roles.
- Added server-side role authorization.

### Session 3 — Database models
- Created models for users, availability slots, appointments, visit notes, appointment history, and alert dismissals.
- Added indexes for important appointment and search queries.

### Session 4 — Availability management
- Added provider availability creation and editing.
- Added archive/restore support.
- Added overlap and booking protections.
- Added recurring weekly availability generation and CSV export.

### Session 5 — Appointment workflow
- Added appointment creation.
- Implemented the required status transitions:
  REQUESTED → CONFIRMED → CHECKED_IN → COMPLETED.
- Added NO_SHOW and cancellation rules.
- Added server-side validation for invalid transitions.

### Session 6 — Care team and visit notes
- Added supporting providers.
- Added provider reassignment for front desk users.
- Added visit notes with author restrictions.
- Added immutable history entries for these actions.

### Session 7 — Appointment finding
- Added server-side patient-name search.
- Added provider, status, and date-range filters.
- Added sorting and pagination with total match counts.

### Session 8 — Dashboard and alerts
- Added dashboard summaries and provider/status breakdowns.
- Added the 8-week no-show rate.
- Added requested-appointment alerts and dismissal/reappearance rules.

### Session 9 — Frontend workflow
- Connected the frontend to the backend APIs.
- Added login and registration screens.
- Added appointment listing, filters, sorting, care-team actions, notes, and history timeline.
- Added availability and dashboard interfaces.

### Session 10 — Rules and authorization audit
- Reviewed server-side permissions and appointment rules.
- Fixed edge cases around provider reassignment, cancellation, alert dismissal, and checked-in appointments.

### Session 11 — Testing and bug fixing
- Planned for batch testing of the complete workflow and role restrictions.
- Fixed issues discovered during development.

### Session 12 — Deployment and submission
- Prepare the production deployment.
- Complete the required documentation.
- Add demo credentials and deployment details.
- Complete SUBMISSION.md.

---

## 2. What order did you build in, and why that order?

I built the application from the backend foundation toward the user-facing workflow.

First, I created the project structure, database connection, authentication, and core data models. These were prerequisites for almost every other feature.

Next, I implemented availability and appointment creation because they form the main scheduling workflow. I then added status transitions, care-team management, visit notes, and immutable history so that appointment actions followed the assignment rules.

After the core workflow was stable, I added search, filtering, sorting, pagination, bulk availability, CSV export, dashboard metrics, and alerts.

Finally, I connected and refined the frontend screens, added registration, reviewed server-side authorization, and prepared the project for testing and deployment.

This order helped reduce rework because the frontend could be built against already-defined API behavior and business rules.

---

## 3. What did you estimate versus what it actually took?

I estimated approximately 12 hours based on the assignment's suggested time limit.

The initial estimate was roughly one hour per implementation session, with the largest amount of time allocated to authentication, appointment rules, availability, history, dashboard/alerts, and frontend integration.

The actual time was somewhat uneven because some features required additional debugging and rule validation, especially server-side authorization, appointment status transitions, provider reassignment, and connecting the frontend to the APIs.

I prioritized completing the core required functionality over spending additional time on optional polish or stretch features.

---

## 4. What did you cut when you ran short?

I prioritized the required scheduling workflow and cut or deferred optional work rather than leaving core requirements incomplete.

The main priorities were:

- Authentication and role-based authorization
- Availability and appointment management
- Appointment status rules
- Care-team management
- Visit notes
- Search, filters, sorting, and pagination
- Bulk availability and CSV export
- Dashboard and alerts
- Immutable appointment history

Optional stretch functionality was not prioritized so that the required functionality could be completed reliably.

I also chose a simple, clean frontend design instead of spending significant time on animations or advanced visual polish. This kept the implementation focused on the scheduling workflow and server-side correctness.