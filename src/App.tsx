import React, { useMemo, useState } from "react";

// ====== UI atoms ======
const Progress = ({ value }: { value: number }) => (
  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
    <div className="h-full bg-purple-600 transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl shadow-md bg-white p-6 border border-gray-100 ${className}`}>{children}</div>
);

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">{children}</span>
);

// ====== Helpers ======
const requiredError = "Este campo es obligatorio";
function asArray<T>(v: any): T[] { return Array.isArray(v) ? (v as T[]) : []; }
function multiToggle<T>(arr: T[], item: T, max?: number) {
  const has = arr.includes(item);
  if (has) return arr.filter((x) => x !== item);
  if (max && arr.length >= max) return arr; // respeta máximo
  return [...arr, item];
}
function validateAnswer(q: Question, v: any): string | null {
  if (q.required) {
    if (v === undefined || v === null) return requiredError;
    if (q.type === "text" && String(v).trim().length === 0) return requiredError;
    if (q.type === "select" && String(v).trim() === "") return requiredError;
    if (q.type === "multiselect" && asArray(v).length === 0) return requiredError;
    if (q.type === "imagepick" && String(v).trim() === "") return requiredError;
    if (q.type === "likert" && (typeof v !== "number")) return requiredError;
  }
  if (q.type === "text" && (q as any).minLen && String(v ?? "").trim().length < (q as any).minLen) {
    return `Mínimo ${(q as any).minLen} caracteres`;
  }
  return null;
}

// ====== Preguntas (30) ======
const QUESTION_SET = [
  { id: "nombre", type: "text", label: "¿Cuál es tu nombre completo?", required: true, minLen: 2 },
  { id: "fecha_nacimiento", type: "text", label: "¿Cuál es tu fecha de nacimiento? (DD/MM/AAAA)", required: true },
  { id: "hora_nacimiento", type: "text", label: "¿A qué hora naciste? (si la sabés con precisión)", required: false },
  { id: "lugar_nacimiento", type: "text", label: "¿En qué ciudad y país naciste?", required: true },
  { id: "tema_interes", type: "multiselect", label: "¿Qué temas espirituales te atraen más?", required: true, options: ["Astrología", "Tarot", "Meditación", "Numerología", "Energía y sanación"], max: 3 },
  { id: "lecturas", type: "select", label: "¿Sueles leer sobre astrología o temas esotéricos?", required: true, options: ["Nunca", "A veces", "Con frecuencia", "Todos los días"] },
  { id: "auto_percepcion", type: "likert", label: "Me siento alineado con mi propósito de vida", required: true, min: 1, max: 5 },
  { id: "proposito", type: "text", label: "¿Qué sentís que viniste a aprender o enseñar en esta vida?", required: true, minLen: 10 },
  { id: "relaciones_valor", type: "multiselect", label: "¿Qué valorás más en tus relaciones?", required: true, options: ["Lealtad", "Libertad", "Pasión", "Estabilidad", "Crecimiento personal"], max: 2 },
  { id: "relaciones_estado", type: "select", label: "¿Actualmente estás en pareja?", required: true, options: ["Sí", "No", "Prefiero no responder"] },
  { id: "vocacion", type: "text", label: "¿Cuál es tu vocación o actividad principal?", required: true },
  { id: "trabajo_sentido", type: "likert", label: "Siento que mi trabajo actual está alineado con quien soy", required: true, min: 1, max: 5 },
  { id: "escenario_vital", type: "imagepick", label: "¿Con cuál de estas imágenes de escenarios vitales te identificás más?", required: true, images: [
      { value: "astros", url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&h=450&fit=crop&crop=entropy", label: "Universo y astros" },
      { value: "tarot", url: "https://images.unsplash.com/photo-1606813907291-85ed9f1d32c0?w=600&h=450&fit=crop&crop=entropy", label: "Cartas de tarot" },
      { value: "meditacion", url: "https://images.unsplash.com/photo-1525097487452-6278ff080c31?w=600&h=450&fit=crop&crop=entropy", label: "Meditación interior" },
      { value: "energia", url: "https://images.unsplash.com/photo-1549887534-4b4b6e04f6ea?w=600&h=450&fit=crop&crop=entropy", label: "Energía sutil" }
    ] },
  { id: "emociones", type: "multiselect", label: "¿Qué emociones predominan en tu vida diaria?", required: true, options: ["Alegría", "Ansiedad", "Calma", "Curiosidad", "Pasión"], max: 3 },
  { id: "gestion_emociones", type: "likert", label: "Considero que manejo bien mis emociones", required: true, min: 1, max: 5 },
  { id: "ciclos", type: "select", label: "¿Sentís que tu vida se mueve en ciclos?", required: true, options: ["Sí, claramente", "A veces", "No lo noto"] },
  { id: "epoca_significativa", type: "text", label: "¿Hay una etapa de tu vida que consideres clave o transformadora?", required: false },
  { id: "creencias", type: "select", label: "¿Te identificás con alguna tradición espiritual o religiosa?", required: false, options: ["Ninguna", "Cristianismo", "Budismo", "Hinduismo", "Otro"] },
  { id: "espiritualidad", type: "likert", label: "Siento que la espiritualidad es parte central de mi vida", required: true, min: 1, max: 5 },
  { id: "fortalezas", type: "text", label: "¿Cuáles sentís que son tus mayores fortalezas?", required: true },
  { id: "desafios", type: "text", label: "¿Cuáles son los desafíos más grandes que enfrentás actualmente?", required: true },
  { id: "energia_entorno", type: "select", label: "¿Dónde sentís que fluís mejor?", required: true, options: ["Entornos tranquilos", "Entornos activos", "En soledad", "En compañía"] },
  { id: "expresion", type: "multiselect", label: "¿Cómo te gusta expresarte más?", required: true, options: ["Arte", "Escritura", "Música", "Movimiento corporal", "Diálogo"], max: 2 },
  { id: "bienestar", type: "likert", label: "En general me siento en paz conmigo mismo/a", required: true, min: 1, max: 5 },
  { id: "energia_personal", type: "likert", label: "Siento que tengo energía suficiente para mis proyectos", required: true, min: 1, max: 5 },
  { id: "curiosidad", type: "text", label: "¿Qué tema investigarías por tu cuenta aunque nadie te lo pida?", required: true },
  { id: "futuro", type: "text", label: "¿Cómo imaginás tu vida dentro de 5 años?", required: false },
  { id: "mensaje", type: "text", label: "Si pudieras dejar un mensaje para tu 'yo' futuro, ¿qué le dirías?", required: false }
] as const;

type Question = (typeof QUESTION_SET)[number] & { max?: number; min?: number };

// ====== Mock de devolución astrológica ======
function generateAstroAdvice(answers: Record<string, any>) {
  return {
    resumen: `Con base en tus respuestas y datos de nacimiento, vemos que tu signo solar tiene un rol clave en tu camino de vida.`,
    bullets: [
      `Fecha de nacimiento: ${answers["fecha_nacimiento"] || "—"}`,
      `Nombre: ${answers["nombre"] || "—"}`,
    ],
    consejos: [
      "Explorá cómo la luna influye en tus emociones diarias.",
      "Prestá atención a tus relaciones, que parecen centrales en tu carta.",
    ],
  };
}

// ====== App principal ======
export default function CartaNatalApp() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const total = QUESTION_SET.length;
  const current = QUESTION_SET[step];

  const [email, setEmail] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  const result = useMemo(() => (unlocked ? generateAstroAdvice(answers) : null), [unlocked, answers]);

  const setValue = (id: string, value: any) => {
    setAnswers((a) => ({ ...a, [id]: value }));
    const err = validateAnswer(current as Question, value);
    setErrors((e) => ({ ...e, [id]: err }));
  };

  const onNext = () => {
    const err = validateAnswer(current as Question, answers[current.id]);
    setErrors((e) => ({ ...e, [current.id]: err }));
    if (!err) setStep((s) => Math.min(total, s + 1));
  };

  const onPrev = () => setStep((s) => Math.max(0, s - 1));

  // ---------- Landing ----------
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-100">
        <header className="max-w-5xl mx-auto px-4 py-6 flex flex-col items-center gap-2">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-indigo-500 flex items-center justify-center">
              <span className="text-white text-2xl font-bold">☉</span>
            </div>
          </div>
          <span className="font-semibold text-purple-800 text-xl mt-1">Carta Natal</span>
          <Badge>MVP</Badge>
        </header>

        <main className="max-w-5xl mx-auto px-4 pb-16">
          <section className="text-center pt-2 sm:pt-4 pb-8 sm:pb-14">
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-purple-900">Descubrí tu mapa astral en minutos</h1>
            <p className="mt-4 text-gray-700 max-w-2xl mx-auto">
              Completá las preguntas <strong>formuladas por profesionales de la materia</strong> y recibí un informe personalizado con tus ejes principales (sol, luna, ascendente), interpretaciones por áreas de vida y recomendaciones prácticas.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3 text-sm text-gray-600">
              <span>✔ Informe detallado.</span>
              <span>✔ Envío por email.</span>
              <span>✔ Devolución completa garantizada.</span>
            </div>
            <div className="mt-8">
              <button onClick={() => { setStarted(true); window?.scrollTo?.({ top: 0, behavior: 'smooth' }); }} className="px-6 py-3 rounded-2xl bg-purple-600 text-white shadow hover:shadow-lg">Comenzar test</button>
            </div>
            <p className="mt-4 mb-2 text-sm text-gray-600">⏱️ Toma solo 10-15 minutos • 🔒 Tus información está segura</p>
            <div className="mt-4 mb-6 flex justify-center">
              <Badge>🔮 Verificado por especialistas y profesionales esotericos.</Badge>
            </div>
          </section>

          <section className="grid md:grid-cols-3 gap-4">
            {[{
              title: '¿Qué vas a recibir?',
              points: ['Tu carta natal básica (sol/luna/ascendente).', 'Interpretaciones por relaciones, trabajo, propósito.', 'Consejos prácticos y próximos pasos.']
            }, {
              title: '¿Cómo funciona?',
              points: ['Completás preguntas especialmente formuladas.', 'Obtenés la devolución completa del informe.', 'Recibís todo en tu email.']
            }, {
              title: '¿Para quién es?',
              points: ['Quienes inician en astrología.', 'Personas buscando claridad y enfoque.', 'Quienes quieren conocerse mejor.']
            }].map((block) => (
              <Card key={block.title}>
                <h3 className="text-lg font-semibold mb-2 text-purple-800 text-center">{block.title}</h3>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  {block.points.map((p) => <li key={p}>{p}</li>)}
                </ul>
              </Card>
            ))}
          </section>

          <section className="mt-10">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold text-purple-900">Lo que dicen personas que ya tuvieron su informe completo</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">Experiencias reales de quienes ya recibieron la devolución completa de su carta natal.</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { name: 'Maru R.', text: 'Me encantó la claridad del informe, sentí que me leían el alma.', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&crop=faces', career: 'Astrología en Escuela Holística' },
                { name: 'Jessica P.', text: 'El resumen por áreas me ayudó a ordenar mis prioridades.', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&crop=faces', career: 'Coaching Astrológico' },
                { name: 'Pablo L.', text: 'Fácil, visual y al toque lo tenía en mi mail. Súper recomendado.', photo: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=200&h=200&crop=faces', career: 'Terapia Holística' },
                { name: 'Lucas M.', text: 'Me dio claridad sobre mis talentos y desafíos. Increíble.', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&crop=faces', career: 'Consultoría espiritual' },
                { name: 'Carla F.', text: 'Sentí que por fin entendía mis ciclos vitales.', photo: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&crop=faces', career: 'Psicología Transpersonal' },
                { name: 'Diego S.', text: 'Lo recomiendo a todos los que quieran conocerse mejor.', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&crop=faces', career: 'Investigador en esoterismo' },
              ].map((t) => (
                <Card key={t.name}>
                  <div className="flex gap-4 items-start">
                    <img loading="lazy" src={t.photo} alt={t.name} className="w-14 h-14 rounded-full object-cover" />
                    <div>
                      <div className="flex items-center gap-1 text-yellow-500 text-sm mb-1">{'★★★★★'}</div>
                      <p className="italic text-gray-700 mb-2">“{t.text}”</p>
                      <p className="font-semibold text-gray-800">{t.name}</p>
                      <p className="text-sm text-purple-600">{t.career}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="text-center mt-8">
              <button onClick={() => { setStarted(true); window?.scrollTo?.({ top: 0, behavior: 'smooth' }); }} className="px-6 py-3 rounded-2xl bg-purple-600 text-white shadow hover:shadow-lg">Comenzar test</button>
            </div>
          </section>
        </main>

        <footer className="border-t mt-12">
          <div className="max-w-5xl mx-auto px-4 py-6 text-xs text-gray-500">© {new Date().getFullYear()} Carta Natal ✨ · Este servicio brinda autoconocimiento y no reemplaza asesoramiento profesional</div>
        </footer>
      </div>
    );
  }

  // ---------- Wizard ----------
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-indigo-100 py-10">
      <div className="max-w-3xl mx-auto px-4">
        <div className="mb-4">
          <Progress value={(step / total) * 100} />
          <p className="text-xs text-gray-500 mt-1">Paso {Math.min(step + 1, total)} de {total}</p>
        </div>

        {step < total && (
          <Card>
            <Question q={current as Question} value={answers[current.id]} error={errors[current.id]} onChange={(v:any)=>setValue(current.id,v)} />
            <div className="mt-6 flex justify-between">
              <button onClick={onPrev} disabled={step===0} className="px-4 py-2 rounded-xl border">Atrás</button>
              {step===total-1 ? (
                <button onClick={onNext} className="px-4 py-2 rounded-xl bg-purple-600 text-white">Continuar a tu devolución completa</button>
              ):(
                <button onClick={onNext} className="px-4 py-2 rounded-xl bg-purple-600 text-white">Siguiente</button>
              )}
            </div>
          </Card>
        )}

        {step===total && !unlocked && (
          <Card>
            <h2 className="text-xl font-semibold mb-2">¡Último paso!</h2>
            <p className="text-gray-600 mb-4">Dejanos tu correo y hacé clic para obtener la devolución completa de tu carta natal personalizada.</p>
            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="border rounded p-2 w-full" placeholder="tu@email.com" />
            <button disabled={!/\S+@\S+\.\S+/.test(email)} onClick={()=>setUnlocked(true)} className="mt-3 bg-emerald-600 text-white px-4 py-2 rounded">Obtener la devolución completa</button>
          </Card>
        )}

        {unlocked && result && (
          <Card>
            <h2 className="text-xl font-semibold mb-2">Tu carta natal</h2>
            <p className="mb-3">{result.resumen}</p>
            <ul className="list-disc pl-5 space-y-1 mb-4">
              {result.bullets.map((b,i)=>(<li key={i}>{b}</li>))}
            </ul>
            <div className="bg-purple-50 border border-purple-100 p-4 rounded-xl">
              <p className="font-medium mb-2">Siguientes pasos sugeridos</p>
              <ul className="list-disc pl-5 space-y-1">
                {result.consejos.map((c,i)=>(<li key={i}>{c}</li>))}
              </ul>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ---------- Question renderer ----------
function Question({ q, value, error, onChange }: { q: Question; value: any; error?: string | null; onChange: (v:any)=>void }) {
  const type = (q as any).type as string;
  const options: string[] = (q as any).options ?? [];
  const images: { value: string; url: string; label?: string }[] = (q as any).images ?? [];

  return (
    <div>
      <h3 className="text-lg font-medium mb-3">{q.label}</h3>

      {type === "text" && (
        <textarea className="w-full rounded-xl border px-4 py-2 min-h-[100px]" value={value ?? ''} onChange={(e)=>onChange(e.target.value)} />
      )}

      {type === "select" && (
        <select className="w-full rounded-xl border px-4 py-2" value={value ?? ''} onChange={(e)=>onChange(e.target.value)}>
          <option value="" disabled>Seleccioná una opción</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {type === "multiselect" && (
        <div className="grid sm:grid-cols-2 gap-2">
          {options.map((opt) => {
            const safe = asArray<string>(value);
            const active = safe.includes(opt);
            const toggle = () => onChange(multiToggle(safe, opt, (q as any).max));
            return (
              <button type="button" onClick={toggle} key={opt} className={`text-left px-4 py-2 rounded-xl border ${active ? 'bg-purple-600 text-white border-purple-600' : 'bg-white'}`}>
                {opt}
              </button>
            );
          })}
          {(q as any).max ? <p className="col-span-full text-xs text-gray-500">Elegí hasta {(q as any).max} opciones.</p> : null}
        </div>
      )}

      {type === "imagepick" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((img) => (
            <div key={img.value} className="flex flex-col">
              <button type="button" onClick={() => onChange(img.value)} className={`relative rounded-2xl overflow-hidden border aspect-[4/3] group ${value === img.value ? 'ring-2 ring-purple-600 border-purple-600' : ''}`} title={img.label || img.value}>
                <img
                  loading="lazy"
                  src={img.url}
                  alt={img.label || img.value}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?w=600&h=450&fit=crop&crop=entropy'; }}
                  className="w-full h-full object-cover"
                />
                {value === img.value && (
                  <span className="absolute top-2 right-2 w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center">✓</span>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
              </button>
              <span className="mt-1 text-xs text-gray-600 text-center truncate" title={img.label || img.value}>{img.label || img.value}</span>
            </div>
          ))}
        </div>
      )}

      {type === "likert" && (
        <div className="flex items-center gap-2">
          {Array.from({ length: (q.max ?? 5) - (q.min ?? 1) + 1 }).map((_, i) => {
            const n = (q.min ?? 1) + i;
            return (
              <button type="button" key={n} onClick={() => onChange(n)} className={`w-10 h-10 rounded-full border flex items-center justify-center ${Number(value) === n ? 'bg-purple-600 text-white border-purple-600' : 'bg-white'}`}>
                {n}
              </button>
            );
          })}
          <span className="ml-2 text-sm text-gray-500">1 = nada de acuerdo · 5 = muy de acuerdo</span>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
    </div>
  );
}
