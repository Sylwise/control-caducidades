import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { 
    isDateValid, 
    getDaysUntilExpiry, 
    isExpiringSoon, 
    isExpired, 
    isStrictlyExpired, 
    isExpiredIncludingToday 
} from './dateUtils';

describe('dateUtils', () => {
    // Mock system time to ensure consistent results regardless of when tests run
    // Using a fixed date: 2024-01-15 12:00:00
    const MOCK_DATE = new Date('2024-01-15T12:00:00');

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(MOCK_DATE);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('isDateValid', () => {
        it('should return true for valid date strings', () => {
            expect(isDateValid('2024-01-20')).toBe(true);
            expect(isDateValid(new Date())).toBe(true);
        });

        it('should return false for invalid date strings', () => {
            expect(isDateValid('invalid-date')).toBe(false);
            expect(isDateValid('2024-13-45')).toBe(false); // Invalid month/day
            expect(isDateValid(null)).toBe(false);
            expect(isDateValid(undefined)).toBe(false);
            expect(isDateValid('')).toBe(false);
        });

        it('should return false for existing dates slightly before "today" (if function implies future check)', () => {
            // Function implementation checks dates >= today (normalized to midnight)
            // Mock Date is Jan 15. 
            // Jan 14 should be false.
            const yesterday = new Date('2024-01-14T23:59:59');
            expect(isDateValid(yesterday)).toBe(false);
        });

        it('should return true for "today"', () => {
             // Jan 15
             expect(isDateValid('2024-01-15')).toBe(true);
        });
    });

    describe('getDaysUntilExpiry', () => {
        it('should calculate correct days difference', () => {
            // Today is Jan 15. Target Jan 20. Diff = 5 days.
            expect(getDaysUntilExpiry('2024-01-20')).toBe(5);
        });

        it('should return negative for past dates', () => {
            // Target Jan 10. Diff = -5 days.
            expect(getDaysUntilExpiry('2024-01-10')).toBe(-5);
        });

        it('should return 0 for today', () => {
            expect(getDaysUntilExpiry('2024-01-15')).toBe(0);
        });

        it('should return Infinity for null/undefined', () => {
            expect(getDaysUntilExpiry(null)).toBe(Infinity);
        });
    });

    describe('isExpiringSoon (<= 14 days)', () => {
        it('should return true for dates within 14 days', () => {
            // Jan 15 + 14 days = Jan 29.
            expect(isExpiringSoon('2024-01-20')).toBe(true); // 5 days away
            expect(isExpiringSoon('2024-01-29')).toBe(true); // Exactly 14 days away
        });

        it('should return false for dates beyond 14 days', () => {
            expect(isExpiringSoon('2024-01-30')).toBe(false); // 15 days away
        });

        it('should return true for past dates (technically "soon" logic often covers past too)', () => {
             // Logic is: date <= twoWeeksFromNow. Past is < twoWeeksFromNow.
            expect(isExpiringSoon('2024-01-10')).toBe(true);
        });
    });

    describe('isExpired (<= Tomorrow)', () => {
        // Implementation: date <= tomorrow (Jan 16) matches.
        
        it('should return true for past dates', () => {
            expect(isExpired('2024-01-10')).toBe(true);
        });

        it('should return true for today', () => {
            expect(isExpired('2024-01-15')).toBe(true);
        });

        it('should return true for tomorrow', () => {
            expect(isExpired('2024-01-16')).toBe(true);
        });

        it('should return false for day after tomorrow', () => {
            expect(isExpired('2024-01-17')).toBe(false);
        });
    });

    describe('isStrictlyExpired (< Today)', () => {
        it('should return true for yesterday', () => {
            expect(isStrictlyExpired('2024-01-14')).toBe(true);
        });

        it('should return false for today', () => {
            expect(isStrictlyExpired('2024-01-15')).toBe(false);
        });

        it('should return false for future', () => {
            expect(isStrictlyExpired('2024-01-16')).toBe(false);
        });
    });

    describe('isExpiredIncludingToday (<= Today)', () => {
        it('should return true for yesterday', () => {
            expect(isExpiredIncludingToday('2024-01-14')).toBe(true);
        });

        it('should return true for today', () => {
            expect(isExpiredIncludingToday('2024-01-15')).toBe(true);
        });

        it('should return false for tomorrow', () => {
            expect(isExpiredIncludingToday('2024-01-16')).toBe(false);
        });
    });
});
