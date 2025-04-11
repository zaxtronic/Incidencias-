document.addEventListener('DOMContentLoaded', () => {
    // --- Selectores ---
    const formIncidencia = document.getElementById('form-incidencia');
    const incidenciasContainer = document.getElementById('incidencias-container');
    const feedbackMensajeContainer = document.getElementById('feedback-mensaje');
    const filtroEstado = document.getElementById('filtro-estado');
    const ordenarPor = document.getElementById('ordenar-por');
    const inputBusqueda = document.getElementById('input-busqueda');
    const placeholderIncidencias = document.querySelector('.placeholder-incidencias');
    const contadorIncidenciasEl = document.getElementById('contador-incidencias');
    const btnSaveJson = document.getElementById('btn-save-json');
    const btnTriggerLoadJson = document.getElementById('btn-trigger-load-json');
    const inputLoadJson = document.getElementById('input-load-json');

    // --- Modal Selectores ---
    const modalElement = document.getElementById('modalDetallesIncidencia');
    const modal = new bootstrap.Modal(modalElement); // Inicialización del modal de Bootstrap
    const modalBodyContent = document.getElementById('modal-body-content');
    const modalCambiarEstadoSelect = document.getElementById('modal-cambiar-estado');
    const modalGuardarBtn = document.getElementById('modal-guardar-cambios');
    const modalEliminarBtn = document.getElementById('modal-eliminar-incidencia');
    const modalTitleLabel = document.getElementById('modalDetallesLabel');
    let currentEditingIncidenciaId = null;

    // --- Estado ---
    let incidencias = []; // El array que contiene todas las incidencias cargadas/creadas

    // --- Funciones Auxiliares ---
    const mostrarFeedback = (mensaje, tipo = 'success', duracion = 4000) => {
        const alertHTML = `
            <div class="alert alert-${tipo} alert-dismissible fade show d-flex align-items-center" role="alert">
                 <span class="material-icons-outlined me-2">${getFeedbackIcon(tipo)}</span>
                 <div>${mensaje}</div>
                 <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>`;
        feedbackMensajeContainer.innerHTML = alertHTML;
        const alertElement = feedbackMensajeContainer.querySelector('.alert');
        if (duracion > 0 && alertElement) {
            setTimeout(() => {
                // Solo intentar cerrar si el elemento aún existe en el DOM
                if (document.body.contains(alertElement)) {
                    const bsAlert = bootstrap.Alert.getOrCreateInstance(alertElement);
                    if (bsAlert) {
                        bsAlert.close();
                    }
                }
            }, duracion);
        }
    };

    const getFeedbackIcon = (tipo) => {
        switch(tipo) {
            case 'success': return 'check_circle_outline';
            case 'danger': return 'error_outline';
            case 'warning': return 'warning_amber';
            case 'info': return 'info_outline';
            case 'primary': return 'file_download_done';
            default: return 'notifications_none';
        }
    };

    const formatShortDate = (isoDateString) => {
        if (!isoDateString) return 'Fecha desconocida';
        try {
            const date = new Date(isoDateString);
            if (isNaN(date)) return 'Fecha inválida'; // Comprobar si la fecha es válida
            return date.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) { return 'Fecha inválida'; }
    };

    const formatFullDate = (isoDateString) => {
        if (!isoDateString) return 'Fecha desconocida';
        try {
            const date = new Date(isoDateString);
             if (isNaN(date)) return 'Fecha inválida';
            return date.toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' });
        } catch (e) { return 'Fecha inválida'; }
    };

    const getPrioridadLabel = (prioridadKey) => {
        const labels = { baja: 'Baja', media: 'Media', alta: 'Alta', critica: 'Crítica' };
        return labels[prioridadKey] || prioridadKey;
    };
    const getPrioridadClass = (prioridadKey) => `priority-${prioridadKey}`;

    const getEstadoLabel = (estadoKey) => {
        const labels = { nueva: 'Nueva', en_proceso: 'En Proceso', resuelta: 'Resuelta' };
        return labels[estadoKey] || estadoKey;
    };
    const getEstadoClass = (estadoKey) => `status-${estadoKey}`;

    const getEstadoBootstrapClass = (estado) => {
        switch(estado) {
            case 'nueva': return 'primary';
            case 'en_proceso': return 'info';
            case 'resuelta': return 'success';
            default: return 'secondary';
        }
    };

    // --- JSON Handling ---
    const guardarIncidenciasJSON = () => {
        if (incidencias.length === 0) {
            mostrarFeedback("No hay incidencias para guardar.", "warning");
            return;
        }
        try {
            // Usar sort para guardar siempre en el mismo orden (ej: por fecha descendente)
            const incidenciasOrdenadas = [...incidencias].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            const jsonData = JSON.stringify(incidenciasOrdenadas, null, 2); // null, 2 para pretty print
            const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8' }); // Especificar charset
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const fechaHoy = new Date();
            const formattedDate = fechaHoy.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
            link.download = `incidencias_ies_moderno_${formattedDate}.json`;
            link.href = url;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            mostrarFeedback("Incidencias guardadas correctamente en archivo JSON.", "primary", 5000);
        } catch (error) {
            console.error("Error al generar o descargar el JSON:", error);
            mostrarFeedback("Error al guardar las incidencias en JSON.", "danger");
        }
    };

    const cargarIncidenciasJSON = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        // Permitir application/octet-stream también, por si acaso el navegador no lo detecta bien
        if (!file.type.match(/application\/(json|octet-stream)/)) {
            mostrarFeedback(`Tipo de archivo no válido: ${file.type}. Selecciona un archivo JSON.`, "warning");
            inputLoadJson.value = null; return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedData = JSON.parse(e.target.result);
                if (!Array.isArray(loadedData)) throw new Error("El contenido del JSON no es un array.");
                // Validación básica de la primera incidencia (si existe)
                if (loadedData.length > 0 && (typeof loadedData[0].id === 'undefined' || typeof loadedData[0].descripcion === 'undefined')) {
                   throw new Error("La estructura de las incidencias no parece correcta.");
                }
                incidencias = loadedData;
                mostrarFeedback(`Incidencias cargadas desde ${file.name}.`, "info");
                inputLoadJson.value = null;
                renderizarIncidencias(); // Actualiza la vista con los datos cargados
            } catch (error) {
                console.error("Error al leer o parsear el archivo JSON:", error);
                mostrarFeedback(`Error al procesar el archivo JSON: ${error.message}`, "danger");
                 inputLoadJson.value = null;
            }
        };
        reader.onerror = (e) => {
            console.error("Error al leer el archivo:", e);
            mostrarFeedback("Ocurrió un error al intentar leer el archivo.", "danger");
            inputLoadJson.value = null;
        };
        reader.readAsText(file);
    };

    // --- Renderizado ---
    const renderizarIncidencias = () => {
        // console.log("Renderizando. Incidencias actuales:", incidencias.length); // DEBUG
        incidenciasContainer.innerHTML = ''; // Limpia el contenedor antes de redibujar
        const estadoFiltrado = filtroEstado.value;
        const terminoBusqueda = inputBusqueda.value.toLowerCase().trim();

        // 1. Filtrado
        const incidenciasFiltradas = incidencias.filter(inc => {
            const cumpleEstado = estadoFiltrado === 'todas' || inc.estado === estadoFiltrado;
            if (!cumpleEstado) return false;

            const cumpleBusqueda = terminoBusqueda === '' ||
                                   (inc.reportador && inc.reportador.toLowerCase().includes(terminoBusqueda)) ||
                                   (inc.ubicacion && inc.ubicacion.toLowerCase().includes(terminoBusqueda)) ||
                                   (inc.equipo && inc.equipo.toLowerCase().includes(terminoBusqueda)) ||
                                   (inc.descripcion && inc.descripcion.toLowerCase().includes(terminoBusqueda)) ||
                                   (inc.id && inc.id.toLowerCase().includes(terminoBusqueda));
            return cumpleBusqueda;
        });
         // console.log("Incidencias después de filtrar:", incidenciasFiltradas.length); // DEBUG

        // 2. Ordenación (sobre las filtradas)
        const ordenSeleccionado = ordenarPor.value;
        incidenciasFiltradas.sort((a, b) => {
            if (ordenSeleccionado === 'fecha_desc') return new Date(b.fecha) - new Date(a.fecha);
            if (ordenSeleccionado === 'fecha_asc') return new Date(a.fecha) - new Date(b.fecha);
            if (ordenSeleccionado === 'prioridad') {
                const prioridadValor = { 'critica': 4, 'alta': 3, 'media': 2, 'baja': 1 };
                return (prioridadValor[b.prioridad] || 0) - (prioridadValor[a.prioridad] || 0);
            }
            return 0; // Sin orden específico
        });

        // 3. Mostrar o dibujar
        if (incidenciasFiltradas.length === 0) {
            placeholderIncidencias.style.display = 'flex'; // Mostrar placeholder
            if (incidencias.length === 0) {
                 placeholderIncidencias.querySelector('.material-icons-outlined').textContent = 'file_upload';
                 placeholderIncidencias.querySelector('p').textContent = 'Carga un archivo JSON o reporta una nueva incidencia.';
            } else {
                 placeholderIncidencias.querySelector('.material-icons-outlined').textContent = 'search_off';
                 placeholderIncidencias.querySelector('p').textContent = 'No hay incidencias que coincidan con los filtros.';
            }
            contadorIncidenciasEl.textContent = '0 incidencias mostradas';
        } else {
            placeholderIncidencias.style.display = 'none'; // Ocultar placeholder
            contadorIncidenciasEl.textContent = `${incidenciasFiltradas.length} de ${incidencias.length} incidencias cargadas`;

            // Crear y añadir cada elemento de incidencia al DOM
            incidenciasFiltradas.forEach((inc, index) => {
                 const item = document.createElement('div'); // Crear un nuevo div para cada item
                 item.className = 'list-group-item'; // Añadir clase de Bootstrap
                 item.dataset.id = inc.id; // Guardar ID en el dataset para identificarlo luego
                 item.style.animationDelay = `${index * 0.05}s`; // Retraso para animación escalonada

                 // Construir el HTML interno del item
                 item.innerHTML = `
                    <div class="d-flex w-100 justify-content-between align-items-start">
                        <div>
                            <a href="#" class="incidencia-item-title stretched-link text-decoration-none" title="Ver detalles de ${inc.ubicacion || 'incidencia'}">
                                <span class="material-icons-outlined sm-icon">${inc.equipo ? 'computer' : 'location_on'}</span>
                                ${inc.ubicacion || 'Ubicación desconocida'} ${inc.equipo ? `(${inc.equipo})` : ''}
                             </a>
                             <small class="incidencia-item-meta d-block">
                                 <span class="${getEstadoClass(inc.estado)} status-indicator"></span>
                                 ${getEstadoLabel(inc.estado)}
                                 <span class="meta-divider"></span>
                                 Reportado por: <strong>${inc.reportador || 'Anónimo'}</strong> (${inc.rol || 'N/A'})
                                 <span class="meta-divider"></span>
                                 ${formatShortDate(inc.fecha)}
                            </small>
                        </div>
                        <span class="priority-indicator ${getPrioridadClass(inc.prioridad)}">
                            ${getPrioridadLabel(inc.prioridad)}
                        </span>
                    </div>
                 `;
                 // Añadir listener para abrir modal al hacer clic en el item
                 item.addEventListener('click', (e) => {
                     e.preventDefault();
                     abrirModalDetalles(inc.id);
                 });
                 // Añadir el item completo al contenedor de la lista
                 incidenciasContainer.appendChild(item);
            });
        }
        // console.log("Renderizado completo."); // DEBUG
    };

    // --- Modal Handling ---
    const abrirModalDetalles = (idIncidencia) => {
        const incidencia = incidencias.find(inc => inc.id === idIncidencia);
        if (!incidencia) {
            console.error("No se encontró la incidencia con ID:", idIncidencia);
            mostrarFeedback("Error al cargar los detalles de la incidencia.", "danger");
            return;
        }
        currentEditingIncidenciaId = idIncidencia; // Guardar ID para acciones
        modalTitleLabel.innerHTML = `<span class="material-icons-outlined me-2">visibility</span> Detalles Incidencia <span class="badge bg-secondary fw-normal ms-2">${idIncidencia.substring(0, 8)}...</span>`;

        // Generar contenido HTML del modal de forma segura
        modalBodyContent.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6"><div class="detail-item"><span class="detail-label">Reportado por</span><span class="detail-value">${incidencia.reportador || 'N/A'} (${incidencia.rol || 'N/A'})</span></div></div>
                <div class="col-md-6"><div class="detail-item"><span class="detail-label">Fecha Reporte</span><span class="detail-value">${formatFullDate(incidencia.fecha)}</span></div></div>
                <div class="col-md-6"><div class="detail-item"><span class="detail-label">Ubicación</span><span class="detail-value">${incidencia.ubicacion || 'N/A'}</span></div></div>
                <div class="col-md-6"><div class="detail-item"><span class="detail-label">Prioridad</span><span class="badge text-bg-${getPrioridadBootstrapColor(incidencia.prioridad)}">${getPrioridadLabel(incidencia.prioridad)}</span></div></div>
                <div class="col-md-6"><div class="detail-item"><span class="detail-label">Equipo</span><span class="detail-value">${incidencia.equipo || 'N/A'}</span></div></div>
                <div class="col-md-6"><div class="detail-item"><span class="detail-label">Estado Actual</span><span class="badge bg-${getEstadoBootstrapClass(incidencia.estado)}">${getEstadoLabel(incidencia.estado)}</span></div></div>
                <div class="col-12"><div class="detail-item"><span class="detail-label">Descripción Completa</span><div class="modal-descripcion-full">${incidencia.descripcion || 'Sin descripción'}</div></div></div>
            </div>
        `;
        modalCambiarEstadoSelect.value = incidencia.estado; // Establecer estado actual en el select
        modal.show(); // Mostrar el modal
    };

    // Helper para color de badge de prioridad en modal
     const getPrioridadBootstrapColor = (prioridad) => {
        switch(prioridad) {
            case 'baja': return 'secondary';
            case 'media': return 'primary';
            case 'alta': return 'warning';
            case 'critica': return 'danger';
            default: return 'light';
        }
     }

    // --- Manejador del Formulario ---
    formIncidencia.addEventListener('submit', (e) => {
        e.preventDefault(); // Evita el envío tradicional del formulario

        try {
            const formData = new FormData(formIncidencia);
            const reportador = formData.get('reportador')?.trim() || '';
            const rol = formData.get('rol') || '';
            const ubicacion = formData.get('ubicacion')?.trim() || '';
            const equipo = formData.get('equipo')?.trim() || '';
            const descripcion = formData.get('descripcion')?.trim() || '';
            const prioridad = formData.get('prioridad');

            // Validación explícita
            if (!reportador) { mostrarFeedback('El campo Nombre es obligatorio.', 'warning'); return; }
            if (!rol) { mostrarFeedback('Debes seleccionar un Rol.', 'warning'); return; }
            if (!ubicacion) { mostrarFeedback('El campo Ubicación es obligatorio.', 'warning'); return; }
            if (!descripcion) { mostrarFeedback('El campo Descripción es obligatorio.', 'warning'); return; }
            if (!prioridad) { mostrarFeedback('Debes seleccionar una Prioridad.', 'warning'); return; }

            const nuevaIncidencia = {
                id: `inc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                reportador, rol, ubicacion, equipo, descripcion, prioridad,
                estado: 'nueva', // Estado inicial
                fecha: new Date().toISOString() // Fecha actual en formato ISO
            };

            // console.log("Añadiendo incidencia:", nuevaIncidencia); // DEBUG
            incidencias.unshift(nuevaIncidencia); // Añadir al principio del array en memoria

            renderizarIncidencias(); // Actualizar la lista visualmente

            formIncidencia.reset(); // Limpiar los campos del formulario
            mostrarFeedback(`Incidencia #${nuevaIncidencia.id.substring(0, 8)} añadida. ¡Recuerda Guardar en JSON!`, 'success');
            document.getElementById('reportador')?.focus(); // Poner foco en el primer campo

        } catch (error) {
            console.error("Error durante el submit:", error);
            mostrarFeedback('Ocurrió un error inesperado al procesar el formulario.', 'danger');
        }
    });

    // --- Guardar Cambios Modal ---
    modalGuardarBtn.addEventListener('click', () => {
        if (!currentEditingIncidenciaId) return;
        const incidenciaIndex = incidencias.findIndex(inc => inc.id === currentEditingIncidenciaId);
        if (incidenciaIndex > -1) {
            const nuevoEstado = modalCambiarEstadoSelect.value;
            if (incidencias[incidenciaIndex].estado !== nuevoEstado) {
                incidencias[incidenciaIndex].estado = nuevoEstado;
                // NO se guarda en JSON automáticamente
                renderizarIncidencias(); // Actualiza la vista
                mostrarFeedback(`Estado actualizado a ${getEstadoLabel(nuevoEstado)}. ¡Recuerda Guardar en JSON!`, 'info');
            } else {
                 mostrarFeedback('No se realizaron cambios en el estado.', 'secondary', 2000);
            }
        } else {
             console.error("No se encontró la incidencia para guardar cambios:", currentEditingIncidenciaId);
             mostrarFeedback("Error al guardar: no se encontró la incidencia.", "danger");
        }
        modal.hide(); // Oculta el modal
    });

    // --- Eliminar Incidencia Modal ---
    modalEliminarBtn.addEventListener('click', () => {
        if (!currentEditingIncidenciaId) return;
        const incidenciaAEliminar = incidencias.find(inc => inc.id === currentEditingIncidenciaId);
        if (!incidenciaAEliminar) {
             mostrarFeedback("Error al eliminar: no se encontró la incidencia.", "danger");
             return;
        }

        if (confirm(`¿Confirmas la eliminación PERMANENTE de la incidencia en "${incidenciaAEliminar.ubicacion}"? (Necesitas Guardar en JSON para persistir)`)) {
            incidencias = incidencias.filter(inc => inc.id !== currentEditingIncidenciaId); // Eliminar del array en memoria
            // NO se guarda en JSON automáticamente
            renderizarIncidencias(); // Actualiza la vista
            modal.hide(); // Oculta el modal
            mostrarFeedback(`Incidencia eliminada de la lista. ¡Recuerda Guardar en JSON!`, 'danger');
        }
    });

    // --- Listeners Filtros / Búsqueda / JSON ---
    filtroEstado.addEventListener('change', renderizarIncidencias);
    ordenarPor.addEventListener('change', renderizarIncidencias);
    inputBusqueda.addEventListener('input', renderizarIncidencias); // Búsqueda reactiva
    btnSaveJson.addEventListener('click', guardarIncidenciasJSON);
    btnTriggerLoadJson.addEventListener('click', () => inputLoadJson.click() ); // Dispara el input file
    inputLoadJson.addEventListener('change', cargarIncidenciasJSON); // Gestiona el archivo seleccionado

    // --- Limpiar ID al cerrar modal ---
    modalElement.addEventListener('hidden.bs.modal', () => {
        currentEditingIncidenciaId = null; // Resetea el ID al cerrar
        // Podrías resetear el body aquí si quisieras, aunque al abrir se regenera
        // modalBodyContent.innerHTML = '<div class="text-center p-4"><div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Cargando...</span></div></div>';
    });

    // --- Renderizado Inicial ---
    renderizarIncidencias(); // Dibuja la lista inicial (vacía o con datos si se cargaron previamente)
});