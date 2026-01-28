import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register standard GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Initialize animations on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initHeroEffects();
});

function initScrollAnimations() {
    // Select all elements with data-aos attribute
    const animatedElements = document.querySelectorAll('[data-aos]');

    animatedElements.forEach(element => {
        const animationType = element.getAttribute('data-aos');

        let initialConfig = { opacity: 0, y: 50 }; // Default fade-up

        if (animationType === 'slide-right') {
            initialConfig = { opacity: 0, x: -100, y: 0 };
        } else if (animationType === 'slide-left') {
            initialConfig = { opacity: 0, x: 100, y: 0 };
        } else if (animationType === 'zoom-in') {
            initialConfig = { opacity: 0, scale: 0.8, y: 0 };
        }

        gsap.fromTo(element,
            initialConfig,
            {
                opacity: 1,
                x: 0,
                y: 0,
                scale: 1,
                duration: 1,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: element,
                    start: "top 85%", // Trigger a bit earlier
                    toggleActions: "play none none reverse"
                }
            }
        );
    });

    console.log(`Initialized GSAP animations for ${animatedElements.length} elements.`);
}

function initHeroEffects() {
    // Basic Hero text reveal
    const title = document.querySelector('#hero-title');
    if (title) {
        gsap.fromTo(title,
            { opacity: 0, scale: 0.9 },
            { opacity: 1, scale: 1, duration: 1.2, ease: "back.out(1.7)" }
        );
    }
}
