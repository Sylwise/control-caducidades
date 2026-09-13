
/// <reference types="vitest" />
import { render, screen, fireEvent } from "@testing-library/react";
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
            value={value ? value.toISOString() : ""} 
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
                    <TaskCreationModal {...props} />
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
        const titleInput = screen.getByPlaceholderText("Ej: Limpiar freidora");
        fireEvent.change(titleInput, { target: { value: "New Task" } });

        // Fill Date
        const dateInput = screen.getByTestId("date-input");
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        fireEvent.change(dateInput, { target: { value: tomorrow.toISOString() } });

        // Click create
        const submitBtn = screen.getByText("Crear Tarea");
        fireEvent.click(submitBtn);

        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
            title: "New Task",
            priority: "medium",
            dueDate: expect.any(Date)
        }));
    });
});
