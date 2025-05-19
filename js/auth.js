// js/auth.js - Debe incluirse en TODAS las páginas protegidas

(function() {
    const loggedInUserString = sessionStorage.getItem('loggedInUser');
    const currentPage = window.location.pathname.split('/').pop().split('.')[0]; // "admin", "tecnico", "usuario"
    let requiredRole = null;

    // Determinar rol(es) requerido(s) para la página actual
    if (currentPage === 'admin') requiredRole = 'admin';
    else if (currentPage === 'tecnico') requiredRole = 'tecnico';
    else if (currentPage === 'usuario') requiredRole = ['usuario', 'profesor']; // Permitir ambos

    let user = null;
    if (loggedInUserString) {
        try { user = JSON.parse(loggedInUserString); }
        catch (e) { console.error("Error parsing user data", e); }
    }

    // --- Lógica de Verificación ---
    let isAuthorized = false;
    if (user) {
        if (Array.isArray(requiredRole)) { // Lista de roles permitidos
            if (requiredRole.includes(user.role)) isAuthorized = true;
        } else if (requiredRole) { // Un rol específico
            if (user.role === requiredRole) isAuthorized = true;
        } else { // Si no se define rol, ¿permitir solo por estar logueado? (No aplicable aquí)
           // isAuthorized = true;
        }
    }
    // ---------------------------

    if (!isAuthorized) {
        console.warn(`Acceso no autorizado a ${currentPage}.html. Usuario:`, user, `Rol(es) requerido(s):`, requiredRole);
        sessionStorage.removeItem('loggedInUser');
        window.location.href = 'index.html'; // Redirigir al login
        throw new Error("Auth required or role mismatch."); // Detener script
    }

    // --- Funciones Globales ---
    window.logout = function() {
        sessionStorage.removeItem('loggedInUser');
        window.location.href = 'index.html';
    }
    window.getCurrentUser = function() {
        const data = sessionStorage.getItem('loggedInUser');
        try { return data ? JSON.parse(data) : null; }
        catch(e) { return null; }
    }

})(); // IIFE