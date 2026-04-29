document.addEventListener('DOMContentLoaded', () => {
  const session = window.Synapse.getSession();
  if (session?.token) {
    window.location.replace('../index.html');
    return;
  }

  const themeToggle = document.getElementById('themeToggle');
  const themeToggleIcon = document.getElementById('themeToggleIcon');
  const loginForm = document.getElementById('loginForm');
  const authError = document.getElementById('authError');
  const authSuccess = document.getElementById('authSuccess');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const loginSubmit = document.getElementById('loginSubmit');

  function renderTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
      themeToggle.setAttribute('title', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    }
    if (themeToggleIcon) {
      themeToggleIcon.innerHTML = isDark 
        ? '<circle cx="32" cy="32" r="15"/><path d="M32 8v8M32 48v8M8 32h8M48 32h8M14 14l6 6M44 44l6 6M50 14l-6 6M20 44l-6 6"/>'
        : '<circle cx="32" cy="32" r="12"/><path d="M32 2v10M32 52v10M2 32h10M52 32h10M8 8l7 7M50 50l7 7M56 8l-7 7M22 50l-7 7"/>';
      themeToggleIcon.style.color = isDark ? '#ffd700' : '#1c5aa3';
    }
  }

  renderTheme(window.Synapse.getTheme());

  function hideMessages() {
    authError.classList.add('d-none');
    authSuccess.classList.add('d-none');
    authError.textContent = '';
    authSuccess.textContent = '';
  }

  function showError(message) {
    authError.textContent = message;
    authError.classList.remove('d-none');
    authSuccess.classList.add('d-none');
  }

  function showSuccess(message) {
    authSuccess.textContent = message;
    authSuccess.classList.remove('d-none');
    authError.classList.add('d-none');
  }

  async function loginWithCredentials(email, password) {
    const response = await window.Synapse.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (response?.token) {
      window.Synapse.setSession(response);
      window.location.href = '../index.html';
    } else {
      throw new Error('No se recibió token de sesión');
    }
  }

  function setLoading(button, loadingText, originalText) {
    button.disabled = true;
    button.dataset.originalText = originalText;
    button.textContent = loadingText;
  }

  function restoreLoading(button) {
    button.disabled = false;
    if (button.dataset.originalText) {
      button.textContent = button.dataset.originalText;
    }
  }

  themeToggle?.addEventListener('click', () => {
    renderTheme(window.Synapse.toggleTheme());
  });

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideMessages();

    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    if (!email || !password) {
      showError('Ingresa el correo electrónico y la contraseña.');
      return;
    }

    setLoading(loginSubmit, 'Iniciando sesión...', 'Iniciar sesión');

    try {
      await loginWithCredentials(email, password);
    } catch (error) {
      showError(error.message || 'No fue posible iniciar sesión. Verifica tus credenciales.');
      restoreLoading(loginSubmit);
    }
  });
});