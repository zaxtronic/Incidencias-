// js/usuario.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("Usuario.js: DOMContentLoaded"); // Log inicial

    // --- Constantes y Variables ---
    const INCIDENCIAS_STORAGE_KEY = 'incidenciasData';
    let todasIncidencias = []; // Array con TODAS las incidencias cargadas
    let misIncidencias = [];   // Array con las incidencias reportadas por este usuario
    // let modalUsuarioInstance = null; // No necesaria si usamos data-attributes

    // --- Selectores ---
    // Formulario Reporte
    const formIncidencia = document.getElementById('form-incidencia');
    const feedbackMensajeReporte = document.getElementById('feedback-mensaje-reporte');
    const reportadorInput = document.getElementById('reportador');
    const rolSelect = document.getElementById('rol');
    const ubicacionInput = document.getElementById('ubicacion');
    const equipoInput = document.getElementById('equipo');
    const descripcionInput = document.getElementById('descripcion');
    // Sección Mis Incidencias
    const buscarIdInput = document.getElementById('buscar-incidencia-id');
    const btnBuscarId = document.getElementById('btn-buscar-id');
    const btnMostrarTodas = document.getElementById('btn-mostrar-todas');
    const feedbackBusqueda = document.getElementById('feedback-busqueda');
    const misIncidenciasContainer = document.getElementById('mis-incidencias-container');
    const placeholderMisIncidencias = document.querySelector('.placeholder-mis-incidencias'); // Usa querySelector por si acaso
    const contadorMisIncidencias = document.getElementById('contador-mis-incidencias');
    // Modal Detalles Usuario
    const modalDetallesUsuario = document.getElementById('modalDetallesUsuario');
    const modalUsuarioBodyContent = document.getElementById('modal-usuario-body-content');

    // --- Funciones Auxiliares ---
    const generarIdUnico = () => `inc-${Date.now()}-${Math.random().toString(16).slice(-6)}`;
    const persistirIncidencias = (incidenciasArray) => {
         try { localStorage.setItem(INCIDENCIAS_STORAGE_KEY, JSON.stringify(incidenciasArray)); }
         catch (e) { console.error("Error saving incidencias:", e); mostrarFeedbackReporte("Error crítico al guardar.", "danger"); }
     };
    const mostrarFeedbackReporte = (msg, type = 'info') => {
         if (feedbackMensajeReporte) feedbackMensajeReporte.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show alert-sm">${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
         else console.log(`Feedback Reporte (${type}): ${msg}`);
    };
    const mostrarFeedbackBusqueda = (msg, type = 'info') => {
         if (feedbackBusqueda) { feedbackBusqueda.textContent = msg; feedbackBusqueda.className = `small mt-2 text-${type}`; }
         else console.log(`Feedback Búsqueda (${type}): ${msg}`);
    };
    const formatearFecha = (ts) => ts ? new Date(ts).toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'}) : '-';
    const getPrioBadgeClass = (p) => ({ baja: 'bg-secondary-subtle text-secondary-emphasis', media: 'bg-primary-subtle text-primary-emphasis', alta: 'bg-warning-subtle text-warning-emphasis', critica: 'bg-danger-subtle text-danger-emphasis', pendiente: 'bg-light text-dark' }[p] || 'bg-light');
    const getStatusInfo = (s) => ({ nueva: {i:'fiber_new',c:'text-info',t:'Nueva'}, asignada: {i:'assignment_ind',c:'text-primary',t:'Asignada'}, en_proceso: {i:'hourglass_top',c:'text-warning',t:'En Proceso'}, resuelta: {i:'check_circle',c:'text-success',t:'Resuelta'} }[s] || {i:'help',c:'text-muted',t:'Desconocido'});

    // --- Lógica Formulario Reporte ---
    const handleFormSubmit = (event) => {
        event.preventDefault();
        console.log("Usuario.js: handleFormSubmit triggered"); // Debug
        if(feedbackMensajeReporte) feedbackMensajeReporte.innerHTML = '';

        try {
            const formData = new FormData(formIncidencia);
            const currentUser = getCurrentUser();
            if (!currentUser || !currentUser.username) {
                 throw new Error("No se pudo identificar al usuario actual.");
            }
            const userRole = currentUser.role || 'desconocido';

            const nuevaIncidencia = {
                id: generarIdUnico(), fechaReporte: Date.now(), estado: 'nueva',
                reportador: currentUser.name || '?', rol: userRole,
                ubicacion: formData.get('ubicacion')?.trim() || '?',
                equipo: formData.get('equipo')?.trim() || null,
                descripcion: formData.get('descripcion')?.trim() || '?',
                prioridad: 'pendiente', assignedTechnician: null,
                reportedByUsername: currentUser.username // Clave para filtrar "Mis Incidencias"
            };
            console.log("Usuario.js: Nueva incidencia creada:", nuevaIncidencia); // Debug

            if (!nuevaIncidencia.descripcion || !nuevaIncidencia.ubicacion || nuevaIncidencia.descripcion==='?' || nuevaIncidencia.ubicacion==='?') {
               throw new Error("Completa Ubicación y Descripción.");
            }

            // Leer TODAS, añadir la nueva, y guardar TODAS de nuevo
            let currentTodasIncidencias = [];
            try {
                const data = localStorage.getItem(INCIDENCIAS_STORAGE_KEY);
                currentTodasIncidencias = data ? JSON.parse(data) : [];
                console.log("Usuario.js: Incidencias existentes leídas:", currentTodasIncidencias.length); // Debug
            } catch(e){
                 console.error("Usuario.js: Error reading existing incidencias on submit:", e);
            }

            currentTodasIncidencias.push(nuevaIncidencia);
            persistirIncidencias(currentTodasIncidencias); // Guardar el array completo actualizado
            console.log("Usuario.js: Incidencia añadida y persistida."); // Debug

            mostrarFeedbackReporte(`Incidencia #${nuevaIncidencia.id.slice(-5)} reportada. Será revisada.`, "success");

            // Limpiar campos editables
            if(ubicacionInput) ubicacionInput.value = '';
            if(equipoInput) equipoInput.value = '';
            if(descripcionInput) descripcionInput.value = '';

            // Actualizar la lista de "Mis Incidencias" inmediatamente
            cargarYFiltrarMisIncidencias(); // Vuelve a cargar y filtrar
            renderizarMisIncidencias();      // Vuelve a dibujar la lista

        } catch (error) {
             console.error("Usuario.js: Error en handleFormSubmit:", error); // Debug
             mostrarFeedbackReporte(`Error al reportar: ${error.message}`, "danger");
        }
    };

    // --- Lógica Ver/Buscar Mis Incidencias ---

    const cargarYFiltrarMisIncidencias = () => {
        console.log("Usuario.js: Iniciando carga y filtrado de mis incidencias..."); // Debug
        try {
            const data = localStorage.getItem(INCIDENCIAS_STORAGE_KEY);
            todasIncidencias = data ? JSON.parse(data).map(i => ({
                 ...i, prioridad: i.prioridad ?? 'pendiente', estado: i.estado ?? 'nueva'
            })) : [];
            console.log("Usuario.js: Total incidencias cargadas:", todasIncidencias.length); // Debug
        } catch (e) {
            console.error("Usuario.js: Error cargando todas las incidencias:", e);
            todasIncidencias = [];
            mostrarFeedbackBusqueda("Error al cargar datos de incidencias.", "danger");
        }

        // Filtrar por reportedByUsername
        const currentUser = getCurrentUser();
        if (currentUser?.username) {
            const miEmail = currentUser.username.toLowerCase();
            console.log("Usuario.js: Filtrando por email:", miEmail); // Debug
            misIncidencias = todasIncidencias.filter(inc =>
                inc.reportedByUsername && // Asegurarse que la propiedad existe
                typeof inc.reportedByUsername === 'string' && // Asegurarse que es string
                inc.reportedByUsername.toLowerCase() === miEmail
            );
            // Ordenar mis incidencias por fecha descendente por defecto
             misIncidencias.sort((a, b) => (b.fechaReporte || 0) - (a.fechaReporte || 0));
             console.log("Usuario.js: Incidencias propias encontradas:", misIncidencias.length, misIncidencias); // Debug
        } else {
            misIncidencias = [];
            console.warn("Usuario.js: No se pudo obtener usuario para filtrar 'Mis Incidencias'.");
        }
    };

    const renderizarMisIncidencias = (incidenciasToShow = misIncidencias) => {
        console.log("Usuario.js: Renderizando mis incidencias. Cantidad:", incidenciasToShow.length); // Debug
        if (!misIncidenciasContainer) {
             console.error("Usuario.js: Error - Contenedor 'mis-incidencias-container' no encontrado."); // Debug
             return;
        }
        misIncidenciasContainer.innerHTML = ''; // Limpiar

        if (incidenciasToShow.length === 0) {
            if (placeholderMisIncidencias) placeholderMisIncidencias.style.display = 'block';
            const mensaje = buscarIdInput?.value ? 'No se encontró ninguna incidencia con ese ID.' : 'Aún no has reportado ninguna incidencia.';
            misIncidenciasContainer.innerHTML = `<div class="placeholder-mis-incidencias text-center p-4"><span class="material-icons-outlined fs-1">manage_search</span><p class="text-body-secondary">${mensaje}</p></div>`;
        } else {
            if (placeholderMisIncidencias) placeholderMisIncidencias.style.display = 'none';
            incidenciasToShow.forEach(inc => {
                // Comprobación extra por si algún dato falta
                const desc = inc.descripcion || '(Sin descripción)';
                const prio = inc.prioridad || 'pendiente';
                const stat = inc.estado || 'nueva';
                const idShort = inc.id ? inc.id.slice(-5) : '????';
                const fecha = inc.fechaReporte ? formatearFecha(inc.fechaReporte) : '-';
                const ubi = inc.ubicacion || '-';

                let pText = prio === 'pendiente' ? 'Pend.' : (prio.slice(0, 1).toUpperCase() || '?');
                let pClass = getPrioBadgeClass(prio);
                const sInfo = getStatusInfo(stat);

                // Generar HTML para cada item
                const itemHtml = `
                    <a href="#" class="list-group-item list-group-item-action modern-list-item"
                       data-incidencia-id="${inc.id || ''}"
                       data-bs-toggle="modal" data-bs-target="#modalDetallesUsuario">
                        <div class="d-flex w-100 justify-content-between align-items-center">
                            <span class="fw-medium text-truncate me-2">${desc.substring(0, 50)}${desc.length > 50 ? '...' : ''}</span>
                            <small class="text-nowrap d-flex align-items-center">
                                <span class="badge rounded-pill ${pClass} me-1" title="Prioridad: ${prio}">${pText}</span>
                                <span class="material-icons-outlined sm-icon ${sInfo.c} me-1" title="Estado: ${sInfo.t}">${sInfo.i}</span>
                                <span class="badge bg-light-subtle text-light-emphasis font-monospace">#${idShort}</span>
                            </small>
                        </div>
                        <div class="small text-body-secondary mt-1">
                            <span class="material-icons-outlined sm-icon">calendar_today</span> ${fecha}
                            <span class="ms-2"><span class="material-icons-outlined sm-icon">location_on</span> ${ubi}</span>
                        </div>
                    </a>`;
                misIncidenciasContainer.insertAdjacentHTML('beforeend', itemHtml);
            });
        }
        // Actualizar contador propio
        if (contadorMisIncidencias) {
            contadorMisIncidencias.textContent = `${incidenciasToShow.length} incidencia${incidenciasToShow.length !== 1 ? 's' : ''} encontrada${incidenciasToShow.length !== 1 ? 's' : ''}`;
        }
    };

    const buscarPorId = () => {
        console.log("Usuario.js: Buscando por ID..."); // Debug
        const idBuscado = buscarIdInput?.value.trim().toLowerCase();
        if (!idBuscado) { mostrarFeedbackBusqueda("Introduce los últimos 5 dígitos del ID.", "warning"); return; }
        // Permitir buscar por más de 5 si el usuario pega el ID completo
        // if (idBuscado.length < 5) { mostrarFeedbackBusqueda("Introduce al menos 5 caracteres del ID.", "warning"); return; }

        // Buscar en misIncidencias por ID que *termine* con lo buscado
        const encontradas = misIncidencias.filter(inc =>
            inc.id && inc.id.toLowerCase().endsWith(idBuscado)
        );
        console.log("Usuario.js: Incidencias encontradas por ID:", encontradas.length); // Debug

        renderizarMisIncidencias(encontradas); // Renderizar resultado (puede ser vacío)

        if (encontradas.length > 0) {
            mostrarFeedbackBusqueda(`Mostrando ${encontradas.length} incidencia(s) con ID que termina en "${idBuscado}".`, "success");
        } else {
            mostrarFeedbackBusqueda(`No se encontró ninguna de TUS incidencias con ID que termine en "${idBuscado}".`, "danger");
        }
    };

    const prepararDetallesUsuarioModal = (idIncidencia) => {
        console.log("Usuario.js: Preparando modal para ID:", idIncidencia); // Debug
        // Buscar la incidencia en misIncidencias para asegurar que es del usuario
        const incidencia = misIncidencias.find(inc => inc.id === idIncidencia);

        if (!incidencia) {
            console.error("Usuario.js: Incidencia no encontrada o no pertenece al usuario:", idIncidencia);
            if(modalUsuarioBodyContent) modalUsuarioBodyContent.innerHTML = `<div class="alert alert-danger alert-sm">Error: No se pudieron cargar los detalles.</div>`;
            return;
        }

        console.log("Usuario.js: Incidencia encontrada para modal:", incidencia); // Debug

        // Generar HTML (sin cambios respecto a versión anterior)
        const statusInfo = getStatusInfo(incidencia.estado);
        const prioridadText = incidencia.prioridad === 'pendiente' ? 'Pendiente' : (incidencia.prioridad?.charAt(0).toUpperCase() + incidencia.prioridad?.slice(1) || 'N/A');
        const usersData = JSON.parse(localStorage.getItem('gestionIncidenciasUsers') || '{}');
        const tecnicoNombre = incidencia.assignedTechnician ? (usersData[incidencia.assignedTechnician]?.name || 'Asignado') : 'Sin asignar';

        const modalHtml = `
            <p><strong>Descripción:</strong><br>${incidencia.descripcion || '(Sin descripción)'}</p>
            <hr>
            <div class="row gx-2 gy-1 small">
                <div class="col-12 mb-2"><strong>ID:</strong> <span class="font-monospace user-select-all">${incidencia.id}</span></div>
                <div class="col-6"><strong>Reportado:</strong><br>${formatearFecha(incidencia.fechaReporte)}</div>
                <div class="col-6"><strong>Estado:</strong><br><span class="${statusInfo.c} fw-medium">${statusInfo.t}</span></div>
                <div class="col-6"><strong>Ubicación:</strong><br>${incidencia.ubicacion || '-'}</div>
                <div class="col-6"><strong>Equipo:</strong><br>${incidencia.equipo || '-'}</div>
                <div class="col-6"><strong>Prioridad:</strong><br>${prioridadText}</div>
                <div class="col-6"><strong>Técnico:</strong><br>${tecnicoNombre}</div>
            </div>
        `;

        if (modalUsuarioBodyContent) {
            modalUsuarioBodyContent.innerHTML = modalHtml;
            console.log("Usuario.js: Contenido del modal actualizado."); // Debug
        } else {
            console.error("Usuario.js: Error - Elemento 'modal-usuario-body-content' no encontrado."); // Debug
        }
    };


    // --- Inicialización ---
    console.log("Usuario.js: Inicializando..."); // Debug
    const currentUser = getCurrentUser();
    const welcomeSpan = document.getElementById('welcome-user');
    if (currentUser) {
        // ... (código para rellenar nombre, rol y badge - sin cambios) ...
        if(welcomeSpan) welcomeSpan.textContent = `Hola, ${currentUser.name}`;
        if(reportadorInput) reportadorInput.value = currentUser.name || '';
        if(rolSelect) { /* ... rellenar rol ... */ }
        const badge = document.getElementById('user-role-badge');
        if(badge) { /* ... ajustar badge ... */ }

        // Carga inicial y renderizado de "Mis Incidencias"
        cargarYFiltrarMisIncidencias();
        renderizarMisIncidencias(); // Renderizar la lista inicial de sus incidencias

    } else { // Caso improbable por auth.js
        console.error("Usuario.js: No se pudo obtener currentUser en inicialización."); // Debug
        if(welcomeSpan) welcomeSpan.textContent = 'Usuario Desconocido';
        // Podríamos deshabilitar todo si no hay usuario
    }

    // --- Event Listeners ---
    // Formulario de reporte
    if (formIncidencia) {
        formIncidencia.addEventListener('submit', handleFormSubmit);
        console.log("Usuario.js: Listener de submit añadido a form-incidencia."); // Debug
    } else {
         console.warn("Usuario.js: Elemento form-incidencia no encontrado."); // Debug
    }

    // Búsqueda por ID
    if (btnBuscarId) btnBuscarId.addEventListener('click', buscarPorId);
    else console.warn("Usuario.js: Botón btn-buscar-id no encontrado."); // Debug

    if (buscarIdInput) buscarIdInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') buscarPorId(); });
    else console.warn("Usuario.js: Input buscar-incidencia-id no encontrado."); // Debug

    // Botón Mostrar Todas
    if (btnMostrarTodas) btnMostrarTodas.addEventListener('click', () => {
        if(buscarIdInput) buscarIdInput.value = '';
        mostrarFeedbackBusqueda('');
        renderizarMisIncidencias(); // Renderizar todas mis incidencias de nuevo
    });
    else console.warn("Usuario.js: Botón btn-mostrar-todas no encontrado."); // Debug

    // Listener para preparar el modal ANTES de que se muestre
    if (modalDetallesUsuario) {
        modalDetallesUsuario.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget; // El <a> que disparó el modal
            if (button) {
                 const incidenciaId = button.getAttribute('data-incidencia-id');
                 if (incidenciaId) {
                     prepararDetallesUsuarioModal(incidenciaId); // Prepara el contenido
                 } else { console.error("Usuario.js: Botón modal sin data-incidencia-id"); if(modalUsuarioBodyContent) modalUsuarioBodyContent.innerHTML = `<div class="alert alert-warning alert-sm">Error ID.</div>`; }
            } else { console.error("Usuario.js: Modal abierto sin relatedTarget"); if(modalUsuarioBodyContent) modalUsuarioBodyContent.innerHTML = `<div class="alert alert-warning alert-sm">Error al abrir.</div>`; }
        });
        // Limpiar al ocultar
         modalDetallesUsuario.addEventListener('hidden.bs.modal', function () {
             if(modalUsuarioBodyContent) modalUsuarioBodyContent.innerHTML = '<div class="text-center p-3"><div class="spinner-border spinner-border-sm"></div></div>';
         });
         console.log("Usuario.js: Listeners de modal añadidos."); // Debug
    } else {
        console.warn("Usuario.js: Elemento modalDetallesUsuario no encontrado."); // Debug
    }

    console.log("Usuario.js: Inicialización completada."); // Debug

}); // Fin DOMContentLoaded

// Función global necesaria
function getCurrentUser() {
    const userData = sessionStorage.getItem('loggedInUser');
    try {
        const user = userData ? JSON.parse(userData) : null;
        // console.log("getCurrentUser:", user); // Descomentar para debug intenso
        return user;
    } catch (e) {
        console.error("Error parsing user data from session storage", e);
        return null;
    }
}