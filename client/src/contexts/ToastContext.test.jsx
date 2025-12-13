import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToastProvider, useToast } from './ToastContext';
import { render, screen } from '@testing-library/react';

// Mock ToastContainer to avoid rendering real toasts and needing DOM checks for animation etc
vi.mock('../components/ToastContainer', () => ({
  default: ({ toasts, removeToast }) => (
    <div data-testid="toast-container">
      {toasts.map(t => (
        <div key={t.id} data-testid={`toast-${t.message}`} onClick={() => removeToast(t.id)}>
          {t.message}
        </div>
      ))}
    </div>
  )
}));

describe('ToastContext', () => {
    // Helper component to use hook
    const TestComponent = () => {
        const { addToast } = useToast();
        return (
            <button onClick={() => addToast('Test Message', 'success')}>
                Add Toast
            </button>
        );
    };

    it('adds a toast correctly', () => {
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        const btn = screen.getByText('Add Toast');
        act(() => {
            btn.click();
        });

        expect(screen.getByTestId('toast-Test Message')).toBeInTheDocument();
    });

    it('removes a toast correctly', () => {
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        const btn = screen.getByText('Add Toast');
        act(() => {
            btn.click();
        });

        const toast = screen.getByTestId('toast-Test Message');
        expect(toast).toBeInTheDocument();

        // Simulate click on mock calling removeToast
        act(() => {
            toast.click();
        });

        expect(screen.queryByTestId('toast-Test Message')).not.toBeInTheDocument();
    });

    it('limits toasts to 3 (FIFO)', () => {
        // Need to expose internal state or simulate multiple adds
        // We can use renderHook for cleaner testing of logic
        const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>;
        const { result } = renderHook(() => useToast(), { wrapper });

        act(() => {
            result.current.addToast('Msg 1');
            result.current.addToast('Msg 2');
            result.current.addToast('Msg 3');
        });

        // Current verification: We can't access `toasts` directly from useToast if it is not exported.
        // ToastContext.Provider value={{ addToast, removeToast, toasts }}
        // YES, it exports `toasts`!
        
        expect(result.current.toasts).toHaveLength(3);
        expect(result.current.toasts[0].message).toBe('Msg 1');
        expect(result.current.toasts[2].message).toBe('Msg 3');

        // Add 4th
        act(() => {
            result.current.addToast('Msg 4');
        });

        // Should be 3, Msg 1 removed.
        expect(result.current.toasts).toHaveLength(3);
        expect(result.current.toasts[0].message).toBe('Msg 2');
        expect(result.current.toasts[2].message).toBe('Msg 4');
    });
});
