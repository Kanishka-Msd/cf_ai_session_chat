// Set this to your Worker URL after deploy step 3
const WORKER_URL = "https://cf_ai_session_chat.<subdomain>.workers.dev";
const SESSION_ID = "default";

const log = document.getElementById("log");
const form = document.getElementById("f");
const input = document.getElementById("m");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = (input.value || "").trim();
  if (!text) return;
  add("you", text);
  input.value = "";
  try {
    const r = await fetch(`${WORKER_URL}/chat?session=${encodeURIComponent(SESSION_ID)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: text })
    });
    const data = await r.json();
    add("bot", data.reply || "(no reply)");
  } catch (err) {
    add("bot", "Error talking to the API.");
  }
});

function add(who, text) {
  const div = document.createElement("div");
  div.className = `msg ${who}`;
  div.textContent = text;
  log.appendChild(div);
  log.scrollTop = log.scrollHeight;
}
