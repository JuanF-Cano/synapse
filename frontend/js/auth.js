document.addEventListener('DOMContentLoaded', () => {
  const session = window.Synapse.getSession();
  if (session?.token) {
    window.location.replace('../index.html');
    return;
  }

  const themeToggle = document.getElementById('themeToggle');
  const themeToggleIcon = document.getElementById('themeToggleIcon');
  const authShell = document.getElementById('authShell');
  const authPanel = document.getElementById('authPanel');
  const authTitle = document.getElementById('authTitle');
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const authError = document.getElementById('authError');
  const authSuccess = document.getElementById('authSuccess');
  const fillDemoLogin = document.getElementById('fillDemoLogin');
  const fillDemoRegister = document.getElementById('fillDemoRegister');
  const switchToLoginFromRegister = document.getElementById('switchToLoginFromRegister');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const registerNombre = document.getElementById('registerNombre');
  const registerApellido = document.getElementById('registerApellido');
  const registerEmail = document.getElementById('registerEmail');
  const registerDocumento = document.getElementById('registerDocumento');
  const registerPassword = document.getElementById('registerPassword');
  const registerRole = document.getElementById('registerRole');
  const loginSubmit = document.getElementById('loginSubmit');
  const registerSubmit = document.getElementById('registerSubmit');

  function renderTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    if (themeToggle) {
      themeToggle.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
      themeToggle.setAttribute('title', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    }
    if (themeToggleIcon) {
      themeToggleIcon.innerHTML = '<path d="M32 10v44M18 18l10 10M46 18 36 28M12 32h12M40 32h12M18 46l10-10M46 46 36 36"/><circle cx="32" cy="32" r="6"/><path d="M24 16c0 4 3 7 8 10 5-3 8-6 8-10"/><path d="M24 48c0-4 3-7 8-10 5 3 8 6 8 10"/>';
      themeToggleIcon.style.color = isDark ? '#d8b15f' : '#08131c';
    }
  }

  renderTheme(window.Synapse.getTheme());

  const queryMode = new URLSearchParams(window.location.search).get('mode');
  let activeMode = queryMode === 'register' ? 'register' : 'login';

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

  function setMode(mode) {
    activeMode = mode;
    const isRegister = mode === 'register';

    loginTab.classList.toggle('active', !isRegister);
    registerTab.classList.toggle('active', isRegister);
    loginForm.classList.toggle('active', !isRegister);
    registerForm.classList.toggle('active', isRegister);
    authTitle.textContent = isRegister ? 'Registrarse' : 'Iniciar sesión';
    authShell.classList.toggle('is-register', isRegister);
    hideMessages();
  }

  async function loginWithCredentials(email, password) {
    const response = await window.Synapse.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    window.Synapse.setSession(response);
    window.location.href = '../index.html';
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

  loginTab.addEventListener('click', () => setMode('login'));
  registerTab.addEventListener('click', () => setMode('register'));
  switchToLoginFromRegister?.addEventListener('click', () => setMode('login'));
  themeToggle?.addEventListener('click', () => {
    renderTheme(window.Synapse.toggleTheme());
  });

  fillDemoLogin.addEventListener('click', () => {
    loginEmail.value = 'paciente@test.com';
    loginPassword.value = '123456';
    showSuccess('Datos de ejemplo cargados. Puedes iniciar sesión con ellos si ya existe un usuario de prueba en tu base de datos.');
    setMode('login');
  });

  fillDemoRegister.addEventListener('click', () => {
    registerNombre.value = 'Ariana';
    registerApellido.value = 'Mora';
    registerEmail.value = `ariana.mora.${Date.now()}@synapse.test`;
    registerDocumento.value = `${Math.floor(100000000 + Math.random() * 900000000)}`;
    registerPassword.value = 'Synapse123!';
    registerRole.value = '4';
    showSuccess('Datos de ejemplo cargados. Envía el formulario para crear tu usuario y entrar de inmediato.');
    setMode('register');
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
      showError(error.message || 'No fue posible iniciar sesión.');
      restoreLoading(loginSubmit);
    }
  });

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideMessages();

    const nombre = registerNombre.value.trim();
    const apellido = registerApellido.value.trim();
    const email = registerEmail.value.trim();
    const documento = registerDocumento.value.trim();
    const password = registerPassword.value.trim();
    const role = Number(registerRole.value || 4);

    if (!nombre || !apellido || !email || !documento || !password) {
      showError('Completa todos los campos para registrarte.');
      return;
    }

    setLoading(registerSubmit, 'Creando cuenta...', 'Crear cuenta e iniciar sesión');

    try {
      await window.Synapse.request('/users', {
        method: 'POST',
        body: JSON.stringify({
          nombre,
          apellido,
          email,
          password,
          documento,
          roles: [role]
        })
      });

      showSuccess('Cuenta creada. Iniciando sesión ahora...');
      await loginWithCredentials(email, password);
    } catch (error) {
      showError(error.message || 'No fue posible crear la cuenta.');
      restoreLoading(registerSubmit);
    }
  });

  setMode(activeMode);
  authPanel?.classList.add('ready');
});