# A Tool to Track Student Group Git Repositories

## Student Details
- **Student name:** Vaishnavi Late
- **Student email:** vl99@student.le.ac.uk

## Project Description
This project proposes the design and implementation of a web-based analytical tool to support module convenors in monitoring, evaluating, and managing student group Git repositories in a structured, automated, and fair manner. In many Computer Science group projects, collaborative development through Git is standard practice, and assessment often depends on repository commit histories. Manual analysis of these repositories is time-consuming and introduces practical challenges, including multiple branches, inconsistent commit and author identities, low-quality commits, and uneven contribution patterns.

The implemented system integrates with major Git hosting platforms such as GitHub and GitLab to automatically retrieve and analyse repository activity across multiple student groups. It aggregates commit data to provide individual and group-level insights, including commit frequency, proportional contribution, branch-level activity, and time-based work patterns. The tool also resolves identity inconsistencies by mapping multiple usernames or email aliases to verified student profiles and removes duplicate commits across branches using commit SHA.

To strengthen reliability of assessment evidence, the platform includes rule-based commit quality checks to flag generic commit messages, whitespace-only changes, and minimal modifications. A visual dashboard provides searchable and filterable analytics views, highlights inactivity and contribution imbalance, and supports report generation for marking decisions.

The wider research contribution of the project is an evaluation of automated repository analytics as a practical and academically defensible approach to collaborative software assessment.

## Objectives

### Essential
- Develop a web-based platform that allows module convenors to view and manage multiple student group Git repositories from a single dashboard.
- Implement role-based authentication and authorisation, supporting at least administrator and module convenor roles with controlled access to repositories and analytics.
- Retrieve, store, and aggregate commit metadata from group repositories to calculate accurate contribution statistics for each student.
- Collect commits from all repository branches, remove duplicate commits using unique identifiers (for example, commit SHA), and present a consolidated commit history per student.

### Desirable
- Implement rule-based detection mechanisms to identify and flag low-quality commits based on criteria such as generic messages, minimal changes, or whitespace-only modifications.
- Design and implement a student identity mapping mechanism that links multiple Git usernames or email addresses to a single verified student profile.
- Analyse commit timestamps to detect irregular contribution patterns, including prolonged inactivity and last-minute spikes in activity.
- Integrate Git hosting platform APIs to automate bulk creation of group repositories and automatic assignment of students with predefined access permissions.

### Optional
- Provide configurable system parameters that allow module convenors to define thresholds for inactivity duration and minimum contribution expectations.
- Compute and present contribution distribution metrics that quantify proportional participation among group members.
- Generate structured group-level and student-level summary reports containing contribution statistics and flagged indicators to support marking decisions.
- Design and evaluate a machine learning model that classifies commits as meaningful or low-quality based on extracted commit features.

## Repository Structure
- `backend/` contains API services, controllers, middleware, Prisma schema/migrations, and automated backend tests.
- `frontend/` contains the React web application for landing page, authentication, convenor interface, and admin interface.
- `backend/prisma/` contains data model and migration history.
- `backend/tests/` contains unit, integration, and API test suites.
- `backend/test-provision.http` contains sample API payloads for provisioning and manual endpoint checks.

## Prerequisites
- Node.js (LTS recommended)
- npm
- PostgreSQL
- GitHub and or GitLab access tokens for repository analytics/provisioning features

## Local Setup and Run Steps

### 1) Clone and open project
```bash
git clone <your-repository-url>
cd Git_Tracker_Tool
```

### 2) Backend setup
```bash
cd backend
npm install
```

Create `backend/.env` and configure values:
```env
DATABASE_URL=postgresql://<db_user>:<db_password>@localhost:<db_port>/<db_name>
JWT_SECRET=<strong_random_secret>
BCRYPT_SALT_ROUNDS=12
JWT_EXPIRES_IN=7d
PORT=5000

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=<email_account>
EMAIL_PASS=<email_app_password>
EMAIL_FROM_NAME=Git Tracker Tool

GITLAB_BASE_URL=https://gitlab.com/api/v4
GITLAB_TOKEN=<gitlab_token>
UNI_GITLAB_TOKEN=<optional_university_gitlab_token>
ADMIN_SIGNUP_KEY=<admin_signup_key>
```

### 3) Database setup
Run migrations and generate Prisma client:
```bash
npx prisma migrate deploy
npm run prisma:generate
```

For local schema sync during development (optional):
```bash
npx prisma db push
```

### 4) Start backend server
```bash
npm run dev
```
Backend runs at `http://localhost:5000`.

### 5) Frontend setup
Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at `http://localhost:5173`.

## Running Tests

### Backend automated tests
From `backend/`:
```bash
npm test
```

Run by level:
```bash
npm run test:unit
npm run test:integration
npm run test:api
```

## API Testing
- Manual API checks can be executed with Postman.
- A quick `.http` payload file is available at `backend/test-provision.http`.

Recommended base API URL:
```text
http://localhost:5000/api
```

## Main Functional Areas
- Authentication and role-based access control (Convenor/Admin).
- Module and group management.
- Repository linking for GitHub/GitLab.
- Consolidated commit analytics across branches.
- Low-quality commit and inactivity detection.
- Student identity mapping for fair attribution.
- Auto group and GitLab provisioning workflow.
- CSV/PDF summary reporting.
- Convenor-admin support messaging.

## Academic and Repository Use Notes
- Commit regularly once a feature is integrated and working.
- Use concise, meaningful commit messages.
- Keep secrets and tokens out of version control.
- Follow academic integrity and plagiarism guidance from the module resources.

