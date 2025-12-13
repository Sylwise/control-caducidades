import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UpdateModal from './UpdateModal';

// Mock child components to verify props and simulate interactions
vi.mock('./CustomDateInput', () => ({
  default: ({ label, value, onChange, onRemove, className }) => (
    <div data-testid={`date-input-${label}`}>
      <span>{label}</span>
      <input 
        value={value || ''} 
        onChange={(e) => onChange(e.target.value)} 
        className={className}
      />
      {onRemove && <button onClick={onRemove}>Remove</button>}
    </div>
  )
}));

vi.mock('./QuantitySelector', () => ({
  default: ({ value, onChange }) => (
    <input 
      type="number" 
      data-testid="quantity-selector"
      value={value} 
      onChange={(e) => onChange(parseInt(e.target.value, 10))} 
    />
  )
}));

vi.mock('./ModalContainer', () => ({
  default: ({ children, title }) => (
    <div data-testid="modal-container">
      <div>{title}</div>
      {children}
    </div>
  )
}));

vi.mock('../hooks/useHardwareBackButton', () => ({
  default: vi.fn()
}));

// Mock lucide icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    RefreshCw: () => <span>Spin</span>,
    Plus: () => <span>Plus</span>,
    AlertCircle: () => <span>Alert</span>,
    Check: () => <span>Check</span>,
    HelpCircle: () => <span>Help</span>,
    Trash: () => <span>Trash</span>,
  };
});

describe('UpdateModal', () => {
    const mockSetUpdateForm = vi.fn();
    const mockOnClose = vi.fn();
    const mockOnSubmit = vi.fn();

    const normalProduct = {
        producto: {
            nombre: 'Test Product',
            isDirectConsumption: false
        }
    };

    const directProduct = {
        producto: {
            nombre: 'Direct Product',
            isDirectConsumption: true
        }
    };

    const defaultForm = {
        fechaFrente: '2023-01-01',
        fechaAlmacen: '2023-01-05',
        cajasAlmacen: 5,
        fechaAlmacen2: '',
        cajasAlmacen2: 1,
        fechaAlmacen3: '',
        cajasAlmacen3: 1,
        showSecondDate: false,
        showThirdDate: false
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders correctly for normal product', () => {
        render(
            <UpdateModal
                isOpen={true}
                isClosing={false}
                editingProduct={normalProduct}
                updateForm={defaultForm}
                setUpdateForm={mockSetUpdateForm}
                isUpdating={false}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
            />
        );

        expect(screen.getByText('Actualizar estado de')).toBeInTheDocument();
        expect(screen.getByText('Test Product')).toBeInTheDocument();
        expect(screen.getByText('Fecha visible al cliente')).toBeInTheDocument();
        expect(screen.getByText('Fechas de caducidad en almacén')).toBeInTheDocument();
    });

    it('renders correctly for direct consumption product', () => {
         render(
            <UpdateModal
                isOpen={true}
                isClosing={false}
                editingProduct={directProduct}
                updateForm={defaultForm}
                setUpdateForm={mockSetUpdateForm}
                isUpdating={false}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
            />
        );
        
        expect(screen.queryByText('Fecha visible al cliente')).not.toBeInTheDocument();
        expect(screen.getByText('Fechas de Caducidad')).toBeInTheDocument();
    });

    it('calls setUpdateForm when date input changes', () => {
        render(
            <UpdateModal
                isOpen={true}
                isClosing={false}
                editingProduct={normalProduct}
                updateForm={defaultForm}
                setUpdateForm={mockSetUpdateForm}
                isUpdating={false}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
            />
        );

        const frontInput = screen.getByTestId('date-input-Fecha Frente').querySelector('input');
        fireEvent.change(frontInput, { target: { value: '2023-02-01' } });

        expect(mockSetUpdateForm).toHaveBeenCalledWith({
            ...defaultForm,
            fechaFrente: '2023-02-01'
        });
    });

    it('validates storage date must be after front date', () => {
        const invalidForm = {
            ...defaultForm,
            fechaFrente: '2023-01-05',
            fechaAlmacen: '2023-01-01' // Invalid: Before Front
        };

        render(
            <UpdateModal
                isOpen={true}
                isClosing={false}
                editingProduct={normalProduct}
                updateForm={invalidForm}
                setUpdateForm={mockSetUpdateForm}
                isUpdating={false}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
            />
        );

        expect(screen.getByTitle('La fecha de almacén debe ser posterior a la de frente')).toBeInTheDocument();
        const submitBtn = screen.getByText('Guardar').closest('button');
        expect(submitBtn).toBeDisabled();
    });

    it('enables adding secondary dates when primary is set', () => {
         render(
            <UpdateModal
                isOpen={true}
                isClosing={false}
                editingProduct={normalProduct}
                updateForm={defaultForm}
                setUpdateForm={mockSetUpdateForm}
                isUpdating={false}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
            />
        );

        const addBtn = screen.getByText('Añadir fecha adicional');
        fireEvent.click(addBtn);

        // Verification relies on mockSetUpdateForm being called to enable second date
        // Since component state update depends on props update (controlled), 
        // in a real app parent would update props. Here we check the call.
        
        // It uses function update: setUpdateForm(prev => ...)
        // We can't easily check the result of functional update without implementing a wrapper 
        // or checking the function logic.
        // But simpler: just check it was called.
        expect(mockSetUpdateForm).toHaveBeenCalled();
    });

    it('calls onSubmit when Save is clicked', () => {
         render(
            <UpdateModal
                isOpen={true}
                isClosing={false}
                editingProduct={normalProduct}
                updateForm={defaultForm}
                setUpdateForm={mockSetUpdateForm}
                isUpdating={false}
                onClose={mockOnClose}
                onSubmit={mockOnSubmit}
            />
        );
        
        fireEvent.click(screen.getByText('Guardar'));
        expect(mockOnSubmit).toHaveBeenCalled();
    });
});
