export interface Task {
  id: number;
  title: string;
  completed: boolean;
}

export class TaskManager {
  private tasks: Task[] = [];

  addTask(title: string): Task {
    const task: Task = {
      id: this.tasks.length + 1,
      title,
      completed: false,
    };

    this.tasks.push(task);
    return task;
  }

  getTasks(): Task[] {
    return this.tasks;
  }

  completeTask(id: number): boolean {
    const task = this.tasks.find(t => t.id === id);

    if (!task) return false;

    task.completed = true;
    return true;
  }

  deleteTask(id: number): boolean {
    const index = this.tasks.findIndex(t => t.id === id);

    if (index === -1) return false;

    this.tasks.splice(index, 1);
    return true;
  }
}