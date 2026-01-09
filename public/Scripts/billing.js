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

// Crear customer en Stripe
export async function createStripeCustomer() {
    // Usar el modal de carga de Stripe si existe
    const stripeLoadingModal = document.getElementById('stripeLoadingModal');
    const stripeLoadingText = document.getElementById('stripeLoadingText');
    if (stripeLoadingModal) stripeLoadingModal.style.display = 'flex';
    if (stripeLoadingText) {
        stripeLoadingText.textContent = 'Creando customer en Stripe...';
        stripeLoadingText.style.color = '#222';
    }
    try {
        const token = SessionStorageManager.getSession().access_token;
        const response = await fetch(
            `${BASE_URL}/billing/customer`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token
                }
            }
        );
        if (!response.ok) {
            const errorText = await response.text();
            let msg = '';
            if (response.status === 400 && errorText.includes('already exists')) {
                msg = 'El customer ya existe para esta cuenta';
            } else if (response.status === 400) {
                msg = 'La cuenta no existe en la base de datos';
            } else if (response.status === 403) {
                msg = 'La cuenta no es de tipo cliente';
            } else if (response.status === 418) {
                msg = 'No se envió el token';
            } else if (response.status === 500) {
                msg = 'Error creando el customer en Stripe';
            } else {
                msg = `Error ${response.status}: ${errorText}`;
            }
            if (stripeLoadingText) {
                stripeLoadingText.textContent = 'Error: ' + msg;
                stripeLoadingText.style.color = '#c00';
            }
            throw new Error(msg);
        }
        const data = await response.json();
        if (stripeLoadingText) {
            stripeLoadingText.textContent = '¡Customer creado correctamente!';
            stripeLoadingText.style.color = '#1a7f37';
        }
        return data;
    } catch (err) {
        // El mensaje de error ya se muestra en el modal
        throw err;
    }
}
async function fetchSubscriptions(page = 1) {
    const loadingEl = document.getElementById('billingLoading');
    const errorEl = document.getElementById('billingError');
    const tableBody = document.getElementById('billingTableBody');
    const billingTable = document.querySelector('.billing-table');
    // Oculta toda la tabla mientras carga
    if (billingTable) billingTable.style.display = 'none';
    if (loadingEl) loadingEl.style.display = 'block';
    if (errorEl) errorEl.style.display = 'none';
    
    try {
        const token = SessionStorageManager.getSession().access_token;
        
        console.log('Token:', token ? 'presente' : 'ausente');
        console.log('Llamando a:', `${BASE_URL}/billing/status`);
        
        // Endpoint para obtener planes del usuario
        const response = await fetch(
            `${BASE_URL}/billing/status`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token
                }
            }
        );

        console.log('Status de respuesta:', response.status);

        if (response.status === 418) {
            window.location.href = '/login';
            return;
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.log('Error response:', errorText);
            
            if (response.status === 400) {
                throw new Error('Account does not exist');
            } else if (response.status === 403) {
                throw new Error('Account is not a client');
            } else if (response.status === 404) {
                throw new Error('404');
            } else if (response.status === 500) {
                throw new Error('Internal server error');
            }
            throw new Error(`Error ${response.status}: No se pudieron cargar los planes`);
        }

        const data = await response.json();
        console.log('Datos recibidos:', data);
        
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
        // Mostrar la tabla cuando termina de cargar
        if (billingTable) billingTable.style.display = '';

        // Agregar animación a la tabla
        const billingContent = document.querySelector('.billing-content');
        if (billingContent) {
            billingContent.style.animation = 'slideInContent 0.5s ease-out';
        }

    } catch (err) {
        console.error("Error al cargar planes:", err);
        const billingContent = document.querySelector('.billing-content');
        const manageBillingBtn = document.getElementById('manageBillingBtn');
        if (errorEl) {
            errorEl.style.display = 'block';
            if (billingContent) billingContent.style.display = 'none';
            if (manageBillingBtn) manageBillingBtn.style.display = 'none';
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
                    <div id="stripeLoadingModal" style="display:none;position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.35);z-index:9999;align-items:center;justify-content:center;">
                        <div style="background:#fff;padding:2rem 2.5rem;border-radius:12px;box-shadow:0 2px 16px #0002;text-align:center;min-width:220px;">
                            <div style="font-size:2.2rem;margin-bottom:0.5rem;">⏳</div>
                            <div id="stripeLoadingText" style="color:#222;font-size:1.1rem;">Creando customer en Stripe...</div>
                        </div>
                    </div>
                `;
                // Event listener para el link de Stripe
                const stripeConfigLink = document.getElementById('stripeConfigLink');
                const stripeLoadingModal = document.getElementById('stripeLoadingModal');
                const stripeLoadingText = document.getElementById('stripeLoadingText');
                if (stripeConfigLink) {
                    stripeConfigLink.addEventListener('click', async (e) => {
                        e.preventDefault();
                        if (stripeLoadingModal) stripeLoadingModal.style.display = 'flex';
                        if (stripeLoadingText) stripeLoadingText.textContent = 'Creando customer en Stripe...';
                        try {
                            await createStripeCustomer();
                            if (stripeLoadingText) stripeLoadingText.textContent = '¡Customer creado correctamente!';
                            setTimeout(() => {
                                if (stripeLoadingModal) stripeLoadingModal.style.display = 'none';
                                // Recargar la página para que se refleje el cambio
                                window.location.reload();
                            }, 1200);
                        } catch (err) {
                            if (stripeLoadingText) stripeLoadingText.textContent = 'Error: ' + (err.message || 'No se pudo crear el customer');
                            setTimeout(() => {
                                if (stripeLoadingModal) stripeLoadingModal.style.display = 'none';
                            }, 2200);
                        }
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
