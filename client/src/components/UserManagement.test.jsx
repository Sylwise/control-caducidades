import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserManagement from './UserManagement';

// Mocks
vi.mock('../hooks/useSocket', () => ({
  useSocket: () => ({ socket: { on: vi.fn(), off: vi.fn() } })
}));

vi.mock('../contexts/ToastContext', () => ({
  useToast: () => ({ addToast: vi.fn() })
}));

vi.mock('../services/offlineManager', () => ({
  default: { isOfflineMode: false }
}));

vi.mock('../hooks/usePreventScroll', () => ({
  default: vi.fn()
}));
// Mock Hardware Button to avoid issues
vi.mock('../hooks/useHardwareBackButton', () => ({
    default: vi.fn()
}));

// Mock Lucide icons
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Users: () => <span data-testid="icon-users">Users</span>,
    UserPlus: () => <span data-testid="icon-user-plus">UserPlus</span>,
    Trash2: () => <span data-testid="icon-trash">Trash</span>,
    Edit: () => <span data-testid="icon-edit">Edit</span>,
    Eye: () => <span data-testid="icon-eye">Eye</span>,
    EyeOff: () => <span data-testid="icon-eye-off">EyeOff</span>,
    RefreshCw: () => <span data-testid="icon-refresh">Refresh</span>,
    WifiOff: () => <span data-testid="icon-wifi-off">WifiOff</span>,
  };
});

describe('UserManagement Component', () => {
  const mockUser = {
    _id: '123',
    username: 'admin',
    role: 'admin',
    restaurante: { _id: 'res1', nombre: 'Restaurante 1' }
  };

  it('renders correctly when open', () => {
    // Mock fetch for loadUsers
    global.fetch = vi.fn(() => 
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve([mockUser])
        })
    );

    render(
      <UserManagement
        isOpen={true}
        onClose={vi.fn()}
        currentUser={mockUser}
      />
    );

    expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <UserManagement
        isOpen={false}
        onClose={vi.fn()}
        currentUser={mockUser}
      />
    );
    // ModalContainer usually uses portals or renders null if !isOpen. 
    // Assuming standard implementation where content isn't visible.
    // However, UserManagement uses ModalContainer which might render a portal.
    // Let's check if the specific content "Gestión de Usuarios" is absent.
    expect(screen.queryByText('Gestión de Usuarios')).not.toBeInTheDocument();
  });
});
