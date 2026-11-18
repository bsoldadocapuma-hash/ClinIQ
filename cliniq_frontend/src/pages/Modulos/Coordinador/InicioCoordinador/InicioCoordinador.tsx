import React, { useState } from "react";
import "./InicioCoordinador.css";

type Prioridad = "Alta" | "Media" | "Baja";
type Estado = "Confirmada" | "Cancelada";

interface Solicitud {
  id: number;
  paciente: string;
  especialidad: string;
  fecha: string;
  prioridad: Prioridad; // sugerida por el triaje IA (solo apoyo logístico)
  modalidad: "Virtual" | "Presencial";
}

interface CitaAgenda {
  id: number;
  hora: string;
  paciente: string;
  medico: string;
  modalidad: "Virtual" | "Presencial";
  estado: Estado;
}

interface Medico {
  nombre: string;
  especialidad: string;
  disponible: boolean;
}

// Datos de ejemplo: luego vendrán de la API (solicitudes, agenda general y médicos)
const MEDICOS: Medico[] = [
  { nombre: "Dra. Rojas", especialidad: "Cardiología", disponible: true },
  { nombre: "Dr. Vargas", especialidad: "Medicina general", disponible: true },
  { nombre: "Dra. Suárez", especialidad: "Dermatología", disponible: false },
  { nombre: "Dr. Molina", especialidad: "Medicina general", disponible: true },
];

const HORAS = ["08:00", "08:30", "09:00", "10:00", "11:30", "15:00"];

const SOLICITUDES_INICIALES: Solicitud[] = [
  { id: 1, paciente: "María Gómez", especialidad: "Cardiología", fecha: "2026-11-18", prioridad: "Alta", modalidad: "Presencial" },
  { id: 2, paciente: "Carlos Pérez", especialidad: "Medicina general", fecha: "2026-11-18", prioridad: "Media", modalidad: "Virtual" },
  { id: 3, paciente: "Lucía Soliz", especialidad: "Dermatología", fecha: "2026-11-19", prioridad: "Baja", modalidad: "Presencial" },
];

const AGENDA_INICIAL: CitaAgenda[] = [
  { id: 101, hora: "08:00", paciente: "Jorge Ríos", medico: "Dr. Vargas", modalidad: "Presencial", estado: "Confirmada" },
  { id: 102, hora: "09:30", paciente: "Ana Flores", medico: "Dra. Rojas", modalidad: "Virtual", estado: "Confirmada" },
];

export const InicioCoordinador: React.FC = () => {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>(SOLICITUDES_INICIALES);
  const [agenda, setAgenda] = useState<CitaAgenda[]>(AGENDA_INICIAL);
  const [seleccion, setSeleccion] = useState<Record<number, { medico: string; hora: string }>>({});
  const [filtroMedico, setFiltroMedico] = useState("");

  const elegir = (id: number, campo: "medico" | "hora", valor: string) =>
    setSeleccion((prev) => {
      const actual = prev[id] ?? { medico: "", hora: "" };
      return { ...prev, [id]: { ...actual, [campo]: valor } };
    });

  const asignar = (s: Solicitud) => {
    const sel = seleccion[s.id];
    if (!sel?.medico || !sel?.hora) return;
    // Aquí iría POST /api/citas (valida solapamiento y genera link de Google Meet si es virtual)
    setAgenda((prev) => [
      ...prev,
      { id: s.id, hora: sel.hora, paciente: s.paciente, medico: sel.medico, modalidad: s.modalidad, estado: "Confirmada" },
    ]);
    setSolicitudes((prev) => prev.filter((x) => x.id !== s.id));
  };

  const rechazar = (id: number) => setSolicitudes((prev) => prev.filter((s) => s.id !== id));

  const cancelar = (id: number) =>
    setAgenda((prev) => prev.map((c) => (c.id === id ? { ...c, estado: "Cancelada" } : c)));

  const agendaVisible = agenda
    .filter((c) => !filtroMedico || c.medico === filtroMedico)
    .sort((a, b) => a.hora.localeCompare(b.hora));

  return (
    <div className="coo-page">
      <header className="coo-cabecera">
        <div className="coo-avatar">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M8 3v4M16 3v4M3 10h18M9 15l2 2 4-4" />
          </svg>
        </div>
        <div>
          <h1>Gestión de Citas</h1>
          <p>Recibe las solicitudes de los pacientes y asígnales médico y horario. Tú confirmas cada cita.</p>
        </div>
      </header>

      <div className="coo-stats">
        <div className="coo-stat"><span>Solicitudes por asignar</span><strong>{solicitudes.length}</strong></div>
        <div className="coo-stat"><span>Citas confirmadas</span><strong>{agenda.filter((c) => c.estado === "Confirmada").length}</strong></div>
        <div className="coo-stat"><span>Médicos disponibles</span><strong>{MEDICOS.filter((m) => m.disponible).length}</strong></div>
        <div className="coo-stat"><span>Canceladas</span><strong>{agenda.filter((c) => c.estado === "Cancelada").length}</strong></div>
      </div>

      <section className="coo-tarjeta">
        <div className="coo-tarjeta-cab">
          <div>
            <h2>Solicitudes por asignar</h2>
            <p>Ordenadas por la prioridad que sugiere el triaje. La decisión final es tuya.</p>
          </div>
        </div>
        <div className="coo-lista">
          {solicitudes.length === 0 && <p className="coo-vacio">No hay solicitudes pendientes.</p>}
          {solicitudes.map((s) => {
            const medicos = MEDICOS.filter((m) => m.disponible && m.especialidad === s.especialidad);
            const sel = seleccion[s.id];
            return (
              <div className="coo-item" key={s.id}>
                <div className="coo-info">
                  <h3>
                    {s.paciente}
                    <span className={`coo-prio coo-prio--${s.prioridad.toLowerCase()}`}>Prioridad {s.prioridad}</span>
                  </h3>
                  <p>{s.especialidad} · {s.modalidad} · Solicita para {s.fecha}</p>
                </div>
                <div className="coo-asignar">
                  <label className="coo-campo">
                    <span>Médico</span>
                    <select value={sel?.medico ?? ""} onChange={(e) => elegir(s.id, "medico", e.target.value)}>
                      <option value="">Seleccionar</option>
                      {medicos.map((m) => <option key={m.nombre} value={m.nombre}>{m.nombre}</option>)}
                    </select>
                  </label>
                  <label className="coo-campo">
                    <span>Hora</span>
                    <select value={sel?.hora ?? ""} onChange={(e) => elegir(s.id, "hora", e.target.value)}>
                      <option value="">Seleccionar</option>
                      {HORAS.map((h) => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </label>
                  <button className="coo-btn coo-btn--solido" disabled={!sel?.medico || !sel?.hora} onClick={() => asignar(s)}>
                    Asignar y confirmar
                  </button>
                  <button className="coo-btn coo-btn--peligro" onClick={() => rechazar(s.id)}>Rechazar</button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="coo-grid">
        <section className="coo-tarjeta">
          <div className="coo-tarjeta-cab">
            <div>
              <h2>Agenda general</h2>
              <p>Todas las citas confirmadas del día.</p>
            </div>
            <label className="coo-campo">
              <span>Filtrar por médico</span>
              <select value={filtroMedico} onChange={(e) => setFiltroMedico(e.target.value)}>
                <option value="">Todos</option>
                {MEDICOS.map((m) => <option key={m.nombre} value={m.nombre}>{m.nombre}</option>)}
              </select>
            </label>
          </div>
          <div className="coo-lista">
            {agendaVisible.map((c) => (
              <div className="coo-item" key={c.id}>
                <div className="coo-hora">{c.hora}</div>
                <div className="coo-info">
                  <h3>{c.paciente}</h3>
                  <p>{c.medico} · {c.modalidad}</p>
                </div>
                <span className={`coo-estado coo-estado--${c.estado.toLowerCase()}`}>{c.estado}</span>
                {c.estado === "Confirmada" && (
                  <>
                    <button className="coo-btn">Reprogramar</button>
                    <button className="coo-btn coo-btn--peligro" onClick={() => cancelar(c.id)}>Cancelar</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="coo-tarjeta">
          <div className="coo-tarjeta-cab">
            <div>
              <h2>Disponibilidad de médicos</h2>
              <p>Según su horario registrado.</p>
            </div>
          </div>
          <div className="coo-lista">
            {MEDICOS.map((m) => (
              <div className="coo-item" key={m.nombre}>
                <div className="coo-info">
                  <h3>{m.nombre}</h3>
                  <p>{m.especialidad}</p>
                </div>
                <span className={`coo-estado ${m.disponible ? "coo-estado--confirmada" : "coo-estado--cancelada"}`}>
                  {m.disponible ? "Disponible" : "No disponible"}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default InicioCoordinador;