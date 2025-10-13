
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import styles from './GlobalAnimationWrapper.module.css';
import { V } from 'node_modules/framer-motion/dist/types.d-DsEeKk6G';

export type AnimationStyle = 'none' | 'particles' | 'gradient';

interface GlobalAnimationWrapperProps {
  children: React.ReactNode;
  animationStyle?: AnimationStyle;
  className?: string;
}

const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [particles, setParticles] = useState<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    opacity: number;
  }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const particleCount = Math.min(50, Math.floor((canvas.width * canvas.height) / 15000));
    const newParticles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.1,
    }));
    setParticles(newParticles);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      newParticles.forEach((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(59, 130, 246, ${particle.opacity})`; // Blue particles
        ctx.fill();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-0 ${styles.particleCanvas}`}
    />
  );
};

const GradientBackground: React.FC = () => {
  return (
    <motion.div
      className={styles.gradientBackground}
      initial={{ backgroundPosition: '0% 50%' }}
      animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
      transition={{
        duration: 8,
        ease: 'linear',
        repeat: Infinity,
      }}
    >
      {/* Glassmorphism overlay */}
      <div className={styles.glassOverlay} />
    </motion.div>
  );
};

const GlobalAnimationWrapper: React.FC<GlobalAnimationWrapperProps> = ({
  children,
  animationStyle = 'none',
  className = '',
}) => {
  const renderAnimation = () => {
    switch (animationStyle) {
      case 'particles':
        return <ParticleBackground />;
      case 'gradient':
        return <GradientBackground />;
      default:
        return null;
    }
  };

  return (
    <div className={`relative min-h-screen ${className}`}>
      {renderAnimation()}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default GlobalAnimationWrapper;
