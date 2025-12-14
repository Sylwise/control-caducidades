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

    // 0. Preparación: Diccionarios extendidos de normalización
    const CLEANING_MAP = [
      { regex: /\b(barra|guion|puntos?)\b/g, replace: ' ' }, // Separadores hablados
      { regex: /\b(del|de|el|la|los|las|en|al|año)\b/g, replace: ' ' }, // Conectores
      { regex: /\s+/g, replace: ' ' }
    ];

    let cleanText = transcript.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Quitar acentos
      .replace(/(\d+)\/(\d+)/g, "$1 $2") // Separar fechas pegadas 21/02
      .replace(/[.,/]/g, " "); // Quitar puntuación

    // 0.1 Aplicar limpieza de separadores hablados
    if (cleanText.includes('barra') || cleanText.includes('guion')) {
        cleanText = cleanText.replace(/\b(barra|guion|punto)\b/g, ' ');
    }
    
    cleanText = cleanText.trim();

    // 1. Detección de Fechas Relativas (Retorno Inmediato)
    const today = new Date();
    // Resetear horas para cálculos limpios
    today.setHours(0,0,0,0);

    const RELATIVE_REGEX = {
      today: /\b(hoy|ahora)\b/,
      tomorrow: /\b(manana)\b/, // sin ñ por normalización
      dayAfterTomorrow: /\b(pasado manana)\b/,
      nextWeek: /\b(semana (que viene|proxima)|en una semana)\b/
    };

    if (RELATIVE_REGEX.today.test(cleanText)) {
      const d = new Date(today);
      return formatDateResult(d);
    }
    if (RELATIVE_REGEX.dayAfterTomorrow.test(cleanText)) {
      const d = new Date(today);
      d.setDate(d.getDate() + 2);
      return formatDateResult(d);
    }
    if (RELATIVE_REGEX.tomorrow.test(cleanText)) {
      const d = new Date(today);
      d.setDate(d.getDate() + 1);
      return formatDateResult(d);
    }
    if (RELATIVE_REGEX.nextWeek.test(cleanText)) {
      const d = new Date(today);
      d.setDate(d.getDate() + 7);
      return formatDateResult(d);
    }

    // 2. Lógica Fuzzy (Fin/Principio de mes) - Detección de intenciones
    let fuzzyMode = null; // 'START', 'MID', 'END'
    if (/\b(fin|finales) de\b/.test(cleanText)) fuzzyMode = 'END';
    else if (/\b(principios?|inicios?|primero) de\b/.test(cleanText)) fuzzyMode = 'START';
    else if (/\b(mediados) de\b/.test(cleanText)) fuzzyMode = 'MID';

    // Limpieza final de texto para extraer entidades base
    cleanText = cleanText
      .replace(/\b(de|del|el|la|los|las|en|al|año|fin|finales|principios|inicios|mediados)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // 3. Extracción de entidades (Día y Mes)
    let day = null;
    let month = null;
    let year = null; 

    // Mapeo inverso de palabras a números si no está el NUMBER_MAP completo aquí... 
    // Usamos el del closure.
    
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
             // Nota: Si estamos en fuzzyMode, ignoramos el día explícito si parece un día pequeño y ya tenemos mes, 
             // pero aquí la lógica es básica. 
             // Mejor: Si hay fuzzyMode y encontramos un número <= 31, ¿es dia o mes?
             // Si hay fuzzy mode, generalmente SOLO buscamos Mes (y tal vez año).
             // Ejemplo "Fin de Enero" -> "Enero".
             
             if (!day && num <= 31 && !fuzzyMode) {
                 day = num;
             } 
             // Si ya tenemos día, buscamos mes (1-12)
             else if ((day || fuzzyMode) && !month && num <= 12) {
                 month = num;
             }
             // Si tenemos día y mes, el siguiente número podría ser el año (ej: 24, 25, 2025)
             else if ((day || fuzzyMode) && month && !year) {
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
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    // Si tenemos mes pero no año, inferimos
    if (month && !year) {
        // Lógica inteligente: Si el mes ya pasó, es para el año siguiente
        // OJO: Si es "finales de enero" y estamos en febrero, es enero del año que viene.
        if (month < currentMonth) {
            year = currentYear + 1;
        } else {
            year = currentYear;
        }
    }

    // Resolver Fuzzy Date
    if (fuzzyMode && month && year) {
        if (fuzzyMode === 'START') day = 1;
        if (fuzzyMode === 'MID') day = 15;
        if (fuzzyMode === 'END') {
            // Último día del mes. Mes en JS Date es 0-indexed.
            // new Date(year, month, 0) da el último día del mes anterior (si month es 1-indexed, month+1 es siguiente, 0 es ultimo dia del mes "month")
            // Espera, new Date(2025, 1, 0) -> 31 Enero 2025. (Mes 1 = Febrero)
            day = new Date(year, month, 0).getDate(); 
        }
    }

    if (day && month && year) {
       return formatDateResult(new Date(year, month - 1, day));
    }

    return null;

  }, []);

  // Helper para devolver formato consistente
  const formatDateResult = (dateObj) => {
      const d = dateObj.getDate().toString().padStart(2, '0');
      const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const y = dateObj.getFullYear();
      return `${d}${m}${y}`;
  };

  return { parseVoiceDate };
};

export default useVoiceDateParser;
