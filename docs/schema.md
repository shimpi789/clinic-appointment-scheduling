# Schema

The application uses MongoDB with Mongoose. The main collections are User, Slot,
Appointment, VisitNote, AppointmentHistory, and AlertDismissal.

## 1. Collections, fields, and types

### User

| Field | Type | Purpose |
|---|---|---|
| `_id` | ObjectId | Unique user identifier |
| `name` | String | User's display name |
| `email` | String | Login email; unique and stored in lowercase |
| `password` | String | Hashed password |
| `role` | String | `FRONT_DESK` or `PROVIDER` |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |

### Slot

| Field | Type | Purpose |
|---|---|---|
| `_id` | ObjectId | Unique slot identifier |
| `providerId` | ObjectId → User | Provider who owns the availability |
| `date` | String | Slot date |
| `startTime` | String | Slot start time |
| `duration` | Number | Duration in minutes |
| `archived` | Boolean | Whether the slot is archived |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |

An active slot has a unique combination of provider, date, and start time.

### Appointment

| Field | Type | Purpose |
|---|---|---|
| `_id` | ObjectId | Unique appointment identifier |
| `slotId` | ObjectId → Slot | Availability slot used by the appointment |
| `patientName` | String | Patient name; also used for server-side search |
| `schedulingProviderId` | ObjectId → User | Primary scheduling provider |
| `supportingProviderIds` | Array of ObjectId → User | Additional care-team providers |
| `status` | String | Appointment workflow status |
| `cancellationReason` | String | Reason recorded when cancelled |
| `scheduledAt` | Date | Combined appointment date/time |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |

Possible statuses are:

- `REQUESTED`
- `CONFIRMED`
- `CHECKED_IN`
- `COMPLETED`
- `NO_SHOW`
- `CANCELLED`

### VisitNote

| Field | Type | Purpose |
|---|---|---|
| `_id` | ObjectId | Unique note identifier |
| `appointmentId` | ObjectId → Appointment | Appointment associated with the note |
| `providerId` | ObjectId → User | Provider who authored the note |
| `text` | String | Provider's observations |
| `createdAt` | Date | Note creation timestamp |
| `updatedAt` | Date | Last update timestamp |

### AppointmentHistory

| Field | Type | Purpose |
|---|---|---|
| `_id` | ObjectId | Unique history identifier |
| `appointmentId` | ObjectId → Appointment | Appointment associated with the event |
| `type` | String | Type of history event |
| `oldStatus` | String | Previous status for status changes |
| `newStatus` | String | New status for status changes |
| `providerId` | ObjectId → User | Provider involved in a care-team change |
| `performedBy` | ObjectId → User | User who performed the action |
| `reason` | String | Reason/details for applicable events |
| `createdAt` | Date | Event timestamp |
| `updatedAt` | Date | Update timestamp |

History event types include:

- `STATUS_CHANGE`
- `SUPPORTING_PROVIDER_ADDED`
- `SUPPORTING_PROVIDER_REMOVED`
- `SCHEDULING_PROVIDER_REASSIGNED`
- `CANCELLATION`
- `VISIT_NOTE_ADDED`

History records are only created by application actions. There are no API endpoints
for editing or deleting history.

### AlertDismissal

| Field | Type | Purpose |
|---|---|---|
| `_id` | ObjectId | Unique dismissal identifier |
| `appointmentId` | ObjectId → Appointment | Appointment associated with the alert |
| `dismissedBy` | ObjectId → User | Front-desk user who dismissed it |
| `dismissedAt` | Date | Time of dismissal |
| `createdAt` | Date | Creation timestamp |
| `updatedAt` | Date | Last update timestamp |

## 2. Relationships

### One-to-many

**User → Slot**

One provider can have many availability slots.

**User → VisitNote**

One provider can author many visit notes.

**User → Appointment**

A provider can be the scheduling provider for many appointments.

**Appointment → VisitNote**

One appointment can have multiple visit notes.

**Appointment → AppointmentHistory**

One appointment can have many immutable history events.

**Appointment → AlertDismissal**

An appointment can have alert dismissal records.

### Many-to-many

**Appointment ↔ User**

Appointments have one scheduling provider and an array of supporting providers.
This represents the care-team relationship: a provider can support many
appointments, and an appointment can have multiple supporting providers.

The relationship is stored on the Appointment document using
`schedulingProviderId` and `supportingProviderIds`.

### One-to-one

**Slot → Appointment**

A slot can result in at most one appointment. The Appointment collection enforces
this through the unique `slotId` field.

## 3. Database constraints vs application-level constraints

I used database constraints where MongoDB can reliably enforce uniqueness and
basic data integrity.

### Database-enforced constraints

- User email is unique.
- Active slots have a unique provider/date/start-time combination.
- Appointment `slotId` is unique.
- Appointment and history indexes support frequent queries.
- Patient name has a text index for search.
- Appointment history is indexed by appointment and creation time.
- Visit notes are indexed by appointment and creation time.

### Application-enforced constraints

Business rules are enforced in the API because they depend on the current
state of multiple documents or the authenticated user's role.

Examples:

- A provider can only create availability for themselves.
- Front desk can create availability for any provider.
- Providers can only access their own schedules.
- Booked slots cannot be edited or archived.
- Availability time overlaps are rejected.
- Appointment status transitions must follow the defined workflow.
- NO_SHOW is only allowed after the scheduled time.
- Cancellation requires a reason and is not allowed after check-in.
- Only front desk can reassign the scheduling provider.
- A scheduling provider cannot be reassigned after check-in.
- Providers can only act on appointments where they are part of the care team.
- Only the provider who authored a visit note can edit it.
- History cannot be edited or deleted through the API.
- Alert dismissal is restricted to front desk.

These rules are better handled in application code because they involve authorization,
workflow state, or comparisons between multiple records rather than simple
single-field database constraints.

## 4. What did you deliberately denormalise?

The main deliberate denormalisation is keeping the provider IDs directly on the
Appointment document instead of creating a separate appointment-care-team
collection.

The appointment stores:

- `schedulingProviderId`
- `supportingProviderIds`

This makes common queries simpler because the system frequently needs to find
appointments belonging to a provider, including appointments where that provider
is only supporting.

Provider details themselves are not duplicated into the Appointment document;
the IDs are populated from the User collection when needed.

## 5. What would break first if this had 100x the data?

The first pressure point would likely be appointment listing and search because
these are the most frequently queried datasets and can grow substantially.

The application already limits this impact by using:

- Server-side pagination
- A maximum page size
- Query indexes
- Server-side filtering and sorting
- Appointment count queries for pagination totals

At 100x the data, the main areas I would revisit are:

1. **Search performance** — patient-name search may need a dedicated search
   strategy if requirements become more advanced.
2. **Pagination count queries** — calculating total matches for every request can
   become expensive at very large scale.
3. **Dashboard aggregations** — repeated date-range aggregation queries could
   require precomputed or cached metrics.
4. **History growth** — immutable history will grow continuously and may need
   archival/partitioning strategies.
5. **Alert queries** — frequent checks for upcoming requested appointments could
   benefit from optimized indexes or scheduled processing.
6. **Database capacity** — MongoDB indexes and storage would need to be monitored
   as appointment and history volume grows.

I would address these only when the larger scale justified the additional
complexity, rather than prematurely introducing those systems into the take-home
implementation.