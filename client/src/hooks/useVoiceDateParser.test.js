import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import useVoiceDateParser from './useVoiceDateParser';

describe('useVoiceDateParser', () => {
    const { result } = renderHook(() => useVoiceDateParser());
    
    // Mock date to 2025-06-15 (Sunday)
    // Using a fixed date helps testing relative logic
    beforeEach(() => {
        vi.useFakeTimers();
        const date = new Date(2025, 5, 15); // Month is 0-indexed: 5 is June
        vi.setSystemTime(date);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // --- BASE FUNCTIONALITY ---
    it('parses explicit numeric dates correctly', () => {
        expect(result.current.parseVoiceDate('15 06')).toBe('15062025');
        expect(result.current.parseVoiceDate('01 01 2026')).toBe('01012026');
    });

    it('parses spoken months correctly', () => {
        expect(result.current.parseVoiceDate('15 junio')).toBe('15062025');
        expect(result.current.parseVoiceDate('uno de enero')).toBe('01012026'); // Future inferrence (June 2025 -> Jan 2026)
        expect(result.current.parseVoiceDate('dos de mayo del 26')).toBe('02052026');
    });

    // --- RELATIVE DATES ---
    it('parses relative dates', () => {
        const { result: currentResult } = renderHook(() => useVoiceDateParser());
        
        // "Hoy" -> 15/06/2025
        expect(currentResult.current.parseVoiceDate('hoy')).toBe('15062025');
        expect(currentResult.current.parseVoiceDate('caduca hoy')).toBe('15062025');

        // "Mañana" -> 16/06/2025
        expect(currentResult.current.parseVoiceDate('mañana')).toBe('16062025');
        expect(currentResult.current.parseVoiceDate('vence mañana')).toBe('16062025');

        // "Pasado mañana" -> 17/06/2025
        expect(currentResult.current.parseVoiceDate('pasado mañana')).toBe('17062025');
    });

    it('parses week-based relative dates', () => {
       const { result: currentResult } = renderHook(() => useVoiceDateParser());

       // "En una semana" -> 22/06/2025 (15 + 7)
       expect(currentResult.current.parseVoiceDate('en una semana')).toBe('22062025');
       // "La semana que viene"
       expect(currentResult.current.parseVoiceDate('la semana que viene')).toBe('22062025');
    });

    // --- FUZZY DATES (PARTIAL MONTHS) ---
    it('parses start/end of month expressions', () => {
        const { result: currentResult } = renderHook(() => useVoiceDateParser());

        // "Fin de <Mes>" -> Last day of month
        // "Fin de Enero" (Next Jan is 2026) -> 31/01/2026
        expect(currentResult.current.parseVoiceDate('fin de enero')).toBe('31012026');
        
        // "Finales de Junio" (Current month) -> 30/06/2025
        expect(currentResult.current.parseVoiceDate('finales de junio')).toBe('30062025');

        // "Principios de Julio" -> 01/07/2025
        expect(currentResult.current.parseVoiceDate('principios de julio')).toBe('01072025');
        
        // "Mediados de Agosto" -> 15/08/2025
        expect(currentResult.current.parseVoiceDate('mediados de agosto')).toBe('15082025');
    });

    // --- SEPARATORS ---
    it('handles spoken separators', () => {
        const { result: currentResult } = renderHook(() => useVoiceDateParser());

        // "12 barra 05"
        expect(currentResult.current.parseVoiceDate('12 barra 05')).toBe('12052026'); // May 2026 (since May < June)
        
        // "15 guion 08"
        expect(currentResult.current.parseVoiceDate('15 guion 08')).toBe('15082025');
    });
    
    // --- EDGE CASES ---
    it('handles garbage gracefully', () => {
        const { result: currentResult } = renderHook(() => useVoiceDateParser());
        expect(currentResult.current.parseVoiceDate('patata')).toBeNull();
        expect(currentResult.current.parseVoiceDate('')).toBeNull();
    });
});
