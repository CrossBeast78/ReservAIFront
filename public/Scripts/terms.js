// Script para la página de términos y condiciones
document.addEventListener("DOMContentLoaded", function() {
    const backToLoginBtn = document.getElementById("backToLogin");
    
    // Event listener para el botón "Volver al Login"
    if (backToLoginBtn) {
        backToLoginBtn.addEventListener("click", function() {
            window.location.href = "/login";
        });
    }
    
    // Smooth scroll para enlaces internos (si los hay en el futuro)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Agregar efecto de fade-in a las secciones
    const termsSections = document.querySelectorAll('.terms-section');
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    termsSections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(section);
    });
});