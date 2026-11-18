"""Generador de un dataset SINTÉTICO de triaje.

⚠ Las etiquetas salen de una fórmula inventada (motivo + intensidad + edad +
enfermedades + reglas de seguridad), NO de casos reales ni de criterio clínico.
Sirve para probar el sistema de punta a punta. Para un modelo de verdad, reemplaza
data/dataset_triaje.csv por casos reales etiquetados por un profesional de salud
(mismas columnas).
"""
from __future__ import annotations

import math
import random
from pathlib import Path

import pandas as pd

from triaje import catalogos as cat
from triaje.dominio.prioridad import gravedad
from triaje.dominio.reglas import prioridad_minima_por_reglas

# Motivos más frecuentes pesan más al muestrear (el resto pesa 1)
COMUNES = {
    "fiebre": 4, "dolor_abdominal": 4, "dolor_cabeza": 4, "tos_garganta": 4,
    "vomitos_diarrea": 3, "resfriado_congestion": 3, "golpe_caida": 3,
    "dolor_pecho": 3, "dificultad_respirar": 3, "herida_sangrado": 2,
    "dolor_espalda": 2, "dolor_articular_muscular": 2, "ardor_urinario": 2,
    "erupcion_piel": 2, "mareo_desmayo": 2, "problema_bebe_nino": 2,
}
SOLO_13_MAS = {"sangrado_vaginal", "dolor_pelvico_menstrual", "molestia_embarazo",
               "infeccion_genital"}
SOLO_ADULTOS = {"presion_azucar_alta", "molestia_embarazo"}
INFECCIOSOS = {"fiebre", "resfriado_congestion", "tos_garganta", "vomitos_diarrea",
               "dolor_oido", "herida_infectada", "problema_bebe_nino",
               "tos_persistente", "ardor_urinario"}
PEDIATRIA = {"medicina_general", "gastroenterologia", "neumologia",
             "otorrinolaringologia", "dermatologia", "neurologia"}
EMBARAZO_GINECO = {"dolor_abdominal", "vomitos_diarrea", "sangrado_vaginal",
                   "dolor_pelvico_menstrual", "molestia_embarazo"}
PREVALENCIA = {"diabetes": .08, "hipertension": .15, "corazon": .06, "asma_epoc": .07,
               "anticoagulantes": .03, "obesidad": .08, "colesterol_alto": .08,
               "tabaquismo": .10, "artritis": .06, "gastritis_ulcera": .07}
ENFERMEDADES_INFANTILES = {"asma_epoc": .05, "epilepsia": .02, "alergia_medicamentos": .03,
                           "anemia": .04}
NIVEL = {"naranja": 1, "amarillo": 2, "verde": 3, "azul": 4}   # índice en ORDEN_PRIORIDAD
# Calibra el reparto de colores (≈ rojo 4 %, naranja 21 %, amarillo 23 %, verde 26 %, azul 26 %)
AJUSTE_GENERAL = 0.8


def _edad(rng, motivo) -> str:
    edades = list(cat.VALORES["edad"])
    pesos = [4, 12, 8, 56, 20]
    if motivo.id == "problema_bebe_nino":
        pesos = [1, 2, 0, 0, 0]
    elif motivo.id in SOLO_ADULTOS:
        pesos = [0, 0, 0, 56, 20]
    elif motivo.id in SOLO_13_MAS:
        pesos = [0, 0, 8, 56, 20]
    return rng.choices(edades, weights=pesos)[0]


def _fila(rng: random.Random) -> dict:
    motivo = rng.choices(cat.MOTIVOS, weights=[COMUNES.get(m.id, 1) for m in cat.MOTIVOS])[0]
    sexo = motivo.sexo or rng.choice(["M", "F"])
    edad = _edad(rng, motivo)

    if sexo == "M" or edad in cat.EDADES_SIN_EMBARAZO:
        embarazo = "no_aplica"
    elif motivo.id == "molestia_embarazo":
        embarazo = "si"
    elif edad == "65_mas":
        embarazo = "no"
    else:
        embarazo = "si" if rng.random() < (0.10 if edad == "18_64" else 0.02) else "no"

    # Señales de alarma (~9 % de los casos tiene alguna)
    alarmas = set()
    if rng.random() < 0.09:
        posibles = [a.id for a in cat.ALARMAS if not a.sexo or a.sexo == sexo]
        alarmas.add(rng.choice(posibles))
        if rng.random() < 0.2:
            alarmas.add(rng.choice(posibles))

    # Enfermedades previas
    enfermedades = set()
    for e in cat.ENFERMEDADES:
        if edad in ("menor_1", "1_12"):
            p = ENFERMEDADES_INFANTILES.get(e.id, 0)
        else:
            p = PREVALENCIA.get(e.id, 0.03) * {"13_17": 0.3, "18_64": 1, "65_mas": 3}[edad]
        if rng.random() < p:
            enfermedades.add(e.id)

    base = NIVEL[motivo.base]
    intensidad = int(min(10, max(0, round(rng.gauss(8.5 - 1.8 * base, 2)))))
    inicio = "de_golpe" if rng.random() < (0.35 if base <= 2 else 0.2) else "poco_a_poco"
    duracion = rng.choices(cat.VALORES["duracion"], weights=[2, 4, 3, 3])[0]
    evolucion = rng.choices(cat.VALORES["evolucion"], weights=[3, 4, 3])[0]

    # Temperatura (opcional)
    informa = rng.random() < (0.9 if motivo.id in INFECCIOSOS else 0.12)
    if informa:
        if motivo.id in ("fiebre", "problema_bebe_nino"):
            t = rng.gauss(38.9, 0.8)
        elif motivo.id in INFECCIOSOS:
            t = rng.gauss(37.8, 0.9)
        else:
            t = rng.gauss(36.7, 0.4)
        temperatura = round(min(41.5, max(35.0, t)), 1)
    else:
        temperatura = math.nan

    fila = {"edad": edad, "sexo": sexo, "embarazo": embarazo,
            "motivo_consulta": motivo.id, "inicio": inicio, "duracion": duracion,
            "evolucion": evolucion, "intensidad": intensidad, "temperatura": temperatura}
    for id_, col in cat.COLUMNA_ALARMA.items():
        fila[col] = int(id_ in alarmas)
    for id_, col in cat.COLUMNA_ENFERMEDAD.items():
        fila[col] = int(id_ in enfermedades)

    # ---- Prioridad: fórmula inventada (1 = naranja ... 4 = azul) ---------------
    g = float(base) + AJUSTE_GENERAL
    g += -0.8 if intensidad >= 8 else (-0.3 if intensidad >= 6 else (0.5 if intensidad <= 2 else 0))
    g += -0.4 if inicio == "de_golpe" else 0
    g += {"empeora": -0.5, "igual": 0.0, "mejora": 0.5}[evolucion]
    g += -0.3 if (duracion == "varios_dias" and evolucion == "empeora") else 0
    g += {"menor_1": -1.0, "1_12": -0.3, "13_17": 0, "18_64": 0, "65_mas": -0.5}[edad]
    if not math.isnan(temperatura):
        g += -0.5 if temperatura >= 39.5 else (-0.2 if temperatura >= 38.5 else 0)
    riesgo = sum(1 for e in cat.ENFERMEDADES if e.riesgo and e.id in enfermedades)
    g -= min(0.9, 0.3 * riesgo)
    g -= 0.4 if embarazo == "si" else 0
    g += rng.gauss(0, 0.35)
    prioridad = cat.ORDEN_PRIORIDAD[min(4, max(1, round(g)))]

    # Las reglas de seguridad nunca se contradicen
    minimo, _ = prioridad_minima_por_reglas(fila)
    if minimo and gravedad(minimo) < gravedad(prioridad):
        prioridad = minimo

    # ---- Área de derivación ----------------------------------------------------
    area = motivo.area
    if edad in ("menor_1", "1_12") and area in PEDIATRIA:
        area = "pediatria"
    if embarazo == "si" and motivo.id in EMBARAZO_GINECO:
        area = "ginecologia"
    if prioridad == "rojo":
        area = "emergencias"
    elif rng.random() < 0.03:
        area = "medicina_general"      # ruido, como en datos reales

    fila[cat.OBJETIVO_PRIORIDAD] = prioridad
    fila[cat.OBJETIVO_AREA] = area
    return fila


def generar_dataframe(filas: int = 4000, semilla: int = 42) -> pd.DataFrame:
    rng = random.Random(semilla)
    datos = [_fila(rng) for _ in range(filas)]
    return pd.DataFrame(datos, columns=cat.FEATURES + cat.OBJETIVOS)


def generar(filas: int, semilla: int, salida: Path) -> None:
    df = generar_dataframe(filas, semilla)
    salida = Path(salida)
    salida.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(salida, index=False)             # temperatura vacía = NaN -> celda vacía
    print(f"Dataset SINTÉTICO guardado en {salida} ({len(df)} filas).")
    print(df[cat.OBJETIVO_PRIORIDAD].value_counts().reindex(cat.ORDEN_PRIORIDAD).to_string())
    print("\nRecuerda: son datos inventados, solo para probar el sistema.")
