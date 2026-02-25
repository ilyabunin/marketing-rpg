import { NextResponse } from "next/server";
import { getAllCharacters } from "@/lib/characters";
import { getTasksForCharacter } from "@/lib/tasks";

export async function GET() {
  const characters = getAllCharacters();
  const data = characters.map((c) => ({
    id: c.id,
    name: c.name,
    name_ru: c.name_ru,
    role: c.role,
    sprite_id: c.sprite_id,
    position: c.position,
    greeting: c.greeting,
    bio: c.bio || "",
    portraitFile: c.portraitFile || "",
    color: c.color || "#4a4a6a",
    skills: c.skills || [],
    default_model: c.default_model,
    tasks: getTasksForCharacter(c.id).map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
    })),
  }));
  return NextResponse.json(data);
}
