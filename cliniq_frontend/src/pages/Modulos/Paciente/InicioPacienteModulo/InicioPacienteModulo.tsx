import React, { useState } from "react";
import "./InicioPacienteModulo.css";

type Estado = "Solicitada" | "Confirmada" | "Cancelada";

interface Cita {
  id: number;
  fecha: string;
  hora: string;
  medico: string;
  especialidad: string;
  modalidad: "Virtual" | "Presencial";
  estado: Estado;
  linkGoogleMeet?: string;
}

// Datos de ejemplo: luego vendrán de GET /api/citas/mis-citas
const CITAS_INICIALES: Cita[] = [
  { id: 1, fecha: "2026-11-20", hora: "09:30", medico: "Dra. Rojas", especialidad: "Cardiología", modalidad: "Virtual", estado: "Confirmada", linkGoogleMeet: "https://meet.google.com/abc-defg-hij" },
  { id: 2, fecha: "2026-11-25", hora: "15:00", medico: "Dr. Vargas", especialidad: "Medicina general", modalidad: "Presencial", estado: "Confirmada" },
  { id: 3, fecha: "2026-12-02", hora: "Por asignar", medico: "Por asignar", especialidad: "Dermatología", modalidad: "Presencial", estado: "Solicitada" },
];

export const InicioPacienteModulo: React.FC = () => {
  const [citas, setCitas] = useState<Cita[]>(CITAS_INICIALES);

  const cancelar = (id: number) =>
    setCitas((prev) => prev.map((c) => (c.id === id ? { ...c, estado: "Cancelada" } : c)));

  const proxima = citas.find((c) => c.estado === "Confirmada");
  const confirmadas = citas.filter((c) => c.estado === "Confirmada").length;
  const pendientes = citas.filter((c) => c.estado === "Solicitada").length;

  return (
    <div className="pac-page">
      <header className="pac-cabecera">
        <div className="pac-avatar">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M8 3v4M16 3v4M3 10h18" />
          </svg>
        </div>
        <div>
          <h1>Mis Citas</h1>
          <p>Revisa tus próximas atenciones. La coordinación confirma cada solicitud y te asigna médico y horario.</p>
        </div>
      </header>

      <section className="pac-tarjeta">
        <div className="pac-tarjeta-cab">
          <div>
            <h2>Próxima cita</h2>
            <p>Tu siguiente atención confirmada.</p>
          </div>
          <button className="pac-btn">+ Reservar cita</button>
        </div>
        {proxima ? (
          <div className="pac-item pac-item--destacado">
            <div className="pac-fecha">
              <strong>{proxima.fecha.slice(8)}</strong>
              <span>{proxima.hora}</span>
            </div>
            <div className="pac-info">
              <h3>{proxima.medico} <span className="pac-badge">{proxima.modalidad}</span></h3>
              <p>{proxima.especialidad} · {proxima.fecha}</p>
            </div>
            <div className="pac-acciones">
              {proxima.modalidad === "Virtual" && (
                <a className="pac-btn pac-btn--solido" href={proxima.linkGoogleMeet} target="_blank" rel="noreferrer">
                  Unirse a Google Meet
                </a>
              )}
              <button className="pac-btn">Reprogramar</button>
            </div>
          </div>
        ) : (
          <p className="pac-vacio">No tienes citas confirmadas. Reserva una para empezar.</p>
        )}
      </section>

      <div className="pac-grid">
        <section className="pac-tarjeta">
          <div className="pac-tarjeta-cab">
            <div>
              <h2>Todas mis citas</h2>
              <p>Estado de cada solicitud.</p>
            </div>
          </div>
          <div className="pac-lista">
            {citas.map((c) => (
              <div className="pac-item" key={c.id}>
                <div className="pac-info">
                  <h3>{c.especialidad}</h3>
                  <p>{c.medico} · {c.fecha} · {c.hora}</p>
                  <p>{c.modalidad}</p>
                </div>
                <span className={`pac-estado pac-estado--${c.estado.toLowerCase()}`}>{c.estado}</span>
                {c.estado !== "Cancelada" && (
                  <button className="pac-btn pac-btn--peligro" onClick={() => cancelar(c.id)}>
                    Cancelar
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="pac-tarjeta">
          <div className="pac-tarjeta-cab">
            <div>
              <h2>Resumen</h2>
              <p>Tu actividad de citas.</p>
            </div>
          </div>
          <div className="pac-resumen">
            <div className="pac-dato"><span>Confirmadas</span><strong>{confirmadas}</strong></div>
            <div className="pac-dato"><span>Esperando confirmación</span><strong>{pendientes}</strong></div>
            <div className="pac-dato"><span>Total registradas</span><strong>{citas.length}</strong></div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default InicioPacienteModulo;