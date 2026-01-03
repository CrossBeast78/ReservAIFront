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
        
        // SIMULACIÓN DE ERROR 404 - Eliminar cuando el endpoint esté disponible
        throw new Error('404');
        
        // DATOS DE PRUEBA - Eliminar cuando el endpoint esté disponible
        const mockData = {
            data: [
                {
                    id: 1,
                    plan_name: "Plan Básico",
                    price: 1699.99,
                    start_date: "2024-01-15",
                    end_date: "2025-01-15",
                    status: "active"
                },
                {
                    id: 2,
                    plan_name: "Plan Pro",
                    price: 2699.99,
                    start_date: "2023-06-20",
                    end_date: "2026-06-20",
                    status: "active"
                }
            ],
            current_page: page,
            next_page: null
        };

        // Endpoint para obtener planes del usuario
        // const response = await fetch(
        //     `${BASE_URL}/billing/plans?page=${page}`,
        //     {
        //         method: "GET",
        //         headers: {
        //             "Authorization": token
        //         }
        //     }
        // );

        // if (response.status === 418) {
        //     window.location.href = '/login';
        //     return;
        // }

        // if (!response.ok) {
        //     throw new Error('No se pudieron cargar los planes');
        // }

        // const data = await response.json();
        const data = mockData; // USAR DATOS DE PRUEBA
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
            tableBody.style.display = 'table-row-group';
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
        const billingContent = document.querySelector('.billing-content');
        if (errorEl) {
            errorEl.style.display = 'block';
            if (billingContent) billingContent.style.display = 'none';
            // Si es error 404, mostrar mensaje personalizado de Stripe
            if (err.message.includes('404') || err.status === 404) {
                errorEl.innerHTML = `
                    <div style="
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 2.5rem 2rem;
                        gap: 1rem;
                        min-height: 250px;
                    ">
                        <div style="font-size: 3rem; opacity: 0.9;">💳</div>
                        <div style="text-align: center;">
                            <h2 style="
                                font-size: 1.3rem;
                                margin: 0 0 0.5rem 0;
                                color: var(--text-light);
                                font-weight: 600;
                            ">Configura tu método de pago</h2>
                            <p style="
                                color: #A0A0A0;
                                margin: 0;
                                font-size: 0.95rem;
                                line-height: 1.5;
                            ">Completa la configuración de Stripe para comenzar a usar tus planes.</p>
                        </div>
                        <a href="#" id="stripeConfigLink" style="
                            display: inline-flex;
                            align-items: center;
                            gap: 0.5rem;
                            background: var(--primary);
                            color: #fff;
                            padding: 0.75rem 1.75rem;
                            border-radius: 8px;
                            text-decoration: none;
                            cursor: pointer;
                            font-weight: 500;
                            font-size: 0.95rem;
                            transition: all 0.3s ease;
                            border: none;
                            margin-top: 0.5rem;
                        ">Configurar ahora →</a>
                    </div>
                `;
                
                // Event listener para el link de Stripe
                const stripeConfigLink = document.getElementById('stripeConfigLink');
                if (stripeConfigLink) {
                    stripeConfigLink.addEventListener('click', (e) => {
                        e.preventDefault();
                        // TODO: Reemplazar con la URL correcta de Stripe cuando esté disponible
                        // window.location.href = `${BASE_URL}/billing/stripe/setup`;
                        alert("Redirigiendo a configuración de Stripe...");
                    });
                }
            } else {
                errorEl.textContent = '❌ ' + err.message;
            }
        }
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
/*     const prevBtn = document.getElementById('prevBilling');
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
 */

    // Cargar datos iniciales
    fetchSubscriptions(1);
});
