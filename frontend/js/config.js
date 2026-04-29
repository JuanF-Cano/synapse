(function (global) {
  const API_BASE_URL = 'http://localhost:3000/api';
  const AUTH_KEY = 'synapseAuth';
  const THEME_KEY = 'synapseTheme';

  const ROLE_ID_MAP = {
    admin: 1,
    medico: 2,
    recepcionista: 3,
    paciente: 4
  };

  function parseTokenClaims(token) {
    if (!token || typeof token !== 'string') {
      return null;
    }

    try {
      const payload = token.split('.')[1];
      if (!payload) {
        return null;
      }
      return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch (error) {
      return null;
    }
  }

  function getRoleNamesFromClaims(claims) {
    if (!claims || !Array.isArray(claims.roles)) {
      return [];
    }
    return claims.roles.map((role) => String(role).toLowerCase());
  }

  function getPrimaryRole(roles = []) {
    if (!Array.isArray(roles) || roles.length === 0) {
      return null;
    }

    return [...roles]
      .map((role) => String(role).toLowerCase())
      .sort((a, b) => (ROLE_ID_MAP[a] || 999) - (ROLE_ID_MAP[b] || 999))[0];
  }

  function safeUser(user) {
    if (!user) {
      return null;
    }

    const fullName = [user.nombre, user.apellido].filter(Boolean).join(' ').trim();

    return {
      id: user.id_usuario ?? user.id ?? null,
      firstName: user.nombre ?? '',
      lastName: user.apellido ?? '',
      fullName: fullName || user.nombre || user.email || 'Usuario',
      email: user.email ?? '',
      documento: user.documento ?? '',
      telefono: user.telefono ?? '',
      direccion: user.direccion ?? '',
      fecha_nacimiento: user.fecha_nacimiento ?? null,
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

      const claims = parseTokenClaims(parsed.token);
      const roleNames = getRoleNamesFromClaims(claims);

      return {
        token: parsed.token,
        user: {
          ...safeUser(parsed.user),
          roles: roleNames,
          primaryRole: getPrimaryRole(roleNames)
        },
        claims
      };
    } catch (error) {
      return null;
    }
  }

  function setSession(payload) {
    const claims = parseTokenClaims(payload.token);
    const roleNames = getRoleNamesFromClaims(claims);

    const session = {
      token: payload.token,
      user: {
        ...safeUser(payload.user),
        roles: roleNames,
        primaryRole: getPrimaryRole(roleNames)
      },
      claims,
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

  function showToast(message, type = 'info', duration = 3200) {
    let container = document.getElementById('synapse-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'synapse-toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `synapse-toast ${type}`;
    toast.innerHTML = `
      <span class="synapse-toast-icon">${type === 'success' ? '✓' : type === 'error' ? '!' : 'i'}</span>
      <span class="synapse-toast-message">${message}</span>
      <button type="button" class="synapse-toast-close" aria-label="Cerrar">×</button>
    `;

    const close = () => {
      toast.classList.add('removing');
      window.setTimeout(() => toast.remove(), 280);
    };

    toast.querySelector('.synapse-toast-close')?.addEventListener('click', close);
    container.appendChild(toast);

    if (duration > 0) {
      window.setTimeout(close, duration);
    }
  }

  async function request(path, options = {}) {
    console.log('BODY TYPE:', typeof options.body);
    console.log('BODY VALUE:', options.body);
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    const contentType = response.headers.get('content-type') || '';
    const body = contentType.includes('application/json')
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message =
        body && typeof body === 'object' && body.error
          ? body.error
          : 'Request failed';
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
    parseTokenClaims,
    getPrimaryRole,
    ROLE_ID_MAP,
    getTheme,
    setTheme,
    toggleTheme,
    showToast
  };
})(window);