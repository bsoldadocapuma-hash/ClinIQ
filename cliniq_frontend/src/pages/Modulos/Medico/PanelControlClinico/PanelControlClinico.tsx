import React, { useState } from "react";
import "./PanelControlClinico.css";

type Estado = "En espera" | "En curso" | "Atendida";
type Prioridad = "Alta" | "Media" | "Baja";

interface CitaMedico {
  id: number;
  hora: string;
  paciente: string;
  motivo: string;
  modalidad: "Virtual" | "Presencial";
  prioridad: Prioridad; // sugerida por el triaje IA (solo apoyo logístico)
  estado: Estado;
  linkGoogleMeet?: string;
}

// Datos de ejemplo: luego vendrán de GET /api/citas/agenda (citas que asignó coordinación)
const AGENDA_INICIAL: CitaMedico[] = [
  { id: 1, hora: "09:00", paciente: "María Gómez", motivo: "Dolor torácico leve", modalidad: "Presencial", prioridad: "Alta", estado: "En espera" },
  { id: 2, hora: "09:30", paciente: "Carlos Pérez", motivo: "Control de hipertensión", modalidad: "Virtual", prioridad: "Media", estado: "En espera", linkGoogleMeet: "https://meet.google.com/abc-defg-hij" },
  { id: 3, hora: "10:30", paciente: "Lucía Soliz", motivo: "Resultados de laboratorio", modalidad: "Virtual", prioridad: "Baja", estado: "En espera", linkGoogleMeet: "https://meet.google.com/klm-nopq-rst" },
];

const HORARIO = [
  { dia: "Lunes", franja: "08:00 – 14:00" },
  { dia: "Miércoles", franja: "08:00 – 14:00" },
  { dia: "Viernes", franja: "14:00 – 20:00" },
];

const ALERTAS = [
  { paciente: "María Gómez", nivel: "Riesgo alto", detalle: "Patrón asociado a riesgo cardiovascular" },
  { paciente: "Jorge Ríos", nivel: "Riesgo medio", detalle: "Antecedentes y controles irregulares" },
];

export const PanelControlClinico: React.FC = () => {
  const [agenda, setAgenda] = useState<CitaMedico[]>(AGENDA_INICIAL);

  const cambiarEstado = (id: number, estado: Estado) =>
    setAgenda((prev) => prev.map((c) => (c.id === id ? { ...c, estado } : c)));

  const total = agenda.length;
  const virtuales = agenda.filter((c) => c.modalidad === "Virtual").length;
  const atendidas = agenda.filter((c) => c.estado === "Atendida").length;

  return (
    <div className="med-page">
      <header className="med-cabecera">
        <div className="med-avatar">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 12h4l3-7 4 14 3-7h4" />
          </svg>
        </div>
        <div>
          <h1>Panel de Control Clínico</h1>
          <p>Tu agenda de hoy. Las citas las asigna la coordinación; la prioridad es una sugerencia del triaje y no un diagnóstico.</p>
        </div>
      </header>

      <div className="med-stats">
        <div className="med-stat"><span>Citas de hoy</span><strong>{total}</strong></div>
        <div className="med-stat"><span>Virtuales</span><strong>{virtuales}</strong></div>
        <div className="med-stat"><span>Atendidas</span><strong>{atendidas}</strong></div>
        <div className="med-stat"><span>Alertas de riesgo</span><strong>{ALERTAS.length}</strong></div>
      </div>

      <div className="med-grid">
        <section className="med-tarjeta">
          <div className="med-tarjeta-cab">
            <div>
              <h2>Agenda de hoy</h2>
              <p>Pacientes asignados a tu horario.</p>
            </div>
          </div>
          <div className="med-lista">
            {agenda.map((c) => (
              <div className={`med-item${c.estado === "En curso" ? " med-item--activo" : ""}`} key={c.id}>
                <div className="med-hora">{c.hora}</div>
                <div className="med-info">
                  <h3>
                    {c.paciente}
                    <span className={`med-prio med-prio--${c.prioridad.toLowerCase()}`}>Prioridad {c.prioridad}</span>
                  </h3>
                  <p>{c.motivo} · {c.modalidad}</p>
                </div>
                <div className="med-acciones">
                  {c.estado === "En espera" && (
                    <button className="med-btn med-btn--solido" onClick={() => cambiarEstado(c.id, "En curso")}>
                      Iniciar consulta
                    </button>
                  )}
                  {c.estado === "En curso" && (
                    <>
                      {c.modalidad === "Virtual" && (
                        <a className="med-btn" href={c.linkGoogleMeet} target="_blank" rel="noreferrer">Google Meet</a>
                      )}
                      <button className="med-btn med-btn--solido" onClick={() => cambiarEstado(c.id, "Atendida")}>
                        Finalizar y emitir receta
                      </button>
                    </>
                  )}
                  {c.estado === "Atendida" && <span className="med-estado">Atendida</span>}
                  <button className="med-btn">Ver expediente</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="med-columna">
          <section className="med-tarjeta">
            <div className="med-tarjeta-cab"><div><h2>Mi horario semanal</h2><p>Disponibilidad registrada.</p></div></div>
            <div className="med-lista">
              {HORARIO.map((h) => (
                <div className="med-dato" key={h.dia}><span>{h.dia}</span><strong>{h.franja}</strong></div>
              ))}
            </div>
          </section>

          <section className="med-tarjeta">
            <div className="med-tarjeta-cab"><div><h2>Alertas de riesgo</h2><p>Apoyo a tu decisión clínica.</p></div></div>
            <div className="med-lista">
              {ALERTAS.map((a) => (
                <div className="med-item med-item--alerta" key={a.paciente}>
                  <div className="med-info">
                    <h3>{a.paciente} <span className="med-prio med-prio--alta">{a.nivel}</span></h3>
                    <p>{a.detalle}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PanelControlClinico;