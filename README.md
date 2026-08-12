# SHREE BALAJI COACHING CLASSES — Online Test Portal

A full-stack, production-ready online examination platform for **JEE, NEET, and MHT-CET** preparation.

**Institute**: Shree Balaji Coaching Classes, Nandurbar, Maharashtra  
**Owner**: Prof. Ravindra Thakare | 📞 +91 99601 02201

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js v18+
- A free [Supabase](https://supabase.com) account (for PostgreSQL)
- A free [Cloudinary](https://cloudinary.com) account (for media)

### 1. Backend Setup

```bash
cd backend

# Copy and fill environment variables
copy .env.example .env
# → Edit .env with your Supabase DATABASE_URL, JWT_SECRET, etc.

# Install dependencies
npm install

# Push database schema to Supabase
npm run db:push

# Seed default admin + categories
npm run seed

# Start development server
npm run dev
```

Backend runs at: `http://localhost:5000`

### 2. Frontend Setup

```bash
cd frontend

# Copy environment file
copy .env.example .env
# → .env already set to http://localhost:5000/api for local dev

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at: `http://localhost:5173`

### Default Admin Login
| Field | Value |
|---|---|
| Email | `admin@balaji.edu` |
| Password | `Admin@1234` |

> ⚠️ Change the admin password after first login!

---

## 🌐 Deployment (Free Tier)

### Backend → Render
1. Push `backend/` to a GitHub repo
2. Create a new **Web Service** on [Render](https://render.com)
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Add all environment variables from `.env.example`
6. After deploy, run: `npm run seed` via Render Shell

### Frontend → Vercel
1. Push `frontend/` to a GitHub repo
2. Import on [Vercel](https://vercel.com)
3. Set `VITE_API_URL` = your Render backend URL + `/api`
4. Deploy!

### Database → Supabase
1. Create a new project on [Supabase](https://supabase.com)
2. Go to **Settings → Database** and copy the connection string
3. Paste as `DATABASE_URL` in backend `.env`
4. Run `npm run db:push` to create tables

### Media → Cloudinary
1. Create free account at [Cloudinary](https://cloudinary.com)
2. Copy Cloud Name, API Key, API Secret to backend `.env`

---

## 🏗️ Project Structure

```
BALAJI/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # Full DB schema
│   │   └── seed.js            # Default admin + categories
│   ├── src/
│   │   ├── app.js             # Express app + middleware
│   │   ├── lib/prisma.js      # DB client
│   │   ├── middleware/
│   │   │   ├── auth.js        # JWT + RBAC
│   │   │   └── audit.js       # Audit logging
│   │   ├── routes/
│   │   │   ├── auth.js        # Register, Login, Reset Password
│   │   │   ├── admin.js       # Full admin API
│   │   │   ├── student.js     # Student API + exam engine
│   │   │   ├── ocr.js         # Tesseract OCR + pdf-parse
│   │   │   └── public.js      # Public categories/stats
│   │   └── services/
│   │       └── cron.js        # Auto-expire + auto-publish
│   ├── server.js
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── context/AuthContext.jsx
    │   ├── services/api.js         # Axios service layer
    │   ├── pages/
    │   │   ├── LandingPage.jsx
    │   │   ├── auth/               # Login, Register, Forgot/Reset
    │   │   ├── admin/              # Dashboard, Users, Categories,
    │   │   │                       # Tests, TestEditor, Analytics,
    │   │   │                       # Feedback, Moderation, AuditLog
    │   │   └── student/            # Dashboard, Tests, ExamInterface,
    │   │                           # ResultPage, History, Analytics,
    │   │                           # Profile, Feedback
    │   ├── App.jsx                 # Routes + guards
    │   ├── main.jsx
    │   └── index.css               # Design system
    └── vercel.json
```

---

## 🔑 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register student |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Request reset link |
| POST | `/api/auth/reset-password` | Reset password |

### Admin (requires `SUPER_ADMIN` role)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET/PATCH/DELETE | `/api/admin/users` | User management |
| CRUD | `/api/admin/categories` | Category management |
| CRUD | `/api/admin/tests` | Test management |
| POST | `/api/admin/tests/:id/duplicate` | Duplicate test |
| POST | `/api/admin/tests/:testId/questions` | Add questions |
| GET | `/api/admin/analytics/tests/:testId` | Test analytics |
| CRUD | `/api/admin/comments` | Comment moderation |
| GET | `/api/admin/feedback` | Feedback list |
| GET | `/api/admin/audit-logs` | Audit trail |

### Student (requires `STUDENT` role)
| Method | Endpoint | Description |
|---|---|---|
| GET/PUT | `/api/student/profile` | Profile management |
| GET | `/api/student/tests` | Browse published tests |
| POST | `/api/student/tests/:id/start` | Start exam attempt |
| POST | `/api/student/attempts/:id/save` | Auto-save answers |
| POST | `/api/student/attempts/:id/submit` | Submit + calculate score |
| GET | `/api/student/attempts/:id/result` | View result |
| GET | `/api/student/history` | All past attempts |
| GET | `/api/student/analytics` | Performance analytics |
| POST | `/api/student/tests/:id/like` | Toggle like |
| CRUD | `/api/student/tests/:id/comments` | Comments |
| POST | `/api/student/feedback` | Submit feedback |

### OCR (requires `SUPER_ADMIN`)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ocr/extract` | Upload image/PDF → extract questions |

---

## 🧑‍💻 Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS v4 |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Charts | Recharts |
| Backend | Node.js + Express.js |
| Auth | JWT + bcryptjs |
| ORM | Prisma |
| Database | Supabase PostgreSQL |
| Media | Cloudinary |
| OCR | tesseract.js + pdf-parse |
| Scheduler | node-cron |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

---

## 📞 Contact

**Prof. Ravindra Thakare**  
Shree Balaji Coaching Classes, Nandurbar, Maharashtra  
WhatsApp: [wa.me/919960102201](https://wa.me/919960102201)  
Phone: +91 99601 02201
 
