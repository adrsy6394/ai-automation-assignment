# Reddit Automation API - Technical PRD

## 1. Technical Overview

The system is a backend automation service that exposes REST APIs and performs Reddit actions through browser automation.

The service consists of:

* Express.js API Server
* Playwright Automation Engine
* Cookie-Based Session Management
* File-Based Storage
* Dockerized Deployment

---

# 2. Technology Stack

## Backend Framework

* Node.js
* Express.js

Purpose:

* API creation
* Request handling
* Response handling

---

## Browser Automation

* Playwright

Purpose:

* Browser launch
* Page navigation
* Form filling
* Button interaction
* Automation execution

---

## Session Management

* Cookie Storage
* Browser Context Persistence

Purpose:

* Session reuse
* Avoid repeated logins

---

## Configuration

* dotenv

Purpose:

* Environment variables
* Application configuration

---

# 3. Project Structure

```text
reddit-automation-api/
│
├── src/
│   ├── routes/
│   │   ├── createAccount.route.js
│   │   ├── joinSubreddit.route.js
│   │   └── createPost.route.js
│   │
│   ├── controllers/
│   │   ├── createAccount.controller.js
│   │   ├── joinSubreddit.controller.js
│   │   └── createPost.controller.js
│   │
│   ├── services/
│   │   └── redditAutomation.service.js
│   │
│   ├── utils/
│   │   ├── cookieManager.js
│   │   └── logger.js
│   │
│   ├── config/
│   │   └── playwright.config.js
│   │
│   └── app.js
│
├── cookies/
│
├── logs/
│
├── Dockerfile
│
├── package.json
│
├── .env
│
└── README.md
```

---

# 4. API Specifications

## Create Account API

### Endpoint

```http
POST /create-account
```

### Request Body

```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

### Response

```json
{
  "success": true,
  "username": "string"
}
```

---

## Join Subreddit API

### Endpoint

```http
POST /join-subreddit
```

### Request Body

```json
{
  "subreddit": "string"
}
```

### Response

```json
{
  "joined": true
}
```

---

## Create Post API

### Endpoint

```http
POST /create-post
```

### Request Body

```json
{
  "subreddit": "string",
  "title": "string",
  "content": "string"
}
```

### Response

```json
{
  "status": "success",
  "postUrl": "string"
}
```

---

# 5. Browser Configuration

## Browser Type

```javascript
chromium
```

## Browser Mode

Development:

```javascript
headless: false
```

Production:

```javascript
headless: true
```

---

## User Agent

A custom user-agent should be configured for all browser contexts.

Purpose:

* Consistent browser identity
* Reduced automation detection

---

# 6. Session Storage Design

## Cookie Save Flow

```text
Login
↓
Get Cookies
↓
Save Cookies
↓
cookies/session.json
```

---

## Cookie Reuse Flow

```text
Load Cookies
↓
Inject Cookies
↓
Open Reddit
↓
Authenticated Session
```

---

# 7. Validation Rules

## Create Account

Required:

* username
* email
* password

Validation:

* Must not be empty

---

## Join Subreddit

Required:

* subreddit

Validation:

* Must not be empty

---

## Create Post

Required:

* subreddit
* title
* content

Validation:

* Title cannot be empty

---

# 8. CAPTCHA Strategy

Implementation is not required.

Documented approaches:

* Manual solving
* Human-assisted solving
* Third-party CAPTCHA services

---

# 9. Spam Prevention Strategy

Documented approaches:

* Random delays
* Human-like interaction timing
* Natural navigation sequence

Example:

```javascript
await page.waitForTimeout(randomDelay);
```

---

# 10. Logging Design

Log events:

* Account creation attempts
* Account creation result
* Subreddit join attempts
* Subreddit join result
* Post creation attempts
* Post creation result
* Errors

Log destination:

```text
logs/app.log
```

---

# 11. Error Handling

Supported error scenarios:

* Invalid request data
* Browser launch failure
* Signup failure
* Session failure
* Subreddit inaccessible
* Post submission failure

---

# 12. Environment Variables

```env
PORT=5000
```

---

# 13. Docker Configuration

Container requirements:

* Node.js runtime
* Application source code
* Installed dependencies
* Playwright browsers

Container startup command:

```bash
npm start
```

---

# 14. Deployment

Deployment target:

* Free hosting platform

Requirements:

* Public API access
* All three endpoints accessible
* Single deployable service

---

# 15. Deliverables

The final implementation must include:

* Create Reddit Account API
* Join Subreddit API
* Create Post API
* Session persistence
* Logging
* Docker support
* Hosted deployment
