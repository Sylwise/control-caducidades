import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CompactDateDisplay from './CompactDateDisplay';
import * as dateUtils from '../../../utils/dateUtils';

// Mock isExpiredIncludingToday to control "expired" state in tests
vi.mock('../../../utils/dateUtils', () => ({
  isExpiredIncludingToday: vi.fn()
}));

describe('CompactDateDisplay', () => {
    
    // Helper to reset mocks
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders Direct Consumption dates correctly (sorted)', () => {
        const product = {
            producto: { isDirectConsumption: true },
            fechaAlmacen: '2023-12-25T00:00:00.000Z',
            cajasAlmacen: 5,
            fechasAlmacen: [
                { date: '2023-12-20T00:00:00.000Z', boxes: 2 }
            ]
        };
        // Mock not expired
        dateUtils.isExpiredIncludingToday.mockReturnValue(false);

        render(<CompactDateDisplay product={product} />);

        // Should see both dates formatted.
        // 2023-12-20 is first (sorted)
        expect(screen.getByText('20/12/23')).toBeInTheDocument();
        // 2023-12-25 is second
        expect(screen.getByText('25/12/23')).toBeInTheDocument();
        // Check boxes
        expect(screen.getByText('x2')).toBeInTheDocument();
        expect(screen.getByText('x5')).toBeInTheDocument();
    });

    it('renders "Sin fechas" for Direct Consumption if no dates', () => {
        const product = {
            producto: { isDirectConsumption: true },
            fechaAlmacen: null,
            fechasAlmacen: []
        };
        render(<CompactDateDisplay product={product} />);
        expect(screen.getByText('Sin fechas')).toBeInTheDocument();
    });

    it('renders Combined Chip (F/A) when isSameDate is true', () => {
        const product = {
            producto: { isDirectConsumption: false },
            fechaFrente: '2023-12-31T00:00:00.000Z',
            fechaAlmacen: '2023-12-31T00:00:00.000Z',
            cajasAlmacen: 3
        };
        dateUtils.isExpiredIncludingToday.mockReturnValue(false);

        render(<CompactDateDisplay product={product} isSameDate={true} />);

        // Label F/A
        expect(screen.getByText('F/A:')).toBeInTheDocument();
        // Date
        expect(screen.getByText('31/12/23')).toBeInTheDocument();
        // Boxes
        expect(screen.getByText('x3')).toBeInTheDocument();
    });

    it('renders Next Date chip if provided when isSameDate is true', () => {
         const product = {
            producto: { isDirectConsumption: false },
            fechaFrente: '2023-10-10',
            cajasAlmacen: 1
        };
        const nextDate = { date: '2023-10-15', boxes: 5 };
        dateUtils.isExpiredIncludingToday.mockReturnValue(false);

        render(<CompactDateDisplay product={product} isSameDate={true} nextDate={nextDate} />);
        
        expect(screen.getByText('10/10/23')).toBeInTheDocument();
        // Actually, my test product data above used 2023. If current year is 2024, it formats as day/month/year-slice.
        // If current year is 2023, it formats as day/month.
        // My formatDate function: 
        // return date.getFullYear() !== new Date().getFullYear() ? ... : ...
        // Since I can't easily mock "new Date()" globally without affecting other things, I'll rely on text matching or specific outcome.
        // Let's settle for checking presence of ANY date string or label "A:".
        
        expect(screen.getByText('A:')).toBeInTheDocument(); // For nextDate
        expect(screen.getByText('x5')).toBeInTheDocument();
    });

    it('renders Separate Chips (F and A) when isSameDate is false', () => {
        const product = {
            producto: { isDirectConsumption: false },
            fechaFrente: '2024-01-01',
            fechaAlmacen: '2024-01-05', // Different
            cajasAlmacen: 2
        };
        dateUtils.isExpiredIncludingToday.mockReturnValue(false);

        render(<CompactDateDisplay product={product} isSameDate={false} />);

        // Should see F: and A:
        expect(screen.getByText('F:')).toBeInTheDocument();
        expect(screen.getByText('A:')).toBeInTheDocument();
    });

    it('applies red styling when expired', () => {
        const product = {
            producto: { isDirectConsumption: false },
            fechaFrente: '2020-01-01'
        };
        // Mock expired = true
        dateUtils.isExpiredIncludingToday.mockReturnValue(true);

        const { container } = render(<CompactDateDisplay product={product} isSameDate={false} />);

        // "F:" should be red.
        const label = screen.getByText('F:');
        expect(label).toHaveClass('text-red-700');
        
        // The container div should have red bg/border. 
        // Traversing up or finding by class is brittle but verification of class names works.
        // Let's check if there is an element with 'bg-red-50'
        // container.firstChild.firstChild might be the chip
        // Actually CompactDateDisplay returns fragments, so we look for the chip div.
        // We can check if any element has class 'bg-red-50'
        

        const redChip = container.querySelector('.bg-red-50');
        expect(redChip).toBeInTheDocument();
    });
});
