import { useCallback } from 'react';

const useVoiceDateParser = () => {
  // Mapa de palabras a números
  const NUMBER_MAP = {
    'uno': 1, 'primero': 1, 'un': 1,
    'dos': 2, 'segundo': 2,
    'tres': 3, 'tercero': 3,
    'cuatro': 4, 'cuarto': 4,
    'cinco': 5, 'quinto': 5,
    'seis': 6, 'sexto': 6,
    'siete': 7, 'septimo': 7,
    'ocho': 8, 'octavo': 8,
    'nueve': 9, 'noveno': 9,
    'diez': 10, 'decimo': 10,
    'once': 11,
    'doce': 12,
    'trece': 13,
    'catorce': 14,
    'quince': 15,
    'dieciseis': 16,
    'diecisiete': 17,
    'dieciocho': 18,
    'diecinueve': 19,
    'veinte': 20,
    'veintiuno': 21, 'veintiun': 21,
    'veintidos': 22,
    'veintitres': 23,
    'veinticuatro': 24,
    'veinticinco': 25,
    'veintiseis': 26,
    'veintisiete': 27,
    'veintiocho': 28,
    'veintinueve': 29,
    'treinta': 30,
    'treinta y uno': 31, 'treinta y un': 31
  };

  const MONTH_MAP = {
    'enero': 1,
    'febrero': 2,
    'marzo': 3,
    'abril': 4,
    'mayo': 5,
    'junio': 6,
    'julio': 7,
    'agosto': 8,
    'septiembre': 9, 'setiembre': 9,
    'octubre': 10,
    'noviembre': 11,
    'diciembre': 12
  };

  const parseVoiceDate = useCallback((transcript) => {
    if (!transcript) return null;

    // 1. Normalización y Limpieza
    let cleanText = transcript.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
      // FIX: Separar fechas con barras pegadas (ej: "21/02" -> "21 02") explícitamente antes de quitar puntuación
      .replace(/(\d+)\/(\d+)/g, "$1 $2")
      .replace(/[.,\/]/g, " ") // Quitar puntuación y barras restantes
      .trim();

    // 2. Limpieza de conectores
    cleanText = cleanText
      .replace(/\b(de|del|el|la|los|las|en|al|año)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // 3. Extracción de entidades (Día y Mes)
    let day = null;
    let month = null;
    let year = null; 

    const words = cleanText.split(" ");
    
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        
        // Intentar parsear número (numérico o texto)
        let num = parseInt(word);
        if (isNaN(num)) {
            num = NUMBER_MAP[word];
        }

        // Si es un número
        if (num !== undefined) {
             // Caso especial: Año (ej: 2026, 2025 o '26 si es el tercer componente)
             if (num >= 2000) {
                 year = num;
                 continue;
             }
             
             // Asignación secuencial: Día -> Mes -> Año
             if (!day && num <= 31) {
                 day = num;
             } 
             // Si ya tenemos día, buscamos mes (1-12)
             else if (day && !month && num <= 12) {
                 month = num;
             }
             // Si tenemos día y mes, el siguiente número podría ser el año (ej: 24, 25, 2025)
             else if (day && month && !year) {
                 // Si es un número pequeño (ej: 26), asumimos 2000 + num
                 year = num < 100 ? 2000 + num : num;
             }
             continue;
        }

        // Si es un mes (texto), tiene prioridad para el campo mes
        if (MONTH_MAP[word]) {
            month = MONTH_MAP[word];
            continue;
        }
    }

    // 4. Inferencia y Validación
    if (day && month) {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;

        // Inferencia de año si no se especificó
        if (!year) {
            // Lógica inteligente: Si el mes ya pasó, es para el año siguiente
            if (month < currentMonth) {
                year = currentYear + 1;
            } else {
                year = currentYear;
            }
        }

        // Formato de salida para CustomDateInput
        const dayStr = day.toString().padStart(2, '0');
        const monthStr = month.toString().padStart(2, '0');
        const yearStr = year.toString();
        
        return `${dayStr}${monthStr}${yearStr}`;
    }

    return null;

  }, []);

  return { parseVoiceDate };
};

export default useVoiceDateParser;
