import { useState, useEffect } from 'react';

/**
 * Hook para hacer debounce de un valor
 * Útil para evitar recargas excesivas al escribir en inputs de búsqueda
 * 
 * @param value - Valor a hacer debounce
 * @param delay - Tiempo de espera en milisegundos (default: 500ms)
 * @returns Valor con debounce aplicado
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up el timer
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpiar el timeout si el valor cambia antes de que se cumpla el delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
