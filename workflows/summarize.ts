export default {
  async run(event: any, env: any) {
    const session = "default";
    // Call the Worker’s internal handler by simulating the /admin/summarize route
    const workerURL = event?.secrets?.WORKER_URL; // optional: pass via workflows execute secrets
    if (!workerURL) throw new Error("WORKER_URL secret not set for workflow execution");
    const r = await fetch(`${workerURL}/admin/summarize?session=${encodeURIComponent(session)}`, {
      method: "POST"
    });
    if (!r.ok) throw new Error(`Summarize failed: ${r.status}`);
    return { ok: true };
  }
};
