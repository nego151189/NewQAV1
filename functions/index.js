// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// ===== CONFIGURACIÓN DE EMAIL =====
// IMPORTANTE: Configura estas variables en Firebase Console
// Firebase Console > Functions > Configuración
const EMAIL_CONFIG = {
  service: 'gmail',
  user: functions.config().email?.user || 'tu-email@gmail.com',
  pass: functions.config().email?.pass || 'tu-app-password'
};

const transporter = nodemailer.createTransport({
  service: EMAIL_CONFIG.service,
  auth: {
    user: EMAIL_CONFIG.user,
    pass: EMAIL_CONFIG.pass
  }
});

// ===== FUNCIÓN: ENVIAR EMAIL AL RECIBIR NUEVO LEAD =====
exports.sendLeadNotification = functions.firestore
  .document('leads/{leadId}')
  .onCreate(async (snap, context) => {
    const leadData = snap.data();
    const leadId = context.params.leadId;
    
    console.log('Nuevo lead recibido:', leadId);
    
    // Email al admin
    const adminMailOptions = {
      from: `Nadrika <${EMAIL_CONFIG.user}>`,
      to: 'admin@nadrika.com', // Cambia esto por tu email
      subject: `🎯 Nuevo Lead: ${leadData.name}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #06b6d4, #a855f7); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .info-row { margin: 15px 0; padding: 15px; background: white; border-radius: 8px; border-left: 4px solid #06b6d4; }
            .label { font-weight: bold; color: #374151; margin-bottom: 5px; }
            .value { color: #6b7280; }
            .message-box { background: white; padding: 20px; border-radius: 8px; margin-top: 20px; border: 2px dashed #d1d5db; }
            .footer { text-align: center; margin-top: 30px; color: #9ca3af; font-size: 14px; }
            .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #06b6d4, #a855f7); color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Nuevo Lead Recibido</h1>
            </div>
            <div class="content">
              <div class="info-row">
                <div class="label">👤 Nombre:</div>
                <div class="value">${leadData.name}</div>
              </div>
              
              <div class="info-row">
                <div class="label">✉️ Email:</div>
                <div class="value"><a href="mailto:${leadData.email}">${leadData.email}</a></div>
              </div>
              
              <div class="info-row">
                <div class="label">🏢 Empresa:</div>
                <div class="value">${leadData.company || 'No especificada'}</div>
              </div>
              
              <div class="info-row">
                <div class="label">📱 Teléfono:</div>
                <div class="value">${leadData.phone || 'No especificado'}</div>
              </div>
              
              <div class="info-row">
                <div class="label">🎯 Servicio de interés:</div>
                <div class="value">${getServiceLabel(leadData.service)}</div>
              </div>
              
              ${leadData.message ? `
                <div class="message-box">
                  <div class="label">💬 Mensaje:</div>
                  <div class="value">${leadData.message}</div>
                </div>
              ` : ''}
              
              <div style="text-align: center;">
                <a href="https://nadrika-f1002.web.app/admin.html" class="btn">
                  Ver en Panel Admin
                </a>
              </div>
            </div>
            <div class="footer">
              <p>Este es un mensaje automático de Nadrika CRM</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    // Email de confirmación al lead
    const leadMailOptions = {
      from: `Nadrika <${EMAIL_CONFIG.user}>`,
      to: leadData.email,
      subject: '¡Gracias por tu interés en Nadrika!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #06b6d4, #a855f7); padding: 40px; text-align: center; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .greeting { font-size: 20px; color: #111827; margin-bottom: 20px; }
            .text { color: #4b5563; margin: 15px 0; }
            .highlight { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #06b6d4; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #9ca3af; font-size: 14px; }
            .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #06b6d4, #a855f7); color: white; text-decoration: none; border-radius: 8px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✨ ¡Bienvenido a Nadrika!</h1>
            </div>
            <div class="content">
              <div class="greeting">Hola ${leadData.name},</div>
              
              <div class="text">
                ¡Gracias por tu interés en nuestras soluciones de Inteligencia Artificial!
              </div>
              
              <div class="highlight">
                <strong>📋 Hemos recibido tu solicitud:</strong><br><br>
                <strong>Servicio:</strong> ${getServiceLabel(leadData.service)}<br>
                <strong>Empresa:</strong> ${leadData.company || 'No especificada'}
              </div>
              
              <div class="text">
                Nuestro equipo revisará tu solicitud y se pondrá en contacto contigo 
                <strong>dentro de las próximas 24 horas</strong> para:
              </div>
              
              <div class="text">
                ✅ Entender mejor tus necesidades<br>
                ✅ Agendar una demo personalizada<br>
                ✅ Responder todas tus preguntas<br>
                ✅ Elaborar una propuesta a tu medida
              </div>
              
              <div style="text-align: center;">
                <a href="https://nadrika-f1002.web.app" class="btn">
                  Visitar nuestro sitio
                </a>
              </div>
              
              <div class="text" style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                Si tienes alguna pregunta urgente, no dudes en responder a este email.
              </div>
            </div>
            <div class="footer">
              <p>Nadrika - Transformando negocios con IA</p>
              <p style="font-size: 12px;">Este es un mensaje automático, por favor no respondas directamente.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    try {
      // Enviar emails
      await transporter.sendMail(adminMailOptions);
      console.log('Email enviado al admin');
      
      await transporter.sendMail(leadMailOptions);
      console.log('Email de confirmación enviado al lead');
      
      return null;
    } catch (error) {
      console.error('Error al enviar emails:', error);
      return null;
    }
  });

// ===== FUNCIÓN: LIMPIAR LEADS ANTIGUOS =====
// Se ejecuta diariamente a las 2 AM
exports.cleanOldLeads = functions.pubsub
  .schedule('0 2 * * *')
  .timeZone('America/Guatemala')
  .onRun(async (context) => {
    console.log('Limpiando leads antiguos...');
    
    const db = admin.firestore();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    try {
      const snapshot = await db.collection('leads')
        .where('createdAt', '<', sixMonthsAgo)
        .where('status', 'in', ['lost', 'converted'])
        .get();
      
      if (snapshot.empty) {
        console.log('No hay leads antiguos para limpiar');
        return null;
      }
      
      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`${snapshot.size} leads antiguos eliminados`);
      
      return null;
    } catch (error) {
      console.error('Error al limpiar leads:', error);
      return null;
    }
  });

// ===== FUNCIÓN: GENERAR REPORTE SEMANAL =====
// Se ejecuta cada lunes a las 9 AM
exports.weeklyReport = functions.pubsub
  .schedule('0 9 * * 1')
  .timeZone('America/Guatemala')
  .onRun(async (context) => {
    console.log('Generando reporte semanal...');
    
    const db = admin.firestore();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    try {
      const snapshot = await db.collection('leads')
        .where('createdAt', '>=', oneWeekAgo)
        .get();
      
      const stats = {
        total: snapshot.size,
        byService: {},
        byStatus: {}
      };
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Contar por servicio
        if (data.service) {
          stats.byService[data.service] = (stats.byService[data.service] || 0) + 1;
        }
        
        // Contar por estado
        if (data.status) {
          stats.byStatus[data.status] = (stats.byStatus[data.status] || 0) + 1;
        }
      });
      
      // Enviar reporte por email
      const mailOptions = {
        from: `Nadrika <${EMAIL_CONFIG.user}>`,
        to: 'admin@nadrika.com',
        subject: `📊 Reporte Semanal - ${stats.total} nuevos leads`,
        html: `
          <h2>Reporte Semanal de Leads</h2>
          <p><strong>Total de leads esta semana:</strong> ${stats.total}</p>
          
          <h3>Por servicio:</h3>
          <ul>
            ${Object.entries(stats.byService).map(([service, count]) => 
              `<li>${getServiceLabel(service)}: ${count}</li>`
            ).join('')}
          </ul>
          
          <h3>Por estado:</h3>
          <ul>
            ${Object.entries(stats.byStatus).map(([status, count]) => 
              `<li>${getStatusLabel(status)}: ${count}</li>`
            ).join('')}
          </ul>
          
          <p><a href="https://nadrika-f1002.web.app/admin.html">Ver panel admin</a></p>
        `
      };
      
      await transporter.sendMail(mailOptions);
      console.log('Reporte semanal enviado');
      
      return null;
    } catch (error) {
      console.error('Error al generar reporte:', error);
      return null;
    }
  });

// ===== FUNCIONES AUXILIARES =====
function getServiceLabel(service) {
  const labels = {
    'automation': 'Automatización con IA',
    'analytics': 'Analytics Avanzado',
    'consulting': 'Consultoría Estratégica',
    'custom': 'Solución Personalizada'
  };
  return labels[service] || service || 'No especificado';
}

function getStatusLabel(status) {
  const labels = {
    'new': 'Nuevo',
    'contacted': 'Contactado',
    'qualified': 'Calificado',
    'converted': 'Convertido',
    'lost': 'Perdido'
  };
  return labels[status] || status;
}