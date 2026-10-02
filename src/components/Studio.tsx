'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Bot, Send, Loader2, Trash2, Play, FileCode, Plus, Sparkles,
  Check, Copy, ArrowRight, Target, ListChecks, Download, LayoutTemplate,
  FilePlus2, Flame, Trophy, Zap
} from 'lucide-react';
import { AIMode, MODES, ProjectFile, TEMPLATES } from '@/lib/types';
import { useAuth } from '@/components/AuthProvider';
import Onboarding from '@/components/Onboarding';
import { cn } from '@/lib/utils';
import {
  UserProgress, defaultProgress, applyDailyStreak, addXp, getRank, progressToNext,
  XP, ACHIEVEMENTS
} from '@/lib/progress';
import { v4 as uuid } from 'uuid';

function cleanCode(code: string) {
  return code
    .replace(/^```[\w]*\n?/gm, '')
    .replace(/```$/gm, '')
    .replace(/^<!--\s*file:\s*([^\s]+)\s*-->\s*/i, '')
    .replace(/^\/\/\s*file:\s*([^\s]+)\s*\n?/i, '')
    .replace(/^#\s*file:\s*([^\s]+)\s*\n?/i, '')
    .trim();
}

function extractFileName(code: string, language: string): string | null {
  const patterns = [
    /<!--\s*file:\s*([^\s]+)\s*-->/i,
    /\/\/\s*file:\s*([^\s]+)/i,
    /\/\*\s*file:\s*([^\s]+)\s*\*\//i,
    /#\s*file:\s*([^\s]+)/i,
  ];
  for (const re of patterns) {
    const m = code.match(re);
    if (m?.[1]) return m[1].trim();
  }
  // fallback by language
  if (language === 'html') return null;
  return null;
}

function detectLanguage(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || 'js';
  const map: Record<string, string> = {
    js: 'javascript', ts: 'typescript', tsx: 'typescript', jsx: 'javascript',
    css: 'css', html: 'html', json: 'json', md: 'markdown', py: 'python'
  };
  return map[ext] || 'javascript';
}

function CodeBlock({ language, children, onApply, onCreateFile }: {
  language: string;
  children: string;
  onApply: (code: string) => void;
  onCreateFile: (name: string, code: string) => void;
}) {
  const [done, setDone] = useState<'apply' | 'create' | 'copy' | null>(null);
  const raw = String(children);
  const fileName = extractFileName(raw, language);
  const code = cleanCode(raw);

  const flash = (type: 'apply' | 'create' | 'copy') => {
    setDone(type);
    setTimeout(() => setDone(null), 1500);
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800 gap-2">
        <span className="text-[10px] font-mono text-zinc-500 uppercase truncate">
          {fileName ? fileName : (language || 'code')}
        </span>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => {
              navigator.clipboard.writeText(code);
              flash('copy');
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            {done === 'copy' ? <Check size={11} /> : <Copy size={11} />}
            {done === 'copy' ? 'OK' : 'Copiar'}
          </button>
          <button
            onClick={() => {
              onApply(code);
              flash('apply');
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-white/10 text-white hover:bg-white/15"
          >
            {done === 'apply' ? <Check size={11} /> : <ArrowRight size={11} />}
            {done === 'apply' ? 'Aplicado' : 'Aplicar'}
          </button>
          <button
            onClick={() => {
              const name = fileName || prompt('Nombre del archivo:', language === 'html' ? 'index.html' : `file.${language === 'javascript' ? 'js' : language}`) || '';
              if (!name) return;
              onCreateFile(name, code);
              flash('create');
            }}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25"
          >
            {done === 'create' ? <Check size={11} /> : <FilePlus2 size={11} />}
            {done === 'create' ? 'Creado' : (fileName ? 'Crear archivo' : 'Guardar como')}
          </button>
        </div>
      </div>
      <pre className="p-3 overflow-x-auto text-[12px] font-mono text-zinc-300 leading-relaxed max-h-80">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function Studio() {
  const { user, signOut, configured } = useAuth();
  const [mode, setMode] = useState<AIMode>('plan');
  const [projectName, setProjectName] = useState('Nuevo proyecto');
  const [projectGoal, setProjectGoal] = useState('');
  const [progress, setProgress] = useState<UserProgress>(defaultProgress());
  const [xpFlash, setXpFlash] = useState<string | null>(null);
  const [achievementFlash, setAchievementFlash] = useState<string | null>(null);
  const [files, setFiles] = useState<ProjectFile[]>([
    { id: '1', name: 'main.js', language: 'javascript', content: '// Escribe el objetivo del proyecto y pide a CodeFox que genere la estructura.\nconsole.log("CodeFox listo");\n' }
  ]);
  const [activeFileId, setActiveFileId] = useState('1');
  const [checklist, setChecklist] = useState<{ id: string; text: string; done: boolean }[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeFile = files.find(f => f.id === activeFileId) || files[0];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const progressKey = user?.id ? `codefox-progress-${user.id}` : 'codefox-progress-v1';

  const unlockAchievement = (id: string, p: UserProgress) => {
    if (p.achievements.includes(id)) return p;
    const meta = ACHIEVEMENTS[id];
    if (meta) {
      setAchievementFlash(meta.title);
      setTimeout(() => setAchievementFlash(null), 2800);
    }
    return { ...p, achievements: [...p.achievements, id] };
  };

  const gainXp = (amount: number, label: string, extra?: (p: UserProgress) => UserProgress) => {
    setProgress(prev => {
      let next = addXp(prev, amount);
      if (extra) next = extra(next);
      const rankBefore = getRank(prev.xp).id;
      const rankAfter = getRank(next.xp).id;
      if (rankBefore !== rankAfter && rankAfter === 'builder') {
        next = unlockAchievement('level_builder', next);
      }
      return next;
    });
    setXpFlash(`+${amount} XP · ${label}`);
    setTimeout(() => setXpFlash(null), 2200);
  };

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages, append } = useChat({
    api: '/api/chat',
    body: {
      mode,
      projectName,
      projectGoal,
      currentFile: activeFile?.name,
      fileContent: activeFile?.content,
      checklist,
      fileList: files.map(f => f.name),
    },
    onError: (err) => setError(err.message),
    onFinish: () => setError(null),
  });

  useEffect(() => {
    const storageKey = user?.id ? `codefox-pro-${user.id}` : 'codefox-pro-v2';
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.projectName) setProjectName(data.projectName);
        if (data.projectGoal) setProjectGoal(data.projectGoal);
        if (data.files?.length) setFiles(data.files);
        if (data.activeFileId) setActiveFileId(data.activeFileId);
        if (data.checklist) setChecklist(data.checklist);
        if (data.messages) setMessages(data.messages);
        if (data.mode) setMode(data.mode);
      } catch {}
    }
  }, [setMessages, user?.id]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(progressKey);
      if (raw) {
        const parsed = JSON.parse(raw) as UserProgress;
        setProgress(applyDailyStreak({ ...defaultProgress(), ...parsed }));
      } else {
        setProgress(applyDailyStreak(defaultProgress()));
      }
    } catch {
      setProgress(applyDailyStreak(defaultProgress()));
    }
  }, [progressKey]);

  useEffect(() => {
    localStorage.setItem(progressKey, JSON.stringify(progress));
  }, [progress, progressKey]);


  useEffect(() => {
    const storageKey = user?.id ? `codefox-pro-${user.id}` : 'codefox-pro-v2';
    localStorage.setItem(storageKey, JSON.stringify({
      projectName, projectGoal, files, activeFileId, checklist, messages, mode
    }));
  }, [projectName, projectGoal, files, activeFileId, checklist, messages, mode, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleOutput]);

  const updateFileContent = useCallback((content: string) => {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content } : f));
  }, [activeFileId]);

  const applyCode = useCallback((code: string) => {
    updateFileContent(cleanCode(code));
    showToast('Código aplicado al archivo actual');
    gainXp(XP.applyCode, 'Código aplicado');
  }, [updateFileContent]);

  const createFileFromCode = useCallback((name: string, code: string) => {
    const content = cleanCode(code);
    setFiles(prev => {
      const existing = prev.find(f => f.name === name);
      if (existing) {
        return prev.map(f => f.name === name ? { ...f, content } : f);
      }
      const file: ProjectFile = {
        id: uuid(),
        name,
        language: detectLanguage(name),
        content,
      };
      return [...prev, file];
    });
    setFiles(prev => {
      const f = prev.find(x => x.name === name);
      if (f) setActiveFileId(f.id);
      return prev;
    });
    showToast(`Archivo ${name} listo`);
    gainXp(XP.createFile, 'Archivo creado', (p) => {
      let n = { ...p, totalFilesCreated: p.totalFilesCreated + 1 };
      if (n.totalFilesCreated === 1) n = unlockAchievement('first_file', n);
      return n;
    });
  }, []);

  const addFile = () => {
    const name = prompt('Nombre del archivo (ej: index.html, styles.css, app.js):');
    if (!name) return;
    const file: ProjectFile = {
      id: uuid(),
      name,
      language: detectLanguage(name),
      content: ''
    };
    setFiles(prev => [...prev, file]);
    setActiveFileId(file.id);
  };

  const loadTemplate = (templateId: string) => {
    const template = TEMPLATES.find(t => t.id === templateId);
    if (!template) return;
    const newFiles = template.files.map(f => ({ ...f, id: uuid() }));
    setProjectName(template.name);
    setProjectGoal(template.goal);
    setFiles(newFiles);
    setActiveFileId(newFiles[0]?.id || '');
    setChecklist(template.checklist.map(text => ({ id: uuid(), text, done: false })));
    setMessages([]);
    setShowTemplates(false);
    setMode('plan');
    showToast(`Plantilla "${template.name}" cargada`);
  };

  const buildHtmlPreview = () => {
    const htmlFile = files.find(f => f.name.endsWith('.html')) || (activeFile?.language === 'html' ? activeFile : null);
    if (!htmlFile) return null;

    let html = htmlFile.content || '';
    const css = files.filter(f => f.name.endsWith('.css')).map(f => f.content).join('\n\n');
    const js = files.filter(f => f.name.endsWith('.js') || f.name.endsWith('.javascript')).map(f => f.content).join('\n\n');

    // Inject CSS
    if (css.trim()) {
      if (html.includes('</head>')) {
        html = html.replace('</head>', `<style>\n${css}\n</style>\n</head>`);
      } else {
        html = `<style>\n${css}\n</style>\n` + html;
      }
    }

    // Inject JS before </body>
    if (js.trim()) {
      if (html.includes('</body>')) {
        html = html.replace('</body>', `<script>\n${js}\n</script>\n</body>`);
      } else {
        html = html + `\n<script>\n${js}\n</script>`;
      }
    }

    return html;
  };

  const runCode = () => {
    // HTML preview mode
    if (activeFile?.language === 'html' || activeFile?.name.endsWith('.html')) {
      const html = buildHtmlPreview();
      if (!html) {
        setConsoleOutput(prev => [...prev, '✗ No se encontró HTML para previsualizar']);
        return;
      }
      setHtmlPreview(html);
      setConsoleOutput(prev => [...prev, '› Preview HTML abierto']);
      gainXp(XP.runPreview, 'Preview');
      return;
    }

    // If project has HTML and user is on CSS/JS, still allow full preview
    if (files.some(f => f.name.endsWith('.html'))) {
      const html = buildHtmlPreview();
      if (html) {
        setHtmlPreview(html);
        setConsoleOutput(prev => [...prev, '› Preview del proyecto HTML abierto']);
        return;
      }
    }

    const code = cleanCode(activeFile?.content || '');
    if (!code.trim()) {
      setConsoleOutput(prev => [...prev, '✗ No hay código para ejecutar']);
      return;
    }

    setConsoleOutput(prev => [...prev, '› Ejecutando...']);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    try {
      const w = iframe.contentWindow as Window | null;
      if (!w) throw new Error('No se pudo crear el entorno');
      const logs: string[] = [];
      const win = w as any;
      win.console = {
        log: (...args: any[]) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ')),
        error: (...args: any[]) => logs.push('Error: ' + args.map(String).join(' ')),
        warn: (...args: any[]) => logs.push('Warn: ' + args.map(String).join(' ')),
        info: (...args: any[]) => logs.push(args.map(String).join(' ')),
      };
      win.eval(code);
      setConsoleOutput(prev => [...prev, ...(logs.length ? logs : ['✓ Ejecutado (sin salida)'])]);
    } catch (err: any) {
      setConsoleOutput(prev => [...prev, `✗ ${err.message || String(err)}`]);
    } finally {
      document.body.removeChild(iframe);
    }
  };

  const exportProject = () => {
    const content = files.map(f => `// ===== ${f.name} =====\n${f.content}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, '-').toLowerCase() || 'proyecto'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Proyecto exportado');
    gainXp(XP.exportProject, 'Proyecto exportado', (p) => unlockAchievement('first_export', p));
  };

  const toggleCheck = (id: string) => {
    setChecklist(prev => {
      const item = prev.find(c => c.id === id);
      const turningOn = item && !item.done;
      if (turningOn) {
        gainXp(XP.completeCheckItem, 'Checklist', (p) => {
          let n = { ...p, totalChecksDone: p.totalChecksDone + 1 };
          if (n.totalChecksDone === 1) n = unlockAchievement('first_check', n);
          return n;
        });
      }
      return prev.map(c => c.id === id ? { ...c, done: !c.done } : c);
    });
  };

  const addCheckItem = () => {
    const text = prompt('Nueva tarea:');
    if (!text) return;
    setChecklist(prev => [...prev, { id: uuid(), text, done: false }]);
  };

  const doneCount = checklist.filter(c => c.done).length;

  return (
    <div className="h-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white text-black text-sm font-medium shadow-xl">
          {toast}
        </div>
      )}
      {xpFlash && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-500/30 flex items-center gap-1.5">
          <Zap size={12} /> {xpFlash}
        </div>
      )}
      {achievementFlash && (
        <div className="fixed top-28 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-amber-500 text-black text-xs font-semibold shadow-lg flex items-center gap-1.5">
          <Trophy size={12} /> Logro: {achievementFlash}
        </div>
      )}

      <header className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-6 h-6 rounded-md bg-white text-black flex items-center justify-center text-[11px] font-bold shrink-0">CF</div>
          <input
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-transparent outline-none text-sm font-medium max-w-[140px] truncate"
          />
          {(() => {
            const rank = getRank(progress.xp);
            const prog = progressToNext(progress.xp);
            return (
              <div className="hidden lg:flex items-center gap-2 min-w-[160px]">
                <div className="flex flex-col gap-0.5 min-w-[120px]">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={cn('font-semibold', rank.color)}>{rank.name}</span>
                    <span className="text-zinc-500">{progress.xp} XP</span>
                  </div>
                  <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500" style={{ width: `${prog.pct}%` }} />
                  </div>
                </div>
                {progress.streak > 0 && (
                  <div className="flex items-center gap-1 text-[10px] text-orange-400 font-medium px-1.5 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20">
                    <Flame size={11} /> {progress.streak}d
                  </div>
                )}
              </div>
            );
          })()}
          <div className="hidden md:flex items-center gap-1.5 text-zinc-500 text-xs">
            <Target size={12} />
            <input
              value={projectGoal}
              onChange={(e) => setProjectGoal(e.target.value)}
              placeholder="Objetivo del proyecto..."
              className="bg-transparent outline-none text-xs text-zinc-400 placeholder:text-zinc-600 w-[240px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
          {(Object.keys(MODES) as AIMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-3 py-1.5 rounded-md text-[11px] font-medium transition",
                mode === m ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              {MODES[m].label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowTemplates(true)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-800">
            <LayoutTemplate size={13} /> Plantillas
          </button>
          <button onClick={exportProject} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] text-zinc-400 hover:text-white hover:bg-zinc-800">
            <Download size={13} /> Exportar
          </button>
          {configured && user && (
            <button
              onClick={() => signOut()}
              className="px-2.5 py-1.5 rounded-md text-[11px] text-zinc-500 hover:text-white hover:bg-zinc-800"
              title={user.email || 'Salir'}
            >
              Salir
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-[220px] border-r border-zinc-800 flex flex-col shrink-0">
          <div className="p-3 border-b border-zinc-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Archivos</span>
              <button onClick={addFile} className="text-zinc-500 hover:text-white"><Plus size={14} /></button>
            </div>
            <div className="space-y-0.5">
              {files.map((file) => (
                <button
                  key={file.id}
                  onClick={() => setActiveFileId(file.id)}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-left",
                    activeFileId === file.id ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900"
                  )}
                >
                  <FileCode size={13} />
                  {file.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 flex-1 overflow-y-auto">
            <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className={cn('text-xs font-semibold', getRank(progress.xp).color)}>{getRank(progress.xp).name}</span>
                <span className="text-[10px] text-zinc-500">{progress.xp} XP</span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden mb-2">
                <div className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all" style={{ width: `${progressToNext(progress.xp).pct}%` }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span className="flex items-center gap-1"><Flame size={10} className="text-orange-400" /> Racha {progress.streak}d</span>
                <span>{progress.achievements.length} logros</span>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <ListChecks size={12} /> Checklist
              </span>
              <button onClick={addCheckItem} className="text-zinc-500 hover:text-white"><Plus size={14} /></button>
            </div>
            {checklist.length === 0 ? (
              <p className="text-[11px] text-zinc-600">Define tareas para terminar el proyecto.</p>
            ) : (
              <div className="space-y-1.5">
                <div className="text-[10px] text-zinc-500 mb-2">{doneCount}/{checklist.length}</div>
                {checklist.map((item) => (
                  <button key={item.id} onClick={() => toggleCheck(item.id)} className="w-full flex items-start gap-2 text-left">
                    <div className={cn("mt-0.5 w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0", item.done ? "bg-white border-white" : "border-zinc-600")}>
                      {item.done && <Check size={10} className="text-black" />}
                    </div>
                    <span className={cn("text-[11px]", item.done ? "text-zinc-500 line-through" : "text-zinc-300")}>{item.text}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0">
          <div className="h-9 border-b border-zinc-800 flex items-center justify-between px-3">
            <span className="text-xs text-zinc-500">{activeFile?.name}</span>
            <button onClick={runCode} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-100 hover:bg-white text-zinc-900 text-[11px] font-medium">
              <Play size={11} fill="currentColor" /> Ejecutar
            </button>
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={activeFile?.language || 'javascript'}
              value={activeFile?.content || ''}
              onChange={(v) => updateFileContent(v || '')}
              theme="vs-dark"
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                padding: { top: 16, bottom: 16 },
                fontFamily: 'JetBrains Mono, Menlo, monospace',
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
            />
          </div>
          <div className="h-28 border-t border-zinc-800 flex flex-col">
            <div className="px-3 py-1 border-b border-zinc-800 flex justify-between">
              <span className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">Consola</span>
              <button onClick={() => setConsoleOutput([])} className="text-[10px] text-zinc-600 hover:text-zinc-400">Limpiar</button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-1.5 font-mono text-[11px] space-y-0.5">
              {consoleOutput.length === 0 && <span className="text-zinc-700">Sin salida</span>}
              {consoleOutput.map((line, i) => (
                <div key={i} className={cn(line.startsWith('✗') ? 'text-red-400' : line.startsWith('✓') || line.startsWith('›') ? 'text-emerald-400' : 'text-zinc-400')}>{line}</div>
              ))}
              <div ref={consoleEndRef} />
            </div>
          </div>
        </main>

        <section className="w-[400px] border-l border-zinc-800 flex flex-col">
          <div className="h-9 border-b border-zinc-800 flex items-center justify-between px-3">
            <div className="flex items-center gap-2 text-xs font-medium">
              <Sparkles size={13} />
              CodeFox
              <span className="text-zinc-500 font-normal">· {MODES[mode].label}</span>
            </div>
            <button onClick={() => setMessages([])} className="text-zinc-600 hover:text-zinc-300"><Trash2 size={13} /></button>
          </div>

          <div className="px-3 py-2 border-b border-zinc-800 flex gap-1.5 overflow-x-auto">
            {[
              { label: 'Estructura completa', prompt: 'Propón la estructura completa de archivos para este proyecto y genera los archivos principales con el formato file: nombre.ext en cada bloque de código.' },
              { label: 'Generar MVP', prompt: 'Construye un MVP funcional completo con HTML/CSS/JS de navegador. Crea los archivos necesarios con formato file: nombre.ext.' },
              { label: 'Siguiente paso', prompt: '¿Cuál es el siguiente paso más importante para avanzar este proyecto ahora mismo?' },
              { label: 'Cerrar proyecto', prompt: '¿Qué falta para considerar este proyecto terminado y presentable? Dame una lista corta y accionable.' },
            ].map((a) => (
              <button
                key={a.label}
                disabled={isLoading}
                onClick={() => append({ role: 'user', content: a.prompt })}
                className="shrink-0 px-2.5 py-1 rounded-full text-[10px] bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800 disabled:opacity-40"
              >
                {a.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {messages.length === 0 && (
              <div className="mt-8 px-1">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4">
                  <Bot size={18} />
                </div>
                <h2 className="text-sm font-medium mb-1">
                  {progress.streak > 0 ? `Día ${progress.streak} · ¿Qué avanzamos hoy?` : 'Construye proyectos completos'}
                </h2>
                <p className="text-xs text-zinc-500 leading-relaxed mb-5">
                  {projectGoal
                    ? `Objetivo: ${projectGoal}`
                    : 'Define un objetivo y usa Crear archivo en cada bloque para armar el proyecto.'}
                </p>
                <div className="space-y-1.5">
                  {[
                    'Quiero una landing page completa para mi idea',
                    'Genera la estructura de un SaaS simple',
                    'Arma un portfolio moderno con HTML/CSS/JS',
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleInputChange({ target: { value: s } } as any)}
                      className="w-full text-left text-xs px-3 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m) => (
              <div key={m.id} className={cn('flex gap-2', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                {m.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={12} />
                  </div>
                )}
                <div className={cn(
                  'max-w-[92%] rounded-xl px-3 py-2 text-[13px] leading-relaxed',
                  m.role === 'user' ? 'bg-white text-black' : 'bg-zinc-900 text-zinc-200 border border-zinc-800'
                )}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        const codeStr = String(children).replace(/\n$/, '');
                        const isInline = !match && !codeStr.includes('\n');
                        if (isInline) {
                          return <code className="bg-black/20 px-1 py-0.5 rounded text-[11px] font-mono" {...props}>{children}</code>;
                        }
                        return (
                          <CodeBlock
                            language={match?.[1] || 'javascript'}
                            onApply={applyCode}
                            onCreateFile={createFileFromCode}
                          >
                            {codeStr}
                          </CodeBlock>
                        );
                      },
                      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center shrink-0"><Bot size={12} /></div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin text-zinc-400" />
                  <span className="text-xs text-zinc-500">Construyendo...</span>
                </div>
              </div>
            )}

            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-3 py-2 rounded-lg text-xs">{error}</div>}
            <div ref={messagesEndRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              handleSubmit(e);
            }}
            className="p-3 border-t border-zinc-800"
          >
            <div className="flex gap-2">
              <input
                value={input}
                onChange={handleInputChange}
                placeholder="Pide una app, estructura o el siguiente archivo..."
                disabled={isLoading}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-zinc-600 placeholder:text-zinc-600"
              />
              <button type="submit" disabled={isLoading || !input.trim()} className="bg-white hover:bg-zinc-200 disabled:opacity-30 text-black rounded-lg px-3.5">
                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </form>
        </section>
      </div>


      {htmlPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col">
          <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-950">
            <span className="text-sm font-medium text-zinc-200">Preview del proyecto</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const html = buildHtmlPreview();
                  if (html) setHtmlPreview(html);
                }}
                className="px-3 py-1.5 rounded-md text-[11px] bg-zinc-800 text-zinc-300 hover:text-white"
              >
                Recargar
              </button>
              <button
                onClick={() => setHtmlPreview(null)}
                className="px-3 py-1.5 rounded-md text-[11px] bg-white text-black font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
          <iframe
            title="preview"
            srcDoc={htmlPreview}
            className="flex-1 w-full bg-white"
            sandbox="allow-scripts allow-forms allow-modals allow-same-origin"
          />
        </div>
      )}

      {!progress.onboardingDone && (
        <Onboarding
          onComplete={({ projectName: n, goal }) => {
            setProjectName(n);
            setProjectGoal(goal);
            setProgress(prev => {
              let p = addXp(prev, XP.finishOnboarding + XP.defineGoal + XP.createProject);
              p = { ...p, onboardingDone: true, totalProjects: prev.totalProjects + 1 };
              p = unlockAchievement('onboarding', p);
              p = unlockAchievement('first_goal', p);
              return p;
            });
            setXpFlash('+65 XP · Onboarding completado');
            setTimeout(() => setXpFlash(null), 2500);
            setMode('plan');
            showToast('Objetivo definido. Ahora construye.');
          }}
        />
      )}

      {showTemplates && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-sm font-medium">Plantillas</h3>
              <button onClick={() => setShowTemplates(false)} className="text-zinc-500 hover:text-white text-xs">Cerrar</button>
            </div>
            <div className="p-3 space-y-2">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => loadTemplate(t.id)} className="w-full text-left px-4 py-3 rounded-xl hover:bg-zinc-800 border border-zinc-800">
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{t.goal || 'Proyecto en blanco'}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
