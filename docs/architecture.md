# Architecture

## 1. Moving pieces

- **Frontend:** React + Vite. Handles login, dashboard, appointments, availability, notes, history, search and filters.
- **Backend:** Express + Node.js REST API. Handles authentication, authorization, business rules, appointments, availability, history, alerts and dashboard data.
- **Database:** MongoDB Atlas accessed through Mongoose.
- **Communication:** React sends HTTP/JSON requests to the Express API. JWT is sent with authenticated requests.

```text
React Frontend
      |
HTTP/JSON + JWT
      |
      v
Express REST API
      |
   Mongoose
      |
      v
MongoDB Atlas
```

## 2. Where does each piece run?

- React/Vite runs as the frontend application.
- Express/Node.js runs as the backend API.
- MongoDB runs in MongoDB Atlas.
- In production, frontend and backend can be deployed separately, while MongoDB remains hosted by Atlas.

## 3. Example request path

For a front-desk user confirming an appointment:

1. User logs in through the React frontend.
2. Backend validates credentials and returns a JWT.
3. Frontend sends the status update with the JWT.
4. Server checks authentication and role permissions.
5. Server validates the status transition.
6. MongoDB updates the appointment.
7. Server creates an immutable history record.
8. Updated data is returned to React.

## 4. What did you decide not to build?

I focused on the required functionality and deferred optional features such as:

- Real-time WebSocket notifications
- Email/SMS notifications
- Advanced search infrastructure
- Redis/caching infrastructure
- Full staff/user administration