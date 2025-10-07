"use client";

import React, { useRef, useEffect } from "react";

const PlexusBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let particles = [];
    let config = {
      defaultSpeed: 0.1,
      variantSpeed: 0.1,
      defaultRadius: 1.5,
      variantRadius: 0.5,
      linkRadius: 120,
      particleOpacity: 0.4,
      maxLineOpacity: 0.2,
    };

    const getParticleAmount = () => {
      const width = window.innerWidth;
      if (width < 768) {
        return 60;
      } else if (width < 1024) {
        return 100;
      } else {
        return 150;
      }
    };

    const init = () => {
      particles = [];
      for (let i = 0; i < config.particleAmount; i++) {
        particles.push(new Particle());
      }
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      config.particleAmount = getParticleAmount();
      init();
    };

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.speedX =
          Math.random() * config.variantSpeed * 2 -
          config.variantSpeed +
          config.defaultSpeed * (Math.random() > 0.5 ? 1 : -1);
        this.speedY =
          Math.random() * config.variantSpeed * 2 -
          config.variantSpeed +
          config.defaultSpeed * (Math.random() > 0.5 ? 1 : -1);
        this.radius =
          config.defaultRadius + Math.random() * config.variantRadius;
      }

      update() {
        if (this.x > canvas.width || this.x < 0) this.speedX *= -1;
        if (this.y > canvas.height || this.y < 0) this.speedY *= -1;
        this.x += this.speedX;
        this.y += this.speedY;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${config.particleOpacity})`;
        ctx.fill();
        ctx.closePath();
      }
    }

    const connectParticles = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < config.linkRadius) {
            const opacity =
              (1 - distance / config.linkRadius) * config.maxLineOpacity;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.closePath();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const particle of particles) {
        particle.update();
        particle.draw();
      }
      connectParticles();
      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        background: "#000",
      }}
    />
  );
};

export default PlexusBackground;
