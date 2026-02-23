# Digitrench CRM Backend

Node.js Express backend with MongoDB/Mongoose for the Digitrench CRM application.

## Prerequisites

- **Node.js** 18+
- **MongoDB** (local or cloud instance)

## Installation

```bash
cd backend
npm install
```

## Configuration

Edit `.env` file to configure MongoDB connection:

```env
# For local MongoDB
MONGODB_URI=mongodb://localhost:27017/digitrench

# For MongoDB Atlas (cloud)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/digitrench

# Server Port
PORT=5000
```

## Running the Backend

```bash
npm start
```

The server will start on http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login user

### Users
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/:id/activate` - Activate user
- `PATCH /api/users/:id/deactivate` - Deactivate user

### Departments
- `GET /api/departments` - Get all departments
- `POST /api/departments` - Create department
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

### Projects
- `GET /api/projects` - Get all projects
- `GET /api/projects/:id` - Get project by ID
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get task by ID
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Comments
- `GET /api/tasks/:taskId/comments` - Get comments for a task
- `POST /api/comments` - Create comment
- `DELETE /api/comments/:id` - Delete comment

### Time Entries
- `GET /api/time-entries` - Get time entries (optional: ?userId= & ?taskId=)
- `POST /api/time-entries` - Create time entry
- `PUT /api/time-entries/:id` - Update time entry
- `DELETE /api/time-entries/:id` - Delete time entry

### Notifications
- `GET /api/notifications/:userId` - Get notifications for user
- `PATCH /api/notifications/:id/read` - Mark notification as read

### Seed
- `POST /api/seed` - Seed database with initial data

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@digitrench.com | admin123 |
| Management | sarah.johnson@digitrench.com | mgmt123 |
| Employee | emily.rodriguez@digitrench.com | emp123 |

## Connecting Frontend to Backend

Add the following to your frontend `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```
