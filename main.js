// ===== Typing Animation =====
function typeText() {
    const roles = ['AI Assistant', 'UI/UX Enthusiast', 'Web Developer'];
    let roleIndex = 0;
    let charIndex = 0;
    const typingElement = document.getElementById('typing-text');
    const typingSpeed = 100;
    const erasingSpeed = 50;
    const delayBetweenRoles = 2000;

    function type() {
        const currentRole = roles[roleIndex];
        if (charIndex < currentRole.length) {
            typingElement.textContent = currentRole.substring(0, charIndex + 1);
            charIndex++;
            setTimeout(type, typingSpeed);
        } else {
            setTimeout(erase, delayBetweenRoles);
        }
    }

    function erase() {
        const currentRole = roles[roleIndex];
        if (charIndex > 0) {
            typingElement.textContent = currentRole.substring(0, charIndex - 1);
            charIndex--;
            setTimeout(erase, erasingSpeed);
        } else {
            roleIndex = (roleIndex + 1) % roles.length;
            setTimeout(type, 500);
        }
    }

    type();
}

// ===== Scroll Progress Bar =====
function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollTop / docHeight) * 100;
    document.getElementById('scroll-progress').style.width = progress + '%';
}

// ===== Navbar =====
function updateNavbar() {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 50) {
        navbar.classList.add('glass');
        navbar.style.borderBottom = '1px solid rgba(99,102,241,0.1)';
    } else {
        navbar.classList.remove('glass');
        navbar.style.borderBottom = 'none';
    }
}

// ===== Active Nav Link =====
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');
    let currentSection = '';

    sections.forEach(section => {
        if (scrollY >= section.offsetTop - 200) {
            currentSection = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').slice(1) === currentSection) {
            link.classList.add('active');
        }
    });
}

// ===== Intersection Observer with Stagger =====
function setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';

                // Stagger children
                if (entry.target.classList.contains('stagger-children')) {
                    const children = entry.target.children;
                    Array.from(children).forEach((child, i) => {
                        child.style.animationDelay = (i * 0.1) + 's';
                        child.style.animationPlayState = 'running';
                    });
                }
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fade-in-up, .slide-in-left, .scale-in, .stagger-children').forEach(el => {
        el.style.animationPlayState = 'paused';
        observer.observe(el);
    });

    // Stagger children initial state
    document.querySelectorAll('.stagger-children > *').forEach(child => {
        child.style.animationPlayState = 'paused';
    });
}

// ===== Cursor Glow =====
function setupCursorGlow() {
    const glow = document.getElementById('cursor-glow');
    document.addEventListener('mousemove', (e) => {
        glow.style.left = e.clientX + 'px';
        glow.style.top = e.clientY + 'px';
    });
}

// ===== Card 3D Tilt =====
function setupCardTilt() {
    document.querySelectorAll('[data-tilt]').forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });
}

// ===== Magnetic Buttons =====
function setupMagneticButtons() {
    document.querySelectorAll('.magnetic-btn').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        });

        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'translate(0, 0)';
        });
    });
}

// ===== Button Ripple Effect =====
function setupRippleEffect() {
    document.querySelectorAll('.btn-ripple').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'ripple';
            ripple.style.left = (e.clientX - rect.left) + 'px';
            ripple.style.top = (e.clientY - rect.top) + 'px';
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
}

// ===== Particle Background =====
function setupParticles() {
    const canvas = document.getElementById('particles');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;

    function resize() {
        const section = canvas.parentElement;
        canvas.width = section.offsetWidth;
        canvas.height = section.offsetHeight;
    }

    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2 + 0.5,
            speedX: (Math.random() - 0.5) * 0.5,
            speedY: (Math.random() - 0.5) * 0.5,
            opacity: Math.random() * 0.5 + 0.1
        };
    }

    function init() {
        resize();
        particles = [];
        const count = Math.min(60, Math.floor(canvas.width * canvas.height / 15000));
        for (let i = 0; i < count; i++) {
            particles.push(createParticle());
        }
    }

    function drawParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particles.forEach((p, i) => {
            p.x += p.speedX;
            p.y += p.speedY;

            if (p.x < 0 || p.x > canvas.width) p.speedX *= -1;
            if (p.y < 0 || p.y > canvas.height) p.speedY *= -1;

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(99, 102, 241, ${p.opacity})`;
            ctx.fill();

            // Draw connections
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[j].x - p.x;
                const dy = particles[j].y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 120) {
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 * (1 - dist / 120)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        });

        animationId = requestAnimationFrame(drawParticles);
    }

    init();
    drawParticles();
    window.addEventListener('resize', init);
}

// ===== Parallax =====
function updateParallax() {
    const scrollY = window.scrollY;
    const heroSection = document.getElementById('home');
    const blobs = heroSection.querySelectorAll('.float-animate');

    blobs.forEach((blob, i) => {
        const speed = (i + 1) * 0.1;
        blob.style.transform = `translateY(${-scrollY * speed}px)`;
    });
}

// ===== Mobile Menu =====
function setupMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    const links = menu.querySelectorAll('a');

    btn.addEventListener('click', () => menu.classList.toggle('hidden'));
    links.forEach(link => link.addEventListener('click', () => menu.classList.add('hidden')));
}

// ===== Contact Form =====
function setupContactForm() {
    document.getElementById('contact-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;

        if (name.trim() && email.trim() && message.trim()) {
            alert(`감사합니다 ${name}님!\n메시지를 받았습니다. 곧 연락드리겠습니다.`);
            e.target.reset();
        } else {
            alert('모든 필드를 입력해주세요.');
        }
    });
}

// ===== Smooth Scroll =====
function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// ===== Scroll to Top =====
function setupScrollTop() {
    const btn = document.getElementById('scroll-top');
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function updateScrollTop() {
    const btn = document.getElementById('scroll-top');
    if (window.scrollY > 500) {
        btn.classList.add('visible');
    } else {
        btn.classList.remove('visible');
    }
}

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
    typeText();
    setupIntersectionObserver();
    setupCursorGlow();
    setupCardTilt();
    setupMagneticButtons();
    setupRippleEffect();
    setupParticles();
    setupMobileMenu();
    setupContactForm();
    setupSmoothScroll();
    setupScrollTop();
});

window.addEventListener('scroll', () => {
    updateScrollProgress();
    updateNavbar();
    updateActiveNavLink();
    updateParallax();
    updateScrollTop();
});

updateNavbar();
