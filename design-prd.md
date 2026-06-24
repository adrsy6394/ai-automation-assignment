# Reddit Automation API - Design PRD

## 1. Design Overview

The system is designed as a REST API service that receives requests and performs Reddit automation through a browser automation engine.

The design focuses on:

* API-driven architecture
* Browser automation execution
* Session persistence
* Request validation
* Error handling

---

# 2. High Level Architecture

```text
Client
   │
   ▼
Express API Server
   │
   ▼
Automation Service
   │
   ▼
Playwright Browser
   │
   ▼
Reddit
```

---

# 3. Component Design

## 3.1 API Layer

Responsible for:

* Receiving requests
* Validating input
* Calling automation services
* Returning responses

Available endpoints:

```text
POST /create-account
POST /join-subreddit
POST /create-post
```

---

## 3.2 Automation Layer

Responsible for:

* Browser launch
* Page navigation
* Form interaction
* Button clicks
* Automation execution

Browser automation actions:

```text
Open Page
↓
Fill Form
↓
Submit Action
↓
Capture Result
↓
Return Response
```

---

## 3.3 Session Layer

Responsible for:

* Saving cookies
* Loading cookies
* Reusing authenticated sessions

Flow:

```text
Login
↓
Save Session
↓
Store Cookies
↓
Reuse Cookies
↓
Authenticated Requests
```

---

# 4. API Design

## Create Account Flow

```text
Client Request
↓
Validate Input
↓
Launch Browser
↓
Open Signup Page
↓
Fill Email
↓
Fill Username
↓
Fill Password
↓
Submit Form
↓
Capture Result
↓
Return Response
```

---

## Join Subreddit Flow

```text
Client Request
↓
Load Session
↓
Open Subreddit
↓
Check Accessibility
↓
Join Subreddit
↓
Return Joined Status
```

---

## Create Post Flow

```text
Client Request
↓
Validate Input
↓
Load Session
↓
Open Subreddit
↓
Create Post
↓
Submit Post
↓
Capture Post URL
↓
Return Response
```

---

# 5. Session Design

Cookie storage is used for maintaining authentication state.

```text
Authentication
↓
Cookie Generation
↓
Cookie Storage
↓
Cookie Reuse
```

Stored session data:

```json
{
  "cookies": []
}
```

---

# 6. Validation Design

## Create Account

Required:

* Username
* Email
* Password

Validation Rules:

* Fields must not be empty.

---

## Join Subreddit

Required:

* Subreddit name

Validation Rules:

* Field must not be empty.

---

## Create Post

Required:

* Subreddit
* Title
* Content

Validation Rules:

* Title cannot be empty.
* Required fields must be provided.

---

# 7. Error Handling Design

The system should handle:

## Account Creation Errors

* Signup failure
* Invalid input
* CAPTCHA interruption

---

## Subreddit Errors

* Subreddit not found
* Private subreddit
* Restricted subreddit

---

## Posting Errors

* Empty title
* Session expired
* Posting failed

---

# 8. Response Design

## Success Response

```json
{
  "success": true
}
```

---

## Failure Response

```json
{
  "success": false,
  "message": "Error description"
}
```

---

# 9. Deployment Design

Single deployable service exposing:

```text
POST /create-account
POST /join-subreddit
POST /create-post
```

The deployment must provide a publicly accessible API endpoint on a free hosting platform.

---

# 10. Design Constraints

* Browser automation must be used.
* Session reuse must be supported.
* CAPTCHA solving implementation is not required.
* Only the three required APIs are included in scope.
* No additional user-facing features are included.
