# 🚀 Derash Bill Aggregator Backend

> A production-grade, high-performance backend powering the **Derash Bill Aggregation System** — built with scalability, security, and maintainability at its core.

This platform connects **Billers**, **Agents**, and **System Administrators** through a secure and optimized billing workflow architecture designed for real-world financial transaction processing.

---

# 📌 Overview

The Derash Bill Aggregator Backend is designed to solve large-scale bill ingestion, secure payment confirmation, role-based system operations, and auditable financial workflows.

It emphasizes:

* **Scalable batch bill ingestion**
* **Secure transaction processing**
* **Strict role-based access control**
* **Real-time system notifications**
* **Full auditability of critical actions**

---

# 🏗️ System Architecture

This project follows **Clean Architecture (Hexagonal Architecture)** principles.

## Layer Responsibilities

### **Controllers**

Handle HTTP request/response orchestration.

### **Services (Use Cases)**

Contain all business rules and domain workflows.

Examples:

* `IngestBillUseCase`
* `ProcessPaymentUseCase`
* `UpdateSettingsUseCase`

### **Repositories**

Prisma-powered persistence implementations.

### **Middleware**

Cross-cutting concerns:

* Authentication
* Authorization
* Session validation
* Audit logging

---

# ⚡ Performance Engineering

Optimized for **high-volume financial operations**.

## Bill Ingestion Optimization

Supports **500+ bill uploads per request** using:

* In-memory duplicate detection
* Batch validation pipelines
* Prisma bulk inserts
* Reduced database round trips

This ensures low latency even under heavy ingestion workloads.

---

# 🔐 Security Architecture

## Authentication

* JWT session authentication
* Secure cookie-based sessions
* Session revocation support

## Authorization (RBAC)

Supported roles:

* `SYSTEM_ADMIN`
* `BILLER_USER`
* `AGENT_USER`

Each route is guarded with strict role enforcement.

---

# 📝 Comprehensive Audit Trail

Every critical action is recorded with:

* Actor identity
* Actor role
* IP address
* Device metadata
* Action type
* Timestamp

Examples:

* Bill ingestion
* Payment confirmation
* Settings modification
* Session revocation

This provides enterprise-grade traceability.

---

# 🔔 Notification Workflow

Cross-role event propagation enables operational visibility.

Example:

```text
Biller uploads bills
      ↓
System validates ingestion
      ↓
Bills persisted to database
      ↓
Admin notified instantly
      ↓
Agents process payments
      ↓
Audit logs recorded
```

---

# 🗄️ Database Design

Built using **PostgreSQL + Prisma ORM**.

Benefits:

* Type-safe schema access
* Transactional consistency
* Reliable migrations
* Scalable relational modeling

---

# 🛠️ Tech Stack

| Layer             | Technology     |
| ----------------- | -------------- |
| Runtime           | Node.js        |
| Language          | TypeScript     |
| Framework         | Fastify        |
| ORM               | Prisma         |
| Database          | PostgreSQL     |
| Authentication    | JWT            |
| Password Security | Bcrypt         |
| Cookie Security   | Fastify-Cookie |
| Testing           | Jest           |

---

# ⚙️ Why Fastify?

Fastify was selected over Express because of:

* Lower overhead request lifecycle
* Better throughput under concurrent load
* Built-in schema validation support
* Strong TypeScript integration

This directly benefits large-scale bill ingestion performance.

---

# 📂 Project Structure

```bash
src/
├── config/
├── controllers/
├── middleware/
├── models/
├── routes/
├── services/
├── shared/
└── tests/
```

---
# 🐳 Docker Setup
This project now includes full Docker support for easy setup and deployment.
## Run with Docker Compose
```
docker-compose up --build
```
This will:

Build the backend image
Start the Node.js application
Connect to PostgreSQL (if included in compose)
Apply environment configuration automatically

## Environment Variables (Docker)
Make sure your .env is properly configured before running Docker:
```
DATABASE_URL="your_postgresql_url"
JWT_SECRET="your_secret_key"
PORT=3000
```
# 🚀 Getting Started

## Prerequisites

* Node.js v18+
* PostgreSQL
* npm

---

## Installation

### Clone Repository

```bash
git clone https://github.com/Derartu3546/derash-bill-aggregator
cd derash-backend
```

### Install Dependencies

```bash
npm install
```

### Configure Environment

Create `.env`

```env
DATABASE_URL="your_postgresql_url"
JWT_SECRET="your_secret_key"
```

### Run Database Migrations

```bash
npx prisma migrate dev
```

### Start Development Server

```bash
npm run dev
```

---

# 📌 API Highlights

| Endpoint                 | Method | Access | Description             |
| ------------------------ | ------ | ------ | ----------------------- |
| `/auth/login`            | POST   | Public | Authenticate user       |
| `/billers/upload-bills`         | POST   | Biller | Bulk bill upload        |
| `/admin/notifications`   | GET    | Admin  | Fetch unread alerts     |
| `/agent/confirm-payment` | POST   | Agent  | Confirm payment + audit |

---

# 🧪 Testing

Run tests:

```bash
npm test
```

Coverage:

```bash
npm run test:coverage
```

---

## 📖 API Documentation (Swagger)
This project uses **OpenAPI 3.0** via Swagger for interactive documentation. 
Once the server is running, you can explore, test, and view all API endpoints (including file uploads) by visiting:

* **URL:** `http://localhost:5000/docs`

### Features:
* **Interactive Testing:** Use the "Try it out" button to send real requests.
* **Schema Validation:** View required fields, data types, and response formats.
* **File Uploads:** Test the CSV Bill Ingestion directly through the UI.

# 🧠 Engineering Challenges Solved

This project solves practical backend challenges such as:

* Duplicate bill prevention at ingestion scale
* Consistent payment transaction state management
* Secure revocable authentication sessions
* Cross-role notification coordination
* High-integrity audit trace persistence

---

# 👨‍💻 Author

Built with backend engineering best practices using:

* Clean Architecture
* Domain-driven service separation
* Scalable persistence patterns
* Security-first design

---

# 📜 License

Internal project for **Derash Bill Aggregation System**.
