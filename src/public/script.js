document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const refreshSessionsBtn = document.getElementById('refresh-sessions-btn');
  const activeSessionsList = document.getElementById('active-sessions-list');
  const joinUserSelect = document.getElementById('join-user-select');
  const postUserSelect = document.getElementById('post-user-select');

  const createAccountForm = document.getElementById('create-account-form');
  const joinSubredditForm = document.getElementById('join-subreddit-form');
  const createPostForm = document.getElementById('create-post-form');

  const accountResult = document.getElementById('account-result');
  const joinResult = document.getElementById('join-result');
  const postResult = document.getElementById('post-result');

  // Load Active Sessions on load
  loadSessions();

  // Event Listeners
  refreshSessionsBtn.addEventListener('click', loadSessions);

  // 1. Create Account Form Submission
  createAccountForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;

    console.log(`[Create Account] Submitting form for user: ${username}, email: ${email}`);

    const btn = document.getElementById('btn-submit-account');
    setLoading(btn, accountResult, true);

    try {
      const response = await fetch('/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      console.log('[Create Account] Server Response Status:', response.status, data);
      
      if (response.ok && data.success) {
        console.log('[Create Account] Success: Session saved.');
        showResult(accountResult, 'success', `🎉 <strong>Success!</strong> Account <strong>${data.username}</strong> registered and session cookies saved.`);
        createAccountForm.reset();
        loadSessions(); // reload list
      } else {
        if (data.captchaDetected) {
          console.warn('[Create Account] CAPTCHA challenge detected.');
          showResult(accountResult, 'warning', `⚠️ <strong>CAPTCHA Blocked!</strong> Reddit registration requires solving a CAPTCHA. In headful development mode, please solve it manually in the browser window. In headless production mode, a solving service hook is required.`);
        } else {
          console.error('[Create Account] Registration failed:', data.message);
          showResult(accountResult, 'error', `❌ <strong>Failed:</strong> ${data.message || 'Unknown account creation error.'}`);
        }
      }
    } catch (err) {
      console.error('[Create Account] Network Fetch Exception:', err);
      showResult(accountResult, 'error', `❌ <strong>Error:</strong> Failed to communicate with server: ${err.message}`);
    } finally {
      setLoading(btn, null, false);
    }
  });

  // 2. Join Subreddit Form Submission
  joinSubredditForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = joinUserSelect.value;
    const subreddit = document.getElementById('join-subreddit-name').value;

    console.log(`[Join Subreddit] Requesting user ${username} to join subreddit r/${subreddit}`);

    const btn = document.getElementById('btn-submit-join');
    setLoading(btn, joinResult, true);

    try {
      const response = await fetch('/join-subreddit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, subreddit })
      });

      const data = await response.json();
      console.log('[Join Subreddit] Server Response Status:', response.status, data);

      if (response.ok && data.joined) {
        console.log('[Join Subreddit] Success: Subreddit joined.');
        showResult(joinResult, 'success', `✅ <strong>Joined!</strong> Successfully joined <strong>r/${subreddit}</strong> under session <strong>${username}</strong>.`);
        document.getElementById('join-subreddit-name').value = '';
      } else {
        if (response.status === 401) {
          console.warn('[Join Subreddit] Unauthorized: Stored cookies expired or missing.');
          showResult(joinResult, 'error', `🔒 <strong>Authentication Error:</strong> Session for user ${username} is invalid or expired. Re-create the account session.`);
        } else {
          console.error('[Join Subreddit] Error:', data.message);
          showResult(joinResult, 'error', `❌ <strong>Failed:</strong> ${data.message || 'Subreddit could not be joined.'}`);
        }
      }
    } catch (err) {
      console.error('[Join Subreddit] Network Fetch Exception:', err);
      showResult(joinResult, 'error', `❌ <strong>Error:</strong> Server connection failed: ${err.message}`);
    } finally {
      setLoading(btn, null, false);
    }
  });

  // 3. Create Post Form Submission
  createPostForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = postUserSelect.value;
    const subreddit = document.getElementById('post-subreddit-name').value;
    const title = document.getElementById('post-title').value;
    const content = document.getElementById('post-content').value;

    console.log(`[Create Post] User ${username} posting to r/${subreddit}. Title: "${title}"`);

    const btn = document.getElementById('btn-submit-post');
    setLoading(btn, postResult, true);

    try {
      const response = await fetch('/create-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, subreddit, title, content })
      });

      const data = await response.json();
      console.log('[Create Post] Server Response Status:', response.status, data);

      if (response.ok && data.status === 'success') {
        console.log('[Create Post] Success: Post created at ' + data.postUrl);
        showResult(postResult, 'success', `📝 <strong>Post Created!</strong> Post submitted to <strong>r/${subreddit}</strong>. Link: <a href="${data.postUrl}" target="_blank">View Post URL</a>`);
        document.getElementById('post-title').value = '';
        document.getElementById('post-content').value = '';
        document.getElementById('post-subreddit-name').value = '';
      } else {
        if (response.status === 401) {
          console.warn('[Create Post] Unauthorized: Session expired.');
          showResult(postResult, 'error', `🔒 <strong>Authentication Error:</strong> Session for user ${username} is invalid or expired.`);
        } else {
          console.error('[Create Post] Error:', data.message);
          showResult(postResult, 'error', `❌ <strong>Failed:</strong> ${data.message || 'Post could not be submitted.'}`);
        }
      }
    } catch (err) {
      console.error('[Create Post] Network Fetch Exception:', err);
      showResult(joinResult, 'error', `❌ <strong>Error:</strong> Server connection failed: ${err.message}`);
    } finally {
      setLoading(btn, null, false);
    }
  });

  // Fetch Active Sessions from API
  async function loadSessions() {
    activeSessionsList.innerHTML = '<span class="no-sessions">Scanning session files...</span>';
    
    try {
      const res = await fetch('/sessions');
      const data = await res.json();
      
      if (res.ok && data.sessions && data.sessions.length > 0) {
        console.log('[Sessions Manager] Loaded stored session contexts:', data.sessions);
        activeSessionsList.innerHTML = '';
        
        const defaultOptionsHTML = '<option value="" disabled selected>Select session context...</option>';
        joinUserSelect.innerHTML = defaultOptionsHTML;
        postUserSelect.innerHTML = defaultOptionsHTML;

        data.sessions.forEach(user => {
          const tag = document.createElement('span');
          tag.className = 'session-tag';
          tag.textContent = user;
          activeSessionsList.appendChild(tag);

          const option1 = document.createElement('option');
          option1.value = user;
          option1.textContent = user;
          joinUserSelect.appendChild(option1);

          const option2 = document.createElement('option');
          option2.value = user;
          option2.textContent = user;
          postUserSelect.appendChild(option2);
        });
      } else {
        console.log('[Sessions Manager] No stored sessions found.');
        activeSessionsList.innerHTML = '<span class="no-sessions">No active sessions found. Complete account creation or place cookie sessions manually in <code>cookies/</code>.</span>';
        joinUserSelect.innerHTML = '<option value="" disabled selected>No active sessions available</option>';
        postUserSelect.innerHTML = '<option value="" disabled selected>No active sessions available</option>';
      }
    } catch (err) {
      console.error('[Sessions Manager] Failed to load active sessions:', err);
      activeSessionsList.innerHTML = `<span class="no-sessions" style="color: var(--color-error)">Failed to scan sessions directory: ${err.message}</span>`;
    }
  }

  // Loader state toggle helper
  function setLoading(button, resultBox, isLoading) {
    const textEl = button.querySelector('.btn-text');
    const spinnerEl = button.querySelector('.spinner');

    if (isLoading) {
      button.disabled = true;
      textEl.classList.add('hidden');
      spinnerEl.classList.remove('hidden');
      if (resultBox) {
        resultBox.classList.add('hidden');
        resultBox.innerHTML = '';
      }
    } else {
      button.disabled = false;
      textEl.classList.remove('hidden');
      spinnerEl.classList.add('hidden');
    }
  }

  // Result renderer helper
  function showResult(box, type, htmlContent) {
    box.className = `result-box ${type}`;
    box.innerHTML = htmlContent;
    box.classList.remove('hidden');
  }
});
