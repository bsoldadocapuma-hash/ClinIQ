import React, { useState, useEffect } from "react";
import "./ReservaCitaIA.css";
import { triajeService } from "../../../../services/triajeService";
import { authService } from "../../../../services/authService";

interface TriajeRegistrado {
  id: string;
  sintoma: string;
  nivel: string;
  colorBadge: string;
  tiempo: string;
}

interface ResultadoVisualIA {
  clasificacion: string;
  color: string;
  recomendacion: string;
}

const CATALOGO_SINTOMAS = [
  "Dolor en el pecho", "Dificultad para respirar", "Fiebre leve", "Dolor de garganta",
  "Corte superficial en el dedo", "Dolor abdominal intenso", "Vómitos",
  "Pérdida de conciencia", "Desmayo", "Tos leve", "Congestión nasal",
  "Dolor de cabeza intenso", "Herida pequeña en la mano", "Dolor torácico intenso",
  "Resfriado", "Fractura de brazo", "Dolor intenso", "Pequeña raspadura en la rodilla",
  "Dificultad respiratoria severa", "Náuseas leves", "Dolor abdominal fuerte",
  "Pequeña herida superficial", "Sudoración", "Rasguño superficial en el brazo",
  "Vómitos persistentes", "Debilidad intensa", "Estornudos", "Dolor moderado en la espalda",
  "Pequeña cortadura en la mano", "Dificultad grave para respirar", "Fiebre",
  "Moretón pequeño en la pierna", "Dificultad para moverse", "Falta de aire",
  "Tos seca", "Pequeña ampolla en el pie", "Fiebre alta", "Labios azulados",
  "Resfriado leve", "Herida superficial en la pierna", "Mareo", "Fiebre moderada",
  "Malestar general", "Dolor leve en la muñeca", "Pulso elevado", "Dolor de cabeza leve",
  "Pequeño corte en el pie", "Dolor intenso en una pierna", "Dificultad para caminar",
  "Dolor torácico", "Secreción nasal", "Pequeña quemadura superficial", "Dolor de cabeza severo",
  "Respiración severamente comprometida", "Rasguño pequeño en la pierna", "Náuseas",
  "Desmayo repentino", "Congestión", "Pequeña herida en el dedo del pie", "Dolor lumbar intenso",
  "Fiebre baja", "Pequeño hematoma en el brazo", "Debilidad", "Corte superficial en la pierna",
  "Alteración visual", "Tos ligera", "Sudoración fría", "Dolor leve de garganta",
  "Raspadura pequeña en la mano", "Dolor fuerte en el hombro", "Respiración irregular",
  "Pequeño corte superficial", "Dificultad respiratoria extrema", "Pequeña herida en la rodilla",
  "Dolor leve", "Respiración dificultosa", "Corte pequeño en un dedo", "Saturación baja",
];

/* ================= ICONOS (línea) ================= */
const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const IcoUser = () => (<Svg><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" /></Svg>);
const IcoSearch = () => (<Svg><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></Svg>);
const IcoPulse = () => (<Svg><path d="M3 12h4l3-8 4 16 3-8h4" /></Svg>);
const IcoSpark = () => (<Svg><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" /></Svg>);
const IcoCheck = () => (<Svg><path d="M20 6L9 17l-5-5" /></Svg>);
const IcoGauge = () => (<Svg><path d="M12 14l4-4" /><path d="M3.3 17a10 10 0 1 1 17.4 0" /></Svg>);
const IcoLayers = () => (<Svg><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></Svg>);
const IcoClock = () => (<Svg><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>);

const Flecha = () => <span className="flow-arrow" aria-hidden="true">→</span>;

/* ================= COMPONENTE ================= */
export const ReservaCitaIA: React.FC = () => {
  const [nombrePaciente, setNombrePaciente] = useState("");
  const [edad, setEdad] = useState("");
  const [frecuenciaCardiaca, setFrecuenciaCardiaca] = useState("");
  const [presionArterial, setPresionArterial] = useState("");
  const [temperatura, setTemperatura] = useState("");
  const [saturacionOxigeno, setSaturacionOxigeno] = useState("");

  const [sintomasSeleccionados, setSintomasSeleccionados] = useState<string[]>([]);
  const [busquedaSintoma, setBusquedaSintoma] = useState("");
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [errorIA, setErrorIA] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoVisualIA | null>(null);
  const [historial, setHistorial] = useState<TriajeRegistrado[]>([]);

  // Precarga el nombre del paciente con sesión iniciada
  useEffect(() => {
    const u = authService.getCurrentUser();
    if (u?.nombre) setNombrePaciente(u.nombre);
  }, []);

  const sugerencias = CATALOGO_SINTOMAS.filter(
    (s) =>
      s.toLowerCase().includes(busquedaSintoma.toLowerCase()) &&
      !sintomasSeleccionados.includes(s)
  );

  const agregarSintoma = (sintoma: string) => {
    setSintomasSeleccionados([...sintomasSeleccionados, sintoma]);
    setBusquedaSintoma("");
    setMostrarDropdown(false);
  };

  const removerSintoma = (sintoma: string) => {
    setSintomasSeleccionados(sintomasSeleccionados.filter((s) => s !== sintoma));
  };

  const handleKeyDownSintoma = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && busquedaSintoma.trim() !== "") {
      e.preventDefault();
      agregarSintoma(busquedaSintoma.trim());
    }
  };

  const handleAnalizar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sintomasSeleccionados.length === 0) {
      setErrorIA("Debe seleccionar al menos un síntoma.");
      return;
    }

    setCargando(true);
    setResultado(null);
    setErrorIA(null);

    try {
      const respuestaIA = await triajeService.evaluarPaciente({
        id_usuario: "USR001",
        sintomas: sintomasSeleccionados,
      });

      const registro = respuestaIA.registro_atencion || {};

      const prioridadReal = registro.prioridad_ia || "Nivel Desconocido";
      const colorReal = registro.color_triaje || "Azul";
      const confianza = registro.score_confianza_ia
        ? `(Precisión: ${(registro.score_confianza_ia * 100).toFixed(1)}%)`
        : "";
      const estadoSugerido = registro.estado_paciente || "Pendiente";
      const areaDerivacion = registro.area_derivacion_sugerida_ia || "Triaje General";

      let colorBadge = "azul";
      const prioColor = String(colorReal).toLowerCase();
      if (prioColor.includes("rojo")) colorBadge = "rojo";
      else if (prioColor.includes("amarillo")) {
        colorBadge = prioridadReal === "Urgente" ? "naranja" : "amarillo";
      } else if (prioColor.includes("verde")) colorBadge = "verde";

      const nivelNumero = registro.nivel_triaje ? `Nivel ${registro.nivel_triaje} - ` : "";

      setResultado({
        clasificacion: `${nivelNumero}${prioridadReal} ${confianza}`,
        color: colorBadge,
        recomendacion: `${estadoSugerido}. Sugerencia: Derivar paciente a ${areaDerivacion}.`,
      });

      setHistorial([
        {
          id: `PAC-${Math.floor(Math.random() * 9000) + 1000}`,
          sintoma: sintomasSeleccionados.join(", "),
          nivel: `${nivelNumero}${prioridadReal}`,
          colorBadge,
          tiempo: "Justo ahora",
        },
        ...historial,
      ]);
      setSintomasSeleccionados([]);
    } catch (err: any) {
      setErrorIA(err.message || "Error de conexión con IA");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="reserva-page">
      {/* ============ CABECERA ============ */}
      <header className="reserva-hero">
        <h2>Reserva de Cita con IA</h2>
        <p>
          Describe tus síntomas y signos vitales. El asistente prioriza tu atención según la{" "}
          <b>Escala Manchester</b> y te sugiere el área de derivación.
        </p>
      </header>

      {/* ============ FLUJO (4 pasos con flechas) ============ */}
      <section className="flow-grid" aria-label="Proceso de reserva">
        <div className="flow-card">
          <div className="flow-icon"><IcoUser /></div>
          <div className="flow-text"><span className="flow-label">Paso 1</span><strong>Confirma tus datos.</strong></div>
        </div>
        <Flecha />
        <div className="flow-card">
          <div className="flow-icon"><IcoSearch /></div>
          <div className="flow-text"><span className="flow-label">Paso 2</span><strong>Indica tus síntomas.</strong></div>
        </div>
        <Flecha />
        <div className="flow-card">
          <div className="flow-icon"><IcoPulse /></div>
          <div className="flow-text"><span className="flow-label">Paso 3</span><strong>Ingresa tus signos vitales.</strong></div>
        </div>
        <Flecha />
        <div className="flow-card">
          <div className="flow-icon"><IcoSpark /></div>
          <div className="flow-text"><span className="flow-label">Paso 4</span><strong>La IA clasifica tu caso.</strong></div>
        </div>
      </section>

      {/* ============ INFO (4 tarjetas) ============ */}
      <section className="flow-grid flow-grid-info" aria-label="Información del módulo">
        <div className="flow-card">
          <div className="flow-icon"><IcoCheck /></div>
          <div className="flow-text"><span className="flow-label">Atendidos hoy</span><strong>48 pacientes.</strong></div>
        </div>
        <div className="flow-card">
          <div className="flow-icon"><IcoGauge /></div>
          <div className="flow-text"><span className="flow-label">Precisión modelo IA</span><strong>98.2% de acierto.</strong></div>
        </div>
        <div className="flow-card">
          <div className="flow-icon"><IcoLayers /></div>
          <div className="flow-text"><span className="flow-label">Escala</span><strong>Manchester de 5 niveles.</strong></div>
        </div>
        <div className="flow-card">
          <div className="flow-icon"><IcoClock /></div>
          <div className="flow-text"><span className="flow-label">Respuesta</span><strong>Resultado en segundos.</strong></div>
        </div>
      </section>

      {/* ============ FORMULARIO + HISTORIAL ============ */}
      <div className="reserva-layout">
        <section className="reserva-panel">
          <div className="panel-head">
            <div className="flow-icon"><IcoPulse /></div>
            <div>
              <h3>Registro y signos vitales</h3>
              <p>Completa el formulario para clasificar tu caso.</p>
            </div>
          </div>

          <form onSubmit={handleAnalizar} onKeyDown={(e) => { if (e.key === "Enter") e.preventDefault(); }}>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Nombre completo del paciente</label>
                <input type="text" value={nombrePaciente} onChange={(e) => setNombrePaciente(e.target.value)} required />
              </div>

              <div className="form-group full-width sintomas-wrap">
                <label>Sintomatología / motivos de consulta</label>
                <div className={`sintomas-input-container ${mostrarDropdown ? "focus" : ""}`}>
                  <div className="sintomas-tags">
                    {sintomasSeleccionados.map((s, idx) => (
                      <span key={idx} className="sintoma-tag">
                        {s} <button type="button" onClick={() => removerSintoma(s)}>&times;</button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    className="sintomas-search"
                    placeholder={sintomasSeleccionados.length === 0 ? "Buscar síntoma (Ej. Fiebre, Dolor...)" : "Añadir otro síntoma..."}
                    value={busquedaSintoma}
                    onChange={(e) => { setBusquedaSintoma(e.target.value); setMostrarDropdown(true); }}
                    onFocus={() => setMostrarDropdown(true)}
                    onBlur={() => setTimeout(() => setMostrarDropdown(false), 200)}
                    onKeyDown={handleKeyDownSintoma}
                  />
                </div>

                {mostrarDropdown && (busquedaSintoma.length > 0 || sugerencias.length > 0) && (
                  <ul className="sintomas-dropdown">
                    {sugerencias.length > 0 ? (
                      sugerencias.map((s, idx) => (
                        <li key={idx} onMouseDown={() => agregarSintoma(s)}>{s}</li>
                      ))
                    ) : (
                      <li className="no-results">
                        Presiona "Enter" para agregar <b>"{busquedaSintoma}"</b> como síntoma personalizado.
                      </li>
                    )}
                  </ul>
                )}
              </div>

              <div className="form-group">
                <label>Edad</label>
                <input type="number" value={edad} onChange={(e) => setEdad(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Saturación O₂ (%)</label>
                <input type="number" value={saturacionOxigeno} onChange={(e) => setSaturacionOxigeno(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Frecuencia cardíaca (LPM)</label>
                <input type="number" value={frecuenciaCardiaca} onChange={(e) => setFrecuenciaCardiaca(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Presión arterial (mmHg)</label>
                <input type="text" placeholder="Ej. 135/85" value={presionArterial} onChange={(e) => setPresionArterial(e.target.value)} />
              </div>
              <div className="form-group full-width">
                <label>Temperatura (°C)</label>
                <input type="number" step="0.1" value={temperatura} onChange={(e) => setTemperatura(e.target.value)} />
              </div>
            </div>

            {errorIA && <div className="error-ia">{errorIA}</div>}

            <button type="submit" className="btn-primary-action" disabled={cargando}>
              {cargando ? "Evaluando con IA..." : "Clasificar y reservar con IA"}
            </button>
          </form>

          {resultado && (
            <div className={`resultado-ia-box nivel-${resultado.color}`}>
              <div className="resultado-ia-header">
                <span className="resultado-ia-title">Resultado de evaluación ClinIQ</span>
                <span className={`badge-prioridad ${resultado.color}`}>{resultado.clasificacion}</span>
              </div>
              <p className="resultado-ia-desc">
                <b>Sugerencia asistida:</b> {resultado.recomendacion}
              </p>
            </div>
          )}
        </section>

        <section className="reserva-panel">
          <div className="panel-head">
            <div className="flow-icon"><IcoClock /></div>
            <div>
              <h3>Mis últimas clasificaciones</h3>
              <p>Resultados de esta sesión.</p>
            </div>
          </div>

          <div className="recent-list">
            {historial.length === 0 && <p className="text-muted">Aún no has realizado ninguna clasificación.</p>}
            {historial.map((item) => (
              <div className="recent-item" key={item.id}>
                <div>
                  <div className="recent-patient-name">{item.sintoma}</div>
                  <div className="recent-patient-desc">{item.id}</div>
                </div>
                <div className="recent-right">
                  <span className={`badge-text ${item.colorBadge}`}>{item.nivel}</span>
                  <div className="recent-time">{item.tiempo}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ReservaCitaIA;