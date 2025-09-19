// api/openai.ts
export const config = { runtime: "edge" };

export default async function handler(req: Request) {
  const url = "https://api.openai.com/v1/responses";
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return new Response("Missing OPENAI_API_KEY", { status: 500 });

  const upstreamHeaders: Record<string, string> = {
    "Authorization": `Bearer ${apiKey}` ,
    "Content-Type": "application/json",
  };

  const body = await req.text(); // forward exactly what client sends (we call it from server code above, too)
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000); // 30s safety

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: upstreamHeaders,
      body,
      signal: controller.signal
    });

    clearTimeout(timeout);
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err: any) {
    clearTimeout(timeout);
    const msg = err?.name === "AbortError" ? "Upstream timeout" : (err?.message || "Upstream error");
    return new Response(JSON.stringify({ error: msg }), { status: 502, headers: { "Content-Type": "application/json" } });
  }
}
