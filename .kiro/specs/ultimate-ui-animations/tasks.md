# Implementation Plan: Ultimate UI Animations

## Overview

Triển khai hệ thống animations cinematic cho website landing page về đa dạng tôn giáo Việt Nam. Implementation sử dụng Vanilla JavaScript ES6+ với modular architecture, GPU acceleration, và full accessibility support.

## Tasks

- [ ] 1. Setup Animation Core Infrastructure
  - [x] 1.1 Tạo file structure cho animation system
    - Tạo thư mục `js/animations/core/`, `js/animations/controllers/`, `js/animations/utils/`
    - Tạo thư mục `css/animations/`
    - _Requirements: 1.1, 1.2_
  
  - [x] 1.2 Implement utility functions (lerp, easing, vector)
    - Tạo `js/animations/utils/lerp.js` với lerp function
    - Tạo `js/animations/utils/easing.js` với các easing functions
    - Tạo `js/animations/utils/vector.js` với vector math utilities
    - _Requirements: 4.1_
  
  - [ ]* 1.3 Write property test cho Lerp calculation
    - **Property 9: Lerp Calculation Correctness**
    - **Validates: Requirements 4.1**
  
  - [x] 1.4 Implement GPUAccelerator utility
    - Tạo `js/animations/core/gpu-accelerator.js`
    - Implement accelerate(), setWillChange(), clearWillChange(), isGPUProperty()
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  
  - [ ]* 1.5 Write property tests cho GPU acceleration
    - **Property 1: GPU-Only Properties**
    - **Property 2: Hardware Acceleration Application**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.5**
  
  - [x] 1.6 Implement ReducedMotionDetector
    - Tạo `js/animations/core/reduced-motion.js`
    - Implement check(), listen(), và callback handling
    - _Requirements: 9.1, 9.5_
  
  - [x] 1.7 Implement AnimationCore
    - Tạo `js/animations/core/animation-core.js`
    - Implement register(), unregister(), start(), stop(), tick(), destroy()
    - Integrate với ReducedMotionDetector
    - _Requirements: 8.1, 8.3_

- [x] 2. Checkpoint - Core Infrastructure
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 3. Implement Hero Section Animations
  - [x] 3.1 Implement MeshGradient class
    - Tạo `js/animations/controllers/mesh-gradient.js`
    - Implement canvas-based animated gradient với 4+ color points
    - Implement bounce physics khi point chạm edge
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ]* 3.2 Write property tests cho MeshGradient
    - **Property 3: Mesh Gradient Point Count Invariant**
    - **Property 4: Mesh Gradient Bounce Physics**
    - **Validates: Requirements 2.2, 2.3**
  
  - [x] 3.3 Implement ParticleSystem class
    - Tạo `js/animations/controllers/particle-system.js`
    - Implement 3D floating particles với physics
    - Implement mouse interaction
    - _Requirements: 2.4, 2.5, 2.6_
  
  - [ ]* 3.4 Write property tests cho ParticleSystem
    - **Property 5: Particle Mouse Response**
    - **Property 6: Particle Count Invariant**
    - **Validates: Requirements 2.5, 2.6, 10.1**
  
  - [x] 3.5 Implement TextReveal class
    - Tạo `js/animations/controllers/text-reveal.js`
    - Implement character-by-character reveal với stagger delay
    - _Requirements: 2.7, 2.8_
  
  - [ ]* 3.6 Write property test cho TextReveal
    - **Property 7: Text Reveal Stagger Timing**
    - **Validates: Requirements 2.8**
  
  - [x] 3.7 Implement MagneticButton class
    - Tạo `js/animations/controllers/magnetic-button.js`
    - Implement magnetic hover effect
    - _Requirements: 2.9_
  
  - [x] 3.8 Implement HeroController
    - Tạo `js/animations/controllers/hero-controller.js`
    - Integrate MeshGradient, ParticleSystem, TextReveal, MagneticButton
    - _Requirements: 2.1-2.9_
  
  - [x] 3.9 Tạo Hero CSS styles
    - Tạo `css/animations/hero-animations.css`
    - Styles cho canvas, particles, text reveal, magnetic buttons
    - _Requirements: 2.1-2.9_

- [x] 4. Checkpoint - Hero Section
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement Page Transitions
  - [x] 5.1 Implement PageTransitionController
    - Tạo `js/animations/controllers/page-transition.js`
    - Implement liquid wipe transition với clip-path
    - Implement curtain reveal alternative
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [ ]* 5.2 Write property test cho PageTransition
    - **Property 8: Page Transition Configuration**
    - **Validates: Requirements 3.2**
  
  - [x] 5.3 Tạo Page Transition CSS
    - Tạo `css/animations/page-transitions.css`
    - Styles cho overlay, liquid wipe, curtain reveal
    - _Requirements: 3.1, 3.3, 3.5_

- [ ] 6. Implement Scroll Animations
  - [x] 6.1 Enhance ScrollAnimationController với Lerp
    - Update `js/animations/controllers/scroll-animation.js`
    - Implement smooth parallax với Lerp
    - Implement IntersectionObserver với multiple thresholds
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_
  
  - [ ]* 6.2 Write property tests cho Scroll Animations
    - **Property 10: Parallax Effect Application**
    - **Property 11: Scroll Reveal Comprehensive**
    - **Validates: Requirements 4.2, 4.4, 4.5, 4.6**
  
  - [x] 6.3 Tạo Scroll Animation CSS
    - Tạo `css/animations/scroll-reveals.css`
    - Styles cho fade-up, scale, rotate, slide-left, slide-right
    - _Requirements: 4.5_

- [ ] 7. Implement Timeline Animations
  - [x] 7.1 Implement TimelineAnimationController
    - Tạo `js/animations/controllers/timeline-animation.js`
    - Implement SVG progress line animation
    - Implement pulsing nodes với ripple effect
    - Implement 3D transforms cho timeline items
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ]* 7.2 Write property tests cho Timeline Animations
    - **Property 12: Timeline Progress Line**
    - **Property 13: Timeline Items Animation**
    - **Validates: Requirements 5.2, 5.4, 5.5, 5.6**
  
  - [x] 7.3 Tạo Timeline Animation CSS
    - Tạo `css/animations/timeline-animations.css`
    - Styles cho progress line, pulsing nodes, ripple effect
    - _Requirements: 5.1, 5.3, 5.4_

- [x] 8. Checkpoint - Scroll & Timeline
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement Mosaic Animations
  - [x] 9.1 Implement MosaicAnimationController
    - Tạo `js/animations/controllers/mosaic-animation.js`
    - Implement 3D tilt effect với rotateX/rotateY calculation
    - Implement neighbor push effect
    - Implement inner glow với CSS custom properties
    - Implement floating animation
    - _Requirements: 6.1, 6.2, 6.3, 6.6, 6.7_
  
  - [ ]* 9.2 Write property tests cho Mosaic Animations
    - **Property 14: Mosaic 3D Tilt Calculation**
    - **Property 15: Mosaic Neighbor Push**
    - **Property 16: Mosaic Inner Glow Position**
    - **Property 17: Mosaic Floating Animation**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.6, 6.7**
  
  - [x] 9.3 Tạo Mosaic Animation CSS
    - Tạo `css/animations/mosaic-animations.css`
    - Styles cho 3D tilt, gradient borders với @property, inner glow
    - _Requirements: 6.4, 6.5, 6.6_

- [ ] 10. Implement Advanced Effects
  - [x] 10.1 Implement MouseTrailController
    - Tạo `js/animations/controllers/mouse-trail.js`
    - Implement particle trail với hue rotation
    - Implement life decay và cleanup
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ]* 10.2 Write property test cho Mouse Trail
    - **Property 18: Mouse Trail Lifecycle**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**

- [ ] 11. Implement Accessibility & Responsive
  - [x] 11.1 Implement comprehensive reduced motion support
    - Update tất cả controllers để check reduced motion
    - Disable continuous animations khi reduced motion enabled
    - _Requirements: 9.1, 9.2, 9.3, 9.4_
  
  - [ ]* 11.2 Write property test cho Reduced Motion
    - **Property 20: Reduced Motion Comprehensive**
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.4**
  
  - [x] 11.3 Implement responsive adjustments
    - Giảm particle count trên mobile
    - Disable 3D tilt trên touch devices
    - Handle canvas resize
    - _Requirements: 10.1, 10.2, 10.4_
  
  - [ ]* 11.4 Write property tests cho Responsive
    - **Property 21: Touch Device Tilt Disable**
    - **Property 22: Canvas Resize Handling**
    - **Validates: Requirements 10.2, 10.4**

- [x] 12. Checkpoint - Advanced Effects & Accessibility
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Integration & Cleanup
  - [x] 13.1 Tạo main entry point
    - Tạo `js/cinematic-animations.js`
    - Initialize AnimationCore và tất cả controllers
    - Export public API
    - _Requirements: 8.1_
  
  - [x] 13.2 Implement cleanup và destroy methods
    - Ensure tất cả controllers có proper cleanup
    - Remove event listeners, clear RAF, reset styles
    - _Requirements: 8.3_
  
  - [ ]* 13.3 Write property test cho Cleanup
    - **Property 19: Animation Cleanup**
    - **Validates: Requirements 8.3**
  
  - [x] 13.4 Tạo base CSS file
    - Tạo `css/animations/cinematic-base.css`
    - Base styles, CSS custom properties, @property definitions
    - _Requirements: 7.5_
  
  - [x] 13.5 Update HTML files để integrate animations
    - Update index.html với hero animations
    - Update timeline.html với timeline animations
    - Update mosaic.html với mosaic animations
    - Add canvas elements và data attributes
    - _Requirements: 2.1, 5.1, 6.1_

- [x] 14. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify animations work on all pages
  - Verify reduced motion support
  - Verify responsive behavior

## Notes

- Tasks marked with `*` are optional property-based tests
- Each property test references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use fast-check library với minimum 100 iterations
- All animations must respect prefers-reduced-motion preference
