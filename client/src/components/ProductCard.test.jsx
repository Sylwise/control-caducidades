import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProductCard from './ProductCard';

// Mock Lucide icons to avoid issues during render if any
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Box: () => <span data-testid="icon-box">Box</span>,
    Clock: () => <span data-testid="icon-clock">Clock</span>,
    Edit3: () => <span data-testid="icon-edit">Edit</span>,
    Trash2: () => <span data-testid="icon-trash">Trash</span>,
    Package: () => <span data-testid="icon-package">Package</span>,
    History: () => <span data-testid="icon-history">History</span>,
    PackageOpen: () => <span data-testid="icon-package-open">PackageOpen</span>,
  };
});

describe('ProductCard Component', () => {
  const mockProduct = {
    producto: { _id: '123', nombre: 'Test Product', isDirectConsumption: false },
    estado: 'frente-cambia',
    fechaFrente: new Date().toISOString(), // Today
    fechaAlmacen: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    cajasAlmacen: 5,
    updatedAt: new Date().toISOString(),
  };

  const mockHandlers = {
    onProductClick: vi.fn(),
    onUpdateClick: vi.fn(),
    onDeleteClick: vi.fn(),
    isExpiringSoon: vi.fn().mockReturnValue(false),
  };

  it('renders successfully in Card view', () => {
    render(
      <ProductCard
        product={mockProduct}
        isSelected={false}
        {...mockHandlers}
        viewMode="card"
      />
    );
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('renders successfully in Compact view', () => {
    render(
      <ProductCard
        product={mockProduct}
        isSelected={false}
        {...mockHandlers}
        viewMode="compact"
      />
    );
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });
});
