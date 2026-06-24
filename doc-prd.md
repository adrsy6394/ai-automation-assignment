# Reddit Automation API - Product Requirements Document (PRD)

## 1. Project Overview

The Reddit Automation API is a backend service that automates Reddit account creation, subreddit joining, and content posting through browser automation.

The system exposes REST APIs that can be consumed by external applications.

---

## 2. Objective

Build a production-ready API service that provides:

* Reddit Account Creation
* Subreddit Joining
* Reddit Post Creation

using browser automation.

---

## 3. APIs

### 3.1 Create Reddit Account API

#### Endpoint

```http
POST /create-account
```

#### Input

```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

#### Functional Requirements

* Open Reddit signup page.
* Fill username.
* Fill email.
* Fill password.
* Submit signup form.
* Use proper browser headers and user-agent.
* Return success or failure response.
* Return created username.
* CAPTCHA handling approach must be documented.

#### Output

```json
{
  "success": true,
  "username": "string"
}
```

---

### 3.2 Join Subreddit API

#### Endpoint

```http
POST /join-subreddit
```

#### Input

```json
{
  "subreddit": "string"
}
```

#### Functional Requirements

* Use stored session/cookies.
* Navigate to the provided subreddit.
* Join the subreddit.
* Handle private subreddit cases.
* Handle restricted subreddit cases.
* Return join status.

#### Output

```json
{
  "joined": true
}
```

---

### 3.3 Create Post API

#### Endpoint

```http
POST /create-post
```

#### Input

```json
{
  "subreddit": "string",
  "title": "string",
  "content": "string"
}
```

#### Functional Requirements

* Use logged-in session.
* Navigate to the target subreddit.
* Create a post.
* Validate empty title.
* Validate required fields.
* Return post status.
* Return post URL or identifier.
* Document spam prevention approach.

#### Output

```json
{
  "status": "success",
  "postUrl": "string"
}
```

---

## 4. Session Management

### Requirements

* Store login session.
* Store cookies after authentication.
* Reuse stored cookies for subsequent requests.
* Avoid repeated login where session is valid.

---

## 5. CAPTCHA Handling

The system must provide a documented approach for CAPTCHA handling during account creation.

Examples:

* Manual solving
* Human-assisted solving
* Third-party CAPTCHA solving services

Implementation is not mandatory.

---

## 6. Spam Prevention Strategy

The system must document the approach used to reduce spam detection risk.

Examples:

* Human-like delays
* Request randomization
* Natural interaction timing

Implementation details should be documented.

---

## 7. Error Handling

The system should return appropriate failure responses for:

* Signup failure
* Invalid subreddit
* Private subreddit
* Restricted subreddit
* Session failure
* Invalid post input
* Posting failure

---

## 8. Production Readiness

The final solution must be deployable on a free hosting platform and expose all APIs through a single service.

---

## 9. Deliverable

A deployed backend service containing:

* POST /create-account
* POST /join-subreddit
* POST /create-post

with all required functionality working through browser automation.
