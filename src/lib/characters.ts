import fs from "fs";
import path from "path";
import { Character } from "@/types";

const charactersDir = path.join(process.cwd(), "characters");

export function getAllCharacters(): Character[] {
  const files = fs.readdirSync(charactersDir).filter((f) => f.endsWith(".json"));
  return files.map((file) => {
    const raw = fs.readFileSync(path.join(charactersDir, file), "utf-8");
    return JSON.parse(raw) as Character;
  });
}

export function getCharacter(id: string): Character | null {
  const filePath = path.join(charactersDir, `${id}.json`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw) as Character;
}
