'use client';

import { useState } from 'react';
import { ArrowRight, Rocket, Target, Sparkles } from 'lucide-react';

export default function Onboarding({
  onComplete,
}: {
  onComplete: (data: { projectName: string; goal: string }) => void;
}) {
  const [step, setStep] = useState(0);
  const [projectName, setProjectName] = useState('');
  const [goal, setGoal] = useState('');

  const steps = [
    {
      icon: Rocket,
      title: 'Bienvenido a CodeFox',
      body: 'No es solo un chat con código. Es tu espacio para pasar de idea a producto terminado.',
    },
    {
      icon: Target,
      title: 'Todo empieza con un objetivo',
      body: 'Sin objetivo claro, los proyectos se abandonan. Define qué quieres tener listo.',
    },
    {
      icon: Sparkles,
      title: 'Ganas XP mientras construyes',
      body: 'Crear archivos, completar checklist y terminar proyectos te sube de nivel: Novato → Builder → Shipper → Founder.',
    },
  ];

  const current = steps[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[60] bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${i <= step ? 'bg-white' : 'bg-zinc-800'}`}
            />
          ))}
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl">
          <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center mb-5">
            <Icon size={22} />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight mb-2">{current.title}</h2>
          <p className="text-sm text-zinc-400 leading-relaxed mb-6">{current.body}</p>

          {step === 1 && (
            <div className="space-y-3 mb-6">
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Nombre del proyecto</label>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Ej: Landing de mi app"
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm outline-none focus:border-zinc-500"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Objetivo (qué cuenta como terminado)</label>
                <input
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Ej: Página lista para compartir y validar la idea"
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2.5 text-sm outline-none focus:border-zinc-500"
                />
              </div>
            </div>
          )}

          <button
            onClick={() => {
              if (step < steps.length - 1) {
                if (step === 1 && (!projectName.trim() || !goal.trim())) return;
                setStep(step + 1);
                return;
              }
              onComplete({
                projectName: projectName.trim() || 'Mi primer proyecto',
                goal: goal.trim() || 'Terminar una primera versión usable',
              });
            }}
            disabled={step === 1 && (!projectName.trim() || !goal.trim())}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-black font-medium py-3 text-sm hover:bg-zinc-200 disabled:opacity-40 transition"
          >
            {step < steps.length - 1 ? 'Continuar' : 'Empezar a construir'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
