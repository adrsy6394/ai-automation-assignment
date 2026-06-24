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

    const btn = document.getElementById('btn-submit-account');
    setLoading(btn, accountResult, true);

    try {
      const response = await fetch('/create-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        showResult(accountResult, 'success', `🎉 <strong>Success!</strong> Account <strong>${data.username}</strong> registered and session cookies saved.`);
        createAccountForm.reset();
        loadSessions(); // reload list
      } else {
        if (data.captchaDetected) {
          showResult(accountResult, 'warning', `⚠️ <strong>CAPTCHA Blocked!</strong> Reddit registration requires solving a CAPTCHA. In headful development mode, please solve it manually in the browser window. In headless production mode, a solving service hook is required.`);
        } else {
          showResult(accountResult, 'error', `❌ <strong>Failed:</strong> ${data.message || 'Unknown account creation error.'}`);
        }
      }
    } catch (err) {
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

    const btn = document.getElementById('btn-submit-join');
    setLoading(btn, joinResult, true);

    try {
      const response = await fetch('/join-subreddit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, subreddit })
      });

      const data = await response.json();

      if (response.ok && data.joined) {
        showResult(joinResult, 'success', `✅ <strong>Joined!</strong> Successfully joined <strong>r/${subreddit}</strong> under session <strong>${username}</strong>.`);
        document.getElementById('join-subreddit-name').value = '';
      } else {
        if (response.status === 401) {
          showResult(joinResult, 'error', `🔒 <strong>Authentication Error:</strong> Session for user ${username} is invalid or expired. Re-create the account session.`);
        } else {
          showResult(joinResult, 'error', `❌ <strong>Failed:</strong> ${data.message || 'Subreddit could not be joined.'}`);
        }
      }
    } catch (err) {
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

    const btn = document.getElementById('btn-submit-post');
    setLoading(btn, postResult, true);

    try {
      const response = await fetch('/create-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, subreddit, title, content })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        showResult(postResult, 'success', `📝 <strong>Post Created!</strong> Post submitted to <strong>r/${subreddit}</strong>. Link: <a href="${data.postUrl}" target="_blank">View Post URL</a>`);
        document.getElementById('post-title').value = '';
        document.getElementById('post-content').value = '';
        document.getElementById('post-subreddit-name').value = '';
      } else {
        if (response.status === 401) {
          showResult(postResult, 'error', `🔒 <strong>Authentication Error:</strong> Session for user ${username} is invalid or expired.`);
        } else {
          showResult(postResult, 'error', `❌ <strong>Failed:</strong> ${data.message || 'Post could not be submitted.'}`);
        }
      }
    } catch (err) {
      showResult(postResult, 'error', `❌ <strong>Error:</strong> Server connection failed: ${err.message}`);
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
        // Clear lists
        activeSessionsList.innerHTML = '';
        
        // Preserve placeholder option in dropdowns
        const defaultOptionsHTML = '<option value="" disabled selected>Select session context...</option>';
        joinUserSelect.innerHTML = defaultOptionsHTML;
        postUserSelect.innerHTML = defaultOptionsHTML;

        // Render sessions tags & dropdown options
        data.sessions.forEach(user => {
          // Tag
          const tag = document.createElement('span');
          tag.className = 'session-tag';
          tag.textContent = user;
          activeSessionsList.appendChild(tag);

          // Dropdowns
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
        activeSessionsList.innerHTML = '<span class="no-sessions">No active sessions found. Complete account creation or place cookie sessions manually in <code>cookies/</code>.</span>';
        joinUserSelect.innerHTML = '<option value="" disabled selected>No active sessions available</option>';
        postUserSelect.innerHTML = '<option value="" disabled selected>No active sessions available</option>';
      }
    } catch (err) {
      console.error('Failed to load active sessions:', err);
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
