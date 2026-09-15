import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AuthContext from "./AuthContext";
import { TaskProvider, useTasks } from "./TaskContext";

const mocks = vi.hoisted(() => ({
  http: { getTasks: vi.fn(), completeTask: vi.fn(), createTask: vi.fn(), updateTask: vi.fn(), cancelTask: vi.fn(), reopenTask: vi.fn(), addTaskComment: vi.fn() },
  handlers: new Map(),
}));
vi.mock("../services/api", () => ({ http: mocks.http }));
vi.mock("./ToastContext", () => ({ useToast: () => ({ addToast: vi.fn() }) }));
const socket = {
  on: (name, handler) => mocks.handlers.set(name, handler),
  off: (name, handler) => { if (mocks.handlers.get(name) === handler) mocks.handlers.delete(name); },
};
vi.mock("../hooks/useSocket", () => ({ useSocket: () => ({ socket }) }));
const user = { _id: "user1", role: "encargado", restaurante: { _id: "restaurant1" } };
const Consumer = () => {
  const { tasks, completeTask, isOnline, error } = useTasks();
  return <><div data-testid="tasks">{tasks.map((task) => `${task.title}:${task.status}`).join(",")}</div>
    <div data-testid="online">{String(isOnline)}</div><div>{error}</div>
    <button onClick={() => completeTask("task1").catch(() => {})}>Complete</button></>;
};
const mount = () => render(<AuthContext.Provider value={{ user }}><TaskProvider><Consumer /></TaskProvider></AuthContext.Provider>);
const setOnline = (online) => Object.defineProperty(navigator, "onLine", { configurable: true, value: online });
beforeEach(() => {
  vi.clearAllMocks(); mocks.handlers.clear(); setOnline(true);
  mocks.http.getTasks.mockResolvedValue([]);
});

describe("TaskContext wiring (not a real Socket.IO integration)", () => {
  it("reloads on socket connect without a prior offline event and cleans listeners", async () => {
    const view = mount();
    await waitFor(() => expect(mocks.http.getTasks).toHaveBeenCalledTimes(1));
    mocks.http.getTasks.mockResolvedValue([{ _id: "task1", title: "Server task", status: "pending" }]);
    await act(async () => { mocks.handlers.get("connect")(); });
    await waitFor(() => expect(screen.getByTestId("tasks")).toHaveTextContent("Server task"));
    expect(mocks.http.getTasks).toHaveBeenCalledTimes(2);
    view.unmount();
    expect(mocks.handlers.size).toBe(0);
  });

  it("reloads on browser online even when already online", async () => {
    mount();
    await waitFor(() => expect(mocks.http.getTasks).toHaveBeenCalledTimes(1));
    await act(async () => { window.dispatchEvent(new Event("online")); });
    expect(mocks.http.getTasks).toHaveBeenCalledTimes(2);
  });

  it("clears offline and ignores an older in-flight response", async () => {
    let resolve;
    mocks.http.getTasks.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    mount();
    await waitFor(() => expect(resolve).toBeTypeOf("function"));
    await act(async () => { setOnline(false); window.dispatchEvent(new Event("offline")); });
    await act(async () => { resolve([{ _id: "task1", title: "Stale task", status: "pending" }]); });
    expect(screen.getByTestId("online")).toHaveTextContent("false");
    expect(screen.getByTestId("tasks")).toBeEmptyDOMElement();
    await act(async () => { setOnline(true); window.dispatchEvent(new Event("online")); });
    await waitFor(() => expect(mocks.http.getTasks.mock.calls.length).toBeGreaterThan(1));
  });

  it("reloads current state after a 409 without overwriting completion", async () => {
    mount();
    await waitFor(() => expect(mocks.http.getTasks).toHaveBeenCalledTimes(1));
    mocks.http.completeTask.mockRejectedValue(Object.assign(new Error("Conflicto de estado"), { status: 409 }));
    mocks.http.getTasks.mockResolvedValue([{ _id: "task1", title: "Won by another user", status: "completed" }]);
    fireEvent.click(screen.getByRole("button", { name: "Complete" }));
    await waitFor(() => expect(screen.getByTestId("tasks")).toHaveTextContent("Won by another user:completed"));
    expect(screen.getByText("Conflicto de estado")).toBeInTheDocument();
  });

  it("does not overwrite a socket change with an older API snapshot", async () => {
    let resolve;
    mocks.http.getTasks.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
    mount();
    await waitFor(() => expect(resolve).toBeTypeOf("function"));
    mocks.http.getTasks.mockResolvedValue([{ _id: "task1", title: "New task", status: "cancelled" }]);
    await act(async () => {
      mocks.handlers.get("task:cancelled")({ _id: "task1", title: "New task", status: "cancelled" });
      resolve([{ _id: "task1", title: "Old task", status: "pending" }]);
    });
    await waitFor(() => expect(screen.getByTestId("tasks")).toHaveTextContent("New task:cancelled"));
    expect(mocks.http.getTasks).toHaveBeenCalledTimes(2);
  });
});
