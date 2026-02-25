export interface CharacterPosition {
  x: number;
  y: number;
}

export interface Character {
  id: string;
  name: string;
  name_ru: string;
  role: string;
  sprite_id: string;
  room: string;
  position: CharacterPosition;
  tasks: string[];
  default_model: string;
  available_models: string[];
  webhook_on_complete: string;
  system_prompt: string;
  greeting: string;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  character: string;
  model_override: string | null;
  prompt_template: string;
  output_format: "structured" | "text";
  webhook_action: string;
}

export interface RoomFurniture {
  type: string;
  position: CharacterPosition;
  label?: string;
}

export interface Room {
  id: string;
  name: string;
  name_ru: string;
  tilemap: string;
  size: { width: number; height: number };
  background_color: string;
  characters: string[];
  furniture: RoomFurniture[];
}

export interface WebhookConfig {
  url: string;
  description: string;
  destination: string;
  setup_guide: string;
}

export interface WebhookMap {
  [key: string]: WebhookConfig;
}

export interface AIResponse {
  response: string;
  model: string;
  tokens_input: number;
  tokens_output: number;
  cost_estimate: number;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}
