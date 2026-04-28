(function (global) {
  const API_BASE_URL = global.SYNAPSE_API_BASE_URL || 'http://localhost:3000/api';
  const AUTH_KEY = 'synapseAuth';
  const THEME_KEY = 'synapseTheme';

  function safeUser(user) {
    if (!user) {
      return null;
    }

    const fullName = [user.nombre, user.apellido].filter(Boolean).join(' ').trim();

    return {
      id: user.id_usuario ?? user.id ?? null,
      firstName: user.nombre ?? '',
      lastName: user.apellido ?? '',
      fullName: fullName || user.nombre || user.email || 'Synapse user',
      email: user.email ?? '',
      documento: user.documento ?? '',
      roles: user.roles ?? []
    };
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.token || !parsed.user) {
        return null;
      }

      return {
        token: parsed.token,
        user: safeUser(parsed.user)
      };
    } catch (error) {
      return null;
    }
  }

  function setSession(payload) {
    const session = {
      token: payload.token,
      user: safeUser(payload.user),
      savedAt: new Date().toISOString()
    };

    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession() {
    localStorage.removeItem(AUTH_KEY);
  }

  function getTheme() {
    const storedTheme = localStorage.getItem(THEME_KEY);
    return storedTheme === 'dark' ? 'dark' : 'light';
  }

  function setTheme(theme) {
    const resolvedTheme = theme === 'dark' ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, resolvedTheme);
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
    return resolvedTheme;
  }

  function toggleTheme() {
    return setTheme(getTheme() === 'dark' ? 'light' : 'dark');
  }

  async function request(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });

    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
      const message = body && typeof body === 'object' && body.error ? body.error : 'Request failed';
      throw new Error(message);
    }

    return body;
  }

  global.Synapse = {
    API_BASE_URL,
    AUTH_KEY,
    THEME_KEY,
    request,
    getSession,
    setSession,
    clearSession,
    safeUser,
    getTheme,
    setTheme,
    toggleTheme
  };
})(window);