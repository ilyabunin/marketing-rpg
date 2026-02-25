import Anthropic from "@anthropic-ai/sdk";
import { getCharacter } from "./characters";
import { getTask } from "./tasks";
import { getServiceClient } from "./supabase";
import { incrementUsage } from "./usage";
import { AIResponse } from "@/types";

const MODEL_MAP: Record<string, string> = {
  "claude-sonnet": "claude-sonnet-4-5-20250929",
  "claude-opus": "claude-opus-4-6",
  "gemini-pro": "gemini-2.5-pro",
  perplexity: "sonar-pro",
};

export async function routeRequest(
  characterId: string,
  taskId: string,
  userInput: string,
  userId: string
): Promise<AIResponse> {
  const character = getCharacter(characterId);
  if (!character) throw new Error(`Character not found: ${characterId}`);

  const task = getTask(taskId);
  if (!task) throw new Error(`Task not found: ${taskId}`);

  let modelKey = task.model_override || character.default_model;
  const prompt = task.prompt_template.replace("{{user_input}}", userInput);

  // Fallback to claude-sonnet if API key for requested model is missing
  if (modelKey === "gemini-pro" && !process.env.GOOGLE_AI_API_KEY) {
    modelKey = "claude-sonnet";
  }
  if (modelKey === "perplexity" && !process.env.PERPLEXITY_API_KEY) {
    modelKey = "claude-sonnet";
  }

  let result: AIResponse;

  if (modelKey.startsWith("claude")) {
    result = await callClaude(modelKey, character.system_prompt, prompt);
  } else if (modelKey === "gemini-pro") {
    result = await callGemini(character.system_prompt, prompt);
  } else if (modelKey === "perplexity") {
    result = await callPerplexity(character.system_prompt, prompt);
  } else {
    throw new Error(`Unknown model: ${modelKey}`);
  }

  await logChat(userId, characterId, taskId, userInput, result);
  await incrementUsage(userId, result.cost_estimate);

  return result;
}

async function callClaude(
  modelKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<AIResponse> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = MODEL_MAP[modelKey];

  const message = await client.messages.create({
    model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text : "";
  const tokensIn = message.usage.input_tokens;
  const tokensOut = message.usage.output_tokens;
  const cost = estimateCost(modelKey, tokensIn, tokensOut);

  return {
    response: text,
    model: model,
    tokens_input: tokensIn,
    tokens_output: tokensOut,
    cost_estimate: cost,
  };
}

async function callGemini(
  systemPrompt: string,
  userPrompt: string
): Promise<AIResponse> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  const model = MODEL_MAP["gemini-pro"];
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ parts: [{ text: userPrompt }] }],
    }),
  });

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const tokensIn = data.usageMetadata?.promptTokenCount || 0;
  const tokensOut = data.usageMetadata?.candidatesTokenCount || 0;

  return {
    response: text,
    model,
    tokens_input: tokensIn,
    tokens_output: tokensOut,
    cost_estimate: estimateCost("gemini-pro", tokensIn, tokensOut),
  };
}

async function callPerplexity(
  systemPrompt: string,
  userPrompt: string
): Promise<AIResponse> {
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL_MAP["perplexity"],
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  const tokensIn = data.usage?.prompt_tokens || 0;
  const tokensOut = data.usage?.completion_tokens || 0;

  return {
    response: text,
    model: MODEL_MAP["perplexity"],
    tokens_input: tokensIn,
    tokens_output: tokensOut,
    cost_estimate: estimateCost("perplexity", tokensIn, tokensOut),
  };
}

function estimateCost(
  modelKey: string,
  tokensIn: number,
  tokensOut: number
): number {
  const rates: Record<string, [number, number]> = {
    "claude-sonnet": [3.0 / 1e6, 15.0 / 1e6],
    "claude-opus": [15.0 / 1e6, 75.0 / 1e6],
    "gemini-pro": [1.25 / 1e6, 10.0 / 1e6],
    perplexity: [1.0 / 1e6, 1.0 / 1e6],
  };
  const [inRate, outRate] = rates[modelKey] || [0, 0];
  return tokensIn * inRate + tokensOut * outRate;
}

async function logChat(
  userId: string,
  characterId: string,
  taskId: string,
  userMessage: string,
  aiResult: AIResponse
) {
  const supabase = getServiceClient();
  await supabase.from("chat_history").insert({
    user_id: userId,
    character_id: characterId,
    task_id: taskId,
    user_message: userMessage,
    ai_response: aiResult.response,
    model_used: aiResult.model,
    tokens_input: aiResult.tokens_input,
    tokens_output: aiResult.tokens_output,
    cost_estimate: aiResult.cost_estimate,
  });
}
