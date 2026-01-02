import SessionStorageManager from "./AppStorage.js";

const BASE_URL = "https://passmanager.reservai.com.mx/api";

const session = SessionStorageManager.getSession();

if (!session || !session.access_token) {
    window.location.href = "/login";
}

// Mapeo de iconos para diferentes servicios
const serviceIcons = {
    'netflix': '🎬',
    'spotify': '🎵',
    'amazon': '📦',
    'microsoft': '🖥️',
    'disney': '🎭',
    'hulu': '📺',
    'max': '🎥',
    'default': '📋'
};

function getServiceIcon(name) {
    const serviceName = (name || '').toLowerCase();
    for (const [key, icon] of Object.entries(serviceIcons)) {
        if (serviceName.includes(key)) return icon;
    }
    return serviceIcons.default;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
}

function getStatusBadge(status) {
    const statusLower = (status || '').toLowerCase();
    if (statusLower === 'active' || statusLower === 'activo') {
        return { class: 'status-active', text: 'Activo' };
    } else if (statusLower === 'inactive' || statusLower === 'inactivo') {
        return { class: 'status-inactive', text: 'Inactivo' };
    } else if (statusLower === 'pending' || statusLower === 'pendiente') {
        return { class: 'status-pending', text: 'Pendiente' };
    }
    return { class: 'status-inactive', text: statusLower };
}

async function fetchSubscriptions(page = 1) {
    const loadingEl = document.getElementById('billingLoading');
    const errorEl = document.getElementById('billingError');
    const tableBody = document.getElementById('billingTableBody');
    
    if (loadingEl) loadingEl.style.display = 'block';
    if (errorEl) errorEl.style.display = 'none';
    
    try {
        const token = SessionStorageManager.getSession().access_token;
        
        // Endpoint para obtener suscripciones del usuario
        const response = await fetch(
            `${BASE_URL}/subscriptions?page=${page}`,
            {
                method: "GET",
                headers: {
                    "Authorization": token
                }
            }
        );

        if (response.status === 418) {
            window.location.href = '/login';
            return;
        }

        if (!response.ok) {
            throw new Error('No se pudieron cargar las suscripciones');
        }

        const data = await response.json();
        const subscriptions = data.data || data.subscriptions || [];
        const currentPage = data.current_page || page;
        const nextPage = data.next_page || null;

        // Renderizar tabla
        if (subscriptions.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="empty-message"><p>No tienes suscripciones registradas</p></td></tr>';
        } else {
            tableBody.innerHTML = subscriptions.map(sub => `
                <tr>
                    <td>
                        <div class="subscription-name">
                            <span class="subscription-icon">${getServiceIcon(sub.plan_name || sub.name)}</span>
                            <span>${sub.plan_name || sub.name || 'Suscripción'}</span>
                        </div>
                    </td>
                    <td>
                        <span class="cost">$${(sub.amount || 0).toFixed(2)} / mes</span>
                    </td>
                    <td>
                        <span class="date">Inicio: ${formatDate(sub.current_period_start)}</span>
                    </td>
                    <td>
                        <span class="date">Fin: ${formatDate(sub.current_period_end)}</span>
                    </td>
                    <td>
                        <span class="status-badge ${getStatusBadge(sub.status).class}">
                            ${getStatusBadge(sub.status).text}
                        </span>
                    </td>
                </tr>
            `).join('');
        }

        // Actualizar paginación
        const paginationEl = document.querySelector('.pagination');
        const pageInfoEl = document.getElementById('billingPageInfo');
        
        if (paginationEl && pageInfoEl) {
            pageInfoEl.textContent = `Página ${currentPage}`;
            paginationEl.style.display = subscriptions.length > 0 ? 'flex' : 'none';
            
            const prevBtn = document.getElementById('prevBilling');
            const nextBtn = document.getElementById('nextBilling');
            
            if (prevBtn) prevBtn.disabled = currentPage <= 1;
            if (nextBtn) nextBtn.disabled = !nextPage;
        }

        // Guardar estado de paginación
        window.currentBillingPage = currentPage;
        window.nextBillingPage = nextPage;

    } catch (err) {
        console.error("Error al cargar suscripciones:", err);
        if (errorEl) {
            errorEl.style.display = 'block';
            errorEl.textContent = '❌ ' + err.message;
        }
        tableBody.innerHTML = '<tr><td colspan="5" class="empty-message"><p>Error al cargar suscripciones</p></td></tr>';
    } finally {
        if (loadingEl) loadingEl.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Logout
    const logoutBtn = document.getElementById("logout");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", function(e) {
            e.preventDefault();
            sessionStorage.clear();
            window.location.href = "/login";
        });
    }

    // Navegar a Inicio
    const inicioLink = document.getElementById("inicioLink");
    if (inicioLink) {
        inicioLink.addEventListener("click", function(e) {
            e.preventDefault();
            window.location.href = "/inicio";
        });
    }

    // Gestionar Pagos (placeholder para futura funcionalidad)
    const manageBillingBtn = document.getElementById("manageBillingBtn");
    if (manageBillingBtn) {
        manageBillingBtn.addEventListener("click", async () => {
            // Endpoint para abrir la página de gestión de pagos
            // TODO: Implementar cuando el endpoint esté disponible
            // window.location.href = `${BASE_URL}/billing/manage`;
            alert("Funcionalidad de gestión de pagos en desarrollo");
        });
    }

    // Paginación
    const prevBtn = document.getElementById('prevBilling');
    const nextBtn = document.getElementById('nextBilling');

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const currentPage = window.currentBillingPage || 1;
            if (currentPage > 1) {
                fetchSubscriptions(currentPage - 1);
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const nextPage = window.nextBillingPage;
            if (nextPage) {
                fetchSubscriptions(nextPage);
            }
        });
    }

    // Cargar datos iniciales
    fetchSubscriptions(1);
});
