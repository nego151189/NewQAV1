// public/js/admin.js
import { auth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from './firebase-config.js';
import { getAllLeads, getLeadStats, updateLeadStatus, exportLeadsToCSV } from './leads.js';

// ===== VARIABLES GLOBALES =====
let allLeads = [];
let currentUser = null;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔐 Panel Admin iniciado');
  
  initAuth();
  initLoginForm();
  initNavigation();
  initFilters();
  initExport();
});

// ===== AUTENTICACIÓN =====
function initAuth() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      showAdminPanel();
      loadDashboardData();
    } else {
      currentUser = null;
      showLoginScreen();
    }
  });
}

function initLoginForm() {
  const form = document.getElementById('loginForm');
  const errorDiv = document.getElementById('loginError');
  
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;
    
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Iniciando sesión...';
    submitBtn.disabled = true;
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // El listener onAuthStateChanged manejará el resto
    } catch (error) {
      console.error('Error de login:', error);
      errorDiv.textContent = 'Email o contraseña incorrectos';
      errorDiv.classList.remove('hidden');
      
      setTimeout(() => {
        errorDiv.classList.add('hidden');
      }, 3000);
    } finally {
      submitBtn.textContent = 'Iniciar Sesión';
      submitBtn.disabled = false;
    }
  });
}

function showLoginScreen() {
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('adminPanel').classList.add('hidden');
}

function showAdminPanel() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
}

// ===== NAVEGACIÓN =====
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const views = document.querySelectorAll('.admin-view');
  
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const viewName = link.getAttribute('data-view');
      
      // Actualizar links activos
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      // Actualizar vistas
      views.forEach(v => v.classList.remove('active'));
      document.getElementById(`${viewName}View`).classList.add('active');
      
      // Cargar datos según la vista
      if (viewName === 'leads') {
        loadLeadsTable();
      }
    });
  });
  
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  });
}

// ===== DASHBOARD =====
async function loadDashboardData() {
  try {
    // Obtener estadísticas
    const statsResult = await getLeadStats();
    
    if (statsResult.success) {
      const stats = statsResult.data;
      
      // Actualizar cards de estadísticas
      document.getElementById('totalLeads').textContent = stats.total;
      document.getElementById('newLeads').textContent = stats.newLast7Days;
      document.getElementById('convertedLeads').textContent = stats.converted;
      document.getElementById('conversionRate').textContent = stats.conversionRate + '%';
      
      // Cargar gráfico de servicios
      loadServicesChart(stats.byService);
    }
    
    // Obtener todos los leads para el gráfico de tendencias
    const leadsResult = await getAllLeads();
    if (leadsResult.success) {
      allLeads = leadsResult.data;
      loadTrendChart(allLeads);
    }
  } catch (error) {
    console.error('Error al cargar dashboard:', error);
  }
}

function loadServicesChart(serviceData) {
  const canvas = document.getElementById('servicesChartCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  // Si Chart.js no está disponible, salir
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js no está cargado');
    return;
  }
  
  const labels = {
    'automation': 'Automatización',
    'analytics': 'Analytics',
    'consulting': 'Consultoría',
    'custom': 'Personalizado'
  };
  
  const chartData = {
    labels: Object.keys(serviceData).map(key => labels[key] || key),
    datasets: [{
      label: 'Leads por servicio',
      data: Object.values(serviceData),
      backgroundColor: [
        'rgba(6, 182, 212, 0.7)',
        'rgba(168, 85, 247, 0.7)',
        'rgba(16, 185, 129, 0.7)',
        'rgba(245, 158, 11, 0.7)'
      ],
      borderColor: [
        'rgba(6, 182, 212, 1)',
        'rgba(168, 85, 247, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)'
      ],
      borderWidth: 2
    }]
  };
  
  new Chart(ctx, {
    type: 'doughnut',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom'
        }
      }
    }
  });
}

function loadTrendChart(leads) {
  const canvas = document.getElementById('trendChartCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  
  if (typeof Chart === 'undefined') {
    console.warn('Chart.js no está cargado');
    return;
  }
  
  // Agrupar leads por día (últimos 30 días)
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const dailyCount = {};
  
  // Inicializar con 0 para todos los días
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    dailyCount[dateStr] = 0;
  }
  
  // Contar leads por día
  leads.forEach(lead => {
    if (lead.createdAt) {
      const date = new Date(lead.createdAt.seconds * 1000);
      const dateStr = date.toISOString().split('T')[0];
      if (dailyCount[dateStr] !== undefined) {
        dailyCount[dateStr]++;
      }
    }
  });
  
  const labels = Object.keys(dailyCount).map(dateStr => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es', { month: 'short', day: 'numeric' });
  });
  
  const data = Object.values(dailyCount);
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Leads recibidos',
        data: data,
        borderColor: 'rgba(6, 182, 212, 1)',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      }
    }
  });
}

// ===== TABLA DE LEADS =====
async function loadLeadsTable(filters = {}) {
  try {
    const result = await getAllLeads();
    
    if (result.success) {
      allLeads = result.data;
      
      // Aplicar filtros
      let filteredLeads = [...allLeads];
      
      if (filters.status) {
        filteredLeads = filteredLeads.filter(lead => lead.status === filters.status);
      }
      
      if (filters.service) {
        filteredLeads = filteredLeads.filter(lead => lead.service === filters.service);
      }
      
      if (filters.search) {
        const search = filters.search.toLowerCase();
        filteredLeads = filteredLeads.filter(lead => 
          lead.name.toLowerCase().includes(search) ||
          lead.email.toLowerCase().includes(search) ||
          (lead.company && lead.company.toLowerCase().includes(search))
        );
      }
      
      renderLeadsTable(filteredLeads);
    }
  } catch (error) {
    console.error('Error al cargar leads:', error);
  }
}

function renderLeadsTable(leads) {
  const tbody = document.getElementById('leadsTableBody');
  
  if (leads.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-state">
          <div class="empty-icon">📭</div>
          <p>No hay leads que coincidan con los filtros</p>
        </td>
      </tr>
    `;
    return;
  }
  
  const serviceLabels = {
    'automation': 'Automatización',
    'analytics': 'Analytics',
    'consulting': 'Consultoría',
    'custom': 'Personalizado'
  };
  
  const statusLabels = {
    'new': 'Nuevo',
    'contacted': 'Contactado',
    'qualified': 'Calificado',
    'converted': 'Convertido',
    'lost': 'Perdido'
  };
  
  tbody.innerHTML = leads.map(lead => {
    const date = lead.createdAt 
      ? new Date(lead.createdAt.seconds * 1000).toLocaleDateString()
      : '';
    
    return `
      <tr>
        <td>${date}</td>
        <td><strong>${lead.name}</strong></td>
        <td>${lead.email}</td>
        <td>${lead.company || '-'}</td>
        <td>${serviceLabels[lead.service] || '-'}</td>
        <td>
          <select class="status-select" data-lead-id="${lead.id}" onchange="window.handleStatusChange(this)">
            <option value="new" ${lead.status === 'new' ? 'selected' : ''}>Nuevo</option>
            <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>Contactado</option>
            <option value="qualified" ${lead.status === 'qualified' ? 'selected' : ''}>Calificado</option>
            <option value="converted" ${lead.status === 'converted' ? 'selected' : ''}>Convertido</option>
            <option value="lost" ${lead.status === 'lost' ? 'selected' : ''}>Perdido</option>
          </select>
        </td>
        <td>
          <button onclick="window.showLeadDetails('${lead.id}')" class="btn-outline btn-sm">
            Ver detalles
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// ===== FILTROS =====
function initFilters() {
  const searchInput = document.getElementById('searchLeads');
  const statusFilter = document.getElementById('filterStatus');
  const serviceFilter = document.getElementById('filterService');
  
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      applyFilters();
    });
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      applyFilters();
    });
  }
  
  if (serviceFilter) {
    serviceFilter.addEventListener('change', () => {
      applyFilters();
    });
  }
}

function applyFilters() {
  const filters = {
    search: document.getElementById('searchLeads')?.value || '',
    status: document.getElementById('filterStatus')?.value || '',
    service: document.getElementById('filterService')?.value || ''
  };
  
  loadLeadsTable(filters);
}

// ===== EXPORTAR =====
function initExport() {
  const exportBtn = document.getElementById('exportBtn');
  
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (allLeads.length === 0) {
        alert('No hay leads para exportar');
        return;
      }
      
      const result = exportLeadsToCSV(allLeads);
      if (result.success) {
        alert('Leads exportados correctamente');
      } else {
        alert('Error al exportar leads');
      }
    });
  }
}

// ===== FUNCIONES GLOBALES =====
window.handleStatusChange = async function(select) {
  const leadId = select.getAttribute('data-lead-id');
  const newStatus = select.value;
  
  try {
    const result = await updateLeadStatus(leadId, newStatus);
    if (result.success) {
      // Actualizar dashboard
      loadDashboardData();
    }
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    alert('Error al actualizar el estado del lead');
  }
};

window.showLeadDetails = function(leadId) {
  const lead = allLeads.find(l => l.id === leadId);
  if (!lead) return;
  
  const modal = document.getElementById('leadModal');
  const modalBody = document.getElementById('modalBody');
  
  const serviceLabels = {
    'automation': 'Automatización',
    'analytics': 'Analytics',
    'consulting': 'Consultoría',
    'custom': 'Personalizado'
  };
  
  const date = lead.createdAt 
    ? new Date(lead.createdAt.seconds * 1000).toLocaleString()
    : '';
  
  modalBody.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <div>
        <strong>Nombre:</strong> ${lead.name}
      </div>
      <div>
        <strong>Email:</strong> <a href="mailto:${lead.email}">${lead.email}</a>
      </div>
      <div>
        <strong>Empresa:</strong> ${lead.company || '-'}
      </div>
      <div>
        <strong>Teléfono:</strong> ${lead.phone || '-'}
      </div>
      <div>
        <strong>Servicio:</strong> ${serviceLabels[lead.service] || '-'}
      </div>
      <div>
        <strong>Fecha:</strong> ${date}
      </div>
      <div>
        <strong>Mensaje:</strong><br>
        ${lead.message || 'Sin mensaje'}
      </div>
    </div>
  `;
  
  modal.classList.remove('hidden');
  
  // Cerrar modal
  const closeBtn = document.getElementById('closeModalBtn');
  const closeX = modal.querySelector('.modal-close');
  const overlay = modal.querySelector('.modal-overlay');
  
  closeBtn.onclick = () => modal.classList.add('hidden');
  closeX.onclick = () => modal.classList.add('hidden');
  overlay.onclick = () => modal.classList.add('hidden');
};

console.log('✅ Admin.js cargado correctamente');