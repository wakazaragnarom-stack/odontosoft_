// ============================================
// AUTH.JS - Funciones de autenticación
// ============================================

// ── Mostrar/ocultar contraseña ──────────────────────────────────────────────
function togglePassword(id) {
  const input = document.getElementById(id);
  const icon = input.nextElementSibling;
  if (input.type === "password") {
    input.type = "text";
    icon.textContent = "visibility";
  } else {
    input.type = "password";
    icon.textContent = "visibility_off";
  }
}
window.togglePassword = togglePassword;

// ── Validar correo ───────────────────────────────────────────────────────────
function validarCorreo(correo) {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return regex.test(correo);
}
window.validarCorreo = validarCorreo;

// ── Medidor de fortaleza de contraseña ──────────────────────────────────────
function medirFortaleza(pwd) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  return score;
}

function mostrarFortaleza(pwd) {
  const strengthDiv = document.getElementById('passwordStrength');
  if (!strengthDiv) return;
  
  if (pwd.length === 0) {
    strengthDiv.textContent = '';
    strengthDiv.className = 'password-strength';
    return;
  }
  
  const score = medirFortaleza(pwd);
  let mensaje = '';
  let clase = '';
  if (score <= 1) { mensaje = 'Débil'; clase = 'weak'; }
  else if (score === 2) { mensaje = 'Media'; clase = 'medium'; }
  else { mensaje = 'Fuerte'; clase = 'strong'; }
  
  strengthDiv.textContent = `Fortaleza: ${mensaje}`;
  strengthDiv.className = `password-strength ${clase}`;
}
window.mostrarFortaleza = mostrarFortaleza;

// ── Toast ────────────────────────────────────────────────────────────────────
function toast(msg, tipo = "success") {
  const t = document.getElementById("toast");
  if (!t) {
    console.warn("Toast element not found");
    return;
  }
  t.textContent = msg;
  t.className = `toast show ${tipo}`;
  setTimeout(() => t.classList.remove("show"), 3000);
}
window.toast = toast;

// ── Verificar sesión ────────────────────────────────────────────────────────
function verificarSesion() {
  const usuario = localStorage.getItem('usuario_actual');
  if (!usuario) {
    window.location.href = "login.html";
    return null;
  }
  try {
    return JSON.parse(usuario);
  } catch {
    window.location.href = "login.html";
    return null;
  }
}
window.verificarSesion = verificarSesion;

// ── Cerrar sesión ────────────────────────────────────────────────────────────
function cerrarSesion() {
  localStorage.removeItem('usuario_actual');
  window.location.href = "login.html";
}
window.cerrarSesion = cerrarSesion;

// ── Login ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {

  const correoInput = document.getElementById('inCorreo');
  const correoHelper = document.getElementById('correoHelper');

  // Validación en tiempo real del correo
  correoInput?.addEventListener('input', function() {
    const correo = this.value.trim();
    if (correo.length === 0) {
      correoHelper.classList.remove('show');
      return;
    }
    if (validarCorreo(correo)) {
      correoHelper.classList.remove('show');
    } else {
      correoHelper.textContent = 'Ingresa un correo electrónico válido';
      correoHelper.classList.add('show');
    }
  });

  // Submit del formulario
  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const correo = document.getElementById('inCorreo').value.trim();
    const password = document.getElementById('inPassword').value;
    const btn = document.getElementById('btnLogin');

    if (!correo) {
      toast('✉️ Por favor, ingresa tu correo electrónico', 'warning');
      document.getElementById('inCorreo').focus();
      return;
    }

    if (!validarCorreo(correo)) {
      toast('✉️ Ingresa un correo electrónico válido', 'error');
      document.getElementById('inCorreo').focus();
      return;
    }

    if (!password) {
      toast('🔑 Por favor, ingresa tu contraseña', 'warning');
      document.getElementById('inPassword').focus();
      return;
    }

    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined spinner">progress_activity</span> Verificando...`;

    try {
      const response = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena: password })
      });

      if (!response.ok) {
        let errorMsg = 'Error de autenticación';
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            if (errorData.detail.includes('not found') || errorData.detail.includes('registrado')) {
              errorMsg = '❌ No encontramos una cuenta con este correo';
            } else if (errorData.detail.includes('incorrect') || errorData.detail.includes('contraseña')) {
              errorMsg = '❌ Contraseña incorrecta';
            } else if (errorData.detail.includes('inactivo')) {
              errorMsg = '⛔ Tu cuenta está inactiva. Contacta al administrador.';
            } else {
              errorMsg = `❌ ${errorData.detail}`;
            }
          }
        } catch (_) {
          if (response.status === 404) errorMsg = '❌ No encontramos una cuenta con este correo';
          else if (response.status === 401) errorMsg = '❌ Contraseña incorrecta';
          else errorMsg = `❌ Error ${response.status}. Intenta nuevamente.`;
        }
        throw new Error(errorMsg);
      }

      const usuario = await response.json();
      localStorage.setItem('usuario_actual', JSON.stringify(usuario));
      
      const rolNormalizado = String(usuario.rol || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      const roles = { 'administrador': 'Administrador', 'odontologo': 'Odontólogo', 'paciente': 'Paciente' };
      const rolUsuario = roles[rolNormalizado] || usuario.rol;
      
      toast(`✅ ¡Bienvenido, ${usuario.correo}! (${rolUsuario})`, 'success');

      setTimeout(() => {
        const destino = rolNormalizado === 'paciente' ? 'panel_cliente.html' : (rolNormalizado === 'odontologo' ? 'panel_odontologo.html' : 'panel.html');
        window.location.href = destino;
      }, 2000);

    } catch (error) {
      console.error('Error en login:', error);
      let mensajeError = error.message || 'Ocurrió un error inesperado. Intenta nuevamente.';
      if (mensajeError.includes('Failed to fetch') || mensajeError.includes('NetworkError')) {
        mensajeError = '❌ No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
      }
      toast(mensajeError, 'error');
      btn.disabled = false;
      btn.innerHTML = `<span class="material-symbols-outlined">login</span> Ingresar`;
    }
  });

  }

  // ── Registro ──────────────────────────────────────────────────────────────────
  const registroForm = document.getElementById('registroForm');
  if (!registroForm) return;

  document.getElementById('inCorreo')?.addEventListener('input', function() {
    const error = document.getElementById('correoError');
    if (this.value.length > 0 && !validarCorreo(this.value)) error.classList.add('show');
    else error.classList.remove('show');
  });

  document.getElementById('inPassword')?.addEventListener('input', function() {
    const pwd = this.value;
    const error = document.getElementById('passwordError');
    if (pwd.length > 0 && pwd.length < 6) error.classList.add('show');
    else error.classList.remove('show');
    mostrarFortaleza(pwd);
    verificarCoincidencia();
  });

  document.getElementById('inConfirmPassword')?.addEventListener('input', function() {
    verificarCoincidencia();
  });

  function verificarCoincidencia() {
    const pwd = document.getElementById('inPassword')?.value || '';
    const confirm = document.getElementById('inConfirmPassword')?.value || '';
    const error = document.getElementById('confirmError');
    if (confirm.length > 0 && pwd !== confirm) error.classList.add('show');
    else error.classList.remove('show');
  }

  registroForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const nombre = document.getElementById('inNombre').value.trim();
    const apellido = document.getElementById('inApellido').value.trim();
    const correo = document.getElementById('inCorreo').value.trim();
    const telefono = document.getElementById('inTelefono').value.trim();
    const password = document.getElementById('inPassword').value;
    const confirmPassword = document.getElementById('inConfirmPassword').value;

    if (!nombre || !apellido || !correo || !telefono || !password || !confirmPassword) {
      toast('Todos los campos son obligatorios', 'error');
      return;
    }
    if (!validarCorreo(correo)) {
      toast('Ingresa un correo válido', 'error');
      return;
    }
    if (password.length < 6) {
      toast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }
    if (password !== confirmPassword) {
      toast('Las contraseñas no coinciden', 'error');
      return;
    }

    const btn = document.getElementById('btnRegistrar');
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined spinner">progress_activity</span> Registrando...`;

    try {
      const response = await fetch('http://127.0.0.1:8000/usuarios/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena: password, nombre, apellido, telefono })
      });

      const responseText = await response.text();
      let data;
      try { data = JSON.parse(responseText); }
      catch { throw new Error(`Error: ${responseText.substring(0, 100)}`); }

      if (!response.ok) throw new Error(data.detail || `Error ${response.status}`);

      toast(`✅ ¡Registro exitoso! Bienvenido ${nombre} ${apellido}`);
      document.getElementById('registroForm').reset();
      document.getElementById('passwordStrength').textContent = '';
      document.getElementById('passwordStrength').className = 'password-strength';

      setTimeout(() => { window.location.href = 'login.html'; }, 2000);
    } catch (error) {
      toast(`❌ ${error.message}`, 'error');
      btn.disabled = false;
      btn.innerHTML = `<span class="material-symbols-outlined">how_to_reg</span> Registrarse`;
    }
  });
});