import { SessionDO, ChatTurn } from "./durable_memory";

export interface Env {
  AI: Ai;
  SESSIONS: DurableObjectNamespace<SessionDO>;
  MODEL: string;
  TAIL_TURNS: string; // number as string
}

export default {
  async fetch(req: Request, env: Env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: cors() });

    const url = new URL(req.url);
    const pathname = url.pathname;

    // Health
    if (pathname === "/" && req.method === "GET") {
      return new Response("OK", { headers: cors() });
    }

    // POST /chat?session=foo
    if (pathname === "/chat" && req.method === "POST") {
      const { message } = await req.json<any>();
      if (!message || typeof message !== "string") {
        return resJSON({ error: "message required" }, 400);
      }
      const session = url.searchParams.get("session") || "default";
      const doStub = getDOStub(env, session);

      // Load history + summary
      const hist = await fetchFromDO(doStub, "/history");
      const items: ChatTurn[] = hist.items ?? [];
      const summary: string = hist.summary ?? "";

      const tailTurns = Number(env.TAIL_TURNS || "8");
      const system = `You are a concise, helpful assistant. Conversation summary (may be empty): ${summary || "N/A"}`;
      const messages = [
        { role: "system" as const, content: system },
        ...items.slice(-tailTurns),
        { role: "user" as const, content: message }
      ];

      const ai = await env.AI.run(env.MODEL, { messages });
      const reply: string =
        (ai as any)?.response ??
        (ai as any)?.output_text ??
        "Sorry, I had trouble generating a response.";

      // Persist turns
      await fetchFromDO(doStub, "/append", "POST", { role: "user", content: message });
      await fetchFromDO(doStub, "/append", "POST", { role: "assistant", content: reply });

      return resJSON({ reply });
    }

    // GET /history?session=foo
    if (pathname === "/history" && req.method === "GET") {
      const session = url.searchParams.get("session") || "default";
      const doStub = getDOStub(env, session);
      const hist = await fetchFromDO(doStub, "/history");
      return resJSON(hist);
    }

    // POST /admin/summarize?session=foo (can be called by Cron or manually)
    if (pathname === "/admin/summarize" && req.method === "POST") {
      const session = url.searchParams.get("session") || "default";
      const doStub = getDOStub(env, session);
      const hist = await fetchFromDO(doStub, "/history");
      const items: ChatTurn[] = hist.items ?? [];
      const prevSummary: string = hist.summary ?? "";

      // Nothing to do
      if (!items.length) return new Response("no content", { status: 204, headers: cors() });

      const messages = [
        { role: "system", content: "Summarize the conversation crisply for future context. Keep 5-7 bullet points or a short paragraph." },
        ...(prevSummary ? [{ role: "system", content: `Previous summary: ${prevSummary}` }] : []),
        ...items.slice(-20)
      ];

      const ai = await env.AI.run(env.MODEL, { messages });
      const newSummary = (ai as any)?.response ?? (ai as any)?.output_text ?? "";

      await fetchFromDO(doStub, "/summary", "POST", { summary: newSummary });

      return resJSON({ ok: true, saved: Boolean(newSummary) });
    }

    return new Response("Not found", { status: 404, headers: cors() });
  },

  // Export DO class for Wrangler to bind
  // @ts-ignore: used by wrangler via class_name in wrangler.toml
  SessionDO
};

function getDOStub(env: Env, sessionId: string) {
  const id = env.SESSIONS.idFromName(sessionId);
  return env.SESSIONS.get(id);
}

async function fetchFromDO(stub: DurableObjectStub, path: string, method: "GET" | "POST" = "GET", body?: unknown) {
  const req = new Request("https://do" + path, {
    method,
    headers: { "content-type": "application/json" },
    body: method === "POST" ? JSON.stringify(body ?? {}) : undefined
  });
  const r = await stub.fetch(req);
  if (r.status === 204) return {};
  if (!r.ok) throw new Error(`DO error ${r.status}`);
  return r.headers.get("content-type")?.includes("application/json") ? r.json() : r.text();
}

function resJSON(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...cors() }
  });
}

function cors() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS"
  };
}
