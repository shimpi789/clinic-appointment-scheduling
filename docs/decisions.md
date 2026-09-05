# Decisions

## Decision 1 — React + Express + MongoDB

- **Chose:** React for the frontend, Express/Node.js for the API, and MongoDB with Mongoose for persistence.
- **Rejected:** A full-stack framework or relational database setup.
- **Why:** This stack allowed the application to be split cleanly into a client and REST API while keeping the data model flexible for appointments, care teams, notes, alerts, and immutable history.

## Decision 2 — JWT authentication with server-side role authorization

- **Chose:** JWT-based authentication with explicit FRONT_DESK and PROVIDER roles enforced by backend middleware.
- **Rejected:** Relying only on frontend route protection or storing authorization decisions only in the browser.
- **Why:** The assignment explicitly requires server-side enforcement. Frontend restrictions improve the user experience, but the API must remain the source of truth for permissions.

## Decision 3 — Store availability slots separately from appointments

- **Chose:** Keep `Slot` and `Appointment` as separate models, with an appointment referencing its slot.
- **Rejected:** Storing availability and appointment information entirely inside one appointment document.
- **Why:** This makes availability management easier, allows unbooked slots to be edited or archived, and preserves the relationship between the original scheduling slot and the resulting appointment.

## Decision 4 — Archive availability instead of deleting it

- **Chose:** Use an `archived` flag on availability slots and provide archive/restore operations.
- **Rejected:** Permanently deleting unused slots.
- **Why:** The assignment requires archive/restore behavior and preserving scheduling history. Soft archiving avoids destroying records and makes restoration possible.

## Decision 5 — Immutable appointment history as separate records

- **Chose:** Store every important appointment event as a separate `AppointmentHistory` record.
- **Rejected:** Keeping only the current appointment state or overwriting a single history field.
- **Why:** The assignment requires an immutable timeline containing status changes, care-team changes, cancellations, and visit-note events. Separate records make the timeline append-only and easier to query chronologically.

## Decision 6 — Server-side search, filtering, sorting, and pagination

- **Chose:** Apply appointment search, filters, sorting, and pagination in the backend and return only the requested page.
- **Rejected:** Loading all appointments into the browser and filtering them with JavaScript.
- **Why:** The assignment explicitly says that all appointments must never be loaded into the browser. Server-side pagination also keeps the response size bounded as the appointment dataset grows.

## Decision 7 — Simple REST API instead of introducing additional API infrastructure

- **Chose:** Use Express REST endpoints for authentication, appointments, availability, notes, history, dashboard, and alerts.
- **Rejected:** Adding GraphQL or another API layer.
- **Why:** The assignment has a relatively focused set of resources and workflows. REST kept the implementation straightforward and reduced infrastructure and learning overhead within the time limit.

## Decision 8 — Later reversed: Initial development focus was backend-first

- **Chose initially:** Build the backend models and business rules first and connect the frontend after the main API behavior was implemented.
- **Rejected initially:** Building the UI and backend feature simultaneously.
- **Why initially:** The scheduling rules and server-side authorization are the most important correctness requirements, so establishing them first reduced the risk of implementing incorrect frontend behavior.

- **Later reversed:** During development, I started connecting and refining the frontend before every backend feature was completely finalized.
- **Why it changed:** Seeing the real user workflow exposed integration issues and helped identify where the API responses and frontend interactions needed adjustment. This made it more efficient to develop the remaining UI and backend behavior together for some features.