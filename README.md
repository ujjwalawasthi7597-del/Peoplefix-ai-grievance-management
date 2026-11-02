# PeopleFix — AI-Powered Public Grievance Management Platform

**PeopleFix** is an enterprise-grade full-stack civic technology web platform designed to solve urban infrastructure challenges by connecting citizens, municipal department officers, and city administrators through a transparent, AI-augmented grievance resolution pipeline.

---

## 🌟 Key Architecture & Capabilities

### 1. Custom Authentication & Role-Based Access Control (RBAC)
- **Zero Third-Party Auth Lock-In**: Implemented with custom Node.js, Express, JWT, and bcrypt password hashing (no Clerk, Auth0, or Firebase Auth).
- **Dual Token Architecture**: Short-lived Access Tokens (15m) and Refresh Tokens (7d) with token rotation, revocation, and HTTP-only cookie support.
- **Three Strict Personas**:
  - **Citizen**: Submit complaints, upload photo evidence, track resolution timeline, rate satisfaction, reopen complaints.
  - **Department Officer**: Department-scoped complaint queue, update status with resolution photos, post public milestones and private internal notes, reassign field squads.
  - **Administrator**: Cross-department metrics, SLA escalation alerts, user/officer provisioning, department configuration, AI executive report generator, audit logs.
- **Convenience Evaluator Presets**: Quick 1-click role switcher in the navbar to test Citizen, Roads Officer, Sanitation Officer, and Commissioner Administrator workflows seamlessly.

### 2. Multi-Provider AI Intelligence Layer
- **Provider Abstraction**:
  - **Google Gemini API** (`gemini-3.8-flash` via `@google/genai`): Visual damage identification from photos, issue classification, priority assessment, summary generation, and executive reporting.
  - **Smart Rule-Based Fallback**: Municipal domain heuristics, NLP keyword extraction, priority scoring, Haversine proximity calculation, and duplicate detection when no API key is present.
- **Real-Time Duplicate Detection**: Evaluates geographical proximity (< 150m) and text similarity before complaint submission to avoid duplicate municipal crew dispatches.
- **Historical Resolution Recommendations**: Matches reported issues against past successfully resolved complaints to recommend standard operating procedures.

### 3. Geospatial Issue Mapping (OpenStreetMap & Leaflet)
- Interactive map visualization with status-colored and category-specific custom pins.
- Privacy-preserving pins (citizen phone numbers and emails are automatically masked).
- Proximity filtering to discover active municipal works in any neighborhood.

### 4. Automated SLA Monitoring & Escalation Engine
- Background task monitors all active complaints against department-specific SLA hours (Critical: 6-12h, High: 18-24h, Medium: 36-48h).
- Breached complaints are automatically flagged as `Overdue` and escalated with multi-tier alerts dispatched to supervisory officers and administrators.

---

## 🚀 Quick Start & Demo Accounts

### Pre-Configured Test Accounts

| Role | Email | Password | Assigned Scope |
| :--- | :--- | :--- | :--- |
| **Citizen** | `citizen@civicfix.org` | `Citizen@123` | General Citizen Portal |
| **Officer (Roads)** | `officer.roads@civicfix.org` | `Officer@123` | Public Works & Roads Dept |
| **Officer (Sanitation)** | `officer.sanitation@civicfix.org` | `Officer@123` | Sanitation & Solid Waste Dept |
| **Administrator** | `admin@civicfix.org` | `Admin@123` | Municipal Commissioner |

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Recharts, Leaflet, OpenStreetMap, Lucide Icons.
- **Backend**: Node.js, Express, tsx, JWT, bcryptjs, cookie-parser, CORS.
- **Database**: Mongoose / MongoDB Atlas with persistent local store fallback.
- **AI Engine**: `@google/genai` (`gemini-3.8-flash`) + Rule-Based Municipal Heuristic Engine.
