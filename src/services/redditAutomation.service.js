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
   * Retrieves an authenticated browser page context using stored cookies.
   * Checks if user session is valid. Returns { browser, context, page } if valid, null otherwise.
   */
  async getActiveBrowserContext(username) {
    const cookieManager = require('../utils/cookieManager');
    const cookies = cookieManager.loadCookies(username);
    if (!cookies) {
      logger.warn(`No session cookies found for user: ${username || 'default'}`);
      return null;
    }

    let browser;
    let context;
    try {
      browser = await this.launchBrowser();
      context = await browser.newContext({
        userAgent: config.userAgent,
        viewport: config.viewport
      });

      // Inject cookies
      await context.addCookies(cookies);
      const page = await context.newPage();

      // Navigate to Settings to check if session is still logged in
      logger.info(`Verifying session cookies for user: ${username || 'default'}`);
      await page.goto('https://www.reddit.com/settings', { waitUntil: 'domcontentloaded', timeout: 30000 });

      const url = page.url();
      if (url.includes('/login') || url.includes('/register')) {
        logger.warn(`Session cookies expired or invalid for user: ${username || 'default'} (Redirected to login/register)`);
        await context.close();
        await browser.close();
        return null;
      }

      // Check if a login/register button is visible (meaning we are not logged in)
      const hasLoginBtn = await page.locator('a[href*="/login"]').count().catch(() => 0);
      if (hasLoginBtn > 0) {
        const isVisible = await page.locator('a[href*="/login"]').first().isVisible().catch(() => false);
        if (isVisible) {
          logger.warn(`Session invalid: Login button is visible for user: ${username || 'default'}`);
          await context.close();
          await browser.close();
          return null;
        }
      }

      logger.info(`Session is active and valid for user: ${username || 'default'}`);
      return { browser, context, page };
    } catch (err) {
      logger.error(`Failed to verify active browser context: ${err.message}`);
      if (context) await context.close();
      if (browser) await browser.close();
      return null;
    }
  }

  /**
   * Automates Reddit registration.
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

      await page.waitForTimeout(5000);

      // Check if CAPTCHA popped up
      if (await checkCaptcha()) {
        await context.close();
        await browser.close();
        return { success: false, captchaDetected: true, message: 'CAPTCHA detected at Registration Step' };
      }

      // Check validation error messages
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
        
        // Save cookies
        const cookieManager = require('../utils/cookieManager');
        cookieManager.saveCookies(username, cookies);

        await context.close();
        await browser.close();
        return { success: true, username };
      } else {
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

  /**
   * Automates joining a target subreddit.
   */
  async joinSubreddit(username, subreddit) {
    let contextObj;
    try {
      contextObj = await this.getActiveBrowserContext(username);
      if (!contextObj) {
        return { success: false, message: 'Active session not found. Please log in or register first.' };
      }

      const { browser, context, page } = contextObj;
      logger.info(`Navigating to subreddit: r/${subreddit}`);
      await page.goto(`https://www.reddit.com/r/${subreddit}`, { waitUntil: 'domcontentloaded', timeout: 45000 });

      // Check accessibility (private, restricted, banned, not found)
      const checkAccessibility = async () => {
        const text = await page.innerText('body').catch(() => '');
        if (text.includes('private community') || text.includes('Community is private')) {
          return { accessible: false, reason: 'private' };
        }
        if (text.includes('banned') || text.includes('Community has been banned')) {
          return { accessible: false, reason: 'banned' };
        }
        if (text.includes('community not found') || text.includes('there doesn\'t seem to be anything here')) {
          return { accessible: false, reason: 'not_found' };
        }
        return { accessible: true };
      };

      const access = await checkAccessibility();
      if (!access.accessible) {
        logger.warn(`Subreddit r/${subreddit} is inaccessible: ${access.reason}`);
        await context.close();
        await browser.close();
        return { success: false, reason: access.reason, message: `Subreddit is ${access.reason}` };
      }

      // Locate Join Button
      logger.info('Looking for Join button...');
      const joinSelectors = [
        'button:has-text("Join")',
        'button:has-text("join")',
        'button.join-btn',
        '#join-button',
        '[data-testid="join-button"]'
      ];
      let joinBtn = null;
      for (const selector of joinSelectors) {
        if (await page.locator(selector).count() > 0) {
          const el = page.locator(selector).first();
          const isVisible = await el.isVisible().catch(() => false);
          if (isVisible) {
            joinBtn = el;
            break;
          }
        }
      }

      if (!joinBtn) {
        // Check if already joined
        const leaveSelectors = [
          'button:has-text("Joined")',
          'button:has-text("Leave")',
          'button:has-text("leave")'
        ];
        for (const selector of leaveSelectors) {
          if (await page.locator(selector).count() > 0) {
            logger.info(`Already joined subreddit: r/${subreddit}`);
            await context.close();
            await browser.close();
            return { success: true, joined: true, message: 'Already joined' };
          }
        }
        throw new Error('Join button not found on subreddit page');
      }

      await joinBtn.click();
      logger.info('Clicked Join button');

      // Verify status change
      await page.waitForTimeout(3000);
      const leaveSelectors = [
        'button:has-text("Joined")',
        'button:has-text("Leave")',
        'button:has-text("leave")',
        '[data-testid="join-button"]:has-text("Leave")'
      ];
      let joined = false;
      for (const selector of leaveSelectors) {
        if (await page.locator(selector).count() > 0) {
          joined = true;
          break;
        }
      }

      await context.close();
      await browser.close();

      if (joined) {
        logger.info(`Successfully joined subreddit: r/${subreddit}`);
        return { success: true, joined: true };
      } else {
        throw new Error('Click succeeded but Join state did not update');
      }
    } catch (err) {
      logger.error(`Failed to join subreddit: ${err.message}`);
      if (contextObj) {
        await contextObj.context.close();
        await contextObj.browser.close();
      }
      return { success: false, message: err.message };
    }
  }

  /**
   * Automates creating a post in a subreddit.
   */
  async createPost(username, subreddit, title, content) {
    let contextObj;
    try {
      contextObj = await this.getActiveBrowserContext(username);
      if (!contextObj) {
        return { success: false, message: 'Active session not found. Please log in or register first.' };
      }

      const { browser, context, page } = contextObj;
      logger.info(`Navigating to posting page for subreddit: r/${subreddit}`);
      await page.goto(`https://www.reddit.com/r/${subreddit}/submit`, { waitUntil: 'domcontentloaded', timeout: 45000 });

      // Validate submit fields exist
      logger.info('Looking for title and content input fields...');
      const titleSelectors = [
        'textarea[placeholder="Title"]',
        'textarea[name="title"]',
        'input[placeholder="Title"]',
        '[placeholder="Title"]'
      ];
      let titleInput = null;
      for (const selector of titleSelectors) {
        if (await page.locator(selector).count() > 0) {
          titleInput = page.locator(selector).first();
          break;
        }
      }

      const contentSelectors = [
        'div[role="textbox"]',
        'textarea[placeholder="Text (optional)"]',
        'textarea[placeholder="Body"]',
        '[placeholder="Text (optional)"]'
      ];
      let contentInput = null;
      for (const selector of contentSelectors) {
        if (await page.locator(selector).count() > 0) {
          contentInput = page.locator(selector).first();
          break;
        }
      }

      if (!titleInput) {
        throw new Error('Title input field not found on submit page');
      }

      await titleInput.fill(title);
      logger.info('Filled post title');

      if (contentInput) {
        await contentInput.fill(content);
        logger.info('Filled post content');
      } else {
        logger.warn('Content body input box not found or optional, continuing...');
      }

      // Locate Submit / Post button
      logger.info('Looking for Post submission button...');
      const submitSelectors = [
        'button:has-text("Post")',
        'button:has-text("post")',
        'button[type="submit"]',
        'button.submit-btn'
      ];
      let submitBtn = null;
      for (const selector of submitSelectors) {
        if (await page.locator(selector).count() > 0) {
          const el = page.locator(selector).first();
          const isEnabled = await el.isEnabled().catch(() => false);
          if (isEnabled) {
            submitBtn = el;
            break;
          }
        }
      }

      if (!submitBtn) {
        throw new Error('Enabled Post submission button not found');
      }

      await submitBtn.click();
      logger.info('Clicked Post button');

      // Wait for redirect to the new post page
      await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {
        logger.warn('Navigation wait timed out after post submission, checking URL...');
      });

      const postUrl = page.url();
      logger.info(`Post submission page url: ${postUrl}`);

      await context.close();
      await browser.close();

      if (postUrl.includes('/comments/') || postUrl.includes('/s/')) {
        logger.info(`Successfully created post at: ${postUrl}`);
        return { success: true, postUrl };
      } else {
        throw new Error(`Failed to verify post creation. Final URL: ${postUrl}`);
      }

    } catch (err) {
      logger.error(`Failed to create post: ${err.message}`);
      if (contextObj) {
        await contextObj.context.close();
        await contextObj.browser.close();
      }
      return { success: false, message: err.message };
    }
  }
}

module.exports = new RedditAutomationService();
