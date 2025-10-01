// public/js/leads.js
import { db, collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, logEvent, analytics } from './firebase-config.js';

// ===== GUARDAR NUEVO LEAD =====
export async function saveLead(leadData) {
  try {
    // Validar datos
    if (!leadData.name || !leadData.email) {
      throw new Error('Nombre y email son requeridos');
    }

    // Crear lead en Firestore
    const docRef = await addDoc(collection(db, 'leads'), {
      name: leadData.name,
      email: leadData.email,
      company: leadData.company || '',
      phone: leadData.phone || '',
      service: leadData.service || '',
      message: leadData.message || '',
      status: 'new',
      source: 'website',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Log evento en Analytics
    logEvent(analytics, 'lead_submitted', {
      service: leadData.service,
      source: 'website'
    });

    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error al guardar lead:', error);
    return { success: false, error: error.message };
  }
}

// ===== OBTENER TODOS LOS LEADS =====
export async function getAllLeads() {
  try {
    const q = query(collection(db, 'leads'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const leads = [];
    querySnapshot.forEach((doc) => {
      leads.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, data: leads };
  } catch (error) {
    console.error('Error al obtener leads:', error);
    return { success: false, error: error.message };
  }
}

// ===== OBTENER LEADS POR ESTADO =====
export async function getLeadsByStatus(status) {
  try {
    const q = query(
      collection(db, 'leads'), 
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const leads = [];
    querySnapshot.forEach((doc) => {
      leads.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, data: leads };
  } catch (error) {
    console.error('Error al obtener leads por estado:', error);
    return { success: false, error: error.message };
  }
}

// ===== OBTENER LEADS POR SERVICIO =====
export async function getLeadsByService(service) {
  try {
    const q = query(
      collection(db, 'leads'), 
      where('service', '==', service),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const leads = [];
    querySnapshot.forEach((doc) => {
      leads.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return { success: true, data: leads };
  } catch (error) {
    console.error('Error al obtener leads por servicio:', error);
    return { success: false, error: error.message };
  }
}

// ===== ACTUALIZAR ESTADO DE LEAD =====
export async function updateLeadStatus(leadId, newStatus) {
  try {
    const leadRef = doc(db, 'leads', leadId);
    await updateDoc(leadRef, {
      status: newStatus,
      updatedAt: new Date()
    });
    
    // Log evento en Analytics
    logEvent(analytics, 'lead_status_updated', {
      status: newStatus
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar lead:', error);
    return { success: false, error: error.message };
  }
}

// ===== OBTENER ESTADÍSTICAS =====
export async function getLeadStats() {
  try {
    const querySnapshot = await getDocs(collection(db, 'leads'));
    
    const stats = {
      total: 0,
      new: 0,
      contacted: 0,
      qualified: 0,
      converted: 0,
      lost: 0,
      byService: {},
      newLast7Days: 0
    };
    
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      stats.total++;
      
      // Contar por estado
      if (data.status) {
        stats[data.status]++;
      }
      
      // Contar por servicio
      if (data.service) {
        stats.byService[data.service] = (stats.byService[data.service] || 0) + 1;
      }
      
      // Contar nuevos en últimos 7 días
      if (data.createdAt && data.createdAt.toDate() > sevenDaysAgo) {
        stats.newLast7Days++;
      }
    });
    
    // Calcular tasa de conversión
    stats.conversionRate = stats.total > 0 
      ? ((stats.converted / stats.total) * 100).toFixed(1)
      : '0.0';
    
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    return { success: false, error: error.message };
  }
}

// ===== EXPORTAR LEADS A CSV =====
export function exportLeadsToCSV(leads) {
  try {
    // Crear headers
    const headers = ['Fecha', 'Nombre', 'Email', 'Empresa', 'Teléfono', 'Servicio', 'Estado', 'Mensaje'];
    
    // Crear filas
    const rows = leads.map(lead => {
      const date = lead.createdAt ? new Date(lead.createdAt.seconds * 1000).toLocaleDateString() : '';
      return [
        date,
        lead.name || '',
        lead.email || '',
        lead.company || '',
        lead.phone || '',
        lead.service || '',
        lead.status || '',
        lead.message || ''
      ];
    });
    
    // Combinar todo
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return { success: true };
  } catch (error) {
    console.error('Error al exportar CSV:', error);
    return { success: false, error: error.message };
  }
}