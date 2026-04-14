# 📊 Git Repository Analytics System

A web-based analytical platform designed to help module convenors and academic administrators **monitor, evaluate, and interpret student contributions** in collaborative Git repositories.

---

## 🚀 Overview

Assessing individual contributions in group software projects is challenging due to:
- Duplicate commits across branches  
- Inconsistent contributor identities  
- Low-quality or trivial commits  
- Irregular contribution patterns  

This system automates repository analysis by integrating with **GitHub and GitLab APIs**, providing **accurate, structured, and data-driven insights** to support fair academic assessment.

---

## 🎯 Key Features

### 🔐 Authentication & Access Control
- JWT-based secure authentication  
- Role-based access (Admin / Convenor)

### 📂 Repository Integration
- GitHub & GitLab API integration  
- Fetch repositories, branches, contributors, and commits  

### 🔄 Data Processing
- SHA-based duplicate commit removal  
- Multi-branch commit consolidation  
- Identity mapping (multiple emails/usernames → single student)

### 📈 Analytics Engine
- Contribution percentage calculation  
- Commit quality detection (low-value commits)  
- Behavioural pattern analysis:
  - Inactivity detection  
  - Deadline spike detection  

### 📊 Dashboard & Visualisation
- Interactive analytics dashboard (React)  
- Module and group-level insights  
- Contribution comparison charts  

### 📄 Reporting
- Structured group and student reports  
- Export functionality (CSV / PDF)

---

## 🏗️ System Architecture

The system follows a **three-tier architecture** with a modular backend design.


```
Users (Admin / Convenor)
        ↓
Frontend (React + Tailwind CSS)
        ↓
Backend (Node.js + Express)
 ├── API Layer (Authentication, Routing)
 ├── Data Aggregation (GitHub/GitLab APIs)
 ├── Processing Engine (Deduplication, Identity Mapping)
 └── Analytics Engine (Quality + Pattern Analysis)
        ↓
PostgreSQL Database
        ↓
External APIs (GitHub, GitLab)
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository
```bash
git clone https://github.com/VaishnaviLatey21/git_tracker_tool.git
cd git-repo-analytics
```

---

### 2️⃣ Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file:
```
DATABASE_URL=your_postgresql_url
JWT_SECRET=your_secret_key
GITHUB_TOKEN=your_token
GITLAB_TOKEN=your_token
```

Run backend:
```bash
npm run dev
```

---

### 3️⃣ Frontend Setup
```bash
cd frontend
npm install
npm start
```

---

## 🔮 Future Enhancements

- Machine learning-based commit classification  
- Free-rider detection scoring  
- Real-time analytics dashboard  
- Cross-group benchmarking  
- Automated reporting  
