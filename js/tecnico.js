// js/tecnico.js

document.addEventListener('DOMContentLoaded', () => {

    // --- Constantes y Variables Globales ---
    const INCIDENCIAS_STORAGE_KEY = 'incidenciasData';
    let incidencias = [];       // Array con TODAS las incidencias cargadas de localStorage
    let misIncidencias = [];    // Array con las incidencias filtradas para este técnico
    let modalInstance = null;
    let incidenciaActivaId = null;
    const currentUser = getCurrentUser(); // Obtiene datos del usuario logueado { username(email), role, name }

    // --- Selectores del DOM ---
    const incidenciasContainer = document.getElementById('incidencias-container');
    const placeholderIncidencias = document.querySelector('.placeholder-incidencias');
    const contadorIncidencias = document.getElementById('contador-incidencias');
    const inputBusqueda = document.getElementById('input-busqueda');
    const filtroEstado = document.getElementById('filtro-estado');
    const ordenarPor = document.getElementById('ordenar-por');
    // Modal
    const modalDetallesIncidencia = document.getElementById('modalDetallesIncidencia');
    const modalBodyContent = document.getElementById('modal-body-content');
    const modalPrioridadTexto = document.getElementById('modal-prioridad-texto');
    const modalCambiarEstado = document.getElementById('modal-cambiar-estado');
    const modalGuardarCambios = document.getElementById('modal-guardar-cambios');

    // --- Funciones Auxiliares ---
    const formatearFecha = (ts) => ts ? new Date(ts).toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'}) : '-';
    const getPrioBadgeClass = (p) => ({ baja: 'bg-secondary-subtle text-secondary-emphasis', media: 'bg-primary-subtle text-primary-emphasis', alta: 'bg-warning-subtle text-warning-emphasis', critica: 'bg-danger-subtle text-danger-emphasis', pendiente: 'bg-light text-dark' }[p] || 'bg-light');
    const getStatusInfo = (s) => ({ nueva: {i:'fiber_new',c:'text-info',t:'Nueva'}, asignada: {i:'assignment_ind',c:'text-primary',t:'Asignada'}, en_proceso: {i:'hourglass_top',c:'text-warning',t:'En Proc.'}, resuelta: {i:'check_circle',c:'text-success',t:'Resuelta'} }[s] || {i:'help',c:'text-muted',t:'?'});
    // Guarda el array GLOBAL de incidencias en localStorage
    const persistirIncidencias = () => {
        try {
            localStorage.setItem(INCIDENCIAS_STORAGE_KEY, JSON.stringify(incidencias));
        } catch (e) {
            console.error("Error saving incidencias:", e);
            alert("Error crítico: No se pudieron guardar los cambios en las incidencias.");
        }
    };
     // Muestra feedback global (si el elemento existe)
     const mostrarFeedbackGlobal = (msg, type = 'info') => {
         let fb = document.getElementById('global-feedback-area');
         if (fb) {
             fb.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show alert-sm" role="alert">${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
         } else {
             console.log(`Feedback (${type}): ${msg}`); // Fallback a consola
         }
     };

    // --- Lógica Principal ---

    // 1. Carga TODAS las incidencias desde localStorage
    const cargarTodasIncidencias = () => {
        try {
             const data = localStorage.getItem(INCIDENCIAS_STORAGE_KEY);
             // Parsear y asegurar que los campos necesarios existan con valores por defecto
             incidencias = data ? JSON.parse(data).map(inc => ({
                 ...inc, // Copiar propiedades existentes
                 prioridad: inc.prioridad ?? 'pendiente', // Default si falta
                 assignedTechnician: inc.assignedTechnician ?? null, // Default si falta
                 estado: inc.estado ?? 'nueva' // Default si falta
             })) : [];
         } catch (e) {
             console.error("Error cargando incidencias:", e);
             mostrarFeedbackGlobal("Error al cargar las incidencias guardadas.", "danger");
             incidencias = []; // Empezar vacío si hay error
         }
    };

    // 2. Filtra las incidencias asignadas a ESTE técnico
    const filtrarMisIncidencias = () => {
        if (!currentUser || !currentUser.username) {
            misIncidencias = [];
            console.warn("No se pudo obtener el usuario actual para filtrar incidencias.");
            return;
        }
        const miEmail = currentUser.username.toLowerCase(); // Email del técnico actual
        misIncidencias = incidencias.filter(inc =>
            inc.assignedTechnician && // Debe tener un técnico asignado
            inc.assignedTechnician.toLowerCase() === miEmail // Compara emails (ignorando mayúsculas/minúsculas)
        );
    };

    // 3. Renderiza la lista de (mis) incidencias aplicando filtros/ordenación
    const renderizarVista = () => {
        let incidenciasParaMostrar = [...misIncidencias]; // Empezar con las asignadas

        // Aplicar Filtro de Búsqueda (si existe input)
        const terminoBusqueda = inputBusqueda?.value.toLowerCase().trim();
        if (terminoBusqueda) {
             incidenciasParaMostrar = incidenciasParaMostrar.filter(inc =>
                 Object.values(inc).some(val => String(val).toLowerCase().includes(terminoBusqueda))
             );
         }

        // Aplicar Filtro de Estado (si existe select)
        const estadoSeleccionado = filtroEstado?.value;
        if (estadoSeleccionado && estadoSeleccionado !== 'todas') {
             incidenciasParaMostrar = incidenciasParaMostrar.filter(inc => inc.estado === estadoSeleccionado);
         }

        // Aplicar Ordenación (si existe select)
        const criterioOrdenacion = ordenarPor?.value || 'fecha_desc';
        const prioridadesOrden = { 'critica': 4, 'alta': 3, 'media': 2, 'baja': 1, 'pendiente': 0 };
        incidenciasParaMostrar.sort((a, b) => {
            switch (criterioOrdenacion) {
                case 'fecha_asc': return (a.fechaReporte || 0) - (b.fechaReporte || 0);
                case 'prioridad': return (prioridadesOrden[b.prioridad] ?? -1) - (prioridadesOrden[a.prioridad] ?? -1);
                case 'fecha_desc': default: return (b.fechaReporte || 0) - (a.fechaReporte || 0);
            }
        });

        // Renderizar el HTML de la lista
        incidenciasContainer.innerHTML = ''; // Limpiar lista
        if (incidenciasParaMostrar.length === 0) {
            if (placeholderIncidencias) placeholderIncidencias.style.display = 'block';
             const mensajePlaceholder = (inputBusqueda?.value || filtroEstado?.value !== 'todas')
                ? 'No tienes incidencias asignadas que coincidan con los filtros.'
                : 'No tienes incidencias asignadas.';
            incidenciasContainer.innerHTML = `<div class="placeholder-incidencias text-center p-4"><span class="material-icons-outlined fs-1">assignment_late</span><p>${mensajePlaceholder}</p></div>`;
        } else {
            if (placeholderIncidencias) placeholderIncidencias.style.display = 'none';
            incidenciasParaMostrar.forEach(inc => {
                let pText = inc.prioridad === 'pendiente' ? 'Pend.' : (inc.prioridad?.slice(0, 1).toUpperCase() || '?');
                let pClass = getPrioBadgeClass(inc.prioridad);
                const sInfo = getStatusInfo(inc.estado);
                incidenciasContainer.insertAdjacentHTML('beforeend', `
                    <a href="#" class="list-group-item list-group-item-action modern-list-item" data-incidencia-id="${inc.id}">
                        <div class="d-flex w-100 justify-content-between align-items-start">
                            <h5 class="mb-1 text-truncate me-2" style="max-width: 60%;">${inc.descripcion.substring(0, 60)}${inc.descripcion.length > 60 ? '...' : ''}</h5>
                            <small class="text-nowrap d-flex align-items-center">
                                <span class="badge rounded-pill ${pClass} me-1" title="${inc.prioridad}">${pText}</span>
                                <span class="material-icons-outlined sm-icon ${sInfo.c} me-1" title="${sInfo.t}">${sInfo.i}</span>
                                <span class="badge rounded-pill bg-light-subtle text-light-emphasis">#${inc.id.slice(-5)}</span>
                            </small>
                        </div>
                        <p class="mb-1 small text-body-secondary">
                            <span class="material-icons-outlined sm-icon">location_on</span> ${inc.ubicacion}${inc.equipo ? `(${inc.equipo.substring(0, 10)})` : ''} •
                            <span class="material-icons-outlined sm-icon">calendar_today</span> ${formatearFecha(inc.fechaReporte)}
                        </p>
                        <small class="text-body-secondary">Por: ${inc.reportador}</small>
                    </a>`);
            });
        }
        // Actualizar contador
        if(contadorIncidencias) {
             const totalAsignadas = misIncidencias.length;
             const isFiltered = inputBusqueda?.value || filtroEstado?.value !== 'todas';
             contadorIncidencias.textContent = isFiltered
                ? `${incidenciasParaMostrar.length} de ${totalAsignadas} asignadas`
                : `${totalAsignadas} incidencia${totalAsignadas !== 1 ? 's' : ''} asignada${totalAsignadas !== 1 ? 's' : ''}`;
        }
    };

    // --- Manejo del Modal (Técnico) ---

    // Mostrar Detalles en Modal
    const mostrarDetallesModal = (idIncidencia) => {
        // Buscar la incidencia SÓLO dentro de las asignadas al técnico
        const incidencia = misIncidencias.find(inc => inc.id === idIncidencia);
        if (!incidencia) {
            console.error("Error: Se intentó abrir una incidencia no asignada:", idIncidencia);
            mostrarFeedbackGlobal("No se pueden ver los detalles de esta incidencia.", "warning");
            return; // No continuar si no es suya
        }

        incidenciaActivaId = idIncidencia;

        // Preparar datos para mostrar
        const statusInfo = getStatusInfo(incidencia.estado);
        let prioridadText = incidencia.prioridad === 'pendiente' ? 'Pendiente de Asignación' : (incidencia.prioridad?.charAt(0).toUpperCase() + incidencia.prioridad?.slice(1) || 'No definida');

        // Llenar contenido del modal
        modalBodyContent.innerHTML = `
            <h6>${incidencia.descripcion}</h6>
            <hr class="my-2">
            <div class="row gx-3 gy-2 small mb-3">
                <div class="col-md-6"><strong>ID:</strong> <span class="font-monospace user-select-all">${incidencia.id}</span></div>
                <div class="col-md-6"><strong>Estado Actual:</strong> <span class="${statusInfo.c} fw-medium">${statusInfo.t}</span></div>
                <div class="col-md-6"><strong>Reportado:</strong> ${formatearFecha(incidencia.fechaReporte)} por ${incidencia.reportador} (${incidencia.rol})</div>
                <div class="col-md-6"><strong>Ubicación:</strong> ${incidencia.ubicacion} ${incidencia.equipo ? `(${incidencia.equipo})` : ''}</div>
            </div>
            <p class="small bg-body-secondary p-2 rounded">${incidencia.descripcion}</p>
        `;

        // Actualizar controles del modal
        if (modalPrioridadTexto) modalPrioridadTexto.textContent = prioridadText;
        if (modalCambiarEstado) modalCambiarEstado.value = incidencia.estado || 'asignada'; // Estado actual

        // Mostrar el modal
        if (!modalInstance) modalInstance = new bootstrap.Modal(modalDetallesIncidencia);
        modalInstance.show();
    };

    // Guardar Cambios del Modal (Solo Estado)
    const guardarCambiosModal = () => {
        if (!incidenciaActivaId) return;

        // Encontrar índice en el array GLOBAL para modificarlo
        const incidenciaGlobalIndex = incidencias.findIndex(inc => inc.id === incidenciaActivaId);
        if (incidenciaGlobalIndex === -1) {
            console.error("Error: Incidencia activa no encontrada en el array global para guardar.");
            mostrarFeedbackGlobal("Error al guardar: No se encontró la incidencia.", "danger");
            if(modalInstance) modalInstance.hide();
            return;
        }

        // Obtener nuevo estado del select
        const nuevoEstado = modalCambiarEstado.value;

        // Actualizar solo si el estado ha cambiado
        if (incidencias[incidenciaGlobalIndex].estado !== nuevoEstado) {
            incidencias[incidenciaGlobalIndex].estado = nuevoEstado;
            incidencias[incidenciaGlobalIndex].fechaActualizacion = Date.now();

            persistirIncidencias(); // Guardar el array GLOBAL modificado

            // 1. Volver a cargar TODOS los datos (por si acaso algo cambió externamente)
            cargarTodasIncidencias();
            // 2. Volver a filtrar MIS incidencias
            filtrarMisIncidencias();
            // 3. Re-renderizar MI lista con los filtros actuales aplicados
            renderizarVista();

            mostrarFeedbackGlobal(`Estado de la incidencia #${incidenciaActivaId.slice(-5)} actualizado.`, "success");

        } else {
             console.log("No se realizaron cambios en el estado.");
             mostrarFeedbackGlobal("No se detectaron cambios en el estado.", "info");
        }

        if(modalInstance) modalInstance.hide();
        incidenciaActivaId = null;
    };


    // --- Inicialización ---
    // Bienvenida al usuario
    const welcomeSpan = document.getElementById('welcome-user');
    if (currentUser && welcomeSpan) {
        welcomeSpan.textContent = `Hola, ${currentUser.name}`;
    } else if (welcomeSpan) {
         welcomeSpan.textContent = `Usuario Desconocido`;
    }

    // Cargar datos, filtrar y renderizar la vista inicial
    cargarTodasIncidencias();
    filtrarMisIncidencias();
    renderizarVista();

    // --- Event Listeners ---
    // Filtros y ordenación
    if (inputBusqueda) inputBusqueda.addEventListener('input', renderizarVista); // Re-renderiza aplicando filtros
    if (filtroEstado) filtroEstado.addEventListener('change', renderizarVista);
    if (ordenarPor) ordenarPor.addEventListener('change', renderizarVista);

    // Clic en un item de la lista para abrir modal
    if (incidenciasContainer) {
        incidenciasContainer.addEventListener('click', (event) => {
            const item = event.target.closest('.list-group-item[data-incidencia-id]'); // Selector más específico
            if (item) {
                event.preventDefault();
                mostrarDetallesModal(item.dataset.incidenciaId);
            }
        });
    }

    // Botón Guardar Cambios del Modal
    if (modalGuardarCambios) {
        modalGuardarCambios.addEventListener('click', guardarCambiosModal);
    }

    // Inicializar instancia del modal (solo si existe el elemento)
    if (modalDetallesIncidencia) {
        modalInstance = new bootstrap.Modal(modalDetallesIncidencia);
    }

}); // Fin DOMContentLoaded

// Función global necesaria para auth.js y este script
function getCurrentUser() {
    const userData = sessionStorage.getItem('loggedInUser');
    try {
        return userData ? JSON.parse(userData) : null;
    } catch (e) {
        console.error("Error parsing user data from session storage", e);
        return null;
    }
}