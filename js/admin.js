// js/admin.js

document.addEventListener('DOMContentLoaded', () => {

    // --- Constantes y Variables ---
    const USER_STORAGE_KEY = 'gestionIncidenciasUsers';
    const INCIDENCIAS_STORAGE_KEY = 'incidenciasData';
    let incidencias = [];
    let modalInstance = null;
    let incidenciaActivaId = null;

    // --- Selectores ---
    // ELIMINADO: formAdmin, feedbackAdmin
    const container = document.getElementById('incidencias-container');
    const placeholder = document.querySelector('.placeholder-incidencias');
    const counter = document.getElementById('contador-incidencias');
    const searchInput = document.getElementById('input-busqueda');
    const stateFilter = document.getElementById('filtro-estado'); // Filtro 'Todas' por defecto en HTML
    const sortSelect = document.getElementById('ordenar-por');
    const btnSave = document.getElementById('btn-save-json');
    const btnTriggerLoad = document.getElementById('btn-trigger-load-json');
    const inputLoad = document.getElementById('input-load-json');
    // Modal
    const modal = document.getElementById('modalDetallesIncidencia');
    const modalContent = document.getElementById('modal-body-content');
    const modalStateSelect = document.getElementById('modal-cambiar-estado'); // RE-AÑADIDO
    const modalTechSelect = document.getElementById('modal-asignar-tecnico');
    const btnModalDelete = document.getElementById('modal-eliminar-incidencia');
    const btnModalSave = document.getElementById('modal-guardar-cambios');

    // --- Funciones Auxiliares (sin cambios respecto a la versión completa anterior) ---
    const genId = () => `inc-${Date.now()}-${Math.random().toString(16).slice(-6)}`;
    const formatDate = (ts) => ts ? new Date(ts).toLocaleString('es-ES',{dateStyle:'short',timeStyle:'short'}) : '-';
    const getPrioBadge = (p) => ({ baja: 'bg-secondary-subtle text-secondary-emphasis', media: 'bg-primary-subtle text-primary-emphasis', alta: 'bg-warning-subtle text-warning-emphasis', critica: 'bg-danger-subtle text-danger-emphasis', pendiente: 'bg-light text-dark' }[p] || 'bg-light');
    const getStatIcon = (s) => ({ nueva: {i:'fiber_new',c:'text-info',t:'Nueva'}, asignada: {i:'assignment_ind',c:'text-primary',t:'Asignada'}, en_proceso: {i:'hourglass_top',c:'text-warning',t:'En Proc.'}, resuelta: {i:'check_circle',c:'text-success',t:'Resuelta'} }[s] || {i:'help',c:'text-muted',t:'?'});
    const getTechs = () => { try { const u = JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || '{}'); const t = Object.entries(u).filter(([,x])=>x.role==='tecnico').map(([e,u])=>({email:e, name:u.name||e})); t.sort((a,b)=>a.name.localeCompare(b.name)); return t; } catch(e){ return []; }};
    const populateTechs = (id) => { const s = document.getElementById(id); if(!s) return; while (s.options.length > 1) s.remove(1); getTechs().forEach(t=>s.add(new Option(t.name, t.email))); };
    const persist = () => { try { localStorage.setItem(INCIDENCIAS_STORAGE_KEY, JSON.stringify(incidencias)); } catch(e){ console.error("Persist error:", e); showGlobalFeedback("Error guardando incidencias.", "danger"); }};
    const showGlobalFeedback = (msg, type = 'info') => { let fb = document.getElementById('global-feedback-area'); if(fb) fb.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show alert-sm" role="alert">${msg}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`; else alert(msg); };

    // --- Renderizado / Filtrado ---
    const render = (items = incidencias) => { /* ... código sin cambios ... */
         container.innerHTML = ''; const users = JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || '{}');
        if(items.length === 0) { if(placeholder) placeholder.style.display = 'block'; container.innerHTML = `<div class="placeholder-incidencias text-center p-4"><span class="material-icons-outlined fs-1">inbox</span><p>No hay incidencias que mostrar.</p></div>`; }
        else { if(placeholder) placeholder.style.display = 'none'; items.forEach(inc => { let pT=inc.prioridad==='pendiente'?'Pend.':(inc.prioridad?.slice(0,1).toUpperCase()||'?'); let pC=getPrioBadge(inc.prioridad); let tN=inc.assignedTechnician?(users[inc.assignedTechnician]?.name?.split(' ')[0]||'Asig.'):'N/A'; const sI=getStatIcon(inc.estado); container.insertAdjacentHTML('beforeend', `<a href="#" class="list-group-item list-group-item-action modern-list-item" data-incidencia-id="${inc.id}"><div class="d-flex w-100 justify-content-between align-items-start"><h5 class="mb-1 text-truncate me-2" style="max-width: 60%;">${inc.descripcion.substring(0,60)}${inc.descripcion.length>60?'...':''}</h5><small class="text-nowrap d-flex align-items-center"><span class="badge rounded-pill ${pC} me-1" title="${inc.prioridad}">${pT}</span><span class="material-icons-outlined sm-icon ${sI.c} me-1" title="${sI.t}">${sI.i}</span><span class="badge rounded-pill bg-light-subtle text-light-emphasis">#${inc.id.slice(-5)}</span></small></div><p class="mb-1 small text-body-secondary"><span class="material-icons-outlined sm-icon">person</span> ${tN} • <span class="material-icons-outlined sm-icon">location_on</span> ${inc.ubicacion}${inc.equipo?`(${inc.equipo.substring(0,10)})`:''} </p><small class="text-body-secondary">Por: ${inc.reportador} (${formatDate(inc.fechaReporte)})</small></a>`); }); }
        updateCounter(items.length, incidencias.length);
    };
    const updateCounter = (shown, total) => { /* ... código sin cambios ... */ if(counter) { const filt = searchInput?.value || stateFilter?.value !== 'todas'; counter.textContent = filt ? `${shown} de ${total} incidencias` : `${total} incidencia${total !== 1 ? 's' : ''}`; } };
    const filterAndSort = () => { /* ... código sin cambios ... */
        let items = [...incidencias]; const term = searchInput?.value.toLowerCase().trim(); if(term) items = items.filter(i=>Object.values(i).some(v=>String(v).toLowerCase().includes(term))); const estado = stateFilter?.value; if(estado && estado !== 'todas') items = items.filter(i=>i.estado === estado); const orden = sortSelect?.value || 'fecha_desc'; const pOrd={'critica':4,'alta':3,'media':2,'baja':1,'pendiente':0}; items.sort((a,b)=>{ if(orden==='fecha_asc') return (a.fechaReporte||0)-(b.fechaReporte||0); if(orden==='prioridad') return (pOrd[b.prioridad]??-1)-(pOrd[a.prioridad]??-1); return (b.fechaReporte||0)-(a.fechaReporte||0); }); render(items);
    };

    // --- ELIMINADO: Formulario Creación Admin ---

    // --- JSON Handling (sin cambios) ---
    const saveJSON = () => { /* ... código anterior ... */ if(incidencias.length===0){ showGlobalFeedback("Nada que guardar.","warning"); return; } try { const d=JSON.stringify(incidencias,null,2); const b=new Blob([d],{type:'application/json'}); const u=URL.createObjectURL(b); const l=document.createElement('a'); const t=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-'); l.href=u; l.download=`incidencias_${t}.json`; l.click(); URL.revokeObjectURL(u); l.remove(); showGlobalFeedback("Incidencias guardadas.","success"); } catch(e){ console.error("Save JSON error:",e); showGlobalFeedback(`Error: ${e.message}`,"danger"); } };
    const loadJSON = (e) => { /* ... código anterior ... */ const f=e.target.files[0]; if(!f) return; const r=new FileReader(); r.onload=ev=>{ try { const ni=JSON.parse(ev.target.result); if(!Array.isArray(ni)||(ni.length>0&&!ni[0]?.id)) throw new Error("Formato JSON inválido."); ni.forEach(i=>{ i.id=i.id??genId(); i.prioridad=i.prioridad??'pendiente'; i.assignedTechnician=i.assignedTechnician??null; i.estado=i.estado??'nueva'; i.fechaReporte=i.fechaReporte??Date.now(); }); incidencias=ni; persist(); filterAndSort(); showGlobalFeedback(`Cargadas ${incidencias.length} incidencias.`, "success"); } catch(er){ console.error("Load JSON error:",er); showGlobalFeedback(`Error: ${er.message}`,"danger"); } finally { inputLoad.value=null; } }; r.onerror=()=>showGlobalFeedback(`Error al leer ${f.name}.`,"danger"); r.readAsText(f); };

    // --- Modal Handling (Admin - Gestión Completa) ---
    const showModal = (id) => {
        const inc = incidencias.find(i => i.id === id); if (!inc) return;
        incidenciaActivaId = id;
        const users = JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || '{}');

        populateTechs('modal-asignar-tecnico'); // Poblar dropdown técnicos

        const sInfo = getStatIcon(inc.estado);
        let pText = inc.prioridad === 'pendiente' ? 'Pendiente' : (inc.prioridad?.charAt(0).toUpperCase() + inc.prioridad?.slice(1) || 'N/A');
        let pClass = getPrioBadge(inc.prioridad);
        let tName = inc.assignedTechnician ? (users[inc.assignedTechnician]?.name || inc.assignedTechnician) : '<em class="text-muted">Sin asignar</em>';

        // Mostrar info completa en el modal
        modalContent.innerHTML = `
            <h6>${inc.descripcion}</h6>
            <hr class="my-2">
            <div class="row gx-3 gy-2 small mb-3">
                <div class="col-md-6"><strong>ID:</strong> <span class="font-monospace user-select-all">${inc.id}</span></div>
                <div class="col-md-6"><strong>Estado Actual:</strong> <span class="${sInfo.c} fw-medium">${sInfo.t}</span></div>
                <div class="col-md-6"><strong>Reportado:</strong> ${formatDate(inc.fechaReporte)} por ${inc.reportador} (${inc.rol})</div>
                <div class="col-md-6"><strong>Prioridad Actual:</strong> <span class="badge rounded-pill ${pClass}">${pText}</span></div>
                <div class="col-md-6"><strong>Técnico Actual:</strong> ${tName}</div>
                <div class="col-md-6"><strong>Ubicación:</strong> ${inc.ubicacion} ${inc.equipo ? `(${inc.equipo})` : ''}</div>
            </div>
            <p class="small bg-body-secondary p-2 rounded">${inc.descripcion}</p>
        `;

        // Pre-seleccionar valores en controles
        if(modalStateSelect) modalStateSelect.value = inc.estado || 'nueva'; // Seleccionar estado actual
        document.querySelectorAll('input[name="modal-prioridad"]').forEach(radio => radio.checked = (radio.value === inc.prioridad && inc.prioridad !== 'pendiente'));
        if(modalTechSelect) modalTechSelect.value = inc.assignedTechnician || "";

        // ELIMINADA: Validación/deshabilitación del botón guardar
        // if(btnModalSave) btnModalSave.disabled = false; // Siempre habilitado

        if (!modalInstance) modalInstance = new bootstrap.Modal(modal);
        modalInstance.show();
    };

    // Guardar Cambios del Modal (Versión Completa Admin)
    const saveModal = () => {
        if (!incidenciaActivaId) return;
        const idx = incidencias.findIndex(i => i.id === incidenciaActivaId);
        if (idx === -1) return;

        // Obtener valores de TODOS los controles
        const nEstado = modalStateSelect?.value || incidencias[idx].estado; // Usar valor actual si el select no existe
        const nPrio = document.querySelector('input[name="modal-prioridad"]:checked')?.value || incidencias[idx].prioridad; // Mantener si no se marca una nueva
        const nTec = modalTechSelect?.value || null; // null si se selecciona "Sin asignar"

        let changed = false;

        // Comprobar y aplicar cambios
        if (incidencias[idx].estado !== nEstado) { incidencias[idx].estado = nEstado; changed = true; }
        // Solo cambiar prioridad si se seleccionó una nueva (no si se deja como estaba o pendiente)
        if (nPrio !== 'pendiente' && incidencias[idx].prioridad !== nPrio) { incidencias[idx].prioridad = nPrio; changed = true; }
        if (incidencias[idx].assignedTechnician !== nTec) { incidencias[idx].assignedTechnician = nTec; changed = true; }

        // Si se asigna un técnico y estaba 'nueva', cambiar a 'asignada' (a menos que se ponga 'resuelta', etc.)
         if (nTec && nEstado === 'nueva') {
             incidencias[idx].estado = 'asignada';
             changed = true; // Asegurar que se marque como cambio
         }
         // Si se quita el técnico, ¿volvemos a 'nueva' o dejamos el estado actual? -> Dejamos el estado actual por ahora.

        if (changed) {
            incidencias[idx].fechaActualizacion = Date.now();
            persist(); // Guardar cambios en localStorage
            filterAndSort(); // Refrescar la lista
            showGlobalFeedback(`Incidencia #${incidenciaActivaId.slice(-5)} actualizada.`, "success");
        } else {
             showGlobalFeedback(`No se realizaron cambios en la incidencia #${incidenciaActivaId.slice(-5)}.`, "info");
        }

        if(modalInstance) modalInstance.hide();
        incidenciaActivaId = null;
    };

    // Eliminar Incidencia (sin cambios)
    const deleteModal = () => { /* ... código anterior ... */ if(!incidenciaActivaId) return; if(!confirm(`Eliminar incidencia #${incidenciaActivaId.slice(-5)}?`)) return; const idx=incidencias.findIndex(i=>i.id===incidenciaActivaId); if(idx!==-1){ incidencias.splice(idx,1); persist(); filterAndSort(); showGlobalFeedback(`Incidencia eliminada.`, "warning"); } if(modalInstance) modalInstance.hide(); incidenciaActivaId=null; };

    // --- Inicialización ---
    const currentUser = getCurrentUser();
    const welcomeSpan = document.getElementById('welcome-user');
    if(currentUser && welcomeSpan) welcomeSpan.textContent = `Hola, ${currentUser.name}`;

    try { // Carga inicial
        const data = localStorage.getItem(INCIDENCIAS_STORAGE_KEY);
        if(data) { incidencias = JSON.parse(data).map(i=>({...i, prioridad: i.prioridad??'pendiente', assignedTechnician: i.assignedTechnician??null, estado: i.estado??'nueva'})); }
    } catch(e){ console.error("Init load error:", e); showGlobalFeedback("Error al cargar incidencias.", "danger"); }

    filterAndSort(); // Renderizado inicial (aplicará filtro 'todas' por defecto)

    // --- Listeners ---
    // ELIMINADO: Listener para formAdmin
    if(searchInput) searchInput.addEventListener('input', filterAndSort);
    if(stateFilter) stateFilter.addEventListener('change', filterAndSort);
    if(sortSelect) sortSelect.addEventListener('change', filterAndSort);
    if(btnSave) btnSave.addEventListener('click', saveJSON);
    if(btnTriggerLoad) btnTriggerLoad.addEventListener('click', () => inputLoad?.click());
    if(inputLoad) inputLoad.addEventListener('change', loadJSON);
    if(container) container.addEventListener('click', (e) => { const item = e.target.closest('[data-incidencia-id]'); if(item){ e.preventDefault(); showModal(item.dataset.incidenciaId); } });
    if(btnModalSave) btnModalSave.addEventListener('click', saveModal);
    if(btnModalDelete) btnModalDelete.addEventListener('click', deleteModal);
    // ELIMINADO: Listener de 'change' en el modal para validación
    if(modal) modalInstance = new bootstrap.Modal(modal);

}); // Fin DOMContentLoaded

function getCurrentUser() { try { const d = sessionStorage.getItem('loggedInUser'); return d ? JSON.parse(d) : null; } catch (e) { return null; } }