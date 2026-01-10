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

// --------- MODAL DE ERROR GLOBAL ---------
function showError(message) {
    let errorModal = document.getElementById('globalErrorModal');
    if (!errorModal) {
        errorModal = document.createElement('div');
        errorModal.id = 'globalErrorModal';
        errorModal.className = 'global-error-modal';
        document.body.appendChild(errorModal);
    }
    errorModal.textContent = message;
    errorModal.style.display = 'block';
    setTimeout(() => {
        errorModal.style.display = 'none';
    }, 4000);
}


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

// --------- MODALES DE SUSCRIPCIÓN ---------
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'flex';
}
function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
}

// Obtener links de pago desde el endpoint /links
async function fetchPaymentLinks() {
    const token = SessionStorageManager.getSession().access_token;
    const url = `${BASE_URL}/billing/links`;
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = {};
        }
        if (response.status === 200 && data.paymentLinks) {
            return data.paymentLinks;
        }
        let msg = '';
        if (response.status === 400) {
            msg = 'La cuenta no existe en la base de datos';
        } else if (response.status === 403 && (text.includes('not a client') || text.includes('Account is not a client'))) {
            msg = 'La cuenta no es de tipo cliente';
        } else if (response.status === 403) {
            msg = 'Path traversal detectado (Forbidden)';
        } else if (response.status === 404) {
            msg = 'No existe un customer asociado';
        } else if (response.status === 418 && text.includes('Token is required')) {
            msg = 'No se envió el token';
        } else if (response.status === 418) {
            msg = 'El token es inválido';
        } else if (response.status === 500) {
            msg = 'Error creando sesiones o links de pago';
        } else {
            msg = `Error ${response.status}: ${text}`;
        }
        showError('No se pudieron obtener los links de pago: ' + msg);
        return null;
    } catch (err) {
        showError('No se pudieron obtener los links de pago: ' + (err.message || err));
        return null;
    }
}


// Crear sesión del portal de facturación y redirigir al usuario
export async function openStripeBillingPortal() {
    const token = SessionStorageManager.getSession().access_token;
    const url = `${BASE_URL}/billing/portal`;
    console.log('[openStripeBillingPortal] Llamando a:', url);
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });
        console.log('[openStripeBillingPortal] Status de respuesta:', response.status);
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            data = {};
        }
        if (response.status === 200 && data.session && data.session.url) {
            console.log('[openStripeBillingPortal] Abriendo nueva pestaña:', data.session.url);
            window.open(data.session.url, '_blank');
            return;
        }
        // Manejo de errores según la tabla proporcionada
        let msg = '';
        if (response.status === 400) {
            msg = 'La cuenta no existe en la base de datos';
        } else if (response.status === 403 && (text.includes('not a client') || text.includes('Account is not a client'))) {
            msg = 'La cuenta no es de tipo cliente';
        } else if (response.status === 403) {
            msg = 'Path traversal detectado (Forbidden)';
        } else if (response.status === 404) {
            msg = 'No existe un customer asociado';
        } else if (response.status === 418 && text.includes('Token is required')) {
            msg = 'No se envió el token';
        } else if (response.status === 418) {
            msg = 'El token es inválido';
        } else if (response.status === 500) {
            msg = 'Error creando la sesión del portal en Stripe';
        } else {
            msg = `Error ${response.status}: ${text}`;
        }
        console.error('[openStripeBillingPortal] Error:', msg);
        showError('No se pudo abrir el portal de facturación: ' + msg);
    } catch (err) {
        console.error('[openStripeBillingPortal] Error en catch:', err);
        showError('No se pudo abrir el portal de facturación: ' + (err.message || err));
    }
}

// Crear customer en Stripe
export async function createStripeCustomer() {
    // Usar el modal de carga de Stripe si existe
    const stripeLoadingModal = document.getElementById('stripeLoadingModal');
    const stripeLoadingText = document.getElementById('stripeLoadingText');
    const stripeModalIcon = document.getElementById('stripeModalSpinner');
    console.log('[createStripeCustomer] Iniciando creación de customer en Stripe');
    if (stripeLoadingModal) stripeLoadingModal.style.display = 'flex';
    if (stripeModalIcon) {
        stripeModalIcon.style.display = 'block';
    }
    if (stripeLoadingText) {
        stripeLoadingText.textContent = 'Creando customer en Stripe...';
        stripeLoadingText.classList.remove('success', 'error');
    }
    try {
        const token = SessionStorageManager.getSession().access_token;
        console.log('[createStripeCustomer] Token:', token ? 'presente' : 'ausente');
        const url = `${BASE_URL}/billing/customer`;
        console.log('[createStripeCustomer] Llamando a:', url);
        const response = await fetch(
            url,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": token
                }
            }
        );
        console.log('[createStripeCustomer] Status de respuesta:', response.status);
        if (!response.ok) {
            const errorText = await response.text();
            console.log('[createStripeCustomer] Error response:', errorText);
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
                stripeLoadingText.classList.remove('success');
                stripeLoadingText.classList.add('error');
            }
            if (stripeModalIcon) {
                stripeModalIcon.style.display = 'none';
            }
            console.log('[createStripeCustomer] Lanzando error:', msg);
            throw new Error(msg);
        }
        const data = await response.json();
        console.log('[createStripeCustomer] Respuesta exitosa:', data);
        if (stripeLoadingText) {
            stripeLoadingText.textContent = '¡Customer creado correctamente!';
            stripeLoadingText.classList.remove('error');
            stripeLoadingText.classList.add('success');
        }
        if (stripeModalIcon) {
            stripeModalIcon.style.display = 'none';
        }
        return data;
    } catch (err) {
        console.error('[createStripeCustomer] Error en catch:', err);
        // El mensaje de error ya se muestra en el modal
        throw err;
    }
}
async function fetchSubscriptions(page = 1) {
    const loadingEl = document.getElementById('billingLoading');
    const errorEl = document.getElementById('billingError');
    const cardsContainer = document.getElementById('billingCardsContainer');
    if (cardsContainer) cardsContainer.innerHTML = '';
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
        

        let plans = data.data || data.plans || [];
        const currentPage = data.current_page || page;
        const nextPage = data.next_page || null;


        // Renderizar tarjetas de suscripción
        if (!cardsContainer) return;
        if (plans.length === 0) {
            cardsContainer.innerHTML = '<div class="empty-message"><p>No tienes planes activos</p></div>';
        } else {
            cardsContainer.innerHTML = plans.map(plan => {
                const badge = getStatusBadge(plan.status);
                let statusClass = 'card-status';
                if (badge.class === 'status-inactive') statusClass += ' inactive';
                if (badge.class === 'status-pending') statusClass += ' pending';
                return `
                <div class="subscription-card">
                  <div class="card-header">
                    <span class="card-icon"><img src="${getPlanIcon(plan.plan_name)}" alt="${plan.plan_name}" style="width: 32px; height: 32px; object-fit: contain;"></span>
                    <div>
                      <div class="card-title">${plan.plan_name || 'Plan'}</div>
                      <div class="card-price">$${(plan.amount / 100).toFixed(2)} / mes</div>
                    </div>
                  </div>
                  <div class="${statusClass}">${badge.text.toUpperCase()}</div>
                  <div class="card-dates">
                    <div>
                      <div class="card-date-label"><i class="fa-regular fa-calendar"></i> FECHA DE INICIO</div>
                      <div class="card-date-value">${formatDate(plan.current_period_start)}</div>
                    </div>
                    <div>
                      <div class="card-date-label"><i class="fa-regular fa-calendar"></i> FECHA DE FIN</div>
                      <div class="card-date-value">${formatDate(plan.current_period_end)}</div>
                    </div>
                  </div>
                </div>
                `;
            }).join('');
        }
        // Mostrar el contenedor de tarjetas cuando termina de cargar
        // (No es necesario mostrar/ocultar billingTable, ya no existe)

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
                    <div id="stripeLoadingModal">
                        <div class="stripe-modal-content">
                            <div id="stripeModalSpinner" class="spinner" style="display: block;"></div>
                            <div id="stripeLoadingText">Creando customer en Stripe...</div>
                        </div>
                    </div>
                `;
                // Event listener para el link de Stripe
                const stripeConfigLink = document.getElementById('stripeConfigLink');
                const stripeLoadingModal = document.getElementById('stripeLoadingModal');
                const stripeLoadingText = document.getElementById('stripeLoadingText');
                const stripeModalIcon = document.getElementById('stripeModalSpinner');
                if (stripeConfigLink) {
                    stripeConfigLink.addEventListener('click', async (e) => {
                        e.preventDefault();
                        if (stripeLoadingModal) stripeLoadingModal.style.display = 'flex';
                        if (stripeModalIcon) stripeModalIcon.style.display = 'block';
                        if (stripeLoadingText) {
                            stripeLoadingText.textContent = 'Creando customer en Stripe...';
                            stripeLoadingText.classList.remove('success', 'error');
                        }
                        try {
                            await createStripeCustomer();
                            if (stripeLoadingText) {
                                stripeLoadingText.textContent = '¡Customer creado correctamente!';
                                stripeLoadingText.classList.remove('error');
                                stripeLoadingText.classList.add('success');
                            }
                            if (stripeModalIcon) stripeModalIcon.style.display = 'none';
                            setTimeout(() => {
                                if (stripeLoadingModal) stripeLoadingModal.style.display = 'none';
                                window.location.reload();
                            }, 1200);
                        } catch (err) {
                            if (stripeLoadingText) {
                                stripeLoadingText.textContent = 'Error: ' + (err.message || 'No se pudo crear el customer');
                                stripeLoadingText.classList.remove('success');
                                stripeLoadingText.classList.add('error');
                            }
                            if (stripeModalIcon) stripeModalIcon.style.display = 'none';
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
        // FAB y modales de suscripción
        const fabBtn = document.getElementById('addSubscriptionBtn');
        const warningModal = document.getElementById('warningModal');
        const warningContinueBtn = document.getElementById('warningContinueBtn');
        const warningCancelBtn = document.getElementById('warningCancelBtn');
        const planModal = document.getElementById('planModal');
        const planBasicOption = document.getElementById('planBasicOption');
        const planPremiumOption = document.getElementById('planPremiumOption');
        let paymentLinksCache = null;

        if (fabBtn) {
            fabBtn.addEventListener('click', () => {
                showModal('warningModal');
            });
        }
        if (warningCancelBtn) {
            warningCancelBtn.addEventListener('click', () => {
                hideModal('warningModal');
            });
        }
        if (warningContinueBtn) {
            warningContinueBtn.addEventListener('click', async () => {
                hideModal('warningModal');
                // Obtener links de pago y mostrar modal de planes
                paymentLinksCache = await fetchPaymentLinks();
                if (paymentLinksCache) {
                    showModal('planModal');
                }
            });
        }
        // Cerrar modal de planes al hacer click fuera del contenido
        if (planModal) {
            planModal.addEventListener('click', (e) => {
                if (e.target === planModal) hideModal('planModal');
            });
        }
        // Selección de plan
        if (planBasicOption) {
            planBasicOption.addEventListener('click', () => {
                if (paymentLinksCache && paymentLinksCache.basico && paymentLinksCache.basico.url) {
                    window.open(paymentLinksCache.basico.url, '_blank');
                    hideModal('planModal');
                } else {
                    showError('No se encontró el link de pago para el plan Básico.');
                }
            });
        }
        if (planPremiumOption) {
            planPremiumOption.addEventListener('click', () => {
                if (paymentLinksCache && paymentLinksCache.premium && paymentLinksCache.premium.url) {
                    window.open(paymentLinksCache.premium.url, '_blank');
                    hideModal('planModal');
                } else {
                    showError('No se encontró el link de pago para el plan Premium.');
                }
            });
        }
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

    // Gestionar Pagos: abrir portal de Stripe
    const manageBillingBtn = document.getElementById("manageBillingBtn");
    if (manageBillingBtn) {
        manageBillingBtn.addEventListener("click", async () => {
            await openStripeBillingPortal();
        });
    }
    // Cargar datos iniciales
    fetchSubscriptions(1);
});
