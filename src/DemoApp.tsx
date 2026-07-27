import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RotateCcw, Shield, Flame, Crosshair, Cpu, Eye, Sparkles, Layers } from 'lucide-react';

export type DemoChapter = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  duration: number; // in seconds
  cameraAngle: 'hero' | 'side' | 'muzzle' | 'pump';
  preset: 'cyberprint' | 'printedsteel' | 'wood' | 'stealth';
  action?: 'fire' | 'disassemble' | 'reassemble' | 'rack';
};

const CHAPTERS: DemoChapter[] = [
  {
    id: 'sculpt',
    title: '1. Anatomical 3D Sculpt Match',
    subtitle: 'Image 1 Reference Accuracy',
    description: 'Sloped rear receiver chamfer, ergonomic wrist grip, silver trigger, and top ventilated sight rib.',
    duration: 6,
    cameraAngle: 'side',
    preset: 'cyberprint',
  },
  {
    id: 'skins',
    title: '2. 4 Custom 3D Print Graphic Skins',
    subtitle: 'Sleek Modern Finishes',
    description: 'Cyber Cyan & Gold Dragon, Stenciled Military Steel, Engraved Wood Filigree, and Stealth Carbon Camo.',
    duration: 7,
    cameraAngle: 'hero',
    preset: 'cyberprint',
  },
  {
    id: 'smoke',
    title: '3. FPS Gunfire & Volumetric Smoke FX',
    subtitle: 'Gunpowder Smoke Clouds',
    description: '24 expanding smoke particles and muzzle flash light on every fire action.',
    duration: 6,
    cameraAngle: 'muzzle',
    preset: 'printedsteel',
    action: 'fire',
  },
  {
    id: 'ejection',
    title: '4. Snappy M416 Shell Drop Physics',
    subtitle: 'Off-Screen Gravity Fall',
    description: 'Real 12-gauge brass shell ejects in 3D space and falls past the laptop screen bottom.',
    duration: 6,
    cameraAngle: 'pump',
    preset: 'stealth',
    action: 'fire',
  },
  {
    id: 'cad',
    title: '5. Clean CAD Mechanical Disassembly',
    subtitle: 'Technical Blueprint View',
    description: 'Clean exploded component layout with 3D dashed CAD blueprint guidelines.',
    duration: 7,
    cameraAngle: 'hero',
    preset: 'cyberprint',
    action: 'disassemble',
  },
];

export function DemoApp() {
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [activePreset, setActivePreset] = useState<'cyberprint' | 'printedsteel' | 'wood' | 'stealth'>('cyberprint');

  const currentChapter = CHAPTERS[currentChapterIndex];

  // Auto-play timer loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 0.1;
        if (next >= currentChapter.duration) {
          // Next chapter
          const nextIndex = (currentChapterIndex + 1) % CHAPTERS.length;
          setCurrentChapterIndex(nextIndex);
          triggerChapterAction(CHAPTERS[nextIndex]);
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, currentChapterIndex]);

  const triggerChapterAction = (chapter: DemoChapter) => {
    setActivePreset(chapter.preset);

    // Trigger DOM buttons in background Three.js viewer
    const btnCam = document.getElementById(`cam-${chapter.cameraAngle}`);
    if (btnCam) btnCam.click();

    const btnPreset = document.getElementById(`preset-${chapter.preset}`);
    if (btnPreset) btnPreset.click();

    if (chapter.action === 'fire') {
      setTimeout(() => {
        const btnFire = document.getElementById('btn-fire');
        if (btnFire) btnFire.click();
      }, 800);
    } else if (chapter.action === 'disassemble') {
      setTimeout(() => {
        const btnExplode = document.getElementById('btn-explode-toggle');
        if (btnExplode && btnExplode.innerText.includes('Disassemble')) {
          btnExplode.click();
        }
      }, 1000);
    } else if (chapter.action === 'reassemble') {
      setTimeout(() => {
        const btnExplode = document.getElementById('btn-explode-toggle');
        if (btnExplode && btnExplode.innerText.includes('Reassemble')) {
          btnExplode.click();
        }
      }, 1000);
    }
  };

  const handleSelectChapter = (index: number) => {
    setCurrentChapterIndex(index);
    setProgress(0);
    triggerChapterAction(CHAPTERS[index]);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-30 flex flex-col justify-between p-6 select-none font-sans">
      {/* Top Banner & Control Bar */}
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between pointer-events-auto bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-2xl px-6 py-3 shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-wide flex items-center gap-2">
              PUMP SHOTGUN 12G
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                React Motion Video Showcase
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Interactive 3D Feature Presentation</p>
          </div>
        </div>

        {/* Video Player Play/Pause Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsPlaying(!isPlaying);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs transition-all active:scale-95"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pause Demo' : 'Play Video Demo'}
          </button>
          <button
            onClick={() => handleSelectChapter(0)}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 text-slate-300 transition-all active:scale-95"
            title="Restart Video Demo"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Center Cinematic Motion Feature Card */}
      <div className="flex justify-between items-end">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentChapter.id}
            initial={{ opacity: 0, x: -40, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.95 }}
            transition={{ duration: 0.4 }}
            className="pointer-events-auto max-w-md bg-slate-950/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 shadow-2xl text-white space-y-3"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span className="text-[10px] uppercase tracking-wider font-black text-cyan-400">
                {currentChapter.subtitle}
              </span>
            </div>
            <h2 className="text-xl font-black text-slate-100 tracking-tight">{currentChapter.title}</h2>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">{currentChapter.description}</p>

            {/* Chapter Progress Bar */}
            <div className="w-full bg-slate-800/60 rounded-full h-1.5 overflow-hidden border border-slate-700/50">
              <motion.div
                className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full rounded-full"
                style={{ width: `${(progress / currentChapter.duration) * 100}%` }}
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Interactive Chapter Timeline Selector */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="pointer-events-auto flex flex-col gap-2 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3 shadow-2xl"
        >
          <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-2">
            Demo Video Timeline
          </div>
          <div className="flex flex-col gap-1.5">
            {CHAPTERS.map((ch, idx) => (
              <button
                key={ch.id}
                onClick={() => handleSelectChapter(idx)}
                className={`flex items-center justify-between gap-4 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                  idx === currentChapterIndex
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-900/40 hover:bg-slate-800/60 text-slate-400 border border-transparent'
                }`}
              >
                <span>{ch.title}</span>
                {idx === currentChapterIndex && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
