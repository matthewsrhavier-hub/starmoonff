'use client';

import React, { useState, useEffect } from 'react';
import { Logo } from '@/components/layout/Logo';

export function Splash() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .splash-container {
            position: fixed;
            inset: 0;
            background-color: #000000;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            z-index: 9999;
            pointer-events: none;
        }

        .ambient-light {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 120vw;
            height: 120vw;
            background: radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 40%, rgba(0,0,0,0) 70%);
            z-index: 1;
            opacity: 0;
            animation: pulseLight 2.5s ease-in-out forwards;
        }

        .logo-container {
            position: relative;
            z-index: 2;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transform: scale(0.8);
            animation: cinematicReveal 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .particles {
            position: absolute;
            width: 100%;
            height: 100%;
            z-index: 0;
            background-image: radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px);
            background-size: 30px 30px;
            opacity: 0.35;
            animation: drift 15s linear infinite;
        }

        .loader-ring {
            position: absolute;
            bottom: 15%;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: 3px solid rgba(255,255,255,0.1);
            border-top-color: #ffffff;
            opacity: 0;
            animation: spinRing 1s linear infinite, fadeInOut 2s ease 0.5s forwards;
            z-index: 2;
        }

        .fade-out-overlay {
            position: absolute;
            inset: 0;
            background: #000000;
            z-index: 10;
            opacity: 0;
            pointer-events: none;
            animation: blindOut 0.5s ease 2.2s forwards;
        }

        @keyframes cinematicReveal {
            0% { opacity: 0; transform: scale(0.85) translateY(20px); filter: blur(10px); }
            30% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0px); }
            85% { opacity: 1; transform: scale(1.05); filter: blur(0px); }
            100% { opacity: 0; transform: scale(1.2); filter: blur(5px); }
        }
        @keyframes pulseLight {
            0% { opacity: 0; width: 0; height: 0; }
            40% { opacity: 1; width: 80vw; height: 80vw; }
            80% { opacity: 1; }
            100% { opacity: 0; width: 100vw; height: 100vw; }
        }
        @keyframes spinRing {
            to { transform: translateX(-50%) rotate(360deg); }
        }
        @keyframes fadeInOut {
            0% { opacity: 0; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { opacity: 0; }
        }
        @keyframes drift {
            from { background-position: 0 0; }
            to { background-position: 100px 100px; }
        }
        @keyframes blindOut {
            to { opacity: 1; }
        }
      `}} />

      <div className="splash-container">
        <div className="particles"></div>
        <div className="ambient-light"></div>

        <div className="logo-container">
          <Logo size="xl" tone="light" />
        </div>

        <div className="loader-ring"></div>
        <div className="fade-out-overlay"></div>
      </div>
    </>
  );
}
