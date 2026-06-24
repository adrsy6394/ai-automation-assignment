const { chromium } = require('playwright');
const path = require('path');
const config = require('../config/playwright.config');
const logger = require('../utils/logger');

class RedditAutomationService {
  async launchBrowser() {
    logger.info('Launching Chromium browser...');
    const browser = await chromium.launch({
      headless: config.headless,
      args: config.launchOptions.args
    });
    return browser;
  }

  async testConnection() {
    let browser;
    try {
      browser = await this.launchBrowser();
      const context = await browser.newContext({
        userAgent: config.userAgent,
        viewport: config.viewport
      });
      const page = await context.newPage();
      logger.info('Navigating to Reddit to test connection...');
      await page.goto('https://www.reddit.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
      const title = await page.title();
      logger.info(`Reddit page loaded. Title: "${title}"`);
      await context.close();
      await browser.close();
      return true;
    } catch (err) {
      logger.error(`Playwright connection test failed: ${err.message}`);
      if (browser) await browser.close();
      return false;
    }
  }

  /**
   * Automates Reddit registration.
   * Note: Reddit uses advanced anti-bot mitigations and CAPTCHAs.
   * If a CAPTCHA is encountered:
   *   - In development (headful mode), it can be solved manually by the developer.
   *   - In production (headless mode), CAPTCHA detection is flagged, returning a status to the client.
   *   - For fully automated headless environments, hooks can be added here to extract site-keys
   *     and resolve them using 3rd party APIs (e.g. 2Captcha, Anti-Captcha) before form submission.
   */
  async createAccount(username, email, password) {
    let browser;
    let context;
    try {
      browser = await this.launchBrowser();
      context = await browser.newContext({
        userAgent: config.userAgent,
        viewport: config.viewport
      });
      const page = await context.newPage();

      logger.info(`Navigating to Reddit register page for user: ${username}`);
      await page.goto('https://www.reddit.com/register', { waitUntil: 'domcontentloaded', timeout: 45000 });

      // Helper function to detect CAPTCHAs on the page
      const checkCaptcha = async () => {
        const captchaSelectors = [
          'iframe[src*="hcaptcha.com"]',
          'iframe[src*="recaptcha"]',
          'iframe[src*="arkoselabs.com"]',
          'iframe[title*="recaptcha"]',
          'iframe[title*="hcaptcha"]',
          'iframe[src*="challenges.cloudflare.com"]',
          '.g-recaptcha',
          '.h-captcha',
          '#recaptcha',
          '#h-captcha',
          'div[id*="turnstile"]'
        ];
        for (const selector of captchaSelectors) {
          const count = await page.locator(selector).count();
          if (count > 0) {
            // Check if visible
            const isVisible = await page.locator(selector).first().isVisible().catch(() => false);
            if (isVisible) {
              logger.warn(`CAPTCHA detected via selector: ${selector}`);
              return true;
            }
          }
        }
        return false;
      };

      // 1. Fill Email
      logger.info('Looking for Email input field...');
      const emailSelectors = [
        'input[type="email"]',
        'input[name="email"]',
        'input#regEmail',
        '[data-testid="signup-email"]'
      ];
      let emailInput = null;
      for (const selector of emailSelectors) {
        if (await page.locator(selector).count() > 0) {
          emailInput = page.locator(selector).first();
          break;
        }
      }

      if (!emailInput) {
        throw new Error('Email input field not found on register page');
      }

      await emailInput.fill(email);
      logger.info('Email filled successfully');

      // Check if continue button exists and needs to be clicked (multi-step signup)
      const continueSelectors = [
        'button[type="submit"]',
        'button:has-text("Continue")',
        'button:has-text("Next")',
        'button.SignupButton'
      ];
      let continueBtn = null;
      for (const selector of continueSelectors) {
        if (await page.locator(selector).count() > 0) {
          continueBtn = page.locator(selector).first();
          break;
        }
      }

      if (continueBtn) {
        await continueBtn.click();
        logger.info('Clicked continue button to load step 2');
        // Wait a short time for transitions
        await page.waitForTimeout(2000);
      }

      // Check if CAPTCHA popped up early
      if (await checkCaptcha()) {
        await context.close();
        await browser.close();
        return { success: false, captchaDetected: true, message: 'CAPTCHA detected at Email Step' };
      }

      // 2. Fill Username and Password
      logger.info('Looking for Username and Password input fields...');
      const usernameSelectors = [
        'input[name="username"]',
        'input#regUsername',
        'input[type="text"]',
        '[data-testid="signup-username"]'
      ];
      let usernameInput = null;
      for (const selector of usernameSelectors) {
        if (await page.locator(selector).count() > 0) {
          const el = page.locator(selector).first();
          const attrType = await el.getAttribute('type').catch(() => '');
          const attrName = await el.getAttribute('name').catch(() => '');
          if (attrType !== 'email' && attrName !== 'email') {
            usernameInput = el;
            break;
          }
        }
      }

      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input#regPassword',
        '[data-testid="signup-password"]'
      ];
      let passwordInput = null;
      for (const selector of passwordSelectors) {
        if (await page.locator(selector).count() > 0) {
          passwordInput = page.locator(selector).first();
          break;
        }
      }

      if (!usernameInput || !passwordInput) {
        throw new Error('Username or Password input field not found on registration step');
      }

      await usernameInput.fill(username);
      logger.info('Username filled successfully');
      await passwordInput.fill(password);
      logger.info('Password filled successfully');

      // 3. Click Submit / Sign Up
      const signUpSelectors = [
        'button[type="submit"]',
        'button:has-text("Sign Up")',
        'button:has-text("Create Account")',
        'button.SignupButton'
      ];
      let signUpBtn = null;
      for (const selector of signUpSelectors) {
        if (await page.locator(selector).count() > 0) {
          signUpBtn = page.locator(selector).first();
          break;
        }
      }

      if (!signUpBtn) {
        throw new Error('Sign Up submission button not found');
      }

      await signUpBtn.click();
      logger.info('Clicked submission / Sign Up button');

      // Wait for registration transition or CAPTCHA check
      await page.waitForTimeout(5000);

      // Check if CAPTCHA popped up
      if (await checkCaptcha()) {
        await context.close();
        await browser.close();
        return { success: false, captchaDetected: true, message: 'CAPTCHA detected at Registration Step' };
      }

      // Check validation error messages (e.g. username taken, password too short)
      const errorSelectors = [
        '.AnimatedForm__errorMessage',
        '.error-message',
        '[class*="errorMessage"]',
        '.FormError'
      ];
      for (const selector of errorSelectors) {
        if (await page.locator(selector).count() > 0) {
          const isVisible = await page.locator(selector).first().isVisible().catch(() => false);
          if (isVisible) {
            const errorText = await page.locator(selector).first().innerText().catch(() => '');
            if (errorText) {
              logger.warn(`Reddit registration form validation error: ${errorText}`);
              await context.close();
              await browser.close();
              return { success: false, message: `Reddit validation error: ${errorText}` };
            }
          }
        }
      }

      // Check if redirected to home page (indicates success) or login cookies present
      const currentUrl = page.url();
      logger.info(`Current page URL post-registration: ${currentUrl}`);

      const cookies = await context.cookies();
      const hasSessionCookie = cookies.some(cookie => 
        cookie.name.includes('session') || 
        cookie.name.includes('token') || 
        cookie.name === 'reddit_session'
      );

      const isRegSuccess = !currentUrl.includes('/register') && (hasSessionCookie || currentUrl.includes('reddit.com/'));

      if (isRegSuccess) {
        logger.info(`Successfully created Reddit account for user: ${username}`);
        await context.close();
        await browser.close();
        return { success: true, username };
      } else {
        // Fallback check: check for CAPTCHA once more
        if (await checkCaptcha()) {
          await context.close();
          await browser.close();
          return { success: false, captchaDetected: true, message: 'CAPTCHA detected' };
        }
        throw new Error('Reddit registration was not verified (likely blocked or form validation error)');
      }

    } catch (err) {
      logger.error(`Automated account creation failed: ${err.message}`);
      if (context) await context.close();
      if (browser) await browser.close();
      return { success: false, message: err.message };
    }
  }
}

module.exports = new RedditAutomationService();
