import { getServiceClient } from "./supabase";

const DAILY_LIMIT = parseInt(process.env.DAILY_REQUEST_LIMIT || "30", 10);

export async function checkUsageLimit(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
}> {
  const supabase = getServiceClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("usage_daily")
    .select("request_count")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  const used = data?.request_count || 0;
  return { allowed: used < DAILY_LIMIT, used, limit: DAILY_LIMIT };
}

export async function incrementUsage(
  userId: string,
  cost: number
): Promise<void> {
  const supabase = getServiceClient();
  const today = new Date().toISOString().split("T")[0];

  const { data } = await supabase
    .from("usage_daily")
    .select("id, request_count, total_cost")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  if (data) {
    await supabase
      .from("usage_daily")
      .update({
        request_count: data.request_count + 1,
        total_cost: data.total_cost + cost,
      })
      .eq("id", data.id);
  } else {
    await supabase.from("usage_daily").insert({
      user_id: userId,
      date: today,
      request_count: 1,
      total_cost: cost,
    });
  }
}

export async function getUserUsage(userId: string) {
  const supabase = getServiceClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: todayUsage } = await supabase
    .from("usage_daily")
    .select("request_count, total_cost")
    .eq("user_id", userId)
    .eq("date", today)
    .single();

  const { data: monthUsage } = await supabase
    .from("usage_daily")
    .select("request_count, total_cost")
    .eq("user_id", userId)
    .gte("date", today.slice(0, 7) + "-01");

  const monthTotal = (monthUsage || []).reduce(
    (acc, r) => ({
      requests: acc.requests + r.request_count,
      cost: acc.cost + r.total_cost,
    }),
    { requests: 0, cost: 0 }
  );

  return {
    today: {
      requests: todayUsage?.request_count || 0,
      cost: todayUsage?.total_cost || 0,
      limit: DAILY_LIMIT,
    },
    month: monthTotal,
  };
}
