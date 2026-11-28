import { TaskManager } from "./taskManager";
import * as readline from "readline";

const manager = new TaskManager();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function menu(): void {
  console.log("\n--- TASK MANAGER ---");
  console.log("1. Add Task");
  console.log("2. View Tasks");
  console.log("3. Complete Task");
  console.log("4. Delete Task");
  console.log("5. Exit");

  rl.question("Choose option: ", (choice) => {
    if (choice === "1") {
      rl.question("Enter task: ", (title) => {
        manager.addTask(title);
        console.log("Task added!");
        menu();
      });
    } else if (choice === "2") {
      console.log(manager.getTasks());
      menu();
    } else if (choice === "3" || choice === "4") {
      rl.question("Enter task ID: ", (id) => {
        const result = choice === "3"
          ? manager.completeTask(Number(id))
          : manager.deleteTask(Number(id));

        console.log(result ? "Success!" : "Task not found.");
        menu();
      });
    } else if (choice === "5") {
      rl.close();
    } else {
      console.log("Invalid option!");
      menu();
    }
  });
}

menu();