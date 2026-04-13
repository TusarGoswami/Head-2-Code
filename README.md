# Head-2-Code

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Stack](https://img.shields.io/badge/Stack-MERN-green.svg)
![AWS](https://img.shields.io/badge/Deployed-AWS_EC2-orange.svg)
![Socket.IO](https://img.shields.io/badge/Realtime-Socket.IO-black.svg)
![Judge0](https://img.shields.io/badge/Judge-Judge0_API-blueviolet.svg)

> A production-grade, real-time gamified competitive coding platform — built for developers who want to practice, compete, and grow.

🔗 **[Live Demo](https://your-live-demo-link.com)** · 📂 **[GitHub Repo](https://github.com/TusarGoswami/Head-2-Code)**

---

## Performance at a Glance

| Metric | Value |
|---|---|
| Concurrent Users Supported | 50+ |
| Real-time Event Latency | < 300ms |
| Avg. Code Submission Response | ~250ms |
| Languages Supported | 10+ |
| Cloud Infrastructure | AWS EC2 |

---

## What is Head-2-Code?

Head-2-Code is a full-stack competitive coding platform built from scratch that combines the real-time engagement of live contests with the depth of a production-grade online judge. Users can challenge friends, join custom contests, solve daily problems, and get AI-powered debugging help — all in one place.

This is not a tutorial project. It is a deployed, scalable system with a real online judge, real-time WebSocket infrastructure, cloud hosting, and AI integration.

---

## Core Features

**Real-time Competitive Engine**
- Friend challenges and custom contests powered by Socket.IO
- Sub-300ms end-to-end event latency at 50+ concurrent users
- Live leaderboard updates and notifications

**Full Online Judge**
- Multi-language code execution via Judge0 API (10+ languages)
- Monaco Editor for a VS Code-like in-browser coding experience
- ~250ms average verdict response time

**AI-Powered Assistant**
- Gemini API integration for complexity analysis, hints, and debugging
- Real-time code review and suggestions without leaving the editor

**Authentication & Security**
- JWT-secured REST API
- OAuth 2.0 via Google and GitHub (Passport.js)
- BCrypt password hashing

**Scalable Cloud Infrastructure**
- Deployed on AWS EC2
- Redis caching layer
- MongoDB Atlas for persistent storage
- Cloudinary for image/asset management

**Modern Frontend**
- React.js 18 with Redux Toolkit for state management
- Tailwind CSS v4 + DaisyUI
- Responsive dark-mode UI

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (React.js)                        │
│         Monaco Editor │ Redux Store │ Socket.IO Client          │
└───────────────────────────────┬─────────────────────────────────┘
                                │ HTTP / WebSocket
┌───────────────────────────────▼─────────────────────────────────┐
│                   Node.js / Express.js (AWS EC2)                 │
│    JWT Auth │ REST API │ Socket.IO Server │ Passport.js OAuth    │
└──────┬───────────────┬────────────────┬──────────────┬──────────┘
       │               │                │              │
  ┌────▼────┐   ┌──────▼──────┐  ┌─────▼──────┐  ┌───▼────────┐
  │ MongoDB │   │    Redis     │  │  Judge0 API│  │ Gemini API │
  │  Atlas  │   │   (Cache)    │  │  (Judge)   │  │    (AI)    │
  └─────────┘   └─────────────┘  └────────────┘  └────────────┘
```

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React.js 18 (Vite) | UI Framework |
| Redux Toolkit | Global State Management |
| React Router v7 | Client-side Routing |
| Tailwind CSS v4 + DaisyUI | Styling |
| Monaco Editor | In-browser Code Editor |
| Socket.IO Client | Real-time Communication |
| Zod + React Hook Form | Form Validation |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express.js | Server & REST API |
| Socket.IO | WebSocket Events |
| MongoDB Atlas (Mongoose) | Primary Database |
| Redis | Caching Layer |
| JWT + Passport.js | Auth & OAuth 2.0 |
| Judge0 API | Code Execution Engine |
| Gemini API | AI Assistant |
| Cloudinary | Image Storage |

### DevOps
| Technology | Purpose |
|---|---|
| AWS EC2 | Cloud Hosting |
| GitHub Actions | CI/CD Pipeline |
| Docker | Containerization |
| Postman | API Testing |

---

## Local Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas URI)
- Redis (optional, for caching)
- Judge0 API key (RapidAPI)
- Gemini API key

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/TusarGoswami/Head-2-Code.git
cd Head-2-Code

# 2. Backend setup
cd backend
npm install
cp .env.example .env   # Fill in your environment variables
npm run dev

# 3. Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`

### Environment Variables

Create `backend/.env` based on the following:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

CLIENT_URL=http://localhost:5173

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

GEMINI_API_KEY=your_gemini_api_key

RAPIDAPI_KEY=your_rapidapi_key
RAPIDAPI_HOST=judge0-ce.p.rapidapi.com
```

---

## Project Structure

```
Head-2-Code/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/          # Redux slices
│   │   └── hooks/
│   └── vite.config.js
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   ├── sockets/            # Socket.IO event handlers
│   └── server.js
└── README.md
```

---

## Roadmap

- [ ] Team contests (3v3, 5v5)
- [ ] Problem difficulty rating system (Elo-based)
- [ ] Discussion threads per problem
- [ ] Weekly contest scheduler
- [ ] Mobile app (React Native)

---

## Contributing

Contributions are welcome.

```bash
# Fork → Clone → Create branch
git checkout -b feature/your-feature-name

# Make changes, commit
git commit -m "feat: add your feature"

# Push and open a PR
git push origin feature/your-feature-name
```

---

## License

Distributed under the ISC License.

---

<p align="center">Built with focus and caffeine by <a href="https://github.com/TusarGoswami">Tusar Goswami</a></p>
