// js/login.js

const USER_STORAGE_KEY = 'gestionIncidenciasUsers';
// --- DOMINIOS ---
const ADMIN_DOMAIN = 'administradorinfo.cat';
const TECHNICIAN_DOMAIN = 'tecnicoinfo.cat';
const STUDENT_PROFESSOR_DOMAIN = 'inspedralbes.cat';

// --- Default User Data (CON LOS NUEVOS DOMINIOS) ---
const defaultUsers = {
    [`admin@${ADMIN_DOMAIN}`]: { password: "adminpass", role: "admin", name: "Administrador Principal" },
    [`tecnico1@${TECHNICIAN_DOMAIN}`]: { password: "tecnicopass", role: "tecnico", name: "Soporte Técnico 1" },
    [`tecnico2@${TECHNICIAN_DOMAIN}`]: { password: "tecnico2pass", role: "tecnico", name: "Soporte Técnico 2" },
    [`profesor.ejemplo@${STUDENT_PROFESSOR_DOMAIN}`]: {password: "profesorpass", role: "profesor", name: "Profesor Ejemplo"},
    [`a23alumno.test@${STUDENT_PROFESSOR_DOMAIN}`]: {password: "alumnopass", role: "usuario", name: "Alumno Test"}
};
// --------------------------------------------------------

const getUsersFromStorage = () => {
    try {
        const usersJson = localStorage.getItem(USER_STORAGE_KEY);
        if (!usersJson) {
            console.log("Initializing default users in localStorage.");
            localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(defaultUsers));
            return defaultUsers;
        }
        return JSON.parse(usersJson);
    } catch (e) { console.error("Error reading users:", e); return defaultUsers; }
};

// --- Lógica del Login ---
document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const errorDiv = document.getElementById('login-error');

    const emailEntered = emailInput.value.trim();
    const emailKey = emailEntered.toLowerCase();
    const passwordEntered = passwordInput.value;

    errorDiv.textContent = '';

    if (!emailKey || !passwordEntered) {
        errorDiv.textContent = 'Por favor, introduce correo y contraseña.'; return;
    }

    const storedUsers = getUsersFromStorage();
    const userFound = storedUsers[emailKey];

    if (userFound && userFound.password === passwordEntered) { // ¡Inseguro!
        sessionStorage.setItem('loggedInUser', JSON.stringify({
            username: emailKey, // Guardamos email como username en session
            role: userFound.role,
            name: userFound.name
        }));

        console.log(`Login successful for ${emailKey}, role: ${userFound.role}. Redirecting...`);
        switch (userFound.role) {
            case 'admin': window.location.href = 'admin.html'; break;
            case 'tecnico': window.location.href = 'tecnico.html'; break;
            case 'profesor':
            case 'usuario': window.location.href = 'usuario.html'; break;
            default:
                console.error(`Rol desconocido: "${userFound.role}"`);
                errorDiv.textContent = 'Error: Rol no configurado.';
                sessionStorage.removeItem('loggedInUser');
        }
    } else {
        errorDiv.textContent = 'Correo electrónico o contraseña incorrectos.';
        passwordInput.value = '';
    }
});

getUsersFromStorage(); // Asegura defaults al cargar