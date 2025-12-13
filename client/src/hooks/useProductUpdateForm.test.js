import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useProductUpdateForm } from './useProductUpdateForm';

describe('useProductUpdateForm', () => {
    const mockHandleUpdateProduct = vi.fn();
    const mockAddToast = vi.fn();
    const mockSetIsUpdateModalOpen = vi.fn();
    const mockSetShowUnclassified = vi.fn();
    const mockSetSearchTerm = vi.fn();
    const mockSetSelectedProduct = vi.fn();
    const mockScrollToProductId = vi.fn();

    const defaultProps = {
        handleUpdateProduct: mockHandleUpdateProduct,
        addToast: mockAddToast,
        setIsUpdateModalOpen: mockSetIsUpdateModalOpen,
        setShowUnclassified: mockSetShowUnclassified,
        setSearchTerm: mockSetSearchTerm,
        setSelectedProduct: mockSetSelectedProduct,
        scrollToProductId: mockScrollToProductId
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('initializes with default state', () => {
        const { result } = renderHook(() => useProductUpdateForm(defaultProps));

        expect(result.current.editingProduct).toBeNull();
        expect(result.current.isUpdating).toBe(false);
        expect(result.current.updateForm).toEqual({
            fechaFrente: "",
            fechaAlmacen: "",
            fechaAlmacen2: "",
            fechaAlmacen3: "",
            cajaUnica: false,
            hayUnicaCajaActual: false,
            showSecondDate: false,
            showThirdDate: false,
        });
    });

    it('prepares form for update correctly', () => {
        const { result } = renderHook(() => useProductUpdateForm(defaultProps));

        const product = {
            fechaFrente: '2023-01-01T00:00:00.000Z',
            fechaAlmacen: '2023-01-05T00:00:00.000Z',
            cajasAlmacen: 5,
            fechasAlmacen: [
                { date: '2023-01-10T00:00:00.000Z', boxes: 2 }
            ],
            estado: 'frente-ok'
        };

        act(() => {
            result.current.prepareFormForUpdate(product);
        });

        expect(result.current.editingProduct).toEqual(product);
        expect(result.current.updateForm.fechaFrente).toBe('2023-01-01');
        expect(result.current.updateForm.fechaAlmacen).toBe('2023-01-05');
        expect(result.current.updateForm.cajasAlmacen).toBe(5);
        
        // Second date extracted from array
        expect(result.current.updateForm.fechaAlmacen2).toBe('2023-01-10');
        expect(result.current.updateForm.cajasAlmacen2).toBe(2);
        expect(result.current.updateForm.showSecondDate).toBe(true);

        expect(mockSetIsUpdateModalOpen).toHaveBeenCalledWith(true);
    });

    it('submits update successfully', async () => {
        const { result } = renderHook(() => useProductUpdateForm(defaultProps));
        
        const product = {
            producto: { _id: '123', nombre: 'Test', isDirectConsumption: false },
            fechaFrente: '2023-01-01T00:00:00.000Z',
            fechaAlmacen: '2023-01-05T00:00:00.000Z'
        };

        // First prepare
        act(() => {
            result.current.prepareFormForUpdate(product);
        });

        // Then modify form slightly
        act(() => {
            result.current.setUpdateForm(prev => ({ ...prev, cajasAlmacen: 10 }));
        });

        mockHandleUpdateProduct.mockResolvedValue(true);

        await act(async () => {
            await result.current.submitUpdate();
        });

        expect(mockHandleUpdateProduct).toHaveBeenCalledWith('123', expect.objectContaining({
             cajasAlmacen: 10
        }));
        
        expect(mockSetIsUpdateModalOpen).toHaveBeenCalledWith(false);
        expect(mockScrollToProductId).toHaveBeenCalledWith('123');
    });

    it('handles validation error (missing front date)', async () => {
        const { result } = renderHook(() => useProductUpdateForm(defaultProps));

        const product = {
            producto: { _id: '123', isDirectConsumption: false },
            fechaFrente: null // Missing
        };

        act(() => {
            result.current.prepareFormForUpdate(product);
        });

        await act(async () => {
             await result.current.submitUpdate();
        });

        expect(mockAddToast).toHaveBeenCalledWith("La fecha de frente es obligatoria.", "error");
        expect(mockHandleUpdateProduct).not.toHaveBeenCalled();
    });
});
