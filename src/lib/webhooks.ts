import fs from "fs";
import path from "path";
import { WebhookMap } from "@/types";

const webhooksPath = path.join(process.cwd(), "webhooks", "make-scenarios.json");

function loadWebhooks(): WebhookMap {
  const raw = fs.readFileSync(webhooksPath, "utf-8");
  const data = JSON.parse(raw);
  delete data._comment;
  return data as WebhookMap;
}

export async function sendWebhook(
  action: string,
  payload: {
    character: string;
    task: string;
    user: string;
    result: string;
    timestamp: string;
  }
): Promise<{ success: boolean; message: string }> {
  const webhooks = loadWebhooks();
  const config = webhooks[action];

  if (!config || !config.url) {
    return { success: false, message: "Webhook не настроен" };
  }

  const res = await fetch(config.url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { success: false, message: `Webhook error: ${res.status}` };
  }

  return { success: true, message: `Отправлено в ${config.destination}` };
}
