import { render, screen, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TaskStats from "./TaskStats";

const tasks = vi.hoisted(() => [
  { status: "pending", dueDate: "2000-01-01" },
  { status: "completed", dueDate: "2000-01-01" },
  { status: "cancelled", dueDate: "2000-01-01" },
]);
vi.mock("../../contexts/TaskContext", () => ({ useTasks: () => ({ tasks }) }));

describe("TaskStats", () => {
  it("does not count cancelled or completed tasks as pending or overdue", () => {
    render(<TaskStats currentFilter="all" onFilterChange={vi.fn()} />);
    for (const label of ["Pendientes", "Vencidas", "Canceladas", "Listas"]) {
      expect(within(screen.getByRole("button", { name: new RegExp(label) })).getByText("1")).toBeInTheDocument();
    }
    expect(within(screen.getByRole("button", { name: /Total/ })).getByText("3")).toBeInTheDocument();
  });
});
