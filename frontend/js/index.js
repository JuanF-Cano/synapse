document.addEventListener('DOMContentLoaded', () => {
  const guestActions = document.getElementById('guestActions');
  const userActions = document.getElementById('userActions');
  const userGreeting = document.getElementById('userGreeting');
  const userGreetingName = document.getElementById('userGreetingName');
  const logoutButton = document.getElementById('logoutButton');
  const themeToggle = document.getElementById('themeToggle');
  const themeToggleIcon = document.getElementById('themeToggleIcon');
  const session = window.Synapse.getSession();
  const heroLoginBtn = document.getElementById('heroLoginBtn');
  const heroDashboardBtn = document.getElementById('heroDashboardBtn');

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
        ? '<path d="M32 10v44M18 18l10 10M46 18 36 28M12 32h12M40 32h12M18 46l10-10M46 46 36 36"/><circle cx="32" cy="32" r="6"/><path d="M24 16c0 4 3 7 8 10 5-3 8-6 8-10"/><path d="M24 48c0-4 3-7 8-10 5 3 8 6 8 10"/>'
        : '<path d="M32 10v44M18 18l10 10M46 18 36 28M12 32h12M40 32h12M18 46l10-10M46 46 36 36"/><circle cx="32" cy="32" r="6"/><path d="M24 16c0 4 3 7 8 10 5-3 8-6 8-10"/><path d="M24 48c0-4 3-7 8-10 5 3 8 6 8 10"/>';
    }
  }

  renderTheme(window.Synapse.getTheme());

  if (session?.user) {
  guestActions?.classList.add('d-none');
  userActions?.classList.remove('d-none');
  userActions?.classList.add('d-flex');

  // 👇 HERO
  heroLoginBtn?.classList.add('d-none');
  heroDashboardBtn?.classList.remove('d-none');

  if (userGreetingName) {
    userGreetingName.textContent = session.user.fullName || 'Usuario';
  }
} else {
  guestActions?.classList.remove('d-none');
  guestActions?.classList.add('d-flex');
  userActions?.classList.add('d-none');
  userActions?.classList.remove('d-flex');

  // 👇 HERO
  heroLoginBtn?.classList.remove('d-none');
  heroDashboardBtn?.classList.add('d-none');
}

  if (session?.user) {
    guestActions?.classList.add('d-none');
    userActions?.classList.remove('d-none');
    userActions?.classList.add('d-flex');
    if (userGreetingName) {
      userGreetingName.textContent = session.user.fullName || 'Usuario';
    }
  } else {
    guestActions?.classList.remove('d-none');
    guestActions?.classList.add('d-flex');
    userActions?.classList.add('d-none');
    userActions?.classList.remove('d-flex');
  }

  logoutButton?.addEventListener('click', () => {
    window.Synapse.clearSession();
    window.location.reload();
  });

  themeToggle?.addEventListener('click', () => {
    renderTheme(window.Synapse.toggleTheme());
  });
});