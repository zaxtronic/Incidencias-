// js/register.js

const USER_STORAGE_KEY = 'gestionIncidenciasUsers';

// --- DOMINIOS y ROLES ASOCIADOS ---
// Objeto que mapea dominios permitidos a sus roles base.
// inspedralbes.cat tiene un rol 'base' que luego se refina.
const ALLOWED_DOMAINS_ROLES = {
    'administradorinfo.cat': 'admin',
    'tecnicoinfo.cat':       'tecnico',
    'inspedralbes.cat':      'inspedralbes_base' // Rol temporal para procesar después
};
const STUDENT_PROFESSOR_DOMAIN = 'inspedralbes.cat';

// --- Funciones Auxiliares ---
const getUsersFromStorage = () => {
    try { const d = localStorage.getItem(USER_STORAGE_KEY); return d ? JSON.parse(d) : {}; }
    catch (e) { console.error("Error reading users:", e); return {}; }
};
const saveUsersToStorage = (users) => {
    try { localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users)); return true; }
    catch (e) { console.error("Error saving users:", e); return false; }
};

/**
 * Determina el rol final basado en el email completo.
 * @param {string} email - El correo electrónico completo y validado.
 * @returns {string|null} El rol ('admin', 'tecnico', 'usuario', 'profesor') o null si hay error.
 */
const determineFinalRole = (email) => {
    const domain = email.split('@')[1]?.toLowerCase();
    const localPart = email.split('@')[0];

    if (!domain || !ALLOWED_DOMAINS_ROLES[domain]) {
        return null; // Dominio no permitido o inválido
    }

    const baseRole = ALLOWED_DOMAINS_ROLES[domain];

    if (baseRole === 'inspedralbes_base') {
        // Lógica específica para inspedralbes.cat
        const studentPattern = /^a\d+/i; // Empieza con 'a' y números
        return studentPattern.test(localPart) ? 'usuario' : 'profesor';
    } else {
        // Para admin y tecnico, el rol es directo
        return baseRole; // 'admin' o 'tecnico'
    }
};

// --- Lógica del Formulario de Registro ---
document.getElementById('register-form').addEventListener('submit', function(event) {
    event.preventDefault();

    // Obtener elementos (sin cambios)
    const nameInput = document.getElementById('reg-name');
    const emailInput = document.getElementById('reg-email');
    const passwordInput = document.getElementById('reg-password');
    const confirmPasswordInput = document.getElementById('reg-confirm-password');
    const feedbackDiv = document.getElementById('register-feedback');

    feedbackDiv.textContent = '';
    feedbackDiv.className = 'small mt-3 text-center';

    // Obtener valores (sin cambios)
    const name = nameInput.value.trim();
    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // --- Validaciones Básicas ---
    if (!name || !email || !password || !confirmPassword) {
        feedbackDiv.textContent = 'Completa todos los campos.'; feedbackDiv.classList.add('text-danger'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
         feedbackDiv.textContent = 'Formato de correo inválido.'; feedbackDiv.classList.add('text-danger'); emailInput.focus(); return;
    }
    if (password.length < 6) {
        feedbackDiv.textContent = 'Contraseña mín. 6 caracteres.'; feedbackDiv.classList.add('text-danger'); return;
    }
    if (password !== confirmPassword) {
        feedbackDiv.textContent = 'Las contraseñas no coinciden.'; feedbackDiv.classList.add('text-danger'); confirmPasswordInput.value = ''; return;
    }
    // --- Fin Validaciones Básicas ---


    // --- Determinar Rol y Validar Dominio ---
    const finalRole = determineFinalRole(email);

    if (!finalRole) { // Si la función devuelve null, el dominio no es válido
        feedbackDiv.textContent = 'El dominio del correo electrónico no está permitido para el registro.';
        feedbackDiv.classList.add('text-danger');
        emailInput.focus();
        return;
    }

    // ¡Advertencia de seguridad! (Opcional pero recomendada)
    if (finalRole === 'admin' || finalRole === 'tecnico') {
         console.warn(`¡ATENCIÓN! Registrando usuario con rol privilegiado: ${finalRole} (${email})`);
         // Podrías añadir un confirm() aquí si realmente quieres permitir esto inseguramente.
    }
    // -----------------------------------------


    // --- Verificar si el email ya existe ---
    const existingUsers = getUsersFromStorage();
    if (existingUsers[email]) {
        feedbackDiv.textContent = 'Correo ya registrado. Intenta iniciar sesión.';
        feedbackDiv.classList.add('text-danger');
        emailInput.focus();
        return;
    }


    // --- Crear y guardar nuevo usuario ---
    const newUser = {
        password: password, // ¡Recuerda hashear en producción!
        role: finalRole,    // Usar el rol final determinado
        name: name
    };

    existingUsers[email] = newUser; // Usar email como clave


    // --- Guardar en localStorage y dar Feedback ---
    if (saveUsersToStorage(existingUsers)) {
        feedbackDiv.textContent = `¡Registro exitoso como ${finalRole}! Redirigiendo...`;
        feedbackDiv.classList.add('text-success');
        document.getElementById('register-form').reset();
        // Redirigir siempre al login después del registro
        setTimeout(() => { window.location.href = 'index.html'; }, 3000);
    } else {
        feedbackDiv.textContent = 'Error al guardar el usuario. Inténtalo de nuevo.';
        feedbackDiv.classList.add('text-danger');
        delete existingUsers[email]; // Intentar revertir si falla el guardado
    }
});