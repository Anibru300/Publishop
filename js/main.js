/* =====================================================
   Publishop - Main JavaScript
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    const navDropdowns = document.querySelectorAll('.nav-dropdown');
    const sections = document.querySelectorAll('section[id], .service-featured[id]');
    const particlesContainer = document.getElementById('particles');
    const counters = document.querySelectorAll('.stat-number');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const productItems = document.querySelectorAll('.product-item');
    const contactForm = document.getElementById('contactForm');
    const yearSpan = document.getElementById('year');

    // Set current year
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Navbar scroll effect
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        lastScroll = currentScroll;
        updateActiveNav();
    });

    // Mobile menu toggle
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });

    // Mobile dropdowns
    navDropdowns.forEach(dropdown => {
        const link = dropdown.querySelector('.nav-link');
        link.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                dropdown.classList.toggle('active');
            }
        });
    });

    // Close mobile menu on link click
    document.querySelectorAll('.nav-menu a, .dropdown-menu a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            navDropdowns.forEach(d => d.classList.remove('active'));
        });
    });

    // Active nav link on scroll
    function updateActiveNav() {
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.offsetHeight;
            
            if (window.pageYOffset >= sectionTop && window.pageYOffset < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            if (href === `#${current}` || (current && href === `#productos` && isProductCategory(current))) {
                link.classList.add('active');
            }
        });
    }

    function isProductCategory(id) {
        return ['lonas', 'dtf', 'vinil', 'plumas', 'tazas', 'termos', 'mdf'].includes(id);
    }

    // Generate particles
    function createParticles() {
        if (!particlesContainer) return;
        
        const particleCount = window.innerWidth < 768 ? 15 : 30;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.classList.add('particle');
            
            const size = Math.random() * 4 + 1;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.opacity = Math.random() * 0.5 + 0.1;
            particle.style.animationDuration = `${Math.random() * 15 + 10}s`;
            particle.style.animationDelay = `${Math.random() * 5}s`;
            
            particlesContainer.appendChild(particle);
        }
    }
    createParticles();

    // Counter animation
    let countersAnimated = false;
    function animateCounters() {
        if (countersAnimated) return;
        countersAnimated = true;
        
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-count'));
            const duration = 2000;
            const step = target / (duration / 16);
            let current = 0;
            
            const updateCounter = () => {
                current += step;
                if (current < target) {
                    counter.textContent = Math.floor(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.textContent = target;
                }
            };
            
            updateCounter();
        });
    }

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('aos-animate');
                
                // Trigger counters when stats are visible
                if (entry.target.querySelector('.stat-number')) {
                    animateCounters();
                }
                
                revealObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('[data-aos]').forEach(el => {
        revealObserver.observe(el);
    });

    // Product filter
    function filterProducts(category) {
        filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-filter') === category);
        });
        
        productItems.forEach(item => {
            if (category === 'all' || item.getAttribute('data-category') === category) {
                item.classList.remove('hidden');
                setTimeout(() => {
                    item.style.opacity = '1';
                    item.style.transform = 'scale(1)';
                }, 10);
            } else {
                item.style.opacity = '0';
                item.style.transform = 'scale(0.8)';
                setTimeout(() => {
                    item.classList.add('hidden');
                }, 300);
            }
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            filterProducts(filter);
        });
    });

    // Product item animation initialization
    productItems.forEach(item => {
        item.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    });

    // Handle URL hash for product categories
    function handleHashFilter() {
        const hash = window.location.hash.replace('#', '');
        const validCategories = ['lonas', 'dtf', 'vinil', 'plumas', 'tazas', 'termos', 'mdf'];
        
        if (validCategories.includes(hash)) {
            setTimeout(() => {
                filterProducts(hash);
                const productsSection = document.getElementById('productos');
                if (productsSection) {
                    productsSection.scrollIntoView({ behavior: 'smooth' });
                }
            }, 300);
        }
    }

    // Check hash on load
    handleHashFilter();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashFilter);

    // Services Tabs
    const serviceTabs = document.querySelectorAll('.service-tab');
    const servicePanels = document.querySelectorAll('.service-tab-panel');
    
    serviceTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');
            
            // Remove active from all tabs and panels
            serviceTabs.forEach(t => t.classList.remove('active'));
            servicePanels.forEach(p => p.classList.remove('active'));
            
            // Add active to clicked tab and corresponding panel
            tab.classList.add('active');
            const targetPanel = document.getElementById(`tab-${targetTab}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all other items
            faqItems.forEach(otherItem => {
                if (otherItem !== item) {
                    otherItem.classList.remove('active');
                    otherItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                }
            });
            
            // Toggle current item
            item.classList.toggle('active');
            question.setAttribute('aria-expanded', !isActive);
        });
    });

    // Contact form handling — send via WhatsApp
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;
            const formMessage = document.getElementById('formMessage');
            
            // Get form values
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            const message = document.getElementById('message').value.trim();
            
            // Build WhatsApp message
            const whatsappMessage = encodeURIComponent(
                `Hola PUBLI SHOP LEÓN GTO, me interesa cotizar:\n\n` +
                `*Nombre:* ${name}\n` +
                `*Correo:* ${email}\n` +
                (phone ? `*Teléfono:* ${phone}\n` : '') +
                `*Mensaje:* ${message}`
            );
            
            const whatsappUrl = `https://wa.me/524778411655?text=${whatsappMessage}`;
            
            // Show success message
            if (formMessage) {
                formMessage.innerHTML = '<i class="fas fa-check-circle"></i> Tu mensaje está listo. Te llevamos a WhatsApp para enviarlo.';
                formMessage.className = 'form-message form-message-success';
                formMessage.style.display = 'block';
            }
            
            // Update button
            btn.innerHTML = '<i class="fab fa-whatsapp"></i> Abriendo WhatsApp...';
            btn.disabled = true;
            
            // Open WhatsApp in new tab
            window.open(whatsappUrl, '_blank');
            
            // Redirect to thanks page after a short delay
            setTimeout(() => {
                window.location.href = 'gracias.html';
            }, 2000);
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            const targetId = href.replace('#', '');
            const validCategories = ['lonas', 'dtf', 'vinil', 'plumas', 'tazas', 'termos', 'mdf'];
            
            if (validCategories.includes(targetId)) {
                e.preventDefault();
                window.location.hash = targetId;
                return;
            }
            
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add loaded class for initial animations
    document.body.classList.add('loaded');
});
