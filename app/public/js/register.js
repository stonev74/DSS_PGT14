const registerForm = document.getElementById('register_form');

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.querySelector('input[name="username_input"]').value?.trim();
    const password = document.querySelector('input[name="password_input"]').value || '';

    if (!username || !password) {
      showRegisterMessage('You must fill out all registration fields.', true);
      return;
    }

    try {
      const response = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username_input: username,
          password_input: password
        })
      });

      const message = await response.text();

      if (!response.ok) {
        showRegisterMessage(message || 'Registration failed. Please try again.', true);
        return;
      }

      showRegisterMessage(message || 'Registration successful. Redirecting to login...', false);
      window.setTimeout(() => {
        window.location.href = '/login';
      }, 1000);

    } catch (err) {
      console.error('Register error', err);
      showRegisterMessage('Server error, please try again.', true);
    }
  });
}

function showRegisterMessage(message, isError) {
  const existing = document.getElementById('register_message');
  if (existing) existing.remove();

  const msg = document.createElement('p');
  msg.id = 'register_message';
  msg.textContent = message;
  msg.classList.add(isError ? 'error' : 'success');

  const submitButton = document.querySelector('#register_btn');
  submitButton.parentNode.insertBefore(msg, submitButton);
}
