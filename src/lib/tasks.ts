import fs from "fs";
import path from "path";
import { Task } from "@/types";

const tasksDir = path.join(process.cwd(), "tasks");

export function getAllTasks(): Task[] {
  const files = fs.readdirSync(tasksDir).filter((f) => f.endsWith(".json"));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(tasksDir, file), "utf-8");
    return JSON.parse(raw) as Task;
  });
}

export function getTask(id: string): Task | null {
  const filePath = path.join(tasksDir, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as Task;
}

export function getTasksForCharacter(characterId: string): Task[] {
  return getAllTasks().filter((t) => t.character === characterId);
}
