import { useState, useRef, useCallback, useEffect } from 'react';

const useVoiceInput = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Navegador no soportado. Por favor usa Chrome o Safari.');
      return;
    }

    // Reset state
    setError(null);
    setTranscript('');
    
    // Haptic feedback start
    if (navigator.vibrate) navigator.vibrate(50);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      
      let errorMessage = 'Error al escuchar.';
      if (event.error === 'not-allowed') {
        errorMessage = 'Permiso de micrófono denegado.';
      } else if (event.error === 'no-speech') {
        errorMessage = 'No se escuchó nada.';
      } else if (event.error === 'network') {
        errorMessage = 'Error de red.';
      }
      
      setError(errorMessage);
      // Haptic feedback error
      if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  return {
    isListening,
    transcript,
    error,
    startListening,
    stopListening
  };
};

export default useVoiceInput;
