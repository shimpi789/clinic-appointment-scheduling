# AI prompts

I used AI as a development assistant throughout the take-home. I used it for
implementation guidance, code review, debugging, and checking the assignment
requirements. I reviewed the generated code before adding it to the project and
made corrections when it did not match the requirements or existing codebase.

## Project architecture and implementation planning

### Prompt

"Read the full clinic scheduling take-home assignment carefully and guide me
step by step. I want to build the project within the available time, prioritizing
required functionality over stretch features. Explain the implementation order,
architecture, important tradeoffs, and what should be cut if time runs short."

### What you got

A phased implementation plan covering project setup, authentication, database
models, availability, appointment workflow, care teams, notes, search and
pagination, bulk availability, dashboard, alerts, immutable history, testing,
and deployment.

### What you corrected

I kept the plan focused on the required features and deferred optional stretch
functionality so that the core scheduling workflow could be completed first.

---

## Database and backend design

### Prompt

"Based on this clinic scheduling assignment, design the MongoDB/Mongoose models
needed for users, availability slots, appointments, visit notes, appointment
history, and alerts. Include relationships, indexes, and the important business
rules that should be enforced by the server."

### What you got

A model structure using separate collections for users, slots, appointments,
visit notes, history, and alert dismissals, along with references between the
collections and indexes for important queries.

### What you corrected

I reviewed the generated model design against the assignment and kept business
rules such as role permissions, status transitions, availability overlap checks,
and appointment workflow validation in application code rather than treating
them as simple database constraints.

---

## Appointment workflow and authorization

### Prompt

"Implement the appointment workflow for the assignment with REQUESTED,
CONFIRMED, CHECKED_IN, COMPLETED, NO_SHOW, and CANCELLED states. Make sure
invalid transitions are rejected server-side, NO_SHOW is only allowed after
the scheduled time, cancellation requires a reason, and provider permissions
are restricted to their own care-team appointments."

### What you got

Backend controller logic for appointment creation, status transitions,
cancellation, provider visibility, and care-team authorization.

### What you corrected

I reviewed the transitions and authorization against the assignment instead of
assuming the generated implementation was sufficient. I also added/fixed
restrictions around scheduling-provider reassignment so that front desk users
could reassign providers only before check-in.

---

## Appointment search, filtering, sorting, and pagination

### Prompt

"Add server-side appointment search by patient name, provider/status/date
filters, sorting by date/status/provider, and pagination with total matches.
Do not load all appointments into the browser."

### What you got

An API that accepts search and filter query parameters, applies them on the
server, sorts the MongoDB query, limits the result set, and returns pagination
metadata including total matches and total pages.

### What you corrected

I checked that provider visibility was applied together with the requested
filters so that a provider could not use the filtering API to access another
provider's appointments.

---

## Dashboard and alerts

### Prompt

"Implement the clinic dashboard requirements: today's appointments,
currently checked-in appointments, this week's no-shows, upcoming confirmed
appointments, provider/status breakdowns, and the weekly no-show rate for the
last eight weeks. Also implement requested appointment alerts with the
front-desk dismissal and one-hour-before-scheduled-time reappearance rule."

### What you got

Backend dashboard aggregation/query logic and an alert system that considers
appointment timing and dismissal records.

### What you corrected

I reviewed the alert permissions and corrected the dismissal behavior so that
only FRONT_DESK users can dismiss alerts. I also kept the server responsible
for deciding when dismissed alerts should reappear.

---

## Frontend integration

### Prompt

"Connect the React frontend to the clinic scheduling API. Build a clean,
professional clinic UI for login, appointments, availability, dashboard,
care-team management, visit notes, appointment history, search/filter/sort,
and pagination. Keep the design simple and responsive rather than adding
unnecessary animations."

### What you got

React pages and API service functions connecting the main scheduling workflows
to the backend.

### What you corrected

I reviewed the frontend against the actual API responses and assignment
requirements, then adjusted filters, sorting, history display, care-team
actions, and authentication/registration flows as needed.

---

## Debugging example — incorrect AI-assisted change

### Prompt

"Check the appointment controller and add a restriction so that scheduling
provider reassignment is not allowed after an appointment has been checked in."

### What you got

The change was initially applied to the wrong part of the appointment
controller. It accidentally replaced the cancellation error message with the
message intended for scheduling-provider reassignment.

The incorrect change looked like this:

```text
- "Appointment cannot be cancelled in its current status",
+ "Scheduling provider cannot be reassigned after the appointment has been checked in",