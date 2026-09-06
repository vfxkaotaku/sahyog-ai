/**
 * RobotAvatar.tsx — SAHYOG AI
 *
 * Procedural SVG robot face that mirrors the ESP32 SSD1306 OLED display.
 * 6 states: IDLE | LISTENING | THINKING | SPEAKING | CAMERA | ERROR
 *
 * Design matches the 128×64 OLED pixel layout, scaled up for web.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { AvatarState } from '../../types';

interface RobotAvatarProps {
  state: AvatarState;
  size?: number;
}

// ─── State-specific palette ───────────────────────────────────────────────────
const STATE_CONFIG: Record<AvatarState, {
  label: string;
  eyeColor: string;
  pupilColor: string;
  faceColor: string;
  ringColor: string;
  glowClass: string;
  statusText: string;
}> = {
  IDLE: {
    label: 'IDLE',
    eyeColor: '#10b981',
    pupilColor: '#d1fae5',
    faceColor: '#1e293b',
    ringColor: '#334155',
    glowClass: '',
    statusText: 'Ready',
  },
  LISTENING: {
    label: 'LISTENING',
    eyeColor: '#10b981',
    pupilColor: '#ffffff',
    faceColor: '#0f2318',
    ringColor: '#10b981',
    glowClass: 'avatar-glow-listening',
    statusText: 'Listening...',
  },
  THINKING: {
    label: 'THINKING',
    eyeColor: '#fbbf24',
    pupilColor: '#fef3c7',
    faceColor: '#1c1500',
    ringColor: '#fbbf24',
    glowClass: 'avatar-glow-thinking',
    statusText: 'Processing...',
  },
  SPEAKING: {
    label: 'SPEAKING',
    eyeColor: '#818cf8',
    pupilColor: '#e0e7ff',
    faceColor: '#11103a',
    ringColor: '#818cf8',
    glowClass: 'avatar-glow-speaking',
    statusText: 'Speaking...',
  },
  CAMERA: {
    label: 'CAMERA',
    eyeColor: '#38bdf8',
    pupilColor: '#f0f9ff',
    faceColor: '#041a26',
    ringColor: '#38bdf8',
    glowClass: 'avatar-glow-camera',
    statusText: 'Vision Active',
  },
  ERROR: {
    label: 'ERROR',
    eyeColor: '#ef4444',
    pupilColor: '#fee2e2',
    faceColor: '#1f0000',
    ringColor: '#ef4444',
    glowClass: 'avatar-glow-error',
    statusText: 'Error',
  },
};

// ─── Helper: animated blinking eye (IDLE) ────────────────────────────────────
function IdleEye({ cx, cy, color, pupilColor, blinking }: {
  cx: number; cy: number; color: string; pupilColor: string; blinking: boolean;
}) {
  const eyeH = blinking ? 2 : 22;
  const rx = 14;
  return (
    <g>
      <rect
        x={cx - rx} y={cy - eyeH / 2}
        width={rx * 2} height={eyeH}
        rx={blinking ? 1 : 8} ry={blinking ? 1 : 8}
        fill={color}
        style={{ transition: 'height 0.08s ease, y 0.08s ease' }}
      />
      {!blinking && (
        <circle cx={cx + 4} cy={cy - 4} r={4} fill={pupilColor} opacity={0.8} />
      )}
    </g>
  );
}

// ─── Helper: listening eye (large circle + pulse ring) ───────────────────────
function ListeningEye({ cx, cy, color, tick }: { cx: number; cy: number; color: string; tick: number }) {
  const pulseR = 14 + (Math.sin(tick * 0.12) + 1) * 3;
  return (
    <g>
      <circle cx={cx} cy={cy} r={pulseR} fill="none" stroke={color} strokeWidth="2.5" opacity={0.4} />
      <circle cx={cx} cy={cy} r={12} fill={color} />
      <circle cx={cx + 3} cy={cy - 3} r={5} fill="white" opacity={0.9} />
      <circle cx={cx + 3} cy={cy - 3} r={2} fill={color} />
    </g>
  );
}

// ─── Helper: thinking eye (scanning line) ────────────────────────────────────
function ThinkingEye({ cx, cy, color, tick }: { cx: number; cy: number; color: string; tick: number }) {
  const scanX = cx + Math.sin(tick * 0.08) * 10;
  return (
    <g>
      <rect x={cx - 16} y={cy - 4} width={32} height={8} rx={4} fill={color} opacity={0.9} />
      <rect x={scanX - 3} y={cy - 8} width={6} height={16} rx={3} fill="white" opacity={0.7} />
    </g>
  );
}

// ─── Helper: speaking eye (pulsing height) ────────────────────────────────────
function SpeakingEye({ cx, cy, color, pupilColor, tick }: {
  cx: number; cy: number; color: string; pupilColor: string; tick: number;
}) {
  const h = 10 + Math.abs(Math.sin(tick * 0.25)) * 14;
  return (
    <g>
      <rect x={cx - 14} y={cy - h / 2} width={28} height={h} rx={7} fill={color} />
      <circle cx={cx} cy={cy} r={4} fill={pupilColor} opacity={0.85} />
    </g>
  );
}

// ─── Helper: camera eye (reticle brackets) ────────────────────────────────────
function CameraEye({ cx, cy, color, tick }: { cx: number; cy: number; color: string; tick: number }) {
  const s = 18;
  const bl = 6;
  const alpha = 0.6 + Math.sin(tick * 0.1) * 0.4;
  return (
    <g opacity={alpha}>
      {/* Corner brackets */}
      <path d={`M${cx - s},${cy - s + bl} L${cx - s},${cy - s} L${cx - s + bl},${cy - s}`} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d={`M${cx + s - bl},${cy - s} L${cx + s},${cy - s} L${cx + s},${cy - s + bl}`} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d={`M${cx - s},${cy + s - bl} L${cx - s},${cy + s} L${cx - s + bl},${cy + s}`} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <path d={`M${cx + s - bl},${cy + s} L${cx + s},${cy + s} L${cx + s},${cy + s - bl}`} stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Crosshair */}
      <line x1={cx - 4} y1={cy} x2={cx + 4} y2={cy} stroke={color} strokeWidth="1.5" />
      <line x1={cx} y1={cy - 4} x2={cx} y2={cy + 4} stroke={color} strokeWidth="1.5" />
    </g>
  );
}

// ─── Helper: error eye (X mark) ───────────────────────────────────────────────
function ErrorEye({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  return (
    <g>
      <line x1={cx - 12} y1={cy - 12} x2={cx + 12} y2={cy + 12} stroke={color} strokeWidth="4" strokeLinecap="round" />
      <line x1={cx + 12} y1={cy - 12} x2={cx - 12} y2={cy + 12} stroke={color} strokeWidth="4" strokeLinecap="round" />
    </g>
  );
}

// ─── Main Avatar Component ────────────────────────────────────────────────────
export default function RobotAvatar({ state, size = 180 }: RobotAvatarProps) {
  const config = STATE_CONFIG[state];
  const [tick, setTick] = useState(0);
  const [blinking, setBlinking] = useState(false);
  const tickRef = useRef(0);
  const blinkTimer = useRef<ReturnType<typeof setInterval>>();
  const animFrame = useRef<number>();

  // Animation tick
  useEffect(() => {
    const loop = () => {
      tickRef.current += 1;
      setTick(tickRef.current);
      animFrame.current = requestAnimationFrame(loop);
    };
    animFrame.current = requestAnimationFrame(loop);
    return () => {
      if (animFrame.current) cancelAnimationFrame(animFrame.current);
    };
  }, []);

  // Idle blink timer
  useEffect(() => {
    if (state !== 'IDLE') { setBlinking(false); return; }
    const scheduleBlink = () => {
      const delay = 2500 + Math.random() * 3000;
      blinkTimer.current = setTimeout(() => {
        setBlinking(true);
        setTimeout(() => { setBlinking(false); scheduleBlink(); }, 120);
      }, delay);
    };
    scheduleBlink();
    return () => { if (blinkTimer.current) clearTimeout(blinkTimer.current); };
  }, [state]);

  const vw = 200;
  const vh = 120;
  const lx = 60, rx = 140, ey = 58;

  function renderEyes() {
    switch (state) {
      case 'IDLE':
        return (
          <>
            <IdleEye cx={lx} cy={ey} color={config.eyeColor} pupilColor={config.pupilColor} blinking={blinking} />
            <IdleEye cx={rx} cy={ey} color={config.eyeColor} pupilColor={config.pupilColor} blinking={blinking} />
          </>
        );
      case 'LISTENING':
        return (
          <>
            <ListeningEye cx={lx} cy={ey} color={config.eyeColor} tick={tick} />
            <ListeningEye cx={rx} cy={ey} color={config.eyeColor} tick={tick + 20} />
          </>
        );
      case 'THINKING':
        return (
          <>
            <ThinkingEye cx={lx} cy={ey} color={config.eyeColor} tick={tick} />
            <ThinkingEye cx={rx} cy={ey} color={config.eyeColor} tick={tick + 15} />
          </>
        );
      case 'SPEAKING':
        return (
          <>
            <SpeakingEye cx={lx} cy={ey} color={config.eyeColor} pupilColor={config.pupilColor} tick={tick} />
            <SpeakingEye cx={rx} cy={ey} color={config.eyeColor} pupilColor={config.pupilColor} tick={tick + 8} />
          </>
        );
      case 'CAMERA':
        return (
          <>
            <CameraEye cx={lx} cy={ey} color={config.eyeColor} tick={tick} />
            <CameraEye cx={rx} cy={ey} color={config.eyeColor} tick={tick + 10} />
          </>
        );
      case 'ERROR':
        return (
          <>
            <ErrorEye cx={lx} cy={ey} color={config.eyeColor} />
            <ErrorEye cx={rx} cy={ey} color={config.eyeColor} />
          </>
        );
    }
  }

  // Speaking mouth animation
  const mouthH = state === 'SPEAKING'
    ? 5 + Math.abs(Math.sin(tick * 0.28)) * 8
    : state === 'ERROR' ? 3 : 5;

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Avatar face */}
      <div
        className={`relative rounded-2xl overflow-hidden transition-all duration-500 ${config.glowClass}`}
        style={{ width: size, height: size * 0.65, background: config.faceColor }}
      >
        {/* Border ring */}
        <div
          className="absolute inset-0 rounded-2xl"
          style={{
            border: `2px solid ${config.ringColor}`,
            opacity: state === 'IDLE' ? 0.3 : 0.8,
            transition: 'border-color 0.4s, opacity 0.4s',
          }}
        />

        {/* Scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
          }}
        />

        {/* SVG face */}
        <svg
          viewBox={`0 0 ${vw} ${vh}`}
          width={size}
          height={size * 0.65}
          className="absolute inset-0"
          style={{ transition: 'background 0.4s' }}
        >
          {/* Eyes */}
          {renderEyes()}

          {/* Mouth */}
          {state !== 'CAMERA' && state !== 'ERROR' && (
            <rect
              x={80} y={88} width={40} height={mouthH}
              rx={mouthH / 2}
              fill={config.eyeColor}
              opacity={0.8}
              style={{ transition: 'fill 0.4s' }}
            />
          )}

          {/* Error frown */}
          {state === 'ERROR' && (
            <path d="M75,92 Q100,84 125,92" stroke={config.eyeColor} strokeWidth="3" fill="none" strokeLinecap="round" />
          )}

          {/* Antenna */}
          <line x1={100} y1={2} x2={100} y2={14} stroke={config.eyeColor} strokeWidth="2.5" opacity={0.6} />
          <circle cx={100} cy={6} r={4} fill={config.eyeColor} opacity={0.8} />

          {/* OLED label */}
          <text x={100} y={108} textAnchor="middle" fontSize={7} fill={config.eyeColor} opacity={0.4} fontFamily="monospace">
            128×64 OLED
          </text>
        </svg>
      </div>

      {/* Status badge */}
      <div
        className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-widest transition-all duration-500"
        style={{
          background: `${config.ringColor}22`,
          color: config.ringColor,
          border: `1px solid ${config.ringColor}44`,
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: config.ringColor,
            animation: state !== 'IDLE' ? 'pulseRing 1s ease-in-out infinite' : 'none',
          }}
        />
        {config.statusText}
      </div>
    </div>
  );
}
