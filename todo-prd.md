# Reddit Automation API - Step-by-Step Implementation Checklist

This document breaks down the development of the Reddit Automation API into sequential phases and modules. To prevent code regression and ensure stability, develop one module at a time, verify its correctness, and perform the designated Git commit checkpoint before proceeding.

---

## Phase 1: Project Setup & Core Infrastructure

### Module 1.1: Project Initialization & Environment Setup
*   **Target Folder Structure:**
    ```text
    reddit-automation-api/
    ├── .env
    ├── .gitignore
    ├── package.json
    └── README.md
    ```
*   **Atomic Tasks:**
    - [ ] Run `npm init -y` to initialize the Node.js project.
    - [ ] Configure `package.json` with metadata, script targets (`start`, `dev`), and basic package info.
    - [ ] Install essential dependencies: `express`, `playwright`, `dotenv`.
    - [ ] Install dev dependencies: `nodemon`.
    - [ ] Create a `.gitignore` file to exclude `node_modules`, `cookies/`, `logs/`, `.env`, and OS-specific files (e.g., `.DS_Store`, `Thumbs.db`).
    - [ ] Create a `.env` file containing the default configuration:
        ```env
        PORT=5000
        NODE_ENV=development
        ```
    - [ ] Create a basic `README.md` with installation and setup instructions.
*   **Git Commit Checkpoint:**
    ```bash
    git add package.json .gitignore .env README.md
    git commit -m "chore: initialize project structure and setup environment variables"
    ```

---

### Module 1.2: Base Logging & Session Utilities
*   **Target Folder Structure:**
    ```text
    reddit-automation-api/
    ├── cookies/
    ├── logs/
    └── src/
        └── utils/
            ├── cookieManager.js
            └── logger.js
    ```
*   **Atomic Tasks:**
    - [ ] Create `logs/` directory and ensure it contains a placeholder or is handled during initialization.
    - [ ] Create `cookies/` directory for persisting user sessions.
    - [ ] Implement `src/utils/logger.js`:
        - Set up a utility that logs timestamped messages to both the console and a file at `logs/app.log`.
        - Format: `[YYYY-MM-DD HH:mm:ss] [LEVEL] Message`.
    - [ ] Implement `src/utils/cookieManager.js`:
        - Define functions `saveCookies(username, cookies)` and `loadCookies(username)`.
        - Persist the cookies as a JSON file under `cookies/${username}_session.json` or a default `cookies/session.json`.
        - Add error handling for missing files, corrupted JSON, or permission errors.
*   **Git Commit Checkpoint:**
    ```bash
    git add src/utils/
    git commit -m "feat: implement logger and cookieManager session utilities"
    ```

---

## Phase 2: Express Server & Routing Foundation

### Module 2.1: Express Application Base
*   **Target Folder Structure:**
    ```text
    reddit-automation-api/
    └── src/
        └── app.js
    ```
*   **Atomic Tasks:**
    - [ ] Create `src/app.js` and set up the boilerplate Express server.
    - [ ] Add standard middleware: `express.json()` and `express.urlencoded({ extended: true })`.
    - [ ] Integrate basic logging middleware to trace incoming HTTP requests.
    - [ ] Bind the server to the port specified in `process.env.PORT` (falling back to `5000`).
    - [ ] Export the app instance (useful for testing) and run the listening server.
*   **Git Commit Checkpoint:**
    ```bash
    git add src/app.js
    git commit -m "feat: configure basic express application server"
    ```

---

### Module 2.2: API Endpoints & Mock Controllers
*   **Target Folder Structure:**
    ```text
    reddit-automation-api/
    └── src/
        ├── controllers/
        │   ├── createAccount.controller.js
        │   ├── createPost.controller.js
        │   └── joinSubreddit.controller.js
        └── routes/
            ├── createAccount.route.js
            ├── createPost.route.js
            └── joinSubreddit.route.js
    ```
*   **Atomic Tasks:**
    - [ ] **Create Account Endpoint:**
        - Create route file `src/routes/createAccount.route.js` routing `POST /create-account`.
        - Implement mock controller `src/controllers/createAccount.controller.js` validating input parameters (`username`, `email`, `password` must not be empty) and returning a simulated `200 OK` response:
          ```json
          { "success": true, "username": "mock_user" }
          ```
    - [ ] **Join Subreddit Endpoint:**
        - Create route file `src/routes/joinSubreddit.route.js` routing `POST /join-subreddit`.
        - Implement mock controller `src/controllers/joinSubreddit.controller.js` validating input parameter (`subreddit` must not be empty) and returning a simulated `200 OK` response:
          ```json
          { "joined": true }
          ```
    - [ ] **Create Post Endpoint:**
        - Create route file `src/routes/createPost.route.js` routing `POST /create-post`.
        - Implement mock controller `src/controllers/createPost.controller.js` validating input parameters (`subreddit`, `title`, `content` must not be empty; title cannot be empty) and returning a simulated `200 OK` response:
          ```json
          { "status": "success", "postUrl": "https://reddit.com/r/test/comments/mock" }
          ```
    - [ ] Register all routes in `src/app.js`.
    - [ ] Add a global error-handling middleware in `src/app.js` to catch invalid JSON payloads or route issues.
    - [ ] Verify endpoints respond correctly using Postman, curl, or a simple test script.
*   **Git Commit Checkpoint:**
    ```bash
    git add src/routes/ src/controllers/
    git commit -m "feat: set up API routes and mock controllers with basic input validation"
    ```

---

## Phase 3: Playwright Integration & Account Creation

### Module 3.1: Playwright Configuration & Base Service
*   **Target Folder Structure:**
    ```text
    reddit-automation-api/
    └── src/
        ├── config/
        │   └── playwright.config.js
        └── services/
            └── redditAutomation.service.js
    ```
*   **Atomic Tasks:**
    - [ ] Create `src/config/playwright.config.js` to define default browser options:
        - `headless`: Configured based on `NODE_ENV` or an env variable (headless in production, headful in development).
        - `userAgent`: Configure a consistent, non-bot browser User-Agent string.
        - `viewport`: Set standard desktop dimensions (e.g., 1280x800).
    - [ ] Initialize `src/services/redditAutomation.service.js` with launch configurations that read from the playwright config.
    - [ ] Add a test function to spawn, navigate to `https://www.reddit.com`, and cleanly close the browser to ensure Playwright is working.
*   **Git Commit Checkpoint:**
    ```bash
    git add src/config/ src/services/redditAutomation.service.js
    git commit -m "feat: integrate playwright config and initialize automation service scaffold"
    ```

---

### Module 3.2: Account Creation Automation Logic
*   **Target Folder Structure:**
    ```text
    reddit-automation-api/
    └── src/
        ├── controllers/
        │   └── createAccount.controller.js
        └── services/
            └── redditAutomation.service.js
    ```
*   **Atomic Tasks:**
    - [ ] Implement `createAccount(username, email, password)` inside `redditAutomation.service.js`:
        - Launch browser with custom user-agent and human-like viewport options.
        - Navigate to the Reddit signup page (`https://www.reddit.com/register`).
        - Wait for fields to load, then use Playwright selectors to fill in `email`, `username`, and `password`.
        - Submit the registration form.
    - [ ] **Document CAPTCHA Strategy:**
        - Document in code comments and the project README the system's CAPTCHA approach (e.g., using manual intervention when in headful mode, or hooks for third-party solvers like 2Captcha/Anti-Captcha). Note: Real-time API automation is not required to solve CAPTCHAs, but must gracefully identify and log the occurrence.
    - [ ] Add response detection: Verify if the submission succeeded (by looking for home dashboard indicators) or failed (indicating email taken, weak password, or CAPTCHA screen).
    - [ ] Update `createAccount.controller.js` to call this service, handle failures, log the event to `logs/app.log`, and return the true status.
*   **Git Commit Checkpoint:**
    ```bash
    git add src/services/redditAutomation.service.js src/controllers/createAccount.controller.js
    git commit -m "feat: implement reddit account creation flow and CAPTCHA strategy documentation"
    ```

---

## Phase 4: Session Management & Reddit Operations

### Module 4.1: Session Management Integration
*   **Target Folder Structure:**
    ```text
    reddit-automation-api/
    └── src/
        └── services/
            └── redditAutomation.service.js
    ```
*   **Atomic Tasks:**
    - [ ] Add cookie-saving logic inside the account creation flow: after a successful sign-up or log-in, extract the browser context cookies and invoke `cookieManager.saveCookies`.
    - [ ] Add helper function `getActiveBrowserContext(username)` inside `redditAutomation.service.js`:
        - Check if cookies exist in `cookies/` for the user.
        - If yes, load cookies, launch a new browser context, inject the cookies, and navigate to Reddit to verify if the session is still valid (e.g., checking if the user profile avatar or username is visible instead of "Log In").
        - If no session or session is expired, abort or log in manually (if fallback is implemented) and update cookies.
*   **Git Commit Checkpoint:**
    ```bash
    git add src/services/redditAutomation.service.js
    git commit -m "feat: integrate automatic cookie saving and session restoration"
    ```

---

### Module 4.2: Join Subreddit Automation
*   **Target Folder Structure:**
    ```text
    reddit-automation-api/
    ├── src/
    │   ├── controllers/
    │   │   └── joinSubreddit.controller.js
    │   └── services/
    │       └── redditAutomation.service.js
    └── cookies/
    ```
*   **Atomic Tasks:**
    - [ ] Implement `joinSubreddit(username, subreddit)` in `redditAutomation.service.js`:
        - Load the authenticated context using the stored session.
        - Navigate directly to `https://www.reddit.com/r/${subreddit}`.
        - Detect subreddit accessibility:
            - **Private Subreddit:** Handle detection of "r/subreddit is private" screen and return an appropriate status/error.
            - **Restricted/Banned Subreddit:** Detect banned/restricted messages and handle accordingly.
        - Locate the "Join" button (supporting both old/new Reddit UI layouts) and click it.
        - Verify the state change (e.g., button text changes to "Joined" or "Leave").
    - [ ] Update `joinSubreddit.controller.js` to parse request variables, verify credentials/cookies, trigger the join automation, and return correct response payloads.
    - [ ] Log attempts, successes, and specific failures (e.g., Private, restricted, not found) to `logs/app.log`.
*   **Git Commit Checkpoint:**
    ```bash
    git add src/services/redditAutomation.service.js src/controllers/joinSubreddit.controller.js
    git commit -m "feat: implement join subreddit automation with accessibility checks"
    ```

---

### Module 4.3: Create Post Automation
*   **Target Folder Structure:**
    ```text
    reddit-automation-api/
    ├── src/
    │   ├── controllers/
    │   │   └── createPost.controller.js
    │   └── services/
    │       └── redditAutomation.service.js
    └── cookies/
    ```
*   **Atomic Tasks:**
    - [ ] Implement `createPost(username, subreddit, title, content)` in `redditAutomation.service.js`:
        - Load the authenticated browser context for the given user.
        - Navigate to the submit post page: `https://www.reddit.com/r/${subreddit}/submit`.
        - Validate elements on the screen.
        - Input the post `title` and the text `content` using target selectors.
        - Submit the form (click "Post" button).
        - Wait for the navigation/redirect post-submission.
        - Parse the resulting post URL from the browser navigation bar or loaded page structure.
    - [ ] Update `createPost.controller.js` to call the creation service, handle validations (e.g. empty title), and log status.
*   **Git Commit Checkpoint:**
    ```bash
    git add src/services/redditAutomation.service.js src/controllers/createPost.controller.js
    git commit -m "feat: implement create post automation and extract post URLs"
    ```

---

## Phase 5: Spam Prevention & Error Handling Refinements

### Module 5.1: Spam Prevention Strategy
*   **Target Folder Structure:**
    ```text
    reddit-automation-api/
    └── src/
        └── services/
            └── redditAutomation.service.js
    ```
*   **Atomic Tasks:**
    - [ ] Implement a randomized delay helper `delay(min, max)` to sleep execution for human-like intervals.
    - [ ] Interleave randomized delays between main browser events (e.g., waiting 1-3 seconds after navigation, delaying form submission clicks, typing with variable character delays).
    - [ ] Document the spam prevention approach in the project files (strategies, delays, and dynamic actions used to avoid Reddit's spam flags).
*   **Git Commit Checkpoint:**
    ```bash
    git add src/services/redditAutomation.service.js
    git commit -m "feat: incorporate human-like delays and document spam prevention tactics"
    ```

---

### Module 5.2: Error Handling & Logging Auditing
*   **Target Folder Structure:**
    ```text
    reddit-automation-api/
    └── src/
        ├── app.js
        └── controllers/
    ```
*   **Atomic Tasks:**
    - [ ] Audit all endpoints for robust exception safety. Catch any unhandled promise rejections inside routes.
    - [ ] Standardize the error response structure as defined in the Design PRD:
      ```json
      {
        "success": false,
        "message": "Error description"
      }
      ```
    - [ ] Ensure proper HTTP status codes:
        - `400 Bad Request` for missing arguments or invalid inputs (e.g., empty post title).
        - `401 Unauthorized` for expired or missing cookies.
        - `500 Internal Server Error` for browser crash or navigation timeouts.
*   **Git Commit Checkpoint:**
    ```bash
    git add src/app.js src/controllers/
    git commit -m "refactor: unify error response design and audit exception handling"
    ```

---

## Phase 6: Containerization & Deployment

### Module 6.1: Docker Setup
*   **Target Folder Structure:**
    ```text
    reddit-automation-api/
    ├── .dockerignore
    └── Dockerfile
    ```
*   **Atomic Tasks:**
    - [ ] Create a `.dockerignore` file to omit `node_modules/`, `cookies/`, `logs/*.log`, `.env`, and local dev logs from the build context.
    - [ ] Create a `Dockerfile` based on the official Playwright environment (e.g., `mcr.microsoft.com/playwright:v1.40.0-jammy` or similar) to ensure all system dependencies for chromium are pre-configured.
    - [ ] Set `ENV PORT=5000` and copy all workspace files into the workdir.
    - [ ] Configure `npm install` and define the entrypoint as `npm start`.
    - [ ] Build the image locally (`docker build -t reddit-automation-api .`) and launch a test container to check endpoints.
*   **Git Commit Checkpoint:**
    ```bash
    git add Dockerfile .dockerignore
    git commit -m "chore: configure Dockerfile and build steps for containerized execution"
    ```

---

### Module 6.2: Final Deployment & Verification
*   **Target Folder Structure:**
    ```text
    reddit-automation-api/
    ├── package.json
    └── README.md
    ```
*   **Atomic Tasks:**
    - [ ] Update `package.json` with scripts to build/install Playwright browsers automatically on deploy systems if running without Docker (e.g., a `postinstall` script running `npx playwright install chromium --with-deps`).
    - [ ] Deploy the application to a free hosting platform (e.g., Render, Railway, Fly.io) supporting custom Docker containers or Node projects with browser environments.
    - [ ] Verify that public endpoints function correctly via API testing on the deployed URL.
    - [ ] Complete `README.md` with configuration guidelines, environment variable setups, API request/response examples, and deployment logs.
*   **Git Commit Checkpoint:**
    ```bash
    git add package.json README.md
    git commit -m "docs: finalize deployment details and update main documentation"
    ```
