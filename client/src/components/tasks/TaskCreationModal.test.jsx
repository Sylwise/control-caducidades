
/// <reference types="vitest" />
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import TaskCreationModal from "./TaskCreationModal";
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "../../contexts/ToastContext";

// Mock dependencies
vi.mock("../ModalContainer", () => ({
    default: ({ children, title, isOpen, onClose }) => {
        if (!isOpen) return null;
        return (
            <div data-testid="modal-container">
                <h2>{title}</h2>
                <button onClick={onClose}>Close</button>
                {children}
            </div>
        );
    }
}));

vi.mock("../CustomDateInput", () => ({
    default: ({ value, onChange }) => (
        <input 
            data-testid="date-input" 
            value={value ? new Date(value).toISOString() : ""}
            onChange={(e) => onChange(new Date(e.target.value))} 
        />
    )
}));

// Mock TaskContext
const mockCreateTask = vi.fn();
vi.mock("../../contexts/TaskContext", () => ({
    useTasks: () => ({
        createTask: mockCreateTask,
        loading: false,
        error: null,
    })
}));


// Import BackButtonProvider
import { BackButtonProvider } from "../../contexts/BackButtonContext";

const renderModal = (props) => {
    return render(
        <MemoryRouter>
            <BackButtonProvider>
                <ToastProvider>
                    <TaskCreationModal isOnline={true} {...props} />
                </ToastProvider>
            </BackButtonProvider>
        </MemoryRouter>
    );
};

describe("TaskCreationModal", () => {
    // const mockOnSubmit = vi.fn(); // We'll use the hook mock instead or pass onSubmit if component uses it?
    // TaskCreationModal uses onSubmit prop OR internal create?
    // Let's check TaskCreationModal.jsx usage.
    // It calls `onSubmit` prop passed from parent (TasksPage) OR `createTask` from context?
    // In TasksPage it passes `onSubmit={handleCreateTask}`.
    // In TaskCreationModal, let's assume it calls `onSubmit`.
    // Wait, step 225: "onSubmit={handleCreateTask}" in TasksPage.
    // In TaskCreationModal code (Step 221):
    // It accepts `onSubmit` prop.
    
    // So we don't necessarily need to mock `useTasks` if it only uses `onSubmit` prop for saving?
    // But it might use `useTasks` for something else?
    // Step 225 code shows `useTasks` imported in `TasksPage`, but inside `TaskCreationModal`?
    // If `TaskCreationModal` uses `useTasks` internally, we need to mock it.
    // If it relies purely on props, then my previous test failure was due to something else?
    // Ah, previous test didn't even run because of crash in TaskCard test file which is in same suite execution?
    // Or maybe TaskCreationModal imports something that needs TaskProvider.
    
    // Let's safe mock it.
    const mockOnClose = vi.fn();
    const mockOnSubmit = vi.fn(); 

    beforeEach(() => {
        vi.clearAllMocks();
        mockOnSubmit.mockResolvedValue(undefined);
    });

    it("renders correctly when open", () => {
        renderModal({ isOpen: true, onClose: mockOnClose, onSubmit: mockOnSubmit });
        expect(screen.getByText("Nueva Tarea")).toBeInTheDocument();
    });

    it("does not render when closed", () => {
        renderModal({ isOpen: false, onClose: mockOnClose, onSubmit: mockOnSubmit });
        expect(screen.queryByText("Nueva Tarea")).not.toBeInTheDocument();
    });

    it("validates form submission", async () => {
        renderModal({ isOpen: true, onClose: mockOnClose, onSubmit: mockOnSubmit });

        // Submit without filling title
        const submitBtn = screen.getByText("Crear Tarea");
        fireEvent.click(submitBtn);

        expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it("submits data when form is valid", async () => {
        renderModal({ isOpen: true, onClose: mockOnClose, onSubmit: mockOnSubmit });

        // Fill Title
        const titleInput = screen.getByPlaceholderText("Ej: Revisar cámara frigorífica");
        fireEvent.change(titleInput, { target: { value: "New Task" } });

        // Fill Date
        const dateInput = screen.getByTestId("date-input");
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        fireEvent.change(dateInput, { target: { value: tomorrow.toISOString() } });

        // Click create
        const submitBtn = screen.getByText("Crear Tarea");
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
                title: "New Task",
                type: "tarea",
                priority: "medium",
                dueDate: expect.any(Date)
            }));
        });
    });

    it("submits the selected task type", async () => {
        renderModal({ isOpen: true, onClose: mockOnClose, onSubmit: mockOnSubmit });

        fireEvent.change(screen.getByPlaceholderText("Ej: Revisar cámara frigorífica"), {
            target: { value: "Avisar al equipo" },
        });
        fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "aviso" } });
        fireEvent.change(screen.getByTestId("date-input"), {
            target: { value: new Date(Date.now() + 86400000).toISOString() },
        });
        fireEvent.click(screen.getByText("Crear Tarea"));

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({ type: "aviso" }));
        });
    });

    it("disables creation while offline", () => {
        renderModal({ isOpen: true, onClose: mockOnClose, onSubmit: mockOnSubmit, isOnline: false });

        expect(screen.getByText("Crear Tarea")).toBeDisabled();
        expect(screen.getByLabelText("Tipo")).toBeDisabled();
    });

    it("initializes pending task editing and saves changed data", async () => {
        renderModal({ isOpen: true, onClose: mockOnClose, onSubmit: mockOnSubmit,
            initialTask: { _id: "edit-1", title: "Revisar cámara", description: "Fuga", type: "averia", priority: "urgent", dueDate: "2026-10-01T00:00:00.000Z" } });
        expect(screen.getByText("Editar Tarea")).toBeInTheDocument();
        expect(screen.getByLabelText("Tipo")).toHaveValue("averia");
        const input = screen.getByPlaceholderText("Ej: Revisar cámara frigorífica");
        expect(input).toHaveValue("Revisar cámara");
        fireEvent.change(input, { target: { value: "Revisar cámara hoy" } });
        fireEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
        await waitFor(() => expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({ title: "Revisar cámara hoy", type: "averia" })));
    });
});
