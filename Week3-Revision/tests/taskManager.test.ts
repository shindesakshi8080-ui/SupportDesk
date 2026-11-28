import { TaskManager } from "../src/taskManager";

describe("TaskManager", () => {
  let manager: TaskManager;

  beforeEach(() => {
    manager = new TaskManager();
  });

  test("1. adds a task", () => {
    expect(manager.addTask("Study").title).toBe("Study");
  });

  test("2. returns all tasks", () => {
    manager.addTask("Study");
    expect(manager.getTasks()).toHaveLength(1);
  });

  test("3. task starts incomplete", () => {
    expect(manager.addTask("Study").completed).toBe(false);
  });

  test("4. completes a task", () => {
    manager.addTask("Study");
    expect(manager.completeTask(1)).toBe(true);
  });

  test("5. invalid completion returns false", () => {
    expect(manager.completeTask(99)).toBe(false);
  });

  test("6. deletes a task", () => {
    manager.addTask("Study");
    expect(manager.deleteTask(1)).toBe(true);
  });

  test("7. invalid deletion returns false", () => {
    expect(manager.deleteTask(99)).toBe(false);
  });

  test("8. removes task from list", () => {
    manager.addTask("Study");
    manager.deleteTask(1);
    expect(manager.getTasks()).toHaveLength(0);
  });
});