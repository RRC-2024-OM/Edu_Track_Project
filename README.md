## 📘 EduTrack Pro – API Documentation

A secure, modular educational backend platform with 5-tier Role-Based Access Control (RBAC) built using **Node.js**, **Firebase**, and **TypeScript**. EduTrack Pro enables multi-institution access control, parental oversight, course management, student progress tracking, and granular analytics — all in a RESTful, tested, and validated backend API.

---

### 📌 Project Overview

EduTrack Pro is a **secure educational management system** offering isolated access for Super Admins, Institution Admins, Teachers, Students, and Parents. It solves real-world educational challenges like unauthorized access, audit logging, user imports, and child progress monitoring.

### 🔐 Role-Based Access Control (RBAC)
| Role              | Capabilities                                      | Data Access Scope                |
|-----------------  |-------------------------------------------------- |----------------------------------|
| Super Admin       | Assign roles, system settings                     | Full access                      |
| Institution Admin | Manage users/courses, reports                     | Only their institution's data    |
| Teacher           | Create courses, grade students                    | Their own courses and students   |
| Student           | Enroll in/view courses                            | Their own progress               |
| Parent            | View child's progress, receive notifications      | Only their linked child’s data   |

---

### ⚙️ Installation Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/RRC-2024-OM/Edu_Track_Project/tree/main
   cd edu-track-api
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup Firebase**
   - Firebase service account key.
     ```
     edu-track-project-firebase-adminsdk-fbsvc-882909e2c4.json
     ```

4. **Configure Environment Variables**
   Create a `.env` file:
   ```env
   PORT=3000
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_CLIENT_EMAIL=your-client-email
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n....\n-----END PRIVATE KEY-----\n"
   ```

5. **Run the app**
   ```bash
   npm run dev
   ```

6. **Access the API locally**
   ```
   http://localhost:3000/api
   ```

7. **Swagger UI (Local Docs)**
   ```
   http://localhost:3000/api/docs
   ```

---

### 🚀 Public API Documentation (Swagger)

Access the live, interactive documentation hosted on GitHub Pages:

🔗 [EduTrack Public API Docs](https://rrc-2024-om.github.io/EDU-TRACK-DOC/)

> Includes full OpenAPI spec, example requests, response schemas, security requirements, and role-specific behavior.

---

### 🧪 Example Usage (TypeScript)

```ts
// Login a user and fetch course list
const login = async () => {
  const res = await fetch("https://your-api.com/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@test.com", password: "Test@1234" }),
  });

  const { token } = await res.json();

  const courses = await fetch("https://your-api.com/api/v1/courses", {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await courses.json();
  console.log(data);
};
```

---

### 📊 Key Modules & Endpoints

#### 🔐 Authentication
- `POST /auth/register` – Register users with roles *(Super Admin)*
- `POST /auth/login` – Login to get access token
- `POST /auth/set-claims` – Assign roles *(Super Admin)*

#### 👥 User Management
- `GET /users` – List users by role/institution *(Admin+)*
- `PUT /users/{id}` – Update profile *(Owner/Admin)*
- `POST /users/bulk` – Bulk import users via CSV

#### 📚 Course Management
- `POST /courses` – Create a new course *(Teachers+)*
- `GET /courses` – List/filter courses by institution
- `POST /courses/{id}/publish` – Toggle draft/published state

#### 🎓 Enrollment & Progress
- `POST /enrollments` – Enroll student *(Teachers+)*
- `PUT /enrollments/{id}/progress` – Update grades
- `GET /enrollments/students/{id}` – View child’s enrollment *(Parent)*

#### 📈 Analytics
- `GET /analytics/institution` – Reports for institution admins
- `GET /analytics/student/{id}` – Progress for student *(Teacher/Parent)*

---

### 📂 File Structure

```
src/
├── config/        # Environment, Firebase, Swagger
├── controllers/   # Route logic
├── middleware/    # Auth, RBAC, error, validation
├── routes/        # REST routes (22+ endpoints)
├── services/      # Business logic
├── types/         # TypeScript interfaces
├── utils/         # Helpers (CSV, email, PDF)
├── validations/   # Joi validators
```

---

### 🔒 Secure Setup Instructions

- **.env File**: Keep this file secret and out of GitHub.
- **Firebase Private Key**: Use escaped multiline format or Base64 encode.
- **Security Practices**:
  - JWT tokens expire in 1h
  - All sensitive routes require `Authorization` header
  - Firestore rules ensure institution isolation

---

### ✅ Testing & Coverage

- **85%+** test coverage using **Jest**
- Includes both **unit** and **integration** tests
- Mocked Firebase admin and Express environments

Run tests with:
```bash
npm test
```

---

### 🧪 Generating OpenAPI Docs

1. Run this:
   ```bash
   npm run generate-docs
   ```

2. This generates:
   - `openapi.json`
   - `api-docs/index.html` for GitHub Pages

3. Copy `api-docs/` to your public repo and deploy via GitHub Pages

---

### 📌 Final Notes

EduTrack Pro is designed with security, usability, and scalability in mind — enabling schools to onboard, manage, and track their educational data securely and efficiently. Your documentation is now clean, public, and accessible — empowering any developer to confidently integrate with your API 🚀

