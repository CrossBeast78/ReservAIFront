import SessionStorageManager from "./AppStorage.js";

const BASE_URL = "https://passmanager.reservai.com.mx/api";

const session = SessionStorageManager.getSession();

if (!session || !session.access_token) {
    window.location.href = "/login";
}

// Mapeo de iconos para diferentes planes
const planIcons = {
    'basico': '/static/Images/LogoReservAi.png',
    'basic': '/static/Images/LogoReservAi.png',
    'pro': '/static/Images/LogoReservAi.png',
    'default': '/static/Images/LogoReservAi.png'
};

function getPlanIcon(name) {
    const planName = (name || '').toLowerCase();
    for (const [key, icon] of Object.entries(planIcons)) {
        if (planName.includes(key)) return icon;
    }
    return planIcons.default;
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
        
        // Endpoint para obtener planes del usuario
        const response = await fetch(
            `${BASE_URL}/billing/plans?page=${page}`,
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
            throw new Error('No se pudieron cargar los planes');
        }

        const data = await response.json();
        const plans = data.data || data.plans || [];
        const currentPage = data.current_page || page;
        const nextPage = data.next_page || null;

        // Renderizar tabla
        if (plans.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="empty-message"><p>No tienes planes activos</p></td></tr>';
        } else {
            tableBody.innerHTML = plans.map(plan => `
                <tr>
                    <td>
                        <div class="subscription-name">
                            <span class="subscription-icon">
                                <img src="${getPlanIcon(plan.plan_name || plan.name)}" alt="${plan.plan_name || plan.name}" style="width: 32px; height: 32px; object-fit: contain;">
                            </span>
                            <span>${plan.plan_name || plan.name || 'Plan'}</span>
                        </div>
                    </td>
                    <td>
                        <span class="cost">$${(plan.price || plan.amount || 0).toFixed(2)} / mes</span>
                    </td>
                    <td>
                        <span class="date">Inicio: ${formatDate(plan.start_date || plan.current_period_start)}</span>
                    </td>
                    <td>
                        <span class="date">Fin: ${formatDate(plan.end_date || plan.current_period_end)}</span>
                    </td>
                    <td>
                        <span class="status-badge ${getStatusBadge(plan.status).class}">
                            ${getStatusBadge(plan.status).text}
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
            paginationEl.style.display = plans.length > 0 ? 'flex' : 'none';
            
            const prevBtn = document.getElementById('prevBilling');
            const nextBtn = document.getElementById('nextBilling');
            
            if (prevBtn) prevBtn.disabled = currentPage <= 1;
            if (nextBtn) nextBtn.disabled = !nextPage;
        }

        // Guardar estado de paginación
        window.currentBillingPage = currentPage;
        window.nextBillingPage = nextPage;

    } catch (err) {
        console.error("Error al cargar planes:", err);
        if (errorEl) {
            errorEl.style.display = 'block';
            errorEl.textContent = '❌ ' + err.message;
        }
        tableBody.innerHTML = '<tr><td colspan="5" class="empty-message"><p>Error al cargar planes</p></td></tr>';
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
            alert("Funcionalidad de gestión de planes en desarrollo");
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
