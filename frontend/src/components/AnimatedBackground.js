import React, { useEffect, useRef } from 'react';

/**
 * Animated Background Component
 * Creates an interactive particle animation with blue dots on white/ivory background
 * Particles move constantly and respond to mouse/touch interactions
 */
const AnimatedBackground = () => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: null, y: null, radius: 150 });
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initParticles();
    };

    // Particle class
    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 4 + 2; // Size between 2-6px
        this.speedX = Math.random() * 0.5 - 0.25; // Slow movement
        this.speedY = Math.random() * 0.5 - 0.25;
        this.color = this.getRandomBlue();
      }

      getRandomBlue() {
        // Different shades of blue
        const blues = [
          'rgba(59, 130, 246, 0.6)',   // #3B82F6
          'rgba(37, 99, 235, 0.6)',     // #2563EB
          'rgba(29, 78, 216, 0.6)',     // #1D4ED8
          'rgba(96, 165, 250, 0.5)',    // #60A5FA lighter blue
          'rgba(147, 197, 253, 0.5)',   // #93C5FD even lighter
        ];
        return blues[Math.floor(Math.random() * blues.length)];
      }

      update() {
        // Move particle
        this.x += this.speedX;
        this.y += this.speedY;

        // Bounce off edges
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

        // Mouse interaction - repel particles
        const dx = mouseRef.current.x - this.x;
        const dy = mouseRef.current.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouseRef.current.radius && mouseRef.current.x !== null) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const maxDistance = mouseRef.current.radius;
          const force = (maxDistance - distance) / maxDistance;

          // Push particles away from cursor
          this.x -= forceDirectionX * force * 5;
          this.y -= forceDirectionY * force * 5;
        }
      }

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    // Initialize particles
    const initParticles = () => {
      particles = [];
      const numberOfParticles = Math.floor((canvas.width * canvas.height) / 8000); // Density based on canvas size
      for (let i = 0; i < numberOfParticles; i++) {
        particles.push(new Particle());
      }
      particlesRef.current = particles;
    };

    // Connect particles with lines
    const connectParticles = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Draw line if particles are close enough
          if (distance < 120) {
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.15 * (1 - distance / 120)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    // Animation loop
    const animate = () => {
      // Clear with ivory/white background
      ctx.fillStyle = '#FFFFF0'; // Ivory color
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Connect nearby particles
      connectParticles();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Mouse move handler
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
    };

    // Touch move handler
    const handleTouchMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      mouseRef.current.x = touch.clientX - rect.left;
      mouseRef.current.y = touch.clientY - rect.top;
    };

    // Mouse leave handler
    const handleMouseLeave = () => {
      mouseRef.current.x = null;
      mouseRef.current.y = null;
    };

    // Initialize
    resizeCanvas();
    animate();

    // Event listeners
    window.addEventListener('resize', resizeCanvas);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{
        background: 'linear-gradient(135deg, #FFFFF0 0%, #FDFDF8 50%, #F8F8FF 100%)',
        touchAction: 'none'
      }}
    />
  );
};

export default AnimatedBackground;
