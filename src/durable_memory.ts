export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

export class SessionDO {
  state: DurableObjectState;
  storage: DurableObjectStorage;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.storage = state.storage;
  }

  async fetch(req: Request) {
    const url = new URL(req.url);
    const path = url.pathname;

    if (req.method === "POST" && path.endsWith("/append")) {
      const { role, content } = await req.json<any>();
      if (!role || !content) return new Response("bad request", { status: 400 });
      const items = (await this.storage.get<ChatTurn[]>("log")) ?? [];
      items.push({ role, content, ts: Date.now() });
      await this.storage.put("log", items);
      return json({ ok: true });
    }

    if (path.endsWith("/history")) {
      const items = (await this.storage.get<ChatTurn[]>("log")) ?? [];
      const summary = (await this.storage.get<string>("summary")) ?? "";
      return json({ items, summary });
    }

    if (req.method === "POST" && path.endsWith("/summary")) {
      const { summary } = await req.json<any>();
      await this.storage.put("summary", summary ?? "");
      return new Response("ok");
    }

    // Simple truncate endpoint (optional)
    if (req.method === "POST" && path.endsWith("/truncate")) {
      await this.storage.delete("log");
      return new Response("ok");
    }

    return new Response("not found", { status: 404 });
  }
}

function json(obj: unknown) {
  return new Response(JSON.stringify(obj), {
    headers: { "content-type": "application/json" }
  });
}
