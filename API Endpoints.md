# API Endpoints

## API Style

The backend exposes RESTful JSON APIs built with ASP.NET Core Minimal APIs.

- Authentication is session-based and uses secure cookies.
- Mutating `/api` requests are protected with antiforgery validation.
- Authorization is enforced server-side with role-based access control.

## Roles

- `admin`
- `manager`
- `employee`

## Authentication

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/auth/csrf` | Anonymous | Issues a fresh CSRF token for SPA requests |
| `POST` | `/api/auth/login` | Anonymous + CSRF | Authenticates the user and creates a cookie session |
| `POST` | `/api/auth/logout` | Session | Clears the auth session and refreshes antiforgery state |
| `GET` | `/api/auth/session` | Authenticated | Returns the current logged-in user session payload |

## Users

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/users` | Authenticated | Returns users visible within the caller's scope |
| `GET` | `/api/users/{id}` | Authenticated | Returns a single user if visible to the caller |
| `GET` | `/api/users/{id}/image` | Authenticated | Returns the user's avatar as a binary image |
| `POST` | `/api/users` | Admin | Creates a new user from multipart form data |
| `PUT` | `/api/users/{id}` | Admin / scoped manager | Updates user profile data |
| `DELETE` | `/api/users/{id}` | Admin | Deletes a user with safety checks |

## Departments

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/departments` | Authenticated | Returns the department list for selectors and detail views |
| `POST` | `/api/departments` | Admin | Creates a new department |

## Evaluations

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/categories` | Authenticated | Returns evaluation category definitions |
| `GET` | `/api/ratings/users/{userId}` | Authenticated | Returns the rating breakdown for a user |
| `GET` | `/api/evaluations/users/{userId}` | Authenticated | Returns the latest annual evaluation form |
| `GET` | `/api/evaluations/users/{userId}/status` | Authenticated | Returns review status for a user |
| `POST` | `/api/evaluations` | Admin / Manager | Creates a new evaluation for a managed user |

## Metrics

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/metrics/department` | Admin / Manager | Returns department-level evaluation aggregates |
| `GET` | `/api/metrics/users` | Admin / Manager | Returns user-level metrics within management scope |

## System

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Anonymous | Lightweight service health check |

## Security Notes

- Cookie sessions are revalidated against the database using `auth_version`.
- Role or password changes invalidate existing sessions.
- Login is protected by CSRF validation, rate limiting, and cooldown logic.
- User avatar uploads are validated from decoded image content instead of trusting MIME type alone.
- DTO-based API responses prevent leaking internal entity state or sensitive fields.
