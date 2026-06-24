const { chromium } = require('playwright');
const path = require('path');
const app = require('../src/app');

const PORT = 5002;
let server;

async function runSimulation() {
  console.log('=== Starting Live Dashboard Simulation ===');
  
  // Start the server programmatically
  server = app.listen(PORT, '127.0.0.1', async () => {
    console.log(`Express server booted locally on http://127.0.0.1:${PORT}`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 950 }
    });
    const page = await context.newPage();

    // Listen to browser console logs and output them to the terminal console
    page.on('console', msg => {
      console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
    });

    try {
      const url = `http://127.0.0.1:${PORT}`;
      console.log(`Navigating to dashboard at ${url}...`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      
      // Wait for UI to render
      await page.waitForTimeout(2000);

      const uniqueUser = `sim_user_${Date.now()}`;
      console.log(`\nFilling registration form inputs (Username: ${uniqueUser})...`);
      await page.fill('#reg-email', 'simulation_test@example.com');
      await page.fill('#reg-username', uniqueUser);
      await page.fill('#reg-password', 'SimulationPwd123!');
      
      console.log('Clicking "Execute Registration" button to trigger automation...');
      await page.click('#btn-submit-account');

      console.log('Waiting 12 seconds for the automated browser flow and results...');
      await page.waitForTimeout(12000);

      // Save screenshot of the UI state showing the result box
      const screenshotPath = path.join('C:\\Users\\DELL\\.gemini\\antigravity-ide\\brain\\ebe50756-f94a-4173-88ca-f81f49c4edbe', 'dashboard_run.png');
      await page.screenshot({ path: screenshotPath });
      console.log(`\nScreenshot of the final dashboard UI saved to: ${screenshotPath}`);

    } catch (err) {
      console.error(`Simulation encountered an error: ${err.message}`);
    } finally {
      await browser.close();
      server.close(() => {
        console.log('Test server closed.');
        console.log('=== Simulation Finished ===');
        process.exit(0);
      });
    }
  });
}

runSimulation();
