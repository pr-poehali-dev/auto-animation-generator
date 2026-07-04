import { useState, useRef, useMemo } from 'react';
import Icon from '@/components/ui/icon';

type SceneObject = {
  id: string;
  name: string;
  color: string;
  keyframes: { time: number; x: number; y: number; rotation: number; scale: number; opacity: number }[];
};

const DURATION = 100;
const TRACKS: { key: 'x' | 'y' | 'rotation' | 'scale' | 'opacity'; label: string; icon: string }[] = [
  { key: 'x', label: 'Позиция X', icon: 'MoveHorizontal' },
  { key: 'y', label: 'Позиция Y', icon: 'MoveVertical' },
  { key: 'rotation', label: 'Поворот', icon: 'RotateCw' },
  { key: 'scale', label: 'Масштаб', icon: 'Maximize2' },
  { key: 'opacity', label: 'Прозрачность', icon: 'Eye' },
];

const ease = (t: number) => t * t * (3 - 2 * t);

function interp(kfs: SceneObject['keyframes'], time: number) {
  const sorted = [...kfs].sort((a, b) => a.time - b.time);
  if (sorted.length === 0) return null;
  if (time <= sorted[0].time) return sorted[0];
  if (time >= sorted[sorted.length - 1].time) return sorted[sorted.length - 1];
  let a = sorted[0], b = sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (time >= sorted[i].time && time <= sorted[i + 1].time) { a = sorted[i]; b = sorted[i + 1]; break; }
  }
  const raw = (time - a.time) / (b.time - a.time || 1);
  const t = ease(raw);
  return {
    time, x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t,
    rotation: a.rotation + (b.rotation - a.rotation) * t,
    scale: a.scale + (b.scale - a.scale) * t,
    opacity: a.opacity + (b.opacity - a.opacity) * t,
  };
}

const initialObjects: SceneObject[] = [
  {
    id: 'obj-1', name: 'Планета', color: '#3B9EFF',
    keyframes: [
      { time: 0, x: 20, y: 55, rotation: 0, scale: 1, opacity: 1 },
      { time: 50, x: 55, y: 30, rotation: 180, scale: 1.4, opacity: 1 },
      { time: 100, x: 80, y: 55, rotation: 360, scale: 1, opacity: 1 },
    ],
  },
  {
    id: 'obj-2', name: 'Спутник', color: '#A855F7',
    keyframes: [
      { time: 0, x: 70, y: 20, rotation: 0, scale: 0.6, opacity: 0.4 },
      { time: 60, x: 35, y: 70, rotation: 90, scale: 0.9, opacity: 1 },
    ],
  },
];

const Index = () => {
  const [objects, setObjects] = useState<SceneObject[]>(initialObjects);
  const [selectedId, setSelectedId] = useState<string>('obj-1');
  const [time, setTime] = useState(28);
  const [playing, setPlaying] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const rafRef = useRef<number>();

  const selected = objects.find((o) => o.id === selectedId)!;
  const selectedState = useMemo(() => interp(selected.keyframes, time), [selected, time]);

  const play = () => {
    if (playing) { cancelAnimationFrame(rafRef.current!); setPlaying(false); return; }
    setPlaying(true);
    const start = performance.now(); const from = time;
    const loop = (now: number) => {
      let t = from + (now - start) / 40;
      if (t > DURATION) t = 0;
      setTime(t);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  };

  const runAI = () => {
    if (!aiPrompt.trim()) return;
    setAiThinking(true);
    setTimeout(() => setAiThinking(false), 1800);
  };

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden font-sans text-[13px]">
      {/* Top bar */}
      <header className="h-11 shrink-0 border-b border-ae-line bg-ae-panel flex items-center px-3 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-ae-blue to-ae-purple grid place-items-center">
            <Icon name="Film" size={14} className="text-white" />
          </div>
          <span className="font-semibold tracking-tight">Motion<span className="text-ae-blue">Forge</span></span>
        </div>
        <div className="h-5 w-px bg-ae-line" />
        <nav className="flex gap-1 text-muted-foreground">
          {['Файл', 'Правка', 'Слой', 'Анимация', 'Вид'].map((m) => (
            <button key={m} className="px-2.5 py-1 rounded hover:bg-ae-panel-2 hover:text-foreground transition-colors">{m}</button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-ae-panel-2 hover:bg-ae-line transition-colors text-muted-foreground">
            <Icon name="Save" size={14} /> Проект
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-ae-blue to-ae-purple text-white font-medium hover:opacity-90 transition-opacity">
            <Icon name="Download" size={14} /> Рендер MP4
          </button>
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex-1 flex min-h-0">
        {/* Left: Layers */}
        <aside className="w-56 shrink-0 border-r border-ae-line bg-ae-panel flex flex-col">
          <PanelHeader icon="Layers" title="Слои" count={objects.length} />
          <div className="flex-1 overflow-y-auto ae-scroll p-1.5 space-y-1">
            {objects.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelectedId(o.id)}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded-md transition-colors text-left ${selectedId === o.id ? 'bg-ae-blue/15 ring-1 ring-ae-blue/40' : 'hover:bg-ae-panel-2'}`}
              >
                <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: o.color }} />
                <span className="flex-1 truncate">{o.name}</span>
                <Icon name="Eye" size={13} className="text-muted-foreground" />
              </button>
            ))}
          </div>
          <div className="p-1.5 border-t border-ae-line">
            <button className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-md border border-dashed border-ae-line text-muted-foreground hover:border-ae-blue hover:text-ae-blue transition-colors">
              <Icon name="ImagePlus" size={14} /> Загрузить изображение
            </button>
          </div>
        </aside>

        {/* Center: Scene + Timeline */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Scene */}
          <section className="flex-1 relative grid-bg overflow-hidden min-h-0">
            <div className="absolute inset-4 rounded-lg border border-ae-line/70 bg-black/20 overflow-hidden shadow-2xl shadow-black/40">
              <div className="absolute top-2 left-3 text-[11px] font-mono text-muted-foreground bg-ae-panel/70 px-2 py-0.5 rounded">
                Композиция · 1920×1080 · {time.toFixed(0)}f
              </div>
              {objects.map((o) => {
                const s = interp(o.keyframes, time);
                if (!s) return null;
                const isSel = o.id === selectedId;
                return (
                  <div
                    key={o.id}
                    onClick={() => setSelectedId(o.id)}
                    className="absolute cursor-pointer transition-shadow"
                    style={{
                      left: `${s.x}%`, top: `${s.y}%`,
                      transform: `translate(-50%,-50%) rotate(${s.rotation}deg) scale(${s.scale})`,
                      opacity: s.opacity,
                    }}
                  >
                    <div
                      className="w-16 h-16 rounded-2xl grid place-items-center font-semibold text-white shadow-lg"
                      style={{ background: `radial-gradient(circle at 30% 30%, ${o.color}, ${o.color}99)`, boxShadow: isSel ? `0 0 0 2px ${o.color}, 0 0 24px ${o.color}66` : `0 8px 24px #0006` }}
                    >
                      <Icon name={o.id === 'obj-1' ? 'Globe' : 'Orbit'} size={26} />
                    </div>
                    {isSel && (
                      <div className="absolute -inset-2 border border-dashed border-ae-blue rounded-2xl pointer-events-none animate-scale-in" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Transport */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-ae-panel/90 backdrop-blur border border-ae-line rounded-full px-2 py-1.5 shadow-xl">
              <TransportBtn icon="SkipBack" onClick={() => setTime(0)} />
              <TransportBtn icon={playing ? 'Pause' : 'Play'} primary onClick={play} />
              <TransportBtn icon="SkipForward" onClick={() => setTime(DURATION)} />
              <span className="font-mono text-[11px] text-muted-foreground px-2">{time.toFixed(0)} / {DURATION}</span>
            </div>
          </section>

          {/* Timeline */}
          <section className="h-64 shrink-0 border-t border-ae-line bg-ae-panel flex flex-col">
            <PanelHeader icon="GanttChartSquare" title="Временная шкала" />
            {/* Ruler */}
            <div className="flex border-b border-ae-line">
              <div className="w-40 shrink-0 border-r border-ae-line" />
              <div
                className="relative flex-1 h-7 cursor-pointer select-none"
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect();
                  setTime(Math.round(((e.clientX - r.left) / r.width) * DURATION));
                }}
              >
                {Array.from({ length: 11 }).map((_, i) => (
                  <div key={i} className="absolute top-0 h-full flex flex-col items-center" style={{ left: `${i * 10}%` }}>
                    <span className="text-[10px] font-mono text-muted-foreground mt-1">{i * 10}</span>
                  </div>
                ))}
                <div className="absolute top-0 bottom-0 w-px bg-ae-blue z-10" style={{ left: `${(time / DURATION) * 100}%` }}>
                  <div className="w-3 h-3 -ml-1.5 -mt-0.5 bg-ae-blue rotate-45 rounded-sm animate-playhead-pulse" />
                </div>
              </div>
            </div>
            {/* Tracks */}
            <div className="flex-1 overflow-y-auto ae-scroll">
              {TRACKS.map((track) => (
                <div key={track.key} className="flex border-b border-ae-line/60 hover:bg-ae-panel-2/50">
                  <div className="w-40 shrink-0 border-r border-ae-line px-3 py-2 flex items-center gap-2 text-muted-foreground">
                    <Icon name={track.icon} size={13} />
                    <span className="text-[12px] truncate">{track.label}</span>
                  </div>
                  <div className="relative flex-1 h-9">
                    {/* interpolation line */}
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-ae-line" />
                    {selected.keyframes.map((kf, i) => {
                      const next = selected.keyframes[i + 1];
                      return (
                        <div key={i}>
                          {next && (
                            <div
                              className="absolute top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-ae-blue/60 to-ae-purple/60"
                              style={{ left: `${(kf.time / DURATION) * 100}%`, width: `${((next.time - kf.time) / DURATION) * 100}%` }}
                            />
                          )}
                          <div
                            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-ae-blue rotate-45 rounded-[2px] hover:scale-125 transition-transform cursor-pointer ring-2 ring-background"
                            style={{ left: `${(kf.time / DURATION) * 100}%` }}
                            title={`Кадр ${kf.time}`}
                          />
                        </div>
                      );
                    })}
                    {/* preview ghost at playhead */}
                    <div className="absolute top-0 bottom-0 w-px bg-ae-blue/40 z-10" style={{ left: `${(time / DURATION) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </main>

        {/* Right: Properties + AI */}
        <aside className="w-72 shrink-0 border-l border-ae-line bg-ae-panel flex flex-col">
          <PanelHeader icon="SlidersHorizontal" title="Свойства объекта" />
          <div className="p-3 space-y-3 border-b border-ae-line">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm" style={{ background: selected.color }} />
              <span className="font-medium">{selected.name}</span>
            </div>
            {selectedState && (
              <div className="space-y-2.5">
                <PropRow label="Позиция X" value={`${selectedState.x.toFixed(1)}%`} pct={selectedState.x} />
                <PropRow label="Позиция Y" value={`${selectedState.y.toFixed(1)}%`} pct={selectedState.y} />
                <PropRow label="Поворот" value={`${selectedState.rotation.toFixed(0)}°`} pct={(selectedState.rotation % 360) / 3.6} />
                <PropRow label="Масштаб" value={`${(selectedState.scale * 100).toFixed(0)}%`} pct={selectedState.scale * 50} />
                <PropRow label="Прозрачность" value={`${(selectedState.opacity * 100).toFixed(0)}%`} pct={selectedState.opacity * 100} />
              </div>
            )}
            <button className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md bg-ae-panel-2 hover:bg-ae-line text-muted-foreground transition-colors">
              <Icon name="Diamond" size={13} /> Добавить ключевой кадр
            </button>
          </div>

          {/* AI generator */}
          <div className="flex-1 flex flex-col min-h-0">
            <PanelHeader icon="Sparkles" title="ИИ-генератор анимации" />
            <div className="p-3 flex flex-col gap-3 flex-1 min-h-0">
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                Опишите движение словами — нейросеть построит ключевые кадры автоматически.
              </p>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Планета плавно облетает по орбите и увеличивается…"
                className="w-full flex-1 min-h-24 resize-none rounded-md bg-background border border-ae-line px-3 py-2 text-[12px] focus:outline-none focus:ring-1 focus:ring-ae-blue placeholder:text-muted-foreground ae-scroll"
              />
              <div className="flex flex-wrap gap-1.5">
                {['Облёт по кругу', 'Плавное появление', 'Пружина'].map((p) => (
                  <button key={p} onClick={() => setAiPrompt(p)} className="text-[11px] px-2 py-1 rounded-full bg-ae-panel-2 text-muted-foreground hover:text-ae-blue hover:bg-ae-blue/10 transition-colors">
                    {p}
                  </button>
                ))}
              </div>
              <button
                onClick={runAI}
                disabled={aiThinking}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md bg-gradient-to-r from-ae-blue to-ae-purple text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {aiThinking ? <Icon name="Loader2" size={15} className="animate-spin" /> : <Icon name="Wand2" size={15} />}
                {aiThinking ? 'Генерирую кадры…' : 'Сгенерировать анимацию'}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Status bar */}
      <footer className="h-6 shrink-0 border-t border-ae-line bg-ae-panel flex items-center px-3 gap-4 text-[11px] font-mono text-muted-foreground">
        <span>FPS 30</span>
        <span>H.264</span>
        <span>Ключевых кадров: {objects.reduce((a, o) => a + o.keyframes.length, 0)}</span>
        <span className="ml-auto flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Готово к рендеру</span>
      </footer>
    </div>
  );
};

const PanelHeader = ({ icon, title, count }: { icon: string; title: string; count?: number }) => (
  <div className="h-8 shrink-0 flex items-center gap-2 px-3 border-b border-ae-line bg-ae-panel-2/50 uppercase text-[10px] tracking-widest text-muted-foreground font-medium">
    <Icon name={icon} size={13} /> {title}
    {count !== undefined && <span className="ml-auto normal-case tracking-normal bg-ae-line px-1.5 rounded text-[10px]">{count}</span>}
  </div>
);

const TransportBtn = ({ icon, primary, onClick }: { icon: string; primary?: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-8 h-8 grid place-items-center rounded-full transition-colors ${primary ? 'bg-ae-blue text-white hover:bg-ae-blue/90' : 'hover:bg-ae-panel-2 text-muted-foreground'}`}
  >
    <Icon name={icon} size={16} />
  </button>
);

const PropRow = ({ label, value, pct }: { label: string; value: string; pct: number }) => (
  <div>
    <div className="flex justify-between text-[11px] mb-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-ae-blue">{value}</span>
    </div>
    <div className="h-1 rounded-full bg-ae-panel-2 overflow-hidden">
      <div className="h-full bg-gradient-to-r from-ae-blue to-ae-purple rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  </div>
);

export default Index;