# Reddit Automation API

A backend service built with Node.js, Express, and Playwright that automates Reddit account creation, subreddit joining, and post creation.

## Requirements

- [Node.js](https://nodejs.org/) (v16 or higher recommended)
- [npm](https://www.npmjs.com/)

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Install Playwright Browsers**:
   ```bash
   npx playwright install chromium
   ```

3. **Configure Environment**:
   Create a `.env` file in the root directory (based on the default configuration):
   ```env
   PORT=5000
   NODE_ENV=development
   ```

4. **Run the Application**:
   - **Development**:
     ```bash
     npm run dev
     ```
   - **Production**:
     ```bash
     npm start
     ```

## API Endpoints

- `POST /create-account`: Automates Reddit registration and records user credentials.
- `POST /join-subreddit`: Automates navigating to and joining a target subreddit.
- `POST /create-post`: Automates post creation in a target subreddit and retrieves the URL.
