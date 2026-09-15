import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AuthContext from "../../contexts/AuthContext";
import TaskDetailModal from "./TaskDetailModal";
import TaskReasonModal from "./TaskReasonModal";

const actions = vi.hoisted(() => ({ addComment: vi.fn(), completeTask: vi.fn(), cancelTask: vi.fn(), reopenTask: vi.fn() }));
vi.mock("../../contexts/TaskContext", () => ({ useTasks: () => ({ ...actions, isOnline: true }) }));
vi.mock("../../contexts/ToastContext", () => ({ useToast: () => ({ addToast: vi.fn() }) }));
vi.mock("../../hooks/useHardwareBackButton", () => ({ default: () => {} }));
vi.mock("../ModalContainer", () => ({ default: ({ children, title, isOpen }) => isOpen ? <div><h2>{title}</h2>{children}</div> : null }));

const task = {
  _id: "task1", title: "Cámara averiada", type: "averia", priority: "high", dueDate: "2026-10-01T00:00:00.000Z",
  createdBy: { username: "Gerente" }, comments: [],
  activity: [
    { _id: "e1", type: "created", user: { username: "Gerente" }, at: "2026-09-15T12:00:00.000Z" },
    { _id: "e2", type: "completed", user: { username: "Encargado Uno" }, at: "2026-09-15T13:00:00.000Z" },
    { _id: "e3", type: "reopened", user: { username: "Gerente" }, at: "2026-09-15T14:00:00.000Z", reason: "Sigue averiada" },
    { _id: "e4", type: "cancelled", user: { username: "Gerente" }, at: "2026-09-15T15:00:00.000Z", reason: "Duplicada" },
  ],
};
beforeEach(() => {
  vi.clearAllMocks();
  Object.values(actions).forEach((action) => action.mockResolvedValue({}));
});

describe("Task lifecycle UI", () => {
  it.each(["admin", "supervisor", "encargado"].flatMap((role) => ["pending", "completed", "cancelled"].map((status) => [role, status])))(
    "%s sees only allowed actions on %s", (role, status) => {
      render(<AuthContext.Provider value={{ user: { role } }}><TaskDetailModal isOpen onClose={vi.fn()} onEdit={vi.fn()} task={{ ...task, status }} /></AuthContext.Provider>);
      const manager = role !== "encargado";
      const check = (label, allowed) => {
        const button = screen.queryByRole("button", { name: label });
        if (allowed) expect(button).toBeInTheDocument(); else expect(button).not.toBeInTheDocument();
      };
      check("Editar", manager && status === "pending");
      check("Cancelar tarea", manager && status === "pending");
      check("Reabrir tarea", manager && status !== "pending");
      check("Completar", !manager && status === "pending");
      check("Comentar", true);
      expect(screen.queryByTitle("Eliminar tarea")).not.toBeInTheDocument();
    }
  );

  it("renders successive activity with reasons, actors and timestamps", () => {
    render(<AuthContext.Provider value={{ user: { role: "admin" } }}><TaskDetailModal isOpen onClose={vi.fn()} onEdit={vi.fn()} task={{ ...task, status: "cancelled" }} /></AuthContext.Provider>);
    const history = screen.getByRole("region", { name: "Historial de actividad" });
    expect(history).toHaveTextContent("Encargado Uno");
    expect(history).toHaveTextContent("Reabierta");
    expect(history).toHaveTextContent("Motivo: Sigue averiada");
    expect(history).toHaveTextContent("Motivo: Duplicada");
    expect(history.querySelectorAll("li")).toHaveLength(4);
    expect(history.querySelectorAll("time")).toHaveLength(4);
  });

  it("cancel dialog requires and sends a reason", async () => {
    render(<AuthContext.Provider value={{ user: { role: "supervisor" } }}><TaskDetailModal isOpen onClose={vi.fn()} onEdit={vi.fn()} task={{ ...task, status: "pending" }} /></AuthContext.Provider>);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar tarea" }));
    fireEvent.click(screen.getAllByRole("button", { name: "Cancelar tarea" }).at(-1));
    expect(screen.getByRole("alert")).toHaveTextContent("El motivo es obligatorio");
    fireEvent.change(screen.getByLabelText("Motivo breve"), { target: { value: "  Duplicada  " } });
    fireEvent.click(screen.getAllByRole("button", { name: "Cancelar tarea" }).at(-1));
    await waitFor(() => expect(actions.cancelTask).toHaveBeenCalledWith("task1", "Duplicada"));
  });

  it("reopen sends its own reason", async () => {
    render(<AuthContext.Provider value={{ user: { role: "admin" } }}><TaskDetailModal isOpen onClose={vi.fn()} onEdit={vi.fn()} task={{ ...task, status: "completed" }} /></AuthContext.Provider>);
    fireEvent.click(screen.getByRole("button", { name: "Reabrir tarea" }));
    fireEvent.change(screen.getByLabelText("Motivo breve"), { target: { value: "Nueva revisión" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Reabrir tarea" }).at(-1));
    await waitFor(() => expect(actions.reopenTask).toHaveBeenCalledWith("task1", "Nueva revisión"));
  });

  it("offline reason dialog cannot submit", () => {
    const submit = vi.fn();
    render(<TaskReasonModal action="cancel" isOnline={false} onClose={vi.fn()} onSubmit={submit} />);
    expect(screen.getByRole("button", { name: "Cancelar tarea" })).toBeDisabled();
    expect(screen.getByLabelText("Motivo breve")).toBeDisabled();
  });
});
