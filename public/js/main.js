// public/js/main.js
import { saveLead } from './leads.js';

// ===== VARIABLES GLOBALES =====
let isSubmitting = false;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Nadrika Frontend iniciado');
  
  initFormSubmission();
  initMobileMenu();
  initSmoothScroll();
});

// ===== FORMULARIO DE CONTACTO =====
function initFormSubmission() {
  const form = document.getElementById('leadForm');
  const successMessage = document.getElementById('successMessage');
  
  if (!form) return;
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Prevenir múltiples envíos
    if (isSubmitting) return;
    isSubmitting = true;
    
    // Obtener datos del formulario
    const formData = {
      name: document.getElementById('name').value.trim(),
      email: document.getElementById('email').value.trim(),
      company: document.getElementById('company').value.trim(),
      phone: document.getElementById('phone').value.trim(),
      service: document.getElementById('service').value,
      message: document.getElementById('message').value.trim()
    };
    
    // Validar campos requeridos
    if (!formData.name || !formData.email || !formData.company) {
      alert('Por favor completa todos los campos requeridos');
      isSubmitting = false;
      return;
    }
    
    // Validar email
    if (!isValidEmail(formData.email)) {
      alert('Por favor ingresa un email válido');
      isSubmitting = false;
      return;
    }
    
    // Deshabilitar botón de envío
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Enviando...';
    submitBtn.disabled = true;
    
    try {
      // Guardar lead en Firebase
      const result = await saveLead(formData);
      
      if (result.success) {
        // Mostrar mensaje de éxito
        form.classList.add('hidden');
        successMessage.classList.remove('hidden');
        
        // Resetear formulario
        form.reset();
        
        // Scroll al mensaje de éxito
        successMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Analytics
        if (typeof gtag !== 'undefined') {
          gtag('event', 'generate_lead', {
            'event_category': 'engagement',
            'event_label': formData.service
          });
        }
        
        // Después de 5 segundos, mostrar el formulario de nuevo
        setTimeout(() => {
          successMessage.classList.add('hidden');
          form.classList.remove('hidden');
        }, 5000);
      } else {
        throw new Error(result.error || 'Error al enviar el formulario');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Hubo un error al enviar tu solicitud. Por favor intenta de nuevo.');
    } finally {
      // Rehabilitar botón
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
      isSubmitting = false;
    }
  });
}

// ===== MENÚ MÓVIL =====
function initMobileMenu() {
  const mobileMenuBtn = document.querySelector('.mobile-menu');
  const navLinks = document.querySelector('.nav-links');
  
  if (!mobileMenuBtn || !navLinks) return;
  
  mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    mobileMenuBtn.classList.toggle('active');
  });
  
  // Cerrar menú al hacer click en un link
  const links = navLinks.querySelectorAll('a');
  links.forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('active');
      mobileMenuBtn.classList.remove('active');
    });
  });
}

// ===== SMOOTH SCROLL =====
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');
  
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      
      // Ignorar links vacíos
      if (href === '#') return;
      
      e.preventDefault();
      
      const target = document.querySelector(href);
      if (target) {
        const offsetTop = target.offsetTop - 80; // 80px para el navbar
        window.scrollTo({
          top: offsetTop,
          behavior: 'smooth'
        });
      }
    });
  });
}

// ===== UTILIDADES =====
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// ===== EFECTOS DE SCROLL =====
window.addEventListener('scroll', () => {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
  } else {
    navbar.style.boxShadow = 'none';
  }
});

console.log('✅ Main.js cargado correctamente');