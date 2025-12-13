import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mocks globales
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
    removeAllListeners: vi.fn(),
  })),
}));

// Mock para scrollTo (no existe en jsdom)
Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true });
