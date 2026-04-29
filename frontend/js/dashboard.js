document.addEventListener('DOMContentLoaded', () => {
  const session = window.Synapse.getSession();
  if (!session?.token || !session?.user) {
    window.location.replace('./auth.html');
    return;
  }

  const roleLabels = {
    admin: 'Administrador',
    medico: 'Medico',
    recepcionista: 'Recepcionista',
    paciente: 'Paciente'
  };

  const roleOrder = ['admin', 'medico', 'recepcionista', 'paciente'];

  const state = {
    token: session.token,
    user: session.user,
    roles: (session.user.roles || []).filter((role) => roleLabels[role]),
    activeRole: session.user.primaryRole || 'paciente',
    activeView: 'overview',
    data: {
      appointments: [],
      doctors: [],
      patients: [],
      users: [],
      receptionists: [],
      treatments: [],
      facturas: []
    },
    selectedFactura: null
  };

  const initialHashView = window.location.hash.replace('#', '').trim();
  const availableViews = new Set([
    'overview',
    'doctors-availability',
    'assign-appointments',
    'register-users',
    'manage-users',
    'reports',
    'treatment-prices',
    'medical-history',
    'edit-history',
    'cancel-appointments',
    'full-history',
    'all-bills',
    'pending-bills',
    'book-appointment',
    'account'
  ]);

  if (availableViews.has(initialHashView)) {
    state.activeView = initialHashView;
  }

  if (state.roles.length === 0) {
    state.roles = ['paciente'];
    state.activeRole = 'paciente';
  }

  state.activeRole = roleOrder.find((role) => state.roles.includes(role)) || state.roles[0];

  const dashboardUserName = document.getElementById('dashboardUserName');
  const logoutButton = document.getElementById('logoutButton');
  const themeToggle = document.getElementById('themeToggle');
  const themeToggleIcon = document.getElementById('themeToggleIcon');
  const sidebarRoot = document.getElementById('dashboardSidebar');
  const mainRoot = document.getElementById('dashboardMain');
  const editableViews = new Set(['account']);

  // Update greeting with actual user name
  const updateGreeting = () => {
    const displayName = state.user.firstName || state.user.fullName || 'Usuario';
    dashboardUserName.textContent = displayName;
  };
  updateGreeting();

  function renderTheme(theme) {
    const isDark = theme === 'dark';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    themeToggle?.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    themeToggle?.setAttribute('title', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
    if (themeToggleIcon) {
      themeToggleIcon.style.color = isDark ? '#d8b15f' : '#08131c';
    }
  }

  function formatCOP(value) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  function formatDate(value, withTime = true) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }
    return date.toLocaleString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: withTime ? '2-digit' : undefined,
      minute: withTime ? '2-digit' : undefined
    });
  }

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  function getCurrentUserDisplayName() {
    return state.user.fullName || [state.user.firstName, state.user.lastName].filter(Boolean).join(' ').trim() || 'Usuario';
  }

  function isCurrentDoctorName(name) {
    const first = (state.user.firstName || '').toLowerCase();
    const full = getCurrentUserDisplayName().toLowerCase();
    const compare = String(name || '').toLowerCase();
    return Boolean(compare && (compare === full || compare.includes(first)));
  }

  function isCurrentPatientName(name) {
    const first = (state.user.firstName || '').toLowerCase();
    const full = getCurrentUserDisplayName().toLowerCase();
    const compare = String(name || '').toLowerCase();
    return Boolean(compare && (compare === full || compare.includes(first)));
  }



  async function api(path, options = {}) {
    console.log('Synapse al cargar:', typeof Synapse);
    const response = await fetch(`${Synapse.API_BASE_URL}${path}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${state.token}`,
        ...(options.headers || {})
      },
      body: options.body
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload?.error || payload?.message || `HTTP ${response.status}`);
    }

    return payload;
  }

  async function loadBaseData() {
    const today = new Date().toISOString().slice(0, 10);
    const requests = [
      api('/appointments').catch(() => []),
      api(`/doctors/availability?date=${today}`).catch(() => []),
      api('/patients').catch(() => []),
      api('/users').catch(() => ({ users: [] })),
      api('/treatments').catch(() => []),
      api('/facturas').catch(() => [])
    ];

    const [appointments, availability, patients, usersPayload, treatments, facturas] = await Promise.all(requests);
    state.data.appointments = Array.isArray(appointments) ? appointments : [];
    state.data.doctors = Array.isArray(availability)
      ? availability
          .map((item) => item?.doctor)
          .filter((doctor) => doctor && doctor.id_usuario)
      : [];
    state.data.patients = Array.isArray(patients) ? patients : [];
    state.data.users = Array.isArray(usersPayload?.users) ? usersPayload.users : [];
    state.data.receptionists = state.data.users.filter((user) =>
      Array.isArray(user?.roles) && user.roles.includes('recepcionista')
    );
    state.data.treatments = Array.isArray(treatments) ? treatments : [];
    state.data.facturas = Array.isArray(facturas) ? facturas : [];
  }

  async function refreshCurrentUser() {
    try {
      const payload = await api('/users/me');
      if (payload?.user) {
        state.user = {
          ...state.user,
          ...window.Synapse.safeUser(payload.user)
        };

        window.Synapse.setSession({ token: state.token, user: payload.user });
        updateGreeting();

        const liveRoles = Array.isArray(payload.user.roles) ? payload.user.roles : [];
        if (liveRoles.length > 0) {
          state.roles = liveRoles.filter((role) => roleLabels[role]);
          state.activeRole = roleOrder.find((role) => state.roles.includes(role)) || state.roles[0] || 'paciente';
        }
      }
    } catch (error) {
      return null;
    }
  }

  function getSidebarConfigForRole(role) {
    if (role === 'recepcionista') {
      return [
        { id: 'overview', label: 'Dashboard' },
        { id: 'register-users', label: 'Registrar usuarios' },
        { id: 'manage-users', label: 'Gestionar usuarios' },
        { id: 'doctors-availability', label: 'Medicos y disponibilidad' },
        { id: 'assign-appointments', label: 'Asignar citas' },
        { id: 'treatment-prices', label: 'Precios de tratamientos' }
      ];
    }

    if (role === 'medico') {
      return [
        { id: 'overview', label: 'Dashboard' },
        { id: 'medical-history', label: 'Historia clinica' },
        { id: 'edit-history', label: 'Editar historia y tratamiento' },
        { id: 'cancel-appointments', label: 'Cancelar citas' }
      ];
    }

    if (role === 'admin') {
      return [
        { id: 'overview', label: 'Dashboard general' },
        { id: 'register-users', label: 'Gestion de usuarios' },
        { id: 'doctors-availability', label: 'Disponibilidad medica' },
        { id: 'assign-appointments', label: 'Citas' },
        { id: 'reports', label: 'Reportes' },
        { id: 'treatment-prices', label: 'Tratamientos y costos' },
        { id: 'medical-history', label: 'Historias clinicas' },
        { id: 'all-bills', label: 'Facturacion' }
      ];
    }

    return [
      { id: 'overview', label: 'Dashboard' },
      { id: 'full-history', label: 'Historia completa' },
      { id: 'all-bills', label: 'Todas mis facturas' },
      { id: 'pending-bills', label: 'Facturas pendientes' }
    ];
  }

  function renderSidebar() {
    const items = getSidebarConfigForRole(state.activeRole);

    const roleSwitcher = state.roles.length > 1
      ? `
      <div class="role-switcher mt-3">
        <button class="btn btn-nav-secondary w-100 text-start" id="toggleRoleSwitch" type="button">
          Cambiar rol
        </button>
        <div class="role-switcher-panel d-none" id="roleSwitchPanel">
          ${state.roles
            .slice()
            .sort((a, b) => (window.Synapse.ROLE_ID_MAP[a] || 999) - (window.Synapse.ROLE_ID_MAP[b] || 999))
            .map((role) => `<button type="button" class="btn btn-sm ${role === state.activeRole ? 'btn-nav-primary' : 'btn-nav-secondary'} w-100 role-option" data-role="${role}">${roleLabels[role]}</button>`)
            .join('')}
        </div>
      </div>
      `
      : '';

    const sidebarMenu = state.activeRole === 'admin'
      ? `
        <div class="sidebar-nav" id="sidebarNav">
          <button type="button" class="sidebar-link ${state.activeView === 'overview' ? 'active' : ''}" data-view="overview">Dashboard general</button>
          <details class="admin-group" open>
            <summary>Operacion recepcion</summary>
            <div class="admin-group-items">
              <button type="button" class="sidebar-link ${state.activeView === 'register-users' ? 'active' : ''}" data-view="register-users">Gestion de usuarios</button>
              <button type="button" class="sidebar-link ${state.activeView === 'doctors-availability' ? 'active' : ''}" data-view="doctors-availability">Disponibilidad medica</button>
              <button type="button" class="sidebar-link ${state.activeView === 'assign-appointments' ? 'active' : ''}" data-view="assign-appointments">Citas</button>
              <button type="button" class="sidebar-link ${state.activeView === 'treatment-prices' ? 'active' : ''}" data-view="treatment-prices">Tratamientos y costos</button>
            </div>
          </details>
          <details class="admin-group">
            <summary>Clinico</summary>
            <div class="admin-group-items">
              <button type="button" class="sidebar-link ${state.activeView === 'medical-history' ? 'active' : ''}" data-view="medical-history">Historias clinicas</button>
            </div>
          </details>
          <details class="admin-group">
            <summary>Facturacion</summary>
            <div class="admin-group-items">
              <button type="button" class="sidebar-link ${state.activeView === 'all-bills' ? 'active' : ''}" data-view="all-bills">Facturacion</button>
              <button type="button" class="sidebar-link ${state.activeView === 'reports' ? 'active' : ''}" data-view="reports">Reportes</button>
            </div>
          </details>
        </div>
      `
      : `
        <div class="sidebar-nav" id="sidebarNav">
          ${items
            .map((item) => `<button type="button" class="sidebar-link ${state.activeView === item.id ? 'active' : ''}" data-view="${item.id}">${item.label}</button>`)
            .join('')}
        </div>
      `;

    sidebarRoot.innerHTML = `
      <div class="sidebar-header mb-3">
        <p class="sidebar-kicker mb-1">Vista activa</p>
        <h2 class="h5 mb-0">${roleLabels[state.activeRole]}</h2>
      </div>
      ${sidebarMenu}
      <div class="sidebar-bottom mt-4">
        <button type="button" class="sidebar-link ${state.activeView === 'account' ? 'active' : ''}" data-view="account">Cuenta</button>
        ${roleSwitcher}
      </div>
    `;

    sidebarRoot.querySelectorAll('.sidebar-link[data-view]').forEach((button) => {
      button.addEventListener('click', () => {
        state.activeView = button.dataset.view;
        renderSidebar();
        renderMain();
      });
    });

    sidebarRoot.querySelector('#toggleRoleSwitch')?.addEventListener('click', () => {
      sidebarRoot.querySelector('#roleSwitchPanel')?.classList.toggle('d-none');
    });

    sidebarRoot.querySelectorAll('.role-option').forEach((button) => {
      button.addEventListener('click', () => {
        state.activeRole = button.dataset.role;
        state.activeView = 'overview';
        renderSidebar();
        renderMain();
      });
    });
  }

  function renderGreetingCard(extraContent = '') {
    return `
      <div class="dashboard-card mb-3">
        <h1 class="h4 mb-2">Hola, ${getCurrentUserDisplayName()}.</h1>
        ${extraContent}
      </div>
    `;
  }

  async function renderReceptionistOverview() {
    const now = new Date();
    const thisMonthFacturas = state.data.facturas.filter((factura) => {
      const created = new Date(factura.created_at);
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    });

    const resumenEstado = state.data.facturas.reduce((acc, factura) => {
      const key = factura.estado || 'desconocido';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    let tratamientosFrecuentes = [];
    const citas = state.data.appointments.slice(0, 40);
    const detalles = await Promise.all(citas.map((cita) => api(`/treatments/cita/${cita.id_cita}`).catch(() => [])));
    const mapCount = {};
    detalles.flat().forEach((trat) => {
      const desc = trat.descripcion || 'Sin descripcion';
      mapCount[desc] = (mapCount[desc] || 0) + 1;
    });

    tratamientosFrecuentes = Object.entries(mapCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const maxValue = Math.max(...tratamientosFrecuentes.map((item) => item[1]), 1);

    return `
      ${renderGreetingCard()}
      <div class="row g-3 mb-3">
        <div class="col-md-4">
          <div class="dashboard-card metric-card">
            <p class="dashboard-muted mb-1">Facturado este mes</p>
            <h2 class="h4 mb-0">${formatCOP(thisMonthFacturas.reduce((sum, f) => sum + Number(f.monto || 0), 0))}</h2>
          </div>
        </div>
        <div class="col-md-8">
          <div class="dashboard-card">
            <p class="dashboard-muted mb-2">Estado de facturas</p>
            <div class="state-chip-wrap">
              ${Object.entries(resumenEstado).map(([estado, total]) => `<span class="state-chip"><strong>${estado}:</strong> ${total}</span>`).join('') || '<span class="dashboard-muted">Sin facturas registradas.</span>'}
            </div>
          </div>
        </div>
      </div>
      <div class="dashboard-card">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2 class="h5 mb-0">Tratamientos mas usados</h2>
          <small class="dashboard-muted">Basado en citas consultadas</small>
        </div>
        ${tratamientosFrecuentes.length === 0
          ? '<p class="dashboard-muted mb-0">No hay tratamientos asociados a citas.</p>'
          : `<div class="chart-bars">${tratamientosFrecuentes
              .map(([label, value]) => `
                <div class="chart-row">
                  <span class="chart-label">${label}</span>
                  <div class="chart-track"><div class="chart-fill" style="width:${Math.round((value / maxValue) * 100)}%"></div></div>
                  <span class="chart-value">${value}</span>
                </div>`)
              .join('')}</div>`}
      </div>
    `;
  }

  async function renderAdminDashboard() {
    const doctors = state.data.doctors || [];
    const receptionists = state.data.receptionists || [];
    const patients = state.data.patients || [];

    return `
      ${renderGreetingCard()}
      <div class="row g-3 mb-3">
        <div class="col-md-4">
          <div class="dashboard-card metric-card">
            <p class="dashboard-muted mb-1">Total medicos</p>
            <h2 class="h4 mb-0">${doctors.length}</h2>
          </div>
        </div>
        <div class="col-md-4">
          <div class="dashboard-card metric-card">
            <p class="dashboard-muted mb-1">Total recepcionistas</p>
            <h2 class="h4 mb-0">${receptionists.length}</h2>
          </div>
        </div>
        <div class="col-md-4">
          <div class="dashboard-card metric-card">
            <p class="dashboard-muted mb-1">Total pacientes</p>
            <h2 class="h4 mb-0">${patients.length}</h2>
          </div>
        </div>
      </div>
      
      <div class="dashboard-card mb-3">
        <h2 class="h5 mb-3">Médicos</h2>
        <select id="doctorFilterSelect" class="form-select synapse-input mb-2">
          <option value="">Selecciona un médico...</option>
          ${doctors.map((d) => `<option value="${d.id_usuario}">${d.nombre} ${d.apellido}</option>`).join('')}
        </select>
        <div id="doctorDetails" class="table-responsive d-none">
          <table class="table dashboard-table mb-0">
            <tbody id="doctorDetailsBody"></tbody>
          </table>
        </div>
      </div>

      <div class="dashboard-card mb-3">
        <h2 class="h5 mb-3">Recepcionistas</h2>
        <select id="receptionistFilterSelect" class="form-select synapse-input mb-2">
          <option value="">Selecciona un recepcionista...</option>
          ${receptionists.map((r) => `<option value="${r.id_usuario}">${r.nombre} ${r.apellido}</option>`).join('')}
        </select>
        <div id="receptionistDetails" class="table-responsive d-none">
          <table class="table dashboard-table mb-0">
            <tbody id="receptionistDetailsBody"></tbody>
          </table>
        </div>
      </div>

      <div class="dashboard-card">
        <h2 class="h5 mb-3">Pacientes</h2>
        <select id="patientFilterSelect" class="form-select synapse-input mb-2">
          <option value="">Selecciona un paciente...</option>
          ${patients.map((p) => `<option value="${p.id_usuario}">${p.nombre} ${p.apellido}</option>`).join('')}
        </select>
        <div id="patientDetails" class="table-responsive d-none">
          <table class="table dashboard-table mb-0">
            <tbody id="patientDetailsBody"></tbody>
          </table>
        </div>
      </div>
    `;
  }

  function hydrateAdminDashboard() {
    const doctorSelect = document.getElementById('doctorFilterSelect');
    const receptionistSelect = document.getElementById('receptionistFilterSelect');
    const patientSelect = document.getElementById('patientFilterSelect');

    if (doctorSelect) {
      doctorSelect.addEventListener('change', () => {
        const doctorId = Number(doctorSelect.value);
        const detailsDiv = document.getElementById('doctorDetails');
        const bodyDiv = document.getElementById('doctorDetailsBody');

        if (!doctorId) {
          detailsDiv.classList.add('d-none');
          return;
        }

        const doctor = state.data.doctors.find((d) => d.id_usuario === doctorId);
        bodyDiv.innerHTML = `
          <tr><th>Nombre</th><td>${doctor?.nombre || '-'} ${doctor?.apellido || ''}</td></tr>
          <tr><th>Especialidad</th><td>${doctor?.especialidad || '-'}</td></tr>
          <tr><th>Correo</th><td>${doctor?.email || '-'}</td></tr>
          <tr><th>Telefono</th><td>${doctor?.telefono || '-'}</td></tr>
          <tr><th>Citas pendientes</th><td>${state.data.appointments?.filter((a) => a.id_medico === doctorId && a.id_estado === 1).length || 0}</td></tr>
        `;
        detailsDiv.classList.remove('d-none');
      });
    }

    if (receptionistSelect) {
      receptionistSelect.addEventListener('change', () => {
        const receptionistId = Number(receptionistSelect.value);
        const detailsDiv = document.getElementById('receptionistDetails');
        const bodyDiv = document.getElementById('receptionistDetailsBody');

        if (!receptionistId) {
          detailsDiv.classList.add('d-none');
          return;
        }

        const receptionist = state.data.receptionists.find((u) => u.id_usuario === receptionistId);
        bodyDiv.innerHTML = `
          <tr><th>Nombre</th><td>${receptionist?.nombre || '-'} ${receptionist?.apellido || ''}</td></tr>
          <tr><th>Correo</th><td>${receptionist?.email || '-'}</td></tr>
          <tr><th>Telefono</th><td>${receptionist?.telefono || '-'}</td></tr>
          <tr><th>Roles</th><td>${receptionist?.roles?.join(', ') || '-'}</td></tr>
        `;
        detailsDiv.classList.remove('d-none');
      });
    }

    if (patientSelect) {
      patientSelect.addEventListener('change', () => {
        const patientId = Number(patientSelect.value);
        const detailsDiv = document.getElementById('patientDetails');
        const bodyDiv = document.getElementById('patientDetailsBody');

        if (!patientId) {
          detailsDiv.classList.add('d-none');
          return;
        }

        const patient = state.data.patients.find((p) => p.id_usuario === patientId);
        bodyDiv.innerHTML = `
          <tr><th>Nombre</th><td>${patient?.nombre || '-'} ${patient?.apellido || ''}</td></tr>
          <tr><th>Correo</th><td>${patient?.email || '-'}</td></tr>
          <tr><th>Telefono</th><td>${patient?.telefono || '-'}</td></tr>
          <tr><th>Fecha de nacimiento</th><td>${patient?.fecha_nacimiento ? new Date(patient.fecha_nacimiento).toLocaleDateString() : '-'}</td></tr>
          <tr><th>Citas totales</th><td>${state.data.appointments?.filter((a) => a.id_paciente === patientId).length || 0}</td></tr>
          <tr><th>Citas pendientes</th><td>${state.data.appointments?.filter((a) => a.id_paciente === patientId && a.id_estado === 1).length || 0}</td></tr>
        `;
        detailsDiv.classList.remove('d-none');
      });
    }
  }

  function renderDoctorsAvailability() {
    const todayInput = new Date().toISOString().slice(0, 10);

    return `
      ${renderGreetingCard()}
      <div class="dashboard-card mb-3">
        <h2 class="h5 mb-2">Disponibilidad de medicos</h2>
        <p class="dashboard-muted mb-3">Capacidad diaria por medico: 10 citas.</p>
        <div class="d-flex gap-2 align-items-center mb-3">
          <label for="availabilityDate" class="form-label mb-0">Fecha</label>
          <input type="date" id="availabilityDate" class="form-control synapse-input" value="${todayInput}" style="max-width: 220px;">
          <button type="button" class="btn btn-nav-secondary btn-sm" id="refreshAvailabilityBtn">Actualizar</button>
        </div>
        <div class="table-responsive">
          <table class="table dashboard-table mb-0" id="availabilityTable"></table>
        </div>
      </div>
    `;
  }

  function renderAssignAppointments() {
    const specialtyOptions = [...new Set(state.data.doctors.map((d) => d.especialidad).filter(Boolean))]
      .map((spec) => `<option value="${spec}">${spec}</option>`)
      .join('');

    const patientOptions = state.data.patients
      .map((patient) => `<option value="${patient.id_usuario}">${patient.nombre} ${patient.apellido}</option>`)
      .join('');

    return `
      ${renderGreetingCard()}
      <div class="dashboard-card">
        <h2 class="h5 mb-3">Asignar cita</h2>
        <form id="appointmentForm" class="row g-3">
          <div class="col-md-6">
            <label class="form-label" for="appointmentPatient">Paciente</label>
            <select class="form-select synapse-input" id="appointmentPatient" required>
              <option value="">Selecciona paciente</option>
              ${patientOptions}
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="appointmentDateTime">Fecha y hora</label>
            <input class="form-control synapse-input" id="appointmentDateTime" type="datetime-local" required>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="appointmentType">Tipo de cita</label>
            <select class="form-select synapse-input" id="appointmentType">
              <option value="regular">Consulta regular</option>
              ${specialtyOptions}
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="appointmentDoctor">Medico disponible</label>
            <select class="form-select synapse-input" id="appointmentDoctor" required></select>
            <small class="dashboard-muted" id="doctorAvailabilityMessage"></small>
          </div>
          <div class="col-12">
            <label class="form-label" for="appointmentReason">Motivo</label>
            <textarea class="form-control synapse-input" id="appointmentReason" rows="2" placeholder="Motivo de consulta"></textarea>
          </div>
          <div class="col-12 d-flex gap-2">
            <button class="btn btn-nav-primary" type="submit">Guardar cita</button>
            <span class="dashboard-muted" id="appointmentFeedback"></span>
          </div>
        </form>
      </div>
    `;
  }

  function renderRegisterUsers() {
    const canAssignAdmin = state.activeRole === 'admin';

    return `
      ${renderGreetingCard()}
      <div class="dashboard-card">
        <h2 class="h5 mb-3">Registrar usuario</h2>
        <form id="registerUserForm" class="row g-3">
          <div class="col-md-6"><label class="form-label">Nombres</label><input class="form-control synapse-input" id="newNombre" required></div>
          <div class="col-md-6"><label class="form-label">Apellidos</label><input class="form-control synapse-input" id="newApellido" required></div>
          <div class="col-md-6"><label class="form-label">Correo</label><input class="form-control synapse-input" id="newEmail" type="email" required></div>
          <div class="col-md-6"><label class="form-label">Documento</label><input class="form-control synapse-input" id="newDocumento" required></div>
          <div class="col-md-6"><label class="form-label">Telefono</label><input class="form-control synapse-input" id="newTelefono" placeholder="Opcional"></div>
          <div class="col-md-6"><label class="form-label">Fecha de nacimiento</label><input class="form-control synapse-input" id="newFechaNacimiento" type="date" placeholder="Opcional"></div>
          <div class="col-md-12"><label class="form-label">Direccion</label><input class="form-control synapse-input" id="newDireccion" placeholder="Opcional"></div>
          <div class="col-md-6"><label class="form-label">Contrasena</label><input class="form-control synapse-input" id="newPassword" type="password" required></div>
          <div class="col-md-6">
            <label class="form-label">Rol</label>
            <select class="form-select synapse-input" id="newRole" required>
              <option value="4">Paciente</option>
              <option value="3">Recepcionista</option>
              <option value="2">Medico</option>
              ${canAssignAdmin ? '<option value="1">Administrador</option>' : ''}
            </select>
          </div>
          <div class="col-12 d-none" id="newRoleExtras">
            <div class="row g-3">
              <div class="col-md-6">
                <label class="form-label" for="newNumeroLicencia">Numero de licencia</label>
                <input class="form-control synapse-input" id="newNumeroLicencia" placeholder="Requerido para medico">
              </div>
              <div class="col-md-6">
                <label class="form-label" for="newIdEspecialidad">Especialidad</label>
                <input class="form-control synapse-input" id="newIdEspecialidad" type="number" min="1" placeholder="Requerido para medico">
              </div>
            </div>
          </div>
          <div class="col-12 d-flex gap-2 align-items-center">
            <button class="btn btn-nav-primary" type="submit">Registrar</button>
            <span class="dashboard-muted" id="registerFeedback"></span>
          </div>
        </form>
      </div>
      <div class="dashboard-card mt-3">
        <h2 class="h5 mb-2">Roles de usuarios existentes</h2>

        <p class="dashboard-muted mb-3">Para agregar o remover roles de usuarios existentes, ve a la siguiente vista:</p>
        <button type="button" class="btn btn-nav-primary" id="goToManageUsersBtn">Gestionar usuarios</button>
      </div>
    `;
  }

  function renderTreatmentPrices() {
    return `
      ${renderGreetingCard()}
      <div class="dashboard-card">
        <h2 class="h5 mb-2">Precios de tratamientos</h2>
        <p class="dashboard-muted mb-3">La API actual permite crear y listar tratamientos. La edicion directa de costo no esta disponible en backend.</p>
        <form id="createTreatmentForm" class="row g-3 mb-4">
          <div class="col-md-6">
            <label class="form-label" for="treatmentDescription">Descripcion</label>
            <input id="treatmentDescription" class="form-control synapse-input" required>
          </div>
          <div class="col-md-4">
            <label class="form-label" for="treatmentCost">Costo</label>
            <input id="treatmentCost" class="form-control synapse-input" type="number" min="0" step="0.01" required>
          </div>
          <div class="col-md-2 d-flex align-items-end">
            <button type="submit" class="btn btn-nav-primary w-100">Crear</button>
          </div>
        </form>
        <div class="table-responsive">
          <table class="table dashboard-table mb-0">
            <thead><tr><th>ID</th><th>Descripcion</th><th>Costo</th></tr></thead>
            <tbody id="treatmentPricesBody">
              ${state.data.treatments.map((t) => `
                <tr>
                  <td>${t.id_tratamiento || '-'}</td>
                  <td>${t.descripcion || '-'}</td>
                  <td>${formatCOP(t.costo || 0)}</td>
                </tr>
              `).join('') || '<tr><td colspan="3">No hay tratamientos.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function hydrateTreatmentPrices() {
    const form = document.getElementById('createTreatmentForm');
    if (!form) {
      return;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const descripcion = document.getElementById('treatmentDescription').value.trim();
      const costo = Number(document.getElementById('treatmentCost').value);

      if (!descripcion || !Number.isFinite(costo) || costo < 0) {
        window.Synapse.showToast('Ingresa descripcion y costo validos', 'info');
        return;
      }

      try {
        await api('/treatments', {
          method: 'POST',
          body: JSON.stringify({ descripcion, costo })
        });
        window.Synapse.showToast('Tratamiento creado correctamente', 'success');
        await loadBaseData();
        mainRoot.innerHTML = renderTreatmentPrices();
        hydrateTreatmentPrices();
      } catch (error) {
        window.Synapse.showToast(error.message || 'No se pudo crear el tratamiento', 'error');
      }
    });
  }

  async function renderReports() {
    const totalCitas = state.data.appointments.length;
    const citasPendientes = state.data.appointments.filter((cita) => String(cita.estado || '').toLowerCase().includes('pend')).length;
    const citasCanceladas = state.data.appointments.filter((cita) => String(cita.estado || '').toLowerCase().includes('cancel')).length;
    const totalFacturado = state.data.facturas.reduce((sum, factura) => sum + Number(factura.monto || 0), 0);
    const totalPendiente = state.data.facturas.reduce((sum, factura) => sum + Number(factura.saldo_pendiente || 0), 0);

    let doctorRows = [];
    try {
      const today = new Date().toISOString().slice(0, 10);
      const availability = await api(`/doctors/availability?date=${today}`);
      doctorRows = Array.isArray(availability) ? availability : [];
    } catch (error) {
      doctorRows = [];
    }

    return `
      ${renderGreetingCard()}
      <div class="row g-3 mb-3">
        <div class="col-md-4"><div class="dashboard-card metric-card"><p class="dashboard-muted mb-1">Total citas</p><h2 class="h4 mb-0">${totalCitas}</h2></div></div>
        <div class="col-md-4"><div class="dashboard-card metric-card"><p class="dashboard-muted mb-1">Citas pendientes</p><h2 class="h4 mb-0">${citasPendientes}</h2></div></div>
        <div class="col-md-4"><div class="dashboard-card metric-card"><p class="dashboard-muted mb-1">Citas canceladas</p><h2 class="h4 mb-0">${citasCanceladas}</h2></div></div>
      </div>
      <div class="row g-3 mb-3">
        <div class="col-md-6"><div class="dashboard-card metric-card"><p class="dashboard-muted mb-1">Facturado total</p><h2 class="h4 mb-0">${formatCOP(totalFacturado)}</h2></div></div>
        <div class="col-md-6"><div class="dashboard-card metric-card"><p class="dashboard-muted mb-1">Saldo pendiente total</p><h2 class="h4 mb-0">${formatCOP(totalPendiente)}</h2></div></div>
      </div>
      <div class="dashboard-card">
        <h2 class="h5 mb-3">Disponibilidad medica de hoy</h2>
        <div class="table-responsive">
          <table class="table dashboard-table mb-0">
            <thead><tr><th>Medico</th><th>Especialidad</th><th>Ocupadas</th><th>Disponibles</th></tr></thead>
            <tbody>
              ${doctorRows.map((item) => `
                <tr>
                  <td>${item.doctor?.nombre || ''} ${item.doctor?.apellido || ''}</td>
                  <td>${item.doctor?.especialidad || '-'}</td>
                  <td>${item.ocupadas ?? 0}</td>
                  <td>${item.disponibles ?? 0}</td>
                </tr>
              `).join('') || '<tr><td colspan="4">No hay datos de disponibilidad.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderManageUsers() {
    return `
      ${renderGreetingCard()}
      <div class="dashboard-card">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2 class="h5 mb-0">Gestionar usuarios</h2>
          <button type="button" class="btn btn-nav-secondary btn-sm" id="refreshUsersBtn">Actualizar</button>
        </div>
        <p class="dashboard-muted mb-3">Agrega o remueve roles de usuarios existentes.</p>
        <div class="table-responsive">
          <table class="table dashboard-table mb-0">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Roles</th>
                <th>Agregar rol</th>
                <th>Remover rol</th>
              </tr>
            </thead>
            <tbody id="manageUsersBody">
              <tr><td colspan="5">Cargando usuarios...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderBookAppointment() {
    const doctorOptions = state.data.doctors
      .map((doctor) => `<option value="${doctor.id_usuario}">${doctor.nombre} ${doctor.apellido} - ${doctor.especialidad || 'Sin especialidad'}</option>`)
      .join('');

    return `
      ${renderGreetingCard()}
      <div class="dashboard-card mb-3">
        <h2 class="h5 mb-3">Agendar cita</h2>
        <form id="selfAppointmentForm" class="row g-3">
          <div class="col-md-6">
            <label class="form-label" for="selfAppointmentDoctor">Medico</label>
            <select class="form-select synapse-input" id="selfAppointmentDoctor" required>
              <option value="">Selecciona medico</option>
              ${doctorOptions}
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="selfAppointmentDateTime">Fecha y hora</label>
            <input class="form-control synapse-input" id="selfAppointmentDateTime" type="datetime-local" required>
          </div>
          <div class="col-12">
            <label class="form-label" for="selfAppointmentReason">Motivo</label>
            <textarea class="form-control synapse-input" id="selfAppointmentReason" rows="2" required></textarea>
          </div>
          <div class="col-12 d-flex gap-2 align-items-center">
            <button class="btn btn-nav-primary" type="submit">Agendar</button>
            <small class="dashboard-muted" id="selfAppointmentFeedback"></small>
          </div>
        </form>
      </div>
      <div class="dashboard-card">
        <h2 class="h5 mb-3">Mis citas</h2>
        <div class="list-group list-group-flush">
          ${getMyPatientAppointments()
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
            .map((appointment) => `
              <div class="list-group-item bg-transparent px-0 border-bottom dashboard-item-row">
                <strong>${formatDate(appointment.fecha)}</strong>
                <span>${appointment.medico || '-'}</span>
                <span class="dashboard-muted">${appointment.estado || '-'}</span>
              </div>
            `)
            .join('') || '<p class="dashboard-muted mb-0">Aun no tienes citas registradas.</p>'}
        </div>
      </div>
    `;
  }

  function getMyDoctorAppointments() {
    return state.data.appointments.filter((appointment) => isCurrentDoctorName(appointment.medico));
  }

  function getMyPatientAppointments() {
    return state.data.appointments.filter((appointment) => isCurrentPatientName(appointment.paciente));
  }

  async function renderDoctorOverview() {
    const allMine = getMyDoctorAppointments().sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    const today = new Date();
    const todays = allMine.filter((appointment) => sameDay(new Date(appointment.fecha), today));
    const nextThree = todays.slice(0, 3);
    const rest = todays.slice(3);

    return `
      ${renderGreetingCard()}
      <div class="row g-3 mb-3">
        <div class="col-lg-3">
          <div class="dashboard-card metric-card h-100">
            <p class="dashboard-muted mb-1">Citas de hoy</p>
            <h2 class="display-6 mb-0">${todays.length}</h2>
          </div>
        </div>
        <div class="col-lg-9">
          <div class="d-grid gap-2">
            ${nextThree.map((appointment) => `
              <div class="dashboard-card appointment-card-horizontal">
                <strong>${appointment.paciente}</strong>
                <span>${formatDate(appointment.fecha)}</span>
                <span class="dashboard-muted">${appointment.motivo || 'Sin motivo'}</span>
              </div>
            `).join('') || '<div class="dashboard-card"><p class="dashboard-muted mb-0">No hay citas proximas para hoy.</p></div>'}
          </div>
        </div>
      </div>
      <div class="dashboard-card">
        <h2 class="h5 mb-3">Resto de citas desde hoy</h2>
        <div class="list-group list-group-flush">
          ${[...rest, ...allMine.filter((appointment) => new Date(appointment.fecha) > new Date(today.setHours(23, 59, 59, 999)))].map((appointment) => `
            <div class="list-group-item bg-transparent px-0 border-bottom dashboard-item-row">
              <strong>${appointment.paciente}</strong>
              <span>${formatDate(appointment.fecha)}</span>
              <span class="dashboard-muted">${appointment.estado}</span>
            </div>
          `).join('') || '<p class="dashboard-muted mb-0">No hay mas citas en agenda.</p>'}
        </div>
      </div>
    `;
  }

  function renderMedicalHistorySearch() {
    const mine = getMyDoctorAppointments();
    const patientNames = [...new Set(mine.map((appointment) => appointment.paciente))];

    return `
      ${renderGreetingCard()}
      <div class="dashboard-card">
        <h2 class="h5 mb-3">Historia clinica por paciente</h2>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label" for="historyPatientSelect">Paciente</label>
            <select class="form-select synapse-input" id="historyPatientSelect">
              <option value="">Selecciona paciente</option>
              ${patientNames.map((name) => `<option value="${name}">${name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="mt-3" id="historyResults"></div>
      </div>
    `;
  }

  function renderEditHistory() {
    const today = new Date();
    const todaysAppointments = getMyDoctorAppointments().filter((appointment) => sameDay(new Date(appointment.fecha), today));

    return `
      ${renderGreetingCard()}
      <div class="dashboard-card">
        <h2 class="h5 mb-3">Editar historia y asignar tratamiento</h2>
        <p class="dashboard-muted">Solo puedes editar historias de citas del dia actual.</p>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label" for="editHistoryCita">Cita de hoy</label>
            <select class="form-select synapse-input" id="editHistoryCita">
              <option value="">Selecciona cita</option>
              ${todaysAppointments.map((appointment) => `<option value="${appointment.id_cita}">${appointment.paciente} - ${formatDate(appointment.fecha)}</option>`).join('')}
            </select>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="assignTreatmentSelect">Tratamiento</label>
            <select class="form-select synapse-input" id="assignTreatmentSelect">
              <option value="">Selecciona tratamiento</option>
              ${state.data.treatments.map((treatment) => `<option value="${treatment.id_tratamiento}">${treatment.descripcion}</option>`).join('')}
            </select>
          </div>
          <div class="col-12">
            <label class="form-label" for="historyDescription">Descripcion general</label>
            <textarea class="form-control synapse-input" id="historyDescription" rows="2"></textarea>
          </div>
          <div class="col-12">
            <label class="form-label" for="historyNotes">Observaciones</label>
            <textarea class="form-control synapse-input" id="historyNotes" rows="2"></textarea>
          </div>
          <div class="col-12 d-flex gap-2">
            <button class="btn btn-nav-primary" id="saveHistoryBtn" type="button">Guardar historia</button>
            <button class="btn btn-nav-secondary" id="assignTreatmentBtn" type="button">Asignar tratamiento</button>
          </div>
          <div class="col-12"><small class="dashboard-muted" id="editHistoryFeedback"></small></div>
        </div>
      </div>
    `;
  }

  function renderCancelAppointments() {
    const now = new Date();
    const upcoming = getMyDoctorAppointments().filter((appointment) => new Date(appointment.fecha) > now);

    return `
      ${renderGreetingCard()}
      <div class="dashboard-card">
        <h2 class="h5 mb-3">Cancelar citas futuras</h2>
        <div class="list-group list-group-flush" id="cancelAppointmentsList">
          ${upcoming.map((appointment) => `
            <div class="list-group-item bg-transparent px-0 border-bottom d-flex justify-content-between gap-2 align-items-center">
              <div>
                <strong>${appointment.paciente}</strong>
                <div class="dashboard-muted">${formatDate(appointment.fecha)} · ${appointment.motivo || 'Sin motivo'}</div>
              </div>
              <button class="btn btn-sm btn-outline-danger cancel-appointment-btn" data-id="${appointment.id_cita}">Cancelar</button>
            </div>
          `).join('') || '<p class="dashboard-muted mb-0">No hay citas futuras para cancelar.</p>'}
        </div>
      </div>
    `;
  }

  async function renderPatientOverview() {
    const mine = getMyPatientAppointments().sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
    const now = new Date();
    const upcoming = mine.filter((appointment) => new Date(appointment.fecha) >= now).slice(0, 5);
    const recent = mine.filter((appointment) => new Date(appointment.fecha) < now).slice(-2);

    const historyDetails = await Promise.all(recent.map((appointment) => api(`/medical-records/${appointment.id_cita}`).catch(() => null)));

    const myFacturas = state.data.facturas.filter((factura) => {
      const cita = mine.find((appointment) => String(appointment.id_cita) === String(factura.id_cita));
      return Boolean(cita);
    });

    const pending = myFacturas.filter((factura) => Number(factura.saldo_pendiente || 0) > 0);

    return `
      ${renderGreetingCard()}
      <div class="row g-3 mb-3">
        <div class="col-lg-6">
          <div class="dashboard-card h-100">
            <h2 class="h5 mb-2">Proximas citas</h2>
            ${upcoming.map((appointment) => `<div class="dashboard-item-row"><strong>${formatDate(appointment.fecha)}</strong><span>${appointment.medico}</span></div>`).join('') || '<p class="dashboard-muted mb-0">No tienes citas proximas.</p>'}
          </div>
        </div>
        <div class="col-lg-6">
          <div class="dashboard-card h-100">
            <h2 class="h5 mb-2">Facturas pendientes</h2>
            ${pending.map((factura) => `<div class="dashboard-item-row"><strong>Factura #${factura.id_factura}</strong><span>${formatCOP(factura.saldo_pendiente)}</span></div>`).join('') || '<p class="dashboard-muted mb-0">No tienes facturas pendientes.</p>'}
          </div>
        </div>
      </div>
      <div class="dashboard-card">
        <h2 class="h5 mb-2">Ultimas historias clinicas</h2>
        ${historyDetails.map((record, index) => `
          <div class="history-entry">
            <strong>Cita #${recent[index]?.id_cita || '-'}</strong>
            <p class="mb-1">${record?.descripcion_general || 'Sin descripcion registrada.'}</p>
            <small class="dashboard-muted">${record?.observaciones || 'Sin observaciones.'}</small>
          </div>
        `).join('') || '<p class="dashboard-muted mb-0">Aun no hay historias para mostrar.</p>'}
      </div>
    `;
  }

  async function renderFullHistory() {
    const mine = getMyPatientAppointments();
    const historyDetails = await Promise.all(mine.map((appointment) => api(`/medical-records/${appointment.id_cita}`).catch(() => null)));

    return `
      ${renderGreetingCard()}
      <div class="dashboard-card">
        <h2 class="h5 mb-3">Historia clinica completa</h2>
        ${historyDetails.map((record, index) => `
          <div class="history-entry">
            <strong>Cita #${mine[index]?.id_cita || '-'}</strong>
            <p class="mb-1">${record?.descripcion_general || 'Sin descripcion registrada.'}</p>
            <small class="dashboard-muted">${record?.observaciones || 'Sin observaciones.'}</small>
          </div>
        `).join('') || '<p class="dashboard-muted mb-0">No hay historia clinica asociada.</p>'}
      </div>
    `;
  }

  function getMyFacturas() {
    const myAppointments = getMyPatientAppointments();
    return state.data.facturas.filter((factura) => myAppointments.some((appointment) => String(appointment.id_cita) === String(factura.id_cita)));
  }

  function renderAllBills() {
    const facturas = state.activeRole === 'paciente' ? getMyFacturas() : state.data.facturas;

    return `
      ${renderGreetingCard()}
      <div class="dashboard-card">
        <h2 class="h5 mb-3">Facturas</h2>
        <div class="table-responsive">
          <table class="table dashboard-table mb-0">
            <thead><tr><th>Factura</th><th>Estado</th><th>Monto</th><th>Pagado</th><th>Pendiente</th></tr></thead>
            <tbody>
              ${facturas.map((factura) => `
                <tr>
                  <td>#${factura.id_factura}</td>
                  <td>${factura.estado}</td>
                  <td>${formatCOP(factura.monto)}</td>
                  <td>${formatCOP(factura.total_pagado)}</td>
                  <td>${formatCOP(factura.saldo_pendiente)}</td>
                </tr>
              `).join('') || '<tr><td colspan="5">No hay facturas disponibles.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderPendingBills() {
    const pending = getMyFacturas().filter((factura) => Number(factura.saldo_pendiente || 0) > 0);

    return `
      ${renderGreetingCard()}
      <div class="dashboard-card mb-3">
        <h2 class="h5 mb-3">Facturas pendientes</h2>
        <div class="row g-3">
          ${pending.map((factura) => `
            <div class="col-md-6 col-lg-4">
              <button type="button" class="pending-bill-card" data-factura="${factura.id_factura}">
                <strong>Factura #${factura.id_factura}</strong>
                <span>Saldo: ${formatCOP(factura.saldo_pendiente)}</span>
              </button>
            </div>
          `).join('') || '<p class="dashboard-muted mb-0">No tienes facturas pendientes.</p>'}
        </div>
      </div>
      <div class="dashboard-card ${state.selectedFactura ? '' : 'd-none'}" id="paymentBox">
        <h2 class="h5 mb-3">Registrar pago</h2>
        <form id="paymentForm" class="row g-3">
          <div class="col-md-4">
            <label class="form-label">Factura</label>
            <input class="form-control synapse-input" id="payFacturaId" readonly>
          </div>
          <div class="col-md-4">
            <label class="form-label">Saldo pendiente</label>
            <input class="form-control synapse-input" id="payFacturaPending" readonly>
          </div>
          <div class="col-md-4">
            <label class="form-label" for="payAmount">Monto a pagar</label>
            <input class="form-control synapse-input" id="payAmount" type="number" min="1" required>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="payMethod">Metodo de pago</label>
            <input class="form-control synapse-input" id="payMethod" placeholder="efectivo, tarjeta, transferencia" required>
          </div>
          <div class="col-12 d-flex gap-2 align-items-center">
            <button class="btn btn-nav-primary" type="submit">Pagar</button>
            <small class="dashboard-muted" id="paymentFeedback"></small>
          </div>
        </form>
      </div>
    `;
  }

  function renderAccount() {
    const canEditAll = state.activeRole === 'admin' || state.activeRole === 'recepcionista';
    const fieldEditable = (value) => canEditAll || value === null || value === undefined || value === '';

    return `
      <div class="dashboard-card">
        <h2 class="h5 mb-3">Cuenta</h2>
        <form id="accountForm" class="row g-3">
          <div class="col-md-6">
            <label class="form-label" for="accountNombre">Nombre</label>
            <input class="form-control synapse-input" id="accountNombre" value="${state.user.firstName || ''}" ${fieldEditable(state.user.firstName) ? '' : 'readonly'}>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="accountApellido">Apellido</label>
            <input class="form-control synapse-input" id="accountApellido" value="${state.user.lastName || ''}" ${fieldEditable(state.user.lastName) ? '' : 'readonly'}>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="accountEmail">Correo</label>
            <input class="form-control synapse-input" id="accountEmail" type="email" value="${state.user.email || ''}" ${fieldEditable(state.user.email) ? '' : 'readonly'}>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="accountDocumento">Documento</label>
            <input class="form-control synapse-input" id="accountDocumento" value="${state.user.documento || ''}" ${fieldEditable(state.user.documento) ? '' : 'readonly'}>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="accountTelefono">Telefono</label>
            <input class="form-control synapse-input" id="accountTelefono" value="${state.user.telefono || ''}" ${fieldEditable(state.user.telefono) ? '' : 'readonly'}>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="accountFechaNacimiento">Fecha de nacimiento</label>
            <input class="form-control synapse-input" id="accountFechaNacimiento" type="date" value="${state.user.fecha_nacimiento ? String(state.user.fecha_nacimiento).slice(0, 10) : ''}" ${fieldEditable(state.user.fecha_nacimiento) ? '' : 'readonly'}>
          </div>
          <div class="col-md-12">
            <label class="form-label" for="accountDireccion">Direccion</label>
            <input class="form-control synapse-input" id="accountDireccion" value="${state.user.direccion || ''}" ${fieldEditable(state.user.direccion) ? '' : 'readonly'}>
          </div>
          <div class="col-md-6">
            <label class="form-label" for="accountPassword">Nueva contrasena</label>
            <input class="form-control synapse-input" id="accountPassword" type="password" placeholder="Dejar vacio si no cambia">
          </div>
          <div class="col-md-6 d-flex align-items-end">
            <button class="btn btn-nav-primary w-100" id="saveAccountBtn" type="submit">Guardar cambios</button>
          </div>
          <div class="col-12">
            <small class="dashboard-muted" id="accountFeedback"></small>
          </div>
        </form>
        <div class="dashboard-note mt-3">Tu contraseña siempre puede cambiarse. Los demas campos solo se pueden completar una vez si siguen vacios, salvo recepcion y administradores.</div>
      </div>
    `;
  }

  function hydrateAccountForm() {
    const form = document.getElementById('accountForm');
    if (!form) {
      return;
    }

    const feedback = document.getElementById('accountFeedback');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      feedback.textContent = '';

      const payload = {};
      const nombre = document.getElementById('accountNombre').value.trim();
      const apellido = document.getElementById('accountApellido').value.trim();
      const email = document.getElementById('accountEmail').value.trim();
      const documento = document.getElementById('accountDocumento').value.trim();
      const telefono = document.getElementById('accountTelefono').value.trim();
      const direccion = document.getElementById('accountDireccion').value.trim();
      const fechaNacimiento = document.getElementById('accountFechaNacimiento').value;
      const password = document.getElementById('accountPassword').value.trim();

      if (nombre) payload.nombre = nombre;
      if (apellido) payload.apellido = apellido;
      if (email) payload.email = email;
      if (documento) payload.documento = documento;
      if (telefono) payload.telefono = telefono;
      if (direccion) payload.direccion = direccion;
      if (fechaNacimiento) payload.fecha_nacimiento = fechaNacimiento;
      if (password) payload.password = password;

      try {
        const updated = await api(`/users/${state.user.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (updated?.user) {
          state.user = {
            ...state.user,
            ...window.Synapse.safeUser(updated.user),
            telefono: updated.user.telefono ?? state.user.telefono,
            direccion: updated.user.direccion ?? state.user.direccion,
            fecha_nacimiento: updated.user.fecha_nacimiento ?? state.user.fecha_nacimiento
          };
          window.Synapse.setSession({ token: state.token, user: updated.user });
          updateGreeting();
        }

        window.Synapse.showToast('Cuenta actualizada correctamente', 'success');
        feedback.textContent = '';
        setTimeout(() => {
          renderSidebar();
          renderMain();
        }, 300);
      } catch (error) {
        const errorMsg = error.message || 'No se pudo actualizar la cuenta.';
        window.Synapse.showToast(errorMsg, 'error');
        feedback.textContent = errorMsg;
      }
    });
  }

  function hydrateAvailabilityTable() {
    const input = document.getElementById('availabilityDate');
    const table = document.getElementById('availabilityTable');
    const refreshBtn = document.getElementById('refreshAvailabilityBtn');
    if (!input || !table) {
      return;
    }

    const renderTable = async () => {
      const selectedDate = input.value;
      if (!selectedDate) {
        return;
      }

      try {
        const availability = await api(`/doctors/availability?date=${selectedDate}`);
        const rows = Array.isArray(availability) ? availability : [];

        table.innerHTML = `
          <thead>
            <tr><th>Medico</th><th>Especialidad</th><th>Agenda del dia</th><th>Disponibles</th></tr>
          </thead>
          <tbody>
            ${rows.map((item) => `
              <tr>
                <td>${item.doctor?.nombre || ''} ${item.doctor?.apellido || ''}</td>
                <td>${item.doctor?.especialidad || '-'}</td>
                <td>${item.ocupadas ?? 0}/10</td>
                <td>${item.disponibles ?? 0}</td>
              </tr>
            `).join('') || '<tr><td colspan="4">No hay medicos registrados.</td></tr>'}
          </tbody>
        `;
      } catch (error) {
        table.innerHTML = '<thead><tr><th>Medico</th><th>Especialidad</th><th>Agenda del dia</th><th>Disponibles</th></tr></thead><tbody><tr><td colspan="4">No se pudo consultar disponibilidad.</td></tr></tbody>';
        window.Synapse.showToast(error.message || 'No se pudo consultar disponibilidad', 'error');
      }
    };

    input.addEventListener('change', renderTable);
    refreshBtn?.addEventListener('click', renderTable);
    renderTable();
  }

  function hydrateAssignAppointment() {
    const form = document.getElementById('appointmentForm');
    if (!form) {
      return;
    }

    const dateInput = document.getElementById('appointmentDateTime');
    const typeInput = document.getElementById('appointmentType');
    const doctorInput = document.getElementById('appointmentDoctor');
    const availabilityMessage = document.getElementById('doctorAvailabilityMessage');
    const feedback = document.getElementById('appointmentFeedback');

    async function getAvailableDoctors() {
      const selectedDate = dateInput.value ? new Date(dateInput.value).toISOString().slice(0, 10) : null;
      const selectedType = typeInput.value;

      if (!selectedDate) {
        doctorInput.innerHTML = '<option value="">Selecciona fecha y hora</option>';
        availabilityMessage.textContent = 'Selecciona una fecha para consultar disponibilidad.';
        return;
      }

      try {
        const availability = await api(`/doctors/availability?date=${selectedDate}`);
        const rows = Array.isArray(availability) ? availability : [];
        const filtered = rows
          .filter((row) => Number(row.disponibles || 0) > 0)
          .filter((row) => selectedType === 'regular' || row.doctor?.especialidad === selectedType)
          .map((row) => row.doctor)
          .filter(Boolean);

        doctorInput.innerHTML = filtered.length > 0
          ? filtered.map((doctor) => `<option value="${doctor.id_usuario}">${doctor.nombre} ${doctor.apellido} - ${doctor.especialidad || '-'}</option>`).join('')
          : '<option value="">No hay medicos disponibles</option>';

        availabilityMessage.textContent = filtered.length > 0
          ? ''
          : 'No hay medicos disponibles para la seleccion actual.';
      } catch (error) {
        doctorInput.innerHTML = '<option value="">No se pudo cargar disponibilidad</option>';
        availabilityMessage.textContent = error.message || 'No se pudo consultar disponibilidad';
      }
    }

    dateInput.addEventListener('change', getAvailableDoctors);
    typeInput.addEventListener('change', getAvailableDoctors);
    getAvailableDoctors();

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      feedback.textContent = '';

      try {
        await api('/appointments', {
          method: 'POST',
          body: JSON.stringify({
            id_paciente: Number(document.getElementById('appointmentPatient').value),
            id_medico: Number(doctorInput.value),
            fecha: new Date(dateInput.value).toISOString(),
            motivo: document.getElementById('appointmentReason').value.trim(),
            observaciones: ''
          })
        });

        window.Synapse.showToast('Cita asignada correctamente', 'success');
        feedback.textContent = 'Cita asignada correctamente.';
        await loadBaseData();
        getAvailableDoctors();
      } catch (error) {
        window.Synapse.showToast(error.message || 'No se pudo crear la cita', 'error');
        feedback.textContent = error.message || 'No se pudo crear la cita.';
      }
    });
  }

  function hydrateRegisterUsers() {
    const form = document.getElementById('registerUserForm');
    if (!form) {
      return;
    }

    const feedback = document.getElementById('registerFeedback');
    const roleSelect = document.getElementById('newRole');
    const extraFields = document.getElementById('newRoleExtras');
    const roleExtras = {
      numeroLicencia: document.getElementById('newNumeroLicencia'),
      idEspecialidad: document.getElementById('newIdEspecialidad')
    };

    const toggleRoleExtras = () => {
      const role = Number(roleSelect.value);
      const showDoctorExtras = role === 2;
      const showStaffExtras = role === 1 || role === 2 || role === 3;

      extraFields.classList.toggle('d-none', !showStaffExtras);
      roleExtras.numeroLicencia.closest('.col-md-6').classList.toggle('d-none', !showDoctorExtras);
      roleExtras.idEspecialidad.closest('.col-md-6').classList.toggle('d-none', !showDoctorExtras);
    };

    roleSelect?.addEventListener('change', toggleRoleExtras);
    toggleRoleExtras();

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      feedback.textContent = '';

      const role = Number(roleSelect.value);
      const extras = {};

      if (role === 2) {
        const numeroLicencia = roleExtras.numeroLicencia.value.trim();
        const idEspecialidad = Number(roleExtras.idEspecialidad.value);
        if (!numeroLicencia || !Number.isFinite(idEspecialidad) || idEspecialidad <= 0) {
          feedback.textContent = 'Para medico, completa numero de licencia y especialidad.';
          return;
        }
        extras.numero_licencia = numeroLicencia;
        extras.id_especialidad = idEspecialidad;
      }

      const payload = {
        nombre: document.getElementById('newNombre').value.trim(),
        apellido: document.getElementById('newApellido').value.trim(),
        email: document.getElementById('newEmail').value.trim(),
        documento: document.getElementById('newDocumento').value.trim(),
        password: document.getElementById('newPassword').value.trim(),
        roles: [role]
      };

      const telefono = document.getElementById('newTelefono').value.trim();
      const fecha_nacimiento = document.getElementById('newFechaNacimiento').value;
      const direccion = document.getElementById('newDireccion').value.trim();

      if (telefono) payload.telefono = telefono;
      if (fecha_nacimiento) payload.fecha_nacimiento = fecha_nacimiento;
      if (direccion) payload.direccion = direccion;

      if (Object.keys(extras).length > 0) {
        payload.extras = extras;
      }

      try {
        await api('/users', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        window.Synapse.showToast('Usuario registrado correctamente', 'success');
        feedback.textContent = 'Usuario registrado.';
        form.reset();
        toggleRoleExtras();
      } catch (error) {
        window.Synapse.showToast(error.message || 'No se pudo registrar', 'error');
        feedback.textContent = error.message || 'No se pudo registrar.';
      }
    });

    const manageUsersBtn = document.getElementById('goToManageUsersBtn');
    manageUsersBtn?.addEventListener('click', () => {
      state.activeView = 'manage-users';
      renderSidebar();
      renderMain();
    });
  }

  function hydrateManageUsers() {
    const body = document.getElementById('manageUsersBody');
    if (!body) {
      return;
    }

    const refreshBtn = document.getElementById('refreshUsersBtn');

    const loadUsers = async () => {
      body.innerHTML = '<tr><td colspan="5">Cargando usuarios...</td></tr>';

      try {
        const response = await api('/users');
        const users = Array.isArray(response?.users) ? response.users : [];

        body.innerHTML = users.map((user) => {
          const roles = Array.isArray(user.roles) ? user.roles : [];
          const removableRoles = roles.map((roleName) => {
            const roleId = window.Synapse.ROLE_ID_MAP[roleName] || '';
            return `<button type="button" class="btn btn-sm btn-outline-danger remove-role-btn" data-user="${user.id_usuario}" data-role-id="${roleId}" data-role-name="${roleName}">${roleName}</button>`;
          }).join(' ');

          const availableRoles = Object.keys(window.Synapse.ROLE_ID_MAP)
            .filter((roleName) => !roles.includes(roleName))
            .filter((roleName) => state.activeRole === 'admin' || roleName !== 'admin');

          const roleOptions = availableRoles
            .map((roleName) => `<option value="${roleName}">${roleName}</option>`)
            .join('');

          return `
            <tr>
              <td>${user.nombre || ''} ${user.apellido || ''}<br><small>#${user.id_usuario}</small></td>
              <td>${user.email || '-'}</td>
              <td>${roles.join(', ') || '-'}</td>
              <td>
                <div class="d-flex gap-2">
                  <select class="form-select synapse-input form-select-sm add-role-select" data-user="${user.id_usuario}" style="min-width: 150px;">
                    <option value="">Selecciona</option>
                    ${roleOptions}
                  </select>
                  <button type="button" class="btn btn-sm btn-nav-primary add-role-btn" data-user="${user.id_usuario}">Agregar</button>
                </div>
              </td>
              <td><div class="d-flex flex-wrap gap-1">${removableRoles || '-'}</div></td>
            </tr>
          `;
        }).join('') || '<tr><td colspan="5">No hay usuarios.</td></tr>';

        body.querySelectorAll('.add-role-btn').forEach((button) => {
          button.addEventListener('click', async () => {
            const userId = Number(button.dataset.user);
            const select = body.querySelector(`.add-role-select[data-user="${userId}"]`);
            const roleName = select?.value;
            const roleId = window.Synapse.ROLE_ID_MAP[roleName];

            if (!roleId) {
              window.Synapse.showToast('Selecciona un rol para agregar', 'info');
              return;
            }

            const extras = {};

            if (roleName === 'medico') {
              const numeroLicencia = prompt('Número de licencia del médico:');
              const idEspecialidad = prompt('ID de especialidad:');

              if (!numeroLicencia || !idEspecialidad) {
                window.Synapse.showToast('Licencia y especialidad son requeridas para médicos', 'info');
                return;
              }

              extras.numero_licencia = numeroLicencia;
              extras.id_especialidad = Number(idEspecialidad);
            }

            try {
              await api('/users/assign-role', {
                method: 'POST',
                body: JSON.stringify({ id_usuario: userId, id_tipo: roleId, extras })
              });
              window.Synapse.showToast('Rol agregado correctamente', 'success');
              location.reload();
            } catch (error) {
              window.Synapse.showToast(error.message || 'No se pudo agregar el rol', 'error');
            }
          });
        });

        body.querySelectorAll('.remove-role-btn').forEach((button) => {
          button.addEventListener('click', async () => {
            const userId = Number(button.dataset.user);
            const roleId = Number(button.dataset.roleId);
            const roleName = button.dataset.roleName;

            try {
              await api('/users/remove-role', {
                method: 'POST',
                body: JSON.stringify({ id_usuario: userId, id_tipo: roleId })
              });
              window.Synapse.showToast(`Rol ${roleName} removido`, 'success');
              location.reload();
            } catch (error) {
              window.Synapse.showToast(error.message || 'No se pudo remover el rol', 'error');
            }
          });
        });
      } catch (error) {
        body.innerHTML = '<tr><td colspan="5">No se pudo cargar la lista de usuarios.</td></tr>';
        window.Synapse.showToast(error.message || 'No se pudo cargar la lista de usuarios', 'error');
      }
    };

    refreshBtn?.addEventListener('click', loadUsers);
    loadUsers();
  }

  function hydrateBookAppointment() {
    const form = document.getElementById('selfAppointmentForm');
    if (!form) {
      return;
    }

    const feedback = document.getElementById('selfAppointmentFeedback');

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      feedback.textContent = '';

      const doctorId = Number(document.getElementById('selfAppointmentDoctor').value);
      const dateTime = document.getElementById('selfAppointmentDateTime').value;
      const reason = document.getElementById('selfAppointmentReason').value.trim();

      if (!doctorId || !dateTime || !reason) {
        window.Synapse.showToast('Completa todos los campos', 'info');
        return;
      }

      try {
        await api('/appointments', {
          method: 'POST',
          body: JSON.stringify({
            id_paciente: Number(state.user.id || state.user.id_usuario),
            id_medico: doctorId,
            fecha: new Date(dateTime).toISOString(),
            motivo: reason,
            observaciones: ''
          })
        });

        await loadBaseData();
        window.Synapse.showToast('Cita agendada correctamente', 'success');
        feedback.textContent = 'Cita agendada correctamente.';
        renderMain();
      } catch (error) {
        window.Synapse.showToast(error.message || 'No se pudo agendar la cita', 'error');
        feedback.textContent = error.message || 'No se pudo agendar la cita.';
      }
    });
  }

  function hydrateRoleAssignment() {
    const form = document.getElementById('roleAssignForm');
    if (!form) {
      return;
    }

    const feedback = document.getElementById('roleAssignFeedback');
    const roleSelect = document.getElementById('roleAssignType');
    const extraFields = document.getElementById('roleAssignExtras');
    const extras = {
      numeroLicencia: document.getElementById('roleAssignNumeroLicencia'),
      idEspecialidad: document.getElementById('roleAssignIdEspecialidad')
    };

    const toggle = () => {
      const role = Number(roleSelect.value);
      const showDoctorExtras = role === 2;
      const showStaffExtras = role === 1 || role === 2 || role === 3;
      extraFields.classList.toggle('d-none', !showStaffExtras);
      extras.numeroLicencia.closest('.col-md-6').classList.toggle('d-none', !showDoctorExtras);
      extras.idEspecialidad.closest('.col-md-6').classList.toggle('d-none', !showDoctorExtras);
    };

    roleSelect?.addEventListener('change', toggle);
    toggle();

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      feedback.textContent = '';

      const userId = Number(document.getElementById('roleAssignUserId').value);
      const role = Number(roleSelect.value);
      if (!Number.isFinite(userId) || userId <= 0) {
        feedback.textContent = 'Ingresa un id de usuario valido.';
        return;
      }

      const payload = { id_tipo: role, extras: {} };

      if (role === 2) {
        const numeroLicencia = extras.numeroLicencia.value.trim();
        const idEspecialidad = Number(extras.idEspecialidad.value);
        if (!numeroLicencia || !Number.isFinite(idEspecialidad) || idEspecialidad <= 0) {
          feedback.textContent = 'Para medico, completa numero de licencia y especialidad.';
          return;
        }
        payload.extras.numero_licencia = numeroLicencia;
        payload.extras.id_especialidad = idEspecialidad;
      }

      try {
        await api('/users/assign-role', {
          method: 'POST',
          body: JSON.stringify({ id_usuario: userId, ...payload })
        });
        feedback.textContent = 'Rol cambiado correctamente.';
      } catch (error) {
        feedback.textContent = error.message || 'No se pudo cambiar el rol.';
      }
    });
  }

  function hydrateMedicalHistorySearch() {
    const select = document.getElementById('historyPatientSelect');
    const root = document.getElementById('historyResults');
    if (!select || !root) {
      return;
    }

    select.addEventListener('change', async () => {
      root.innerHTML = '<p class="dashboard-muted">Cargando...</p>';
      const selectedPatient = select.value;
      const appointments = getMyDoctorAppointments().filter((appointment) => appointment.paciente === selectedPatient);
      const records = await Promise.all(appointments.map((appointment) => api(`/medical-records/${appointment.id_cita}`).catch(() => null)));

      root.innerHTML = records.map((record, index) => `
        <div class="history-entry">
          <strong>Cita #${appointments[index].id_cita} · ${formatDate(appointments[index].fecha)}</strong>
          <p class="mb-1">${record?.descripcion_general || 'Sin descripcion.'}</p>
          <small class="dashboard-muted">${record?.observaciones || 'Sin observaciones.'}</small>
        </div>
      `).join('') || '<p class="dashboard-muted">No hay historia clinica asociada.</p>';
    });
  }

  function hydrateEditHistory() {
    const citaSelect = document.getElementById('editHistoryCita');
    if (!citaSelect) {
      return;
    }

    const desc = document.getElementById('historyDescription');
    const obs = document.getElementById('historyNotes');
    const feedback = document.getElementById('editHistoryFeedback');
    const saveBtn = document.getElementById('saveHistoryBtn');
    const assignBtn = document.getElementById('assignTreatmentBtn');
    const treatmentSelect = document.getElementById('assignTreatmentSelect');

    citaSelect.addEventListener('change', async () => {
      feedback.textContent = '';
      const citaId = Number(citaSelect.value);
      if (!citaId) {
        desc.value = '';
        obs.value = '';
        return;
      }

      const record = await api(`/medical-records/${citaId}`).catch(() => null);
      desc.value = record?.descripcion_general || '';
      obs.value = record?.observaciones || '';
    });

    saveBtn?.addEventListener('click', async () => {
      const citaId = Number(citaSelect.value);
      if (!citaId) {
        feedback.textContent = 'Selecciona una cita.';
        return;
      }

      try {
        await api('/medical-records', {
          method: 'POST',
          body: JSON.stringify({
            id_cita: citaId,
            descripcion_general: desc.value.trim(),
            observaciones: obs.value.trim()
          })
        });
        feedback.textContent = 'Historia clinica guardada.';
      } catch (error) {
        feedback.textContent = `${error.message || 'No se pudo guardar.'} (No hay endpoint de actualizacion de historia existente.)`;
      }
    });

    assignBtn?.addEventListener('click', async () => {
      const citaId = Number(citaSelect.value);
      const treatmentId = Number(treatmentSelect.value);
      if (!citaId || !treatmentId) {
        feedback.textContent = 'Selecciona cita y tratamiento.';
        return;
      }

      try {
        await api('/treatments/assign', {
          method: 'POST',
          body: JSON.stringify({ id_cita: citaId, id_tratamiento: treatmentId })
        });
        feedback.textContent = 'Tratamiento asignado.';
      } catch (error) {
        feedback.textContent = error.message || 'No se pudo asignar tratamiento.';
      }
    });
  }

  function hydrateCancelAppointments() {
    document.querySelectorAll('.cancel-appointment-btn').forEach((button) => {
      button.addEventListener('click', async () => {
        const citaId = Number(button.dataset.id);
        try {
          await api(`/appointments/${citaId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ id_estado: 3 })
          });
          window.Synapse.showToast('Cita cancelada', 'success');
          await loadBaseData();
          renderMain();
        } catch (error) {
          window.Synapse.showToast(error.message || 'No se pudo cancelar la cita', 'error');
          button.textContent = 'Error';
        }
      });
    });
  }

  function hydratePendingBills() {
    document.querySelectorAll('.pending-bill-card').forEach((button) => {
      button.addEventListener('click', () => {
        const idFactura = Number(button.dataset.factura);
        state.selectedFactura = getMyFacturas().find((factura) => Number(factura.id_factura) === idFactura) || null;
        renderMain();
      });
    });

    const form = document.getElementById('paymentForm');
    if (!form || !state.selectedFactura) {
      return;
    }

    const facturaInput = document.getElementById('payFacturaId');
    const pendingInput = document.getElementById('payFacturaPending');
    const amountInput = document.getElementById('payAmount');
    const methodInput = document.getElementById('payMethod');
    const feedback = document.getElementById('paymentFeedback');

    facturaInput.value = `#${state.selectedFactura.id_factura}`;
    pendingInput.value = formatCOP(state.selectedFactura.saldo_pendiente);
    amountInput.max = Number(state.selectedFactura.saldo_pendiente || 0);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      feedback.textContent = '';

      const monto = Number(amountInput.value);
      const saldo = Number(state.selectedFactura.saldo_pendiente || 0);

      if (!Number.isFinite(monto) || monto <= 0) {
        feedback.textContent = 'Ingresa un monto valido.';
        return;
      }

      if (monto > saldo) {
        feedback.textContent = 'El monto no puede superar el saldo pendiente.';
        return;
      }

      try {
        await api('/pagos', {
          method: 'POST',
          body: JSON.stringify({
            id_factura: state.selectedFactura.id_factura,
            monto,
            metodo_pago: methodInput.value.trim() || 'efectivo'
          })
        });

        window.Synapse.showToast('Pago registrado correctamente', 'success');
        await loadBaseData();
        state.selectedFactura = null;
        renderMain();
      } catch (error) {
        window.Synapse.showToast(error.message || 'No se pudo registrar el pago', 'error');
        feedback.textContent = error.message || 'No se pudo registrar el pago.';
      }
    });
  }

  async function renderMain() {
    const role = state.activeRole;
    const view = state.activeView;

    if (role === 'admin' && view === 'overview') {
      mainRoot.innerHTML = await renderAdminDashboard();
      hydrateAdminDashboard();
      return;
    } else if ((role === 'recepcionista' || role === 'admin') && view === 'overview') {
      mainRoot.innerHTML = await renderReceptionistOverview();
    } else if (role === 'medico' && view === 'overview') {
      mainRoot.innerHTML = await renderDoctorOverview();
    } else if (role === 'paciente' && view === 'overview') {
      mainRoot.innerHTML = await renderPatientOverview();
    } else if (view === 'doctors-availability') {
      mainRoot.innerHTML = renderDoctorsAvailability();
      hydrateAvailabilityTable();
      return;
    } else if (view === 'assign-appointments') {
      mainRoot.innerHTML = renderAssignAppointments();
      hydrateAssignAppointment();
      return;
    } else if (view === 'register-users') {
      mainRoot.innerHTML = renderRegisterUsers();
      hydrateRegisterUsers();
      return;
    } else if (view === 'manage-users') {
      mainRoot.innerHTML = renderManageUsers();
      hydrateManageUsers();
      return;
    } else if (view === 'reports') {
      mainRoot.innerHTML = await renderReports();
      return;
    } else if (view === 'book-appointment') {
      mainRoot.innerHTML = renderBookAppointment();
      hydrateBookAppointment();
      return;
    } else if (view === 'treatment-prices') {
      mainRoot.innerHTML = renderTreatmentPrices();
      hydrateTreatmentPrices();
      return;
    } else if (view === 'medical-history') {
      mainRoot.innerHTML = renderMedicalHistorySearch();
      hydrateMedicalHistorySearch();
      return;
    } else if (view === 'edit-history') {
      mainRoot.innerHTML = renderEditHistory();
      hydrateEditHistory();
      return;
    } else if (view === 'cancel-appointments') {
      mainRoot.innerHTML = renderCancelAppointments();
      hydrateCancelAppointments();
      return;
    } else if (view === 'full-history') {
      mainRoot.innerHTML = await renderFullHistory();
    } else if (view === 'all-bills') {
      mainRoot.innerHTML = renderAllBills();
    } else if (view === 'pending-bills') {
      mainRoot.innerHTML = renderPendingBills();
      hydratePendingBills();
      return;
    } else if (view === 'account') {
      mainRoot.innerHTML = renderAccount();
      hydrateAccountForm();
    } else {
      mainRoot.innerHTML = renderAccount();
      hydrateAccountForm();
    }

    hydratePendingBills();
  }

  logoutButton?.addEventListener('click', () => {
    window.Synapse.clearSession();
    window.location.replace('./auth.html');
  });

  themeToggle?.addEventListener('click', () => {
    renderTheme(window.Synapse.toggleTheme());
  });

  function syncViewFromHash() {
    const viewFromHash = window.location.hash.replace('#', '').trim();
    if (viewFromHash) {
      state.activeView = viewFromHash;
    }
  }

  renderTheme(window.Synapse.getTheme());

  syncViewFromHash();

  window.addEventListener('hashchange', async () => {
    syncViewFromHash();
    renderSidebar();
    await renderMain();
  });

  Promise.all([loadBaseData(), refreshCurrentUser()])
    .then(async () => {
      syncViewFromHash();
      renderSidebar();
      await renderMain();
    })
    .catch(() => {
      mainRoot.innerHTML = '<div class="dashboard-card"><p class="mb-0">No fue posible cargar el dashboard con la sesion actual.</p></div>';
    });
});