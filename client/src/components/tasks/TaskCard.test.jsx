
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import TaskCard from "./TaskCard";

import { ToastProvider } from "../../contexts/ToastContext";
import { BrowserRouter } from "react-router-dom";

// Mock hooks
vi.mock("../../hooks/useSocket", () => ({
  useSocket: () => ({ socket: null }),
}));

vi.mock("../../contexts/TaskContext", () => ({
    useTasks: () => ({
        completeTask: vi.fn(),
        deleteTask: vi.fn(),
        tasks: [],
    }),
}));
// Import actual AuthContext (it's safe to use the real context definition)
import AuthContext from "../../contexts/AuthContext";


const mockTask = {
    _id: "task-1",
    title: "Test Task",
    description: "Description of test task",
    priority: "urgent",
    status: "pending",
    dueDate: new Date().toISOString(),
    comments: []
};

const renderWithProviders = (ui) => {
    return render(
        <BrowserRouter>
            <AuthContext.Provider value={{ user: { _id: 'user-1', name: 'Test User' } }}>
                <ToastProvider>
                    {ui}
                </ToastProvider>
            </AuthContext.Provider>
        </BrowserRouter>
    );
};

describe("TaskCard Component", () => {
    it("renders task details correctly", () => {
        renderWithProviders(<TaskCard task={mockTask} />);
        
        expect(screen.getByText("Test Task")).toBeInTheDocument();
        expect(screen.getByText("Description of test task")).toBeInTheDocument();
        expect(screen.getByText("Urgente")).toBeInTheDocument();
    });

    it("renders completed task correctly", () => {
        const completedTask = { ...mockTask, status: "completed" };
        renderWithProviders(<TaskCard task={completedTask} />);

        expect(screen.getByText("Completada")).toBeInTheDocument();
    });

    it("triggers onClick when clicked", () => {
        const handleClick = vi.fn();
        renderWithProviders(<TaskCard task={mockTask} onClick={handleClick} />);

        fireEvent.click(screen.getByText("Test Task"));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    // Note: Testing Complete/Delete button interactions would require mocking TaskContext content more deeply
    // or relying on integration tests. For now, we verify rendering.
});
