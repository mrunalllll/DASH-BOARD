# ⚡ TaskFlow – Collaborative Project Management Tool

> A modern, full-stack SaaS-style project management tool inspired by Trello and Asana. Built as a college engineering project demonstrating real-world full-stack development.

![TaskFlow Banner](https://img.shields.io/badge/TaskFlow-v1.0.0-6366f1?style=for-the-badge&logo=lightning&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat&logo=node.js)
![SQLite](https://img.shields.io/badge/SQLite-node:sqlite-003B57?style=flat&logo=sqlite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=flat&logo=tailwindcss)

---

## 📋 Project Objectives

TaskFlow enables students and teams to:
- **Register & login** with JWT authentication
- **Create group projects** with Kanban boards
- **Manage tasks** — create, assign, prioritize, and track
- **Collaborate** through comments on tasks
- **Monitor progress** with a visual dashboard and charts
- **Get notified** in real-time within the app

---

## ✨ Features

### 🔐 Authentication
- Secure JWT-based registration & login
- Password hashing with bcrypt (salt rounds: 12)
- Protected routes on both frontend and backend
- User profile management

### 📊 Dashboard
- Personalized welcome banner with greeting
- Statistics cards: projects, tasks, completed, overdue
- Recent activity feed
- Pie chart for task breakdown
- Table of pending tasks

### 📁 Project Management
- Create, edit, archive, and delete projects
- Custom project colors
- Progress tracking with completion percentage
- Public / private visibility

### 🗂️ Kanban Board
- Drag-and-drop task cards between columns (dnd-kit)
- Default columns: To Do, In Progress, In Review, Done
- Add, rename, and delete custom columns
- Task count per column

### ✅ Task System
- Rich task editor: title, description, assignee, priority, labels, dates
- Priority levels: Low, Medium, High, Urgent
- Overdue detection
- Comment thread per task

### 💬 Comments
- Conversation-style layout with timestamps
- Edit and delete your own comments
- Real-time activity logging

### 👥 Team Management
- Add members by email address
- Roles: Admin, Member, Viewer
- Update roles, remove members
- Team overview page

### 🔔 Notifications
- Bell icon with unread count badge
- Notifications for: task assignments, comments, deadlines, project invites
- Mark individual / all as read

### 🔍 Search
- Global search: projects, tasks, people
- Debounced results dropdown in top bar

---

## 🛠 Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS 3 |
| Routing | React Router v6 |
| Drag & Drop | dnd-kit (core + sortable) |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| HTTP Client | Axios |
| Backend | Node.js, Express.js |
| Database | SQLite via Node.js built-in `node:sqlite` (v22+) |
| Auth | JWT + bcryptjs |
| Date Utils | date-fns |

---

## 📂 Project Structure

```
taskflow/
├── client/                  # React frontend (Vite)
│   ├── src/
│   │   ├── components/      # Shared UI components
│   │   │   ├── ui/          # Avatar, Badge, Modal, etc.
│   │   │   └── TaskForm.jsx # Task create/edit form
│   │   ├── pages/           # Route-level page components
│   │   ├── layouts/         # AppLayout, Sidebar, TopBar
│   │   ├── context/         # AuthContext, ThemeContext
│   │   ├── services/        # Axios API service layer
│   │   ├── utils/           # Helpers, formatters, constants
│   │   ├── App.jsx          # Routes & providers
│   │   └── main.jsx         # React entry point
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── index.html
│
├── server/                  # Node.js Express backend
│   ├── controllers/         # Business logic per resource
│   ├── routes/              # Express routers
│   ├── middleware/          # Auth & authorization
│   ├── database/
│   │   ├── db.js            # SQLite init & wrapper
│   │   └── seed.js          # Demo data seeder
│   ├── utils/               # Shared utilities
│   ├── server.js            # Express app entry
│   ├── .env                 # Environment variables
│   └── package.json
│
├── .gitignore
├── package.json             # Root scripts
└── README.md
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js v22+** (required for built-in `node:sqlite`)
- npm v9+

### 1. Clone / Download

```bash
cd taskflow
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../client
npm install
```

### 4. Configure Environment

The `server/.env` file is pre-configured for development:

```env
PORT=5000
JWT_SECRET=taskflow_super_secret_jwt_key_2024_change_this
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 5. Seed the Database (optional but recommended)

```bash
cd server
npm run seed
```

This creates 4 demo users and sample projects/tasks.

---

## ▶️ Running the Application

Open **two terminals**:

**Terminal 1 – Backend:**
```bash
cd taskflow/server
npm run dev
# Server starts at http://localhost:5000
```

**Terminal 2 – Frontend:**
```bash
cd taskflow/client
npm run dev
# App opens at http://localhost:5173
```

---

## 👤 Demo Accounts

After seeding, use any of these:

| Name | Email | Password | Role |
|---|---|---|---|
| Alice Johnson | alice@taskflow.com | password123 | Project Owner |
| Bob Smith | bob@taskflow.com | password123 | Developer |
| Carol Williams | carol@taskflow.com | password123 | Developer |
| Dave Brown | dave@taskflow.com | password123 | Project Manager |

---

## 🗄️ Database Schema

Uses 9 tables in SQLite:
- `users` — authentication and profiles
- `projects` — project metadata
- `project_members` — membership + roles
- `boards` — one board per project
- `columns` — board columns with ordering
- `tasks` — full task data with assignments
- `comments` — task comment threads
- `notifications` — in-app notification feed
- `activity_logs` — project activity timeline

---

## 🔌 API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login and get JWT |
| GET | /api/auth/me | Get current user |
| GET | /api/projects | List my projects |
| POST | /api/projects | Create project |
| GET | /api/projects/:id | Get project details |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project |
| GET | /api/projects/:id/board | Get Kanban board |
| POST | /api/projects/:id/members | Add member |
| GET | /api/tasks | List tasks (with filters) |
| POST | /api/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| PUT | /api/tasks/:id/move | Move task (drag-drop) |
| GET | /api/tasks/dashboard-stats | Dashboard statistics |
| GET | /api/tasks/:id/comments | Task comments |
| POST | /api/tasks/:id/comments | Add comment |
| GET | /api/notifications | Get notifications |
| PUT | /api/notifications/read-all | Mark all read |
| GET | /api/search | Global search |

---

## 🛡️ Security

- Passwords hashed with **bcrypt** (12 rounds)
- **JWT tokens** with 7-day expiry
- All protected routes require `Authorization: Bearer <token>`
- Project membership verified server-side on every request
- Parameterized SQLite queries (no SQL injection)
- CORS restricted to frontend origin

---

## 🔮 Future Improvements

- [ ] Real-time updates with WebSockets
- [ ] File attachments on tasks
- [ ] Email notifications
- [ ] Gantt chart view
- [ ] Task time tracking
- [ ] Mobile app (React Native)
- [ ] OAuth (Google / GitHub) login
- [ ] Task templates
- [ ] Export to CSV / PDF

---

## 👨‍💻 Author

**TaskFlow** – College Engineering Project (Task 3)

Built with ❤️ using React, Node.js, Express, and SQLite.
#   D A S H - B O A R D  
 