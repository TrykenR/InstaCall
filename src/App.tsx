import { useEffect, useMemo, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  DATOS — Evaluación de Instagram con el Modelo de Calidad de McCall */
/* ------------------------------------------------------------------ */

const SCALE = [
  { label: "Excelente", value: 4 },
  { label: "Bueno", value: 3 },
  { label: "Regular", value: 2 },
  { label: "Malo", value: 1 },
];

type CapKey = "OPERACIÓN" | "TRANSICIÓN" | "REVISIÓN";

const CAPACITIES: {
  key: CapKey;
  tag: string;
  weight: number;
  obtained: number;
  blurb: string;
}[] = [
  {
    key: "OPERACIÓN",
    tag: "Product Operation",
    weight: 40,
    obtained: 33.7,
    blurb:
      "Cómo se comporta el producto terminado frente al usuario: que haga lo correcto, sin fallas, fácil de usar y protegido.",
  },
  {
    key: "TRANSICIÓN",
    tag: "Product Transition",
    weight: 30,
    obtained: 23.9,
    blurb:
      "Capacidad del software para adaptarse a nuevos entornos, reutilizar componentes y comunicarse con otros sistemas.",
  },
  {
    key: "REVISIÓN",
    tag: "Product Revision",
    weight: 30,
    obtained: 23.8,
    blurb:
      "Qué tan bien resiste el cambio: mantenerlo, extenderlo con nuevas funciones y verificar que todo siga funcionando.",
  },
];

const FACTORS: {
  name: string;
  cap: CapKey;
  weight: number;
  scale: number; // puntaje escalado /10
  avg: number; // promedio /4
}[] = [
  { name: "Corrección", cap: "OPERACIÓN", weight: 10, scale: 9.4, avg: 3.8 },
  { name: "Confiabilidad", cap: "OPERACIÓN", weight: 10, scale: 8.4, avg: 3.4 },
  { name: "Usabilidad", cap: "OPERACIÓN", weight: 10, scale: 8.4, avg: 3.4 },
  { name: "Integridad / Seguridad", cap: "OPERACIÓN", weight: 10, scale: 7.5, avg: 3.0 },
  { name: "Portabilidad", cap: "TRANSICIÓN", weight: 10, scale: 8.1, avg: 3.3 },
  { name: "Reusabilidad", cap: "TRANSICIÓN", weight: 10, scale: 8.3, avg: 3.3 },
  { name: "Interoperabilidad", cap: "TRANSICIÓN", weight: 10, scale: 7.5, avg: 3.0 },
  { name: "Facilidad de Mantenimiento", cap: "REVISIÓN", weight: 10, scale: 8.8, avg: 3.5 },
  { name: "Flexibilidad", cap: "REVISIÓN", weight: 10, scale: 7.5, avg: 3.0 },
  { name: "Facilidad de Prueba", cap: "REVISIÓN", weight: 10, scale: 7.5, avg: 3.0 },
];

const QUESTIONS: {
  metric: string;
  desc: string;
  question: string;
  expected: "Excelente" | "Bueno" | "Regular" | "Malo";
  obtained: "Excelente" | "Bueno" | "Regular" | "Malo";
}[] = [
  {
    metric: "Compleción de las funciones",
    desc: "Grado en que se implementan las funciones para crear y consumir contenido.",
    question:
      "¿Instagram ofrece todas las herramientas necesarias para interactuar y publicar formatos actuales?",
    expected: "Excelente",
    obtained: "Excelente",
  },
  {
    metric: "Complejidad",
    desc: "Complejidad de la interfaz de usuario.",
    question:
      "¿La interfaz es fluida y permite navegar intuitivamente entre el feed, Explore y el perfil?",
    expected: "Excelente",
    obtained: "Bueno",
  },
  {
    metric: "Concisión",
    desc: "Efectividad de la red social.",
    question:
      "¿El algoritmo de recomendación cumple con el objetivo de mostrar contenido relevante?",
    expected: "Excelente",
    obtained: "Excelente",
  },
  {
    metric: "Consistencia",
    desc: "Diseño uniforme de la plataforma.",
    question: "¿El diseño visual se mantiene coherente en todas sus secciones?",
    expected: "Bueno",
    obtained: "Excelente",
  },
  {
    metric: "Eficiencia de ejecución",
    desc: "Rendimiento al cargar contenido multimedia.",
    question:
      "¿La aplicación carga rápidamente los videos en alta definición sin congelarse?",
    expected: "Bueno",
    obtained: "Bueno",
  },
  {
    metric: "Estandarización de datos y estructuras",
    desc: "Manejo estandarizado de métricas e información.",
    question: "¿La plataforma presenta las estadísticas de forma clara y unificada?",
    expected: "Bueno",
    obtained: "Excelente",
  },
  {
    metric: "Exactitud de cálculo y de control",
    desc: "Precisión de los algoritmos y métricas.",
    question:
      "¿Son precisos los contadores de interacciones y se actualizan en tiempo real?",
    expected: "Excelente",
    obtained: "Excelente",
  },
  {
    metric: "Independencia del software",
    desc: "Disponibilidad en distintos sistemas y entornos.",
    question:
      "¿Se pueden utilizar las funciones principales tanto en app móvil como en Web?",
    expected: "Bueno",
    obtained: "Bueno",
  },
  {
    metric: "Modularidad",
    desc: "Independencia funcional de sus servicios.",
    question:
      "¿Las secciones de mensajería (Direct), en vivo (Live) y Reels funcionan bien por separado?",
    expected: "Bueno",
    obtained: "Bueno",
  },
  {
    metric: "Operatividad",
    desc: "Facilidad de creación de contenido.",
    question: "¿Las herramientas nativas de edición son fáciles de operar?",
    expected: "Excelente",
    obtained: "Excelente",
  },
  {
    metric: "Seguridad",
    desc: "Protección de la cuenta y datos del usuario.",
    question:
      "¿Cuenta con opciones robustas de privacidad y herramientas para reportar spam?",
    expected: "Excelente",
    obtained: "Bueno",
  },
  {
    metric: "Simplicidad",
    desc: "Facilidad para configurar y entender la cuenta.",
    question:
      "¿Es sencillo acceder al menú de configuración para gestionar preferencias y privacidad?",
    expected: "Bueno",
    obtained: "Bueno",
  },
];

// Matriz criterio → factor (puntaje 3/4 donde aplica)
const FACTOR_COLS = [
  "Corrección",
  "Confiabilidad",
  "Usabilidad",
  "Integridad",
  "Portabilidad",
  "Reusabilidad",
  "Interoperabilidad",
  "Mantenimiento",
  "Flexibilidad",
  "Prueba",
];

const MATRIX: { metric: string; score: number; cols: number[] }[] = [
  { metric: "Compleción de las funciones", score: 4, cols: [0, 1] },
  { metric: "Complejidad", score: 3, cols: [2, 3, 6] },
  { metric: "Concisión", score: 4, cols: [0] },
  { metric: "Consistencia", score: 4, cols: [0, 2] },
  { metric: "Eficiencia de ejecución", score: 3, cols: [0, 1, 3, 4, 6, 7, 9] },
  { metric: "Estandarización de datos", score: 4, cols: [1, 4, 5, 7] },
  { metric: "Exactitud de cálculo y control", score: 4, cols: [0] },
  { metric: "Independencia del software", score: 3, cols: [1, 3, 4, 5, 6, 8] },
  { metric: "Modularidad", score: 3, cols: [1, 5, 6, 7, 8] },
  { metric: "Operatividad", score: 4, cols: [2, 7] },
  { metric: "Seguridad", score: 3, cols: [2, 3, 9] },
  { metric: "Simplicidad", score: 3, cols: [2, 8, 9] },
];

const TOTAL = 81.4;

/* ------------------------------------------------------------------ */
/*  HELPERS                                                            */
/* ------------------------------------------------------------------ */

const ratingStyle: Record<string, string> = {
  Excelente: "bg-[#14110f] text-[#f4f2ec]",
  Bueno: "bg-transparent text-[#14110f] border border-[#14110f]/40",
  Regular: "bg-[#e8b04b]/25 text-[#7a5410] border border-[#e8b04b]/60",
  Malo: "bg-[#c0392b]/15 text-[#c0392b] border border-[#c0392b]/50",
};

function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setSeen(true),
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, seen };
}

function useCountUp(target: number, run: boolean, ms = 1400) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(target * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, ms]);
  return n;
}

/* ------------------------------------------------------------------ */
/*  SECCIONES                                                          */
/* ------------------------------------------------------------------ */

function ScoreRing() {
  const { ref, seen } = useInView<HTMLDivElement>();
  const val = useCountUp(TOTAL, seen);
  const pct = val / 100;
  const R = 88;
  const C = 2 * Math.PI * R;
  return (
    <div ref={ref} className="relative shrink-0">
      <svg width="220" height="220" viewBox="0 0 220 220" className="-rotate-90">
        <circle cx="110" cy="110" r={R} fill="none" stroke="#14110f" strokeOpacity="0.1" strokeWidth="14" />
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#feda75" />
            <stop offset="35%" stopColor="#fa7e1e" />
            <stop offset="65%" stopColor="#d62976" />
            <stop offset="100%" stopColor="#4f5bd5" />
          </linearGradient>
        </defs>
        <circle
          cx="110"
          cy="110"
          r={R}
          fill="none"
          stroke="url(#ring)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - pct)}
          style={{ transition: "stroke-dashoffset 0.1s linear" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#14110f]/50">
          Puntaje total
        </span>
        <span className="font-mono text-6xl font-extrabold tabular-nums leading-none">
          {val.toFixed(1)}
        </span>
        <span className="font-mono text-sm text-[#14110f]/50">/ 100</span>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <header id="intro" className="scroll-mt-16 border-b border-[#14110f]/15">
      <div className="mx-auto max-w-[1180px] px-6 pt-10 pb-14 lg:px-10">
        <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.3em] text-[#14110f]/55">
          <span className="ig-gradient inline-block h-2.5 w-2.5 rounded-full" />
          Control de Producto (QC) · Modelo de McCall · 1977
        </div>

        <div className="mt-8 grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_auto]">
          <div>
            <h1 className="text-5xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
              Evaluación de calidad de{" "}
              <span className="ig-text">Instagram</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#14110f]/75">
              El modelo utilizado (McCall) es un modelo de evaluación de la calidad
              del software propuesto por McCall, Richards y Walters (1977). Organiza
              la calidad en <strong className="font-semibold">11 factores</strong>,
              agrupados en tres perspectivas:{" "}
              <strong className="font-semibold">operación del producto</strong>,{" "}
              <strong className="font-semibold">revisión del producto</strong> y{" "}
              <strong className="font-semibold">transición del producto</strong>. Su
              propósito es evaluar diferentes características del software mediante
              factores, criterios y métricas de calidad.
            </p>
            <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3 font-mono text-sm">
              {CAPACITIES.map((c) => (
                <div key={c.key} className="flex items-baseline gap-2">
                  <span className="text-[#14110f]/50">{c.key}</span>
                  <span className="font-bold tabular-nums">
                    {c.obtained.toFixed(1)}
                  </span>
                  <span className="text-[#14110f]/40">/ {c.weight}</span>
                </div>
              ))}
            </div>
          </div>
          <ScoreRing />
        </div>
      </div>
    </header>
  );
}

function ScaleLegend() {
  return (
    <section className="border-b border-[#14110f]/15 bg-[#14110f] text-[#f4f2ec]">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-6 px-6 py-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#f4f2ec]/60">
          Tabla de valoración
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {SCALE.map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-3 border-l border-[#f4f2ec]/25 pl-4"
            >
              <span className="font-mono text-3xl font-extrabold ig-text">
                {s.value}
              </span>
              <span className="text-sm uppercase tracking-wide text-[#f4f2ec]/80">
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Capacities() {
  return (
    <section id="capacidades" className="mx-auto max-w-[1180px] scroll-mt-16 px-6 py-20 lg:px-10">
      <SectionHead
        index="01"
        title="Las tres capacidades del producto"
        sub="McCall descompone la calidad genérica en tres capacidades, siempre desde la mirada del usuario."
      />
      <div className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#14110f]/15 bg-[#14110f]/15 md:grid-cols-3">
        {CAPACITIES.map((c) => {
          const pct = (c.obtained / c.weight) * 100;
          return (
            <div key={c.key} className="group bg-[#f4f2ec] p-8 transition-colors hover:bg-[#efe9dd]">
              <div className="flex items-baseline justify-between">
                <h3 className="text-2xl font-extrabold">{c.key}</h3>
                <span className="font-mono text-xs uppercase tracking-widest text-[#14110f]/40">
                  {c.tag}
                </span>
              </div>
              <p className="mt-4 min-h-[96px] text-sm leading-relaxed text-[#14110f]/70">
                {c.blurb}
              </p>
              <div className="mt-6 flex items-end justify-between font-mono">
                <span className="text-4xl font-extrabold tabular-nums">
                  {c.obtained.toFixed(1)}
                </span>
                <span className="text-sm text-[#14110f]/45">peso {c.weight}</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#14110f]/10">
                <div
                  className="ig-gradient h-full rounded-full transition-all duration-1000"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SectionHead({
  index,
  title,
  sub,
}: {
  index: string;
  title: string;
  sub: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-4">
        <span className="font-mono text-sm font-bold text-[#14110f]/35">
          / {index}
        </span>
        <span className="h-px flex-1 bg-[#14110f]/15" />
      </div>
      <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
        {title}
      </h2>
      <p className="mt-3 text-base leading-relaxed text-[#14110f]/65">{sub}</p>
    </div>
  );
}

const CAP_FILTER: (CapKey | "TODAS")[] = ["TODAS", "OPERACIÓN", "TRANSICIÓN", "REVISIÓN"];

function FactorChart() {
  const [filter, setFilter] = useState<(typeof CAP_FILTER)[number]>("TODAS");
  const { ref, seen } = useInView<HTMLDivElement>();
  const rows = useMemo(
    () => (filter === "TODAS" ? FACTORS : FACTORS.filter((f) => f.cap === filter)),
    [filter],
  );
  return (
    <section id="factores" className="scroll-mt-16 border-y border-[#14110f]/15 bg-[#efe9dd]">
      <div className="mx-auto max-w-[1180px] px-6 py-20 lg:px-10">
        <SectionHead
          index="02"
          title="Puntaje escalado por factor"
          sub="Cada factor se evalúa sobre 10. El promedio de sus criterios (sobre 4) se re-escala para obtener la contribución final."
        />

        <div className="mt-10 flex flex-wrap gap-2">
          {CAP_FILTER.map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`font-mono text-xs uppercase tracking-widest transition-all px-4 py-2 rounded-full border ${
                filter === c
                  ? "bg-[#14110f] text-[#f4f2ec] border-[#14110f]"
                  : "border-[#14110f]/25 text-[#14110f]/70 hover:border-[#14110f]/60"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div ref={ref} className="mt-10 space-y-3">
          {rows.map((f, i) => (
            <div
              key={f.name}
              className="grid grid-cols-[1fr] items-center gap-3 sm:grid-cols-[220px_1fr_auto]"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{f.name}</span>
              </div>
              <div className="relative h-8 w-full overflow-hidden rounded-md bg-[#14110f]/8">
                <div
                  className="ig-gradient h-full rounded-md"
                  style={{
                    width: seen ? `${f.scale * 10}%` : "0%",
                    transition: `width 900ms cubic-bezier(.22,1,.36,1) ${i * 70}ms`,
                  }}
                />
                <span className="absolute inset-y-0 right-3 flex items-center font-mono text-[11px] uppercase tracking-widest text-[#14110f]/45">
                  {f.cap}
                </span>
              </div>
              <span className="justify-self-end font-mono text-lg font-bold tabular-nums">
                {f.scale.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Questionnaire() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="cuestionario" className="mx-auto max-w-[1180px] scroll-mt-16 px-6 py-20 lg:px-10">
      <SectionHead
        index="03"
        title="Cuestionario de evaluación"
        sub="Cada métrica se traduce en una pregunta concreta sobre el producto, con un puntaje esperado y el puntaje realmente obtenido."
      />
      <div className="mt-10 divide-y divide-[#14110f]/12 border-y border-[#14110f]/15">
        {QUESTIONS.map((q, i) => {
          const isOpen = open === i;
          const gap = q.expected !== q.obtained;
          return (
            <div key={q.metric}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center gap-4 py-5 text-left transition-colors hover:bg-[#efe9dd]/60"
              >
                <span className="font-mono text-xs tabular-nums text-[#14110f]/35">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="flex-1 text-lg font-semibold">{q.metric}</span>
                <span className="hidden items-center gap-2 sm:flex">
                  <Badge value={q.expected} label="esperado" />
                  <span className="text-[#14110f]/30">→</span>
                  <Badge value={q.obtained} label="obtenido" />
                  {gap && (
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-[#e8b04b]"
                      title="Diferencia entre esperado y obtenido"
                    />
                  )}
                </span>
                <span
                  className={`font-mono text-lg text-[#14110f]/40 transition-transform ${
                    isOpen ? "rotate-45" : ""
                  }`}
                >
                  +
                </span>
              </button>
              <div
                className="grid overflow-hidden transition-all duration-300"
                style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
              >
                <div className="min-h-0">
                  <div className="pb-6 pl-9 pr-4">
                    <p className="text-sm uppercase tracking-wide text-[#14110f]/45">
                      {q.desc}
                    </p>
                    <p className="mt-3 max-w-2xl text-lg leading-relaxed text-[#14110f]/85">
                      “{q.question}”
                    </p>
                    <div className="mt-4 flex gap-2 sm:hidden">
                      <Badge value={q.expected} label="esperado" />
                      <Badge value={q.obtained} label="obtenido" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Badge({ value, label }: { value: string; label: string }) {
  return (
    <span className="inline-flex flex-col items-center">
      <span
        className={`rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-wide ${ratingStyle[value]}`}
      >
        {value}
      </span>
      <span className="mt-1 font-mono text-[9px] uppercase tracking-widest text-[#14110f]/35">
        {label}
      </span>
    </span>
  );
}

function Matrix() {
  return (
    <section id="matriz" className="scroll-mt-16 border-y border-[#14110f]/15 bg-[#14110f] text-[#f4f2ec]">
      <div className="mx-auto max-w-[1180px] px-6 py-20 lg:px-10">
        <div className="max-w-3xl">
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm font-bold text-[#f4f2ec]/40">/ 04</span>
            <span className="h-px flex-1 bg-[#f4f2ec]/20" />
          </div>
          <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
            Criterios de calidad × Factores
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#f4f2ec]/65">
            Un criterio interno puede influir en varios factores externos. La celda
            muestra el puntaje consolidado (sobre 4) con el que cada criterio aporta a
            cada factor.
          </p>
        </div>

        <div className="mt-10 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-[#14110f] px-3 py-3 text-left font-mono text-[11px] uppercase tracking-widest text-[#f4f2ec]/55">
                  Criterio
                </th>
                {FACTOR_COLS.map((f) => (
                  <th
                    key={f}
                    className="whitespace-nowrap px-2 py-3 text-center align-bottom font-mono text-[10px] uppercase tracking-wider text-[#f4f2ec]/55"
                  >
                    <span className="inline-block [writing-mode:vertical-rl] rotate-180">
                      {f}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((row) => (
                <tr key={row.metric} className="border-t border-[#f4f2ec]/10">
                  <td className="sticky left-0 z-10 bg-[#14110f] px-3 py-2.5 font-medium">
                    {row.metric}
                  </td>
                  {FACTOR_COLS.map((_, ci) => {
                    const on = row.cols.includes(ci);
                    return (
                      <td key={ci} className="px-2 py-2.5 text-center">
                        {on ? (
                          <span
                            className={`inline-flex h-7 w-7 items-center justify-center rounded-md font-mono text-xs font-bold tabular-nums ${
                              row.score === 4
                                ? "ig-gradient text-[#14110f]"
                                : "bg-[#f4f2ec]/15 text-[#f4f2ec]"
                            }`}
                          >
                            {row.score}
                          </span>
                        ) : (
                          <span className="text-[#f4f2ec]/12">·</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-[#f4f2ec]/40">
          <span className="ig-text font-bold">4</span> excelente ·{" "}
          <span className="text-[#f4f2ec]/70 font-bold">3</span> bueno
        </p>
      </div>
    </section>
  );
}

function Results() {
  return (
    <section id="resultados" className="mx-auto max-w-[1180px] scroll-mt-16 px-6 py-20 lg:px-10">
      <SectionHead
        index="05"
        title="Resultados de la evaluación"
        sub="Consolidación final: contribución de cada factor a su capacidad y el puntaje global del producto."
      />
      <div className="mt-10 overflow-hidden rounded-xl border border-[#14110f]/15">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#14110f] text-[#f4f2ec]">
            <tr className="font-mono text-[11px] uppercase tracking-widest">
              <th className="px-4 py-3">Capacidad</th>
              <th className="px-4 py-3">Factor</th>
              <th className="px-4 py-3 text-right">Peso</th>
              <th className="px-4 py-3 text-right">Obtenido</th>
              <th className="px-4 py-3 text-right">Capacidad</th>
            </tr>
          </thead>
          <tbody>
            {CAPACITIES.map((cap) => {
              const fs = FACTORS.filter((f) => f.cap === cap.key);
              return fs.map((f, idx) => (
                <tr
                  key={f.name}
                  className="border-t border-[#14110f]/10 hover:bg-[#efe9dd]/70"
                >
                  {idx === 0 && (
                    <td
                      rowSpan={fs.length}
                      className="border-r border-[#14110f]/10 px-4 py-3 align-top font-extrabold"
                    >
                      {cap.key}
                      <span className="mt-1 block font-mono text-xs font-normal text-[#14110f]/45">
                        peso {cap.weight}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-3 font-medium">{f.name}</td>
                  <td className="px-4 py-3 text-right font-mono text-[#14110f]/50">
                    {f.weight}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold tabular-nums">
                    {f.scale.toFixed(1)}
                  </td>
                  {idx === 0 && (
                    <td
                      rowSpan={fs.length}
                      className="border-l border-[#14110f]/10 px-4 py-3 text-right align-middle"
                    >
                      <span className="font-mono text-2xl font-extrabold tabular-nums">
                        {cap.obtained.toFixed(1)}
                      </span>
                      <span className="block font-mono text-xs text-[#14110f]/40">
                        / {cap.weight}
                      </span>
                    </td>
                  )}
                </tr>
              ));
            })}
          </tbody>
          <tfoot>
            <tr className="ig-gradient text-[#14110f]">
              <td colSpan={3} className="px-4 py-4 text-lg font-black uppercase tracking-wide">
                Puntaje total
              </td>
              <td colSpan={2} className="px-4 py-4 text-right">
                <span className="font-mono text-3xl font-black tabular-nums">
                  {TOTAL.toFixed(1)}
                </span>
                <span className="font-mono text-base"> / 100</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        <Insight
          k="Fortaleza"
          title="Corrección — 9.4 / 10"
          body="Instagram implementa de forma completa las funciones para crear y consumir contenido; es su atributo mejor puntuado."
        />
        <Insight
          k="Sólido"
          title="Mantenimiento — 8.8 / 10"
          body="El diseño modular y estandarizado facilita mantener y actualizar la plataforma sin comprometer su estabilidad."
        />
        <Insight
          k="Oportunidad"
          title="Integridad, Interop. y Prueba — 7.5"
          body="Seguridad, interoperabilidad entre entornos y facilidad de prueba son las áreas con mayor margen de mejora."
        />
      </div>
    </section>
  );
}

function Insight({ k, title, body }: { k: string; title: string; body: string }) {
  return (
    <div className="border-t-2 border-[#14110f] pt-5">
      <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-[#14110f]/45">
        {k}
      </span>
      <h4 className="mt-2 text-lg font-extrabold">{title}</h4>
      <p className="mt-2 text-sm leading-relaxed text-[#14110f]/70">{body}</p>
    </div>
  );
}

const REFERENCES = [
  {
    authors: "McCall, J. A., Richards, P. K., & Walters, G. F.",
    year: "1977",
    title: "Factors in software quality",
    detail: "Vols. 1–3. Rome Air Development Center, US Air Force.",
  },
  {
    authors: "Pressman, R. S.",
    year: "2010",
    title: "Software engineering: A practitioner's approach",
    detail: "7.ª ed. McGraw-Hill.",
  },
];

const AUTHORS = [
  "Juan Pablo De Luquez Guerrero",
  "Yorly Enrique Castillo Rojas",
  "Andrés Camilo Gámez Díaz",
];

function Footer() {
  return (
    <footer
      id="referencias"
      className="scroll-mt-16 border-t border-[#14110f]/15 bg-[#14110f] text-[#f4f2ec]"
    >
      <div className="mx-auto max-w-[1180px] px-6 py-16 lg:px-10">
        <p className="max-w-3xl text-lg leading-relaxed">
          La calidad del software no es un concepto abstracto: se descompone en
          factores medibles y se evalúa sistemáticamente. Este informe se centra en el{" "}
          <span className="ig-text font-bold">Control del Producto (QC)</span> —el
          producto final al que accede el usuario— y no en el proceso de desarrollo
          interno (QA).
        </p>

        <div className="mt-14 border-t border-[#f4f2ec]/15 pt-10">
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm font-bold text-[#f4f2ec]/40">/ 06</span>
            <span className="h-px flex-1 bg-[#f4f2ec]/15" />
            <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#f4f2ec]/45">
              Referencias
            </span>
          </div>
          <ol className="mt-8 space-y-6">
            {REFERENCES.map((r, i) => (
              <li key={i} className="flex gap-5 border-l-2 border-[#f4f2ec]/20 pl-5">
                <span className="mt-0.5 shrink-0 font-mono text-sm font-bold tabular-nums text-[#f4f2ec]/30">
                  [{i + 1}]
                </span>
                <p className="text-sm leading-relaxed text-[#f4f2ec]/80">
                  <span className="font-semibold text-[#f4f2ec]">{r.authors}</span>{" "}
                  <span className="text-[#f4f2ec]/50">({r.year}).</span>{" "}
                  <em>{r.title}</em>. {r.detail}
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-14 border-t border-[#f4f2ec]/15 pt-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-[#f4f2ec]/45">
            Autores
          </p>
          <div className="mt-5 grid gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {AUTHORS.map((name, i) => (
              <div key={name} className="flex items-baseline gap-3">
                <span className="font-mono text-xs font-bold tabular-nums text-[#f4f2ec]/30">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-sm font-bold uppercase tracking-[0.15em] text-[#f4f2ec]">
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-2 border-t border-[#f4f2ec]/15 pt-6 font-mono text-xs uppercase tracking-widest text-[#f4f2ec]/45 sm:flex-row sm:items-center sm:justify-between">
          <span>Modelo de McCall, Richards & Walters · 1977</span>
          <span>Evaluación de producto · Instagram · {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}

const NAV = [
  { id: "intro", label: "Introducción" },
  { id: "capacidades", label: "Capacidades" },
  { id: "factores", label: "Factores" },
  { id: "cuestionario", label: "Cuestionario" },
  { id: "matriz", label: "Matriz" },
  { id: "resultados", label: "Resultados" },
  { id: "referencias", label: "Referencias" },
];

function Navbar() {
  const [active, setActive] = useState("intro");
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? Math.min(1, window.scrollY / h) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    NAV.forEach((n) => {
      const el = document.getElementById(n.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const go = (id: string) => {
    setMenu(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        scrolled
          ? "border-[#14110f]/15 bg-[#f4f2ec]/85 backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-6 py-3 lg:px-10">
        <button
          onClick={() => go("intro")}
          className="flex items-center gap-2.5 text-left"
        >
          <span className="ig-gradient inline-block h-5 w-5 rounded-[7px]" />
          <span className="font-mono text-xs font-bold uppercase tracking-[0.2em]">
            McCall<span className="text-[#14110f]/40"> × IG</span>
          </span>
        </button>

        <div className="hidden items-center gap-1 md:flex">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              className={`relative rounded-full px-3.5 py-1.5 text-sm transition-colors ${
                active === n.id
                  ? "text-[#14110f]"
                  : "text-[#14110f]/50 hover:text-[#14110f]"
              }`}
            >
              {active === n.id && (
                <span className="absolute inset-0 rounded-full bg-[#14110f]/8" />
              )}
              <span className="relative">{n.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden font-mono text-sm sm:inline">
            <span className="font-bold tabular-nums">{TOTAL.toFixed(1)}</span>
            <span className="text-[#14110f]/40">/100</span>
          </span>
          <button
            onClick={() => setMenu((m) => !m)}
            aria-label="Menú"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#14110f]/20 md:hidden"
          >
            <span className="font-mono text-lg leading-none">{menu ? "×" : "≡"}</span>
          </button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-transparent">
        <div
          className="ig-gradient h-full origin-left"
          style={{ transform: `scaleX(${progress})`, transition: "transform 0.1s linear" }}
        />
      </div>

      {menu && (
        <div className="border-t border-[#14110f]/12 bg-[#f4f2ec]/95 px-6 py-2 backdrop-blur-md md:hidden">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => go(n.id)}
              className={`block w-full py-2.5 text-left text-base ${
                active === n.id ? "font-bold" : "text-[#14110f]/70"
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <div className="min-h-full w-full">
      <Navbar />
      <Hero />
      <ScaleLegend />
      <Capacities />
      <FactorChart />
      <Questionnaire />
      <Matrix />
      <Results />
      <Footer />
    </div>
  );
}
