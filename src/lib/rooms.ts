import fs from "fs";
import path from "path";
import { Room } from "@/types";

const roomsDir = path.join(process.cwd(), "rooms");

export function getRoom(id: string): Room | null {
  const filePath = path.join(roomsDir, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as Room;
}
