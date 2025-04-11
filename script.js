document.addEventListener('DOMContentLoaded', () => {
    // --- Selectores ---
    const formIncidencia = document.getElementById('form-incidencia'); // Verifica que este ID existe en tu form HTML
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
    const modal = new bootstrap.Modal(modalElement);
    const modalBodyContent = document.getElementById('modal-body-content');
    const modalCambiarEstadoSelect = document.getElementById('modal-cambiar-estado');
    const modalGuardarBtn = document.getElementById('modal-guardar-cambios');
    const modalEliminarBtn = document.getElementById('modal-eliminar-incidencia');
    const modalTitleLabel = document.getElementById('modalDetallesLabel');
    let currentEditingIncidenciaId = null;

    // --- Estado ---
    let incidencias = [];

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
                const bsAlert = bootstrap.Alert.getOrCreateInstance(alertElement);
                if (bsAlert) bsAlert.close();
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
            return date.toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        } catch (e) { return 'Fecha inválida'; }
    };
    const formatFullDate = (isoDateString) => {
         if (!isoDateString) return 'Fecha desconocida';
        try {
            const date = new Date(isoDateString);
            return date.toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' });
         } catch (e) { return 'Fecha inválida'; }
    };
    const getPrioridadLabel = (prioridadKey) => {
        const labels = { baja: 'Baja', media: 'Media', alta: 'Alta', critica: 'Crítica' }; return labels[prioridadKey] || prioridadKey;
    };
    const getPrioridadClass = (prioridadKey) => `priority-${prioridadKey}`;
    const getEstadoLabel = (estadoKey) => {
        const labels = { nueva: 'Nueva', en_proceso: 'En Proceso', resuelta: 'Resuelta' }; return labels[estadoKey] || estadoKey;
    };
    const getEstadoClass = (estadoKey) => `status-${estadoKey}`;
    const getEstadoBootstrapClass = (estado) => {
        switch(estado) {
            case 'nueva': return 'primary'; case 'en_proceso': return 'info'; case 'resuelta': return 'success'; default: return 'secondary';
        }
    };

    // --- JSON Handling ---
    const guardarIncidenciasJSON = () => {
        if (incidencias.length === 0) {
            mostrarFeedback("No hay incidencias para guardar.", "warning");
            return;
        }
        try {
            const jsonData = JSON.stringify(incidencias, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const fechaHoy = new Date();
            const formattedDate = fechaHoy.toISOString().slice(0, 10).replace(/-/g, '');
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
        if (file.type !== "application/json") {
             mostrarFeedback("Por favor, selecciona un archivo JSON válido.", "warning");
             inputLoadJson.value = null; return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const loadedData = JSON.parse(e.target.result);
                if (!Array.isArray(loadedData)) throw new Error("El archivo JSON no contiene un array.");
                // TODO: Añadir validación más robusta de la estructura de cada objeto si se desea
                incidencias = loadedData;
                mostrarFeedback(`Incidencias cargadas desde ${file.name}.`, "info");
                inputLoadJson.value = null;
                renderizarIncidencias();
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
        incidenciasContainer.innerHTML = '';
        const estadoFiltrado = filtroEstado.value;
        const terminoBusqueda = inputBusqueda.value.toLowerCase().trim();
        let incidenciasFiltradas = incidencias.filter(inc => {
            const cumpleEstado = estadoFiltrado === 'todas' || inc.estado === estadoFiltrado;
            const cumpleBusqueda = terminoBusqueda === '' ||
                                   (inc.reportador && inc.reportador.toLowerCase().includes(terminoBusqueda)) ||
                                   (inc.ubicacion && inc.ubicacion.toLowerCase().includes(terminoBusqueda)) ||
                                   (inc.equipo && inc.equipo.toLowerCase().includes(terminoBusqueda)) ||
                                   (inc.descripcion && inc.descripcion.toLowerCase().includes(terminoBusqueda)) ||
                                   (inc.id && inc.id.toLowerCase().includes(terminoBusqueda));
            return cumpleEstado && cumpleBusqueda;
        });
        const ordenSeleccionado = ordenarPor.value;
         incidenciasFiltradas.sort((a, b) => {
            if (ordenSeleccionado === 'fecha_desc') return new Date(b.fecha) - new Date(a.fecha);
            if (ordenSeleccionado === 'fecha_asc') return new Date(a.fecha) - new Date(b.fecha);
            if (ordenSeleccionado === 'prioridad') {
                const prioridadValor = { 'critica': 4, 'alta': 3, 'media': 2, 'baja': 1 };
                return (prioridadValor[b.prioridad] || 0) - (prioridadValor[a.prioridad] || 0);
            }
            return 0;
        });

        if (incidenciasFiltradas.length === 0) {
            placeholderIncidencias.style.display = 'flex';
            if (incidencias.length === 0) {
                 placeholderIncidencias.querySelector('.material-icons-outlined').textContent = 'file_upload';
                 placeholderIncidencias.querySelector('p').textContent = 'Carga un archivo JSON o reporta una nueva incidencia.';
            } else {
                 placeholderIncidencias.querySelector('.material-icons-outlined').textContent = 'search_off';
                 placeholderIncidencias.querySelector('p').textContent = 'No hay incidencias que coincidan con los filtros.';
            }
            contadorIncidenciasEl.textContent = '0 incidencias mostradas';
        } else {
            placeholderIncidencias.style.display = 'none';
            contadorIncidenciasEl.textContent = `${incidenciasFiltradas.length} de ${incidencias.length} incidencias cargadas`;
            incidenciasFiltradas.forEach((inc, index) => {
                 const item = document.createElement('div');
                 item.className = 'list-group-item';
                 item.dataset.id = inc.id;
                 item.style.animationDelay = `${index * 0.05}s`;
                 item.innerHTML = `
                    <div class="d-flex w-100 justify-content-between align-items-start">
                        <div>
                            <a href="#" class="incidencia-item-title stretched-link text-decoration-none">
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
                    </div>`;
                 item.addEventListener('click', (e) => { e.preventDefault(); abrirModalDetalles(inc.id); });
                 incidenciasContainer.appendChild(item);
            });
        }
    };

    // --- Modal Handling ---
    const abrirModalDetalles = (idIncidencia) => {
        const incidencia = incidencias.find(inc => inc.id === idIncidencia);
        if (!incidencia) return;
        currentEditingIncidenciaId = idIncidencia;
        modalTitleLabel.innerHTML = `<span class="material-icons-outlined me-2">visibility</span> Detalles Incidencia <span class="badge bg-secondary fw-normal ms-2">${idIncidencia.substring(0, 8)}...</span>`;
        modalBodyContent.innerHTML = `
            <div class="row g-3">
                <div class="col-md-6"><div class="detail-item"><span class="detail-label">Reportado por</span><span class="detail-value">${incidencia.reportador || 'N/A'} (${incidencia.rol || 'N/A'})</span></div></div>
                <div class="col-md-6"><div class="detail-item"><span class="detail-label">Fecha Reporte</span><span class="detail-value">${formatFullDate(incidencia.fecha)}</span></div></div>
                <div class="col-md-6"><div class="detail-item"><span class="detail-label">Ubicación</span><span class="detail-value">${incidencia.ubicacion || 'N/A'}</span></div></div>
                <div class="col-md-6"><div class="detail-item"><span class="detail-label">Prioridad</span><span class="badge ${getPrioridadClass(incidencia.prioridad)} text-dark">${getPrioridadLabel(incidencia.prioridad)}</span></div></div>
                <div class="col-md-6"><div class="detail-item"><span class="detail-label">Equipo</span><span class="detail-value">${incidencia.equipo || 'N/A'}</span></div></div>
                <div class="col-md-6"><div class="detail-item"><span class="detail-label">Estado Actual</span><span class="badge bg-${getEstadoBootstrapClass(incidencia.estado)}">${getEstadoLabel(incidencia.estado)}</span></div></div>
                <div class="col-12"><div class="detail-item"><span class="detail-label">Descripción Completa</span><div class="modal-descripcion-full">${incidencia.descripcion || 'Sin descripción'}</div></div></div>
            </div>`;
        modalCambiarEstadoSelect.value = incidencia.estado;
        modal.show();
    };

    // --- Manejador del Formulario ---
    formIncidencia.addEventListener('submit', (e) => {
        // console.log('Submit event capturado');
        e.preventDefault();

        try {
            const formData = new FormData(formIncidencia);
            // console.log("--- FormData entries ---");
            // for (let [key, value] of formData.entries()) { console.log(`${key}: ${value}`); }
            // console.log("-----------------------");

            const nuevaIncidencia = {
                id: `inc-${Date.now()}-${Math.random().toString(16).slice(2)}`,
                reportador: formData.get('reportador')?.trim() || '',
                rol: formData.get('rol') || '',
                ubicacion: formData.get('ubicacion')?.trim() || '',
                equipo: formData.get('equipo')?.trim() || '',
                descripcion: formData.get('descripcion')?.trim() || '',
                prioridad: formData.get('prioridad'), // Requiere name="prioridad" en HTML radios
                estado: 'nueva',
                fecha: new Date().toISOString()
            };

            // console.log("Objeto nuevaIncidencia ANTES de validar:", nuevaIncidencia);

            // Validación crucial
            if (!nuevaIncidencia.reportador || !nuevaIncidencia.rol || !nuevaIncidencia.ubicacion || !nuevaIncidencia.descripcion || !nuevaIncidencia.prioridad) {
                // console.warn("Validación fallida. Datos problemáticos:", { /* ... */ });
                mostrarFeedback('Completa todos los campos obligatorios (Nombre, Rol, Ubicación, Descripción, Prioridad).', 'warning');
                return; // Detiene si falta algo
            }

            // console.log("Validación pasada. Añadiendo incidencia...");

            incidencias.unshift(nuevaIncidencia);
            // No se guarda automáticamente
            renderizarIncidencias();
            formIncidencia.reset(); // Limpia el formulario
            mostrarFeedback(`Incidencia #${nuevaIncidencia.id.substring(0, 8)} añadida. ¡Recuerda Guardar en JSON!`, 'success');
            document.getElementById('reportador')?.focus(); // Foco en el primer campo

        } catch (error) {
            console.error("¡ERROR durante el submit!", error);
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
                // No se guarda automáticamente
                renderizarIncidencias();
                mostrarFeedback(`Estado actualizado. ¡Recuerda Guardar en JSON!`, 'info');
            } else {
                 mostrarFeedback('No se realizaron cambios.', 'secondary', 2000);
            }
        }
        modal.hide();
    });

    // --- Eliminar Incidencia Modal ---
    modalEliminarBtn.addEventListener('click', () => {
        if (!currentEditingIncidenciaId) return;
        const incidenciaAEliminar = incidencias.find(inc => inc.id === currentEditingIncidenciaId);
        if (!incidenciaAEliminar) return;
        if (confirm(`¿Confirmas la eliminación de la incidencia en "${incidenciaAEliminar.ubicacion}"? (No se guardará hasta que pulses Guardar JSON)`)) {
            incidencias = incidencias.filter(inc => inc.id !== currentEditingIncidenciaId);
            // No se guarda automáticamente
            renderizarIncidencias();
            modal.hide();
            mostrarFeedback(`Incidencia eliminada de la lista. ¡Recuerda Guardar en JSON!`, 'danger');
        }
    });

    // --- Listeners Filtros / Búsqueda / JSON ---
    filtroEstado.addEventListener('change', renderizarIncidencias);
    ordenarPor.addEventListener('change', renderizarIncidencias);
    inputBusqueda.addEventListener('input', renderizarIncidencias);
    btnSaveJson.addEventListener('click', guardarIncidenciasJSON);
    btnTriggerLoadJson.addEventListener('click', () => inputLoadJson.click() );
    inputLoadJson.addEventListener('change', cargarIncidenciasJSON);

    // --- Limpiar ID al cerrar modal ---
    modalElement.addEventListener('hidden.bs.modal', () => {
        currentEditingIncidenciaId = null;
        modalTitleLabel.innerHTML = `<span class="material-icons-outlined me-2">visibility</span> Detalles de la Incidencia`;
        modalBodyContent.innerHTML = `<div class="text-center p-4"><div class="spinner-border spinner-border-sm" role="status"><span class="visually-hidden">Cargando...</span></div></div>`;
    });

    // --- Renderizado Inicial ---
    renderizarIncidencias(); // Muestra la lista (inicialmente vacía)
});