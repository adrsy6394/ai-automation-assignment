const { chromium } = require('playwright');
const path = require('path');

async function capture() {
  console.log('Launching browser to capture dashboard screenshot...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();
  
  const targetUrl = 'http://127.0.0.1:5000';
  console.log(`Navigating to ${targetUrl}...`);
  
  try {
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    console.log('Dashboard page loaded.');
    
    // Wait for the UI layout transitions to settle
    await page.waitForTimeout(2000);
    
    const screenshotPath = path.join('C:\\Users\\DELL\\.gemini\\antigravity-ide\\brain\\ebe50756-f94a-4173-88ca-f81f49c4edbe', 'dashboard_screenshot.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved successfully to: ${screenshotPath}`);
  } catch (err) {
    console.error(`Failed to capture screenshot: ${err.message}`);
  } finally {
    await browser.close();
  }
}

capture();
