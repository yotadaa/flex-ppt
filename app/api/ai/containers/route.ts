import { NextResponse } from "next/server";
import { stripMarkdownCodeFence } from "../../../../src/utils/containers";

export const runtime = "nodejs";

type ContainerAiRequest = {
  mode?: "html" | "svg";
  prompt?: string;
};

const fallbackHtml = (prompt: string) => `
<div class="dynamic-container-card">
  <strong>${escapeHtml(prompt.slice(0, 72) || "AI structure")}</strong>
  <span>Ringkas, visual, dan siap ditempatkan di slide presentasi.</span>
</div>`;

const fallbackSvg = (prompt: string) => `
<svg viewBox="0 0 420 240" role="img" aria-label="${escapeHtml(prompt.slice(0, 64) || "AI structure")}">
  <defs>
    <linearGradient id="ai-container-gradient" x1="0" x2="1" y1="0" y2="1">
      <stop stop-color="#f8fafc"/>
      <stop offset="1" stop-color="#dbeafe"/>
    </linearGradient>
  </defs>
  <rect width="420" height="240" rx="28" fill="url(#ai-container-gradient)"/>
  <rect x="34" y="34" width="132" height="34" rx="17" fill="#0f172a"/>
  <circle cx="74" cy="142" r="38" fill="#14b8a6"/>
  <rect x="132" y="118" width="238" height="16" rx="8" fill="#2563eb"/>
  <rect x="132" y="154" width="180" height="14" rx="7" fill="#64748b"/>
</svg>`;

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({})) as ContainerAiRequest;
  const mode = body.mode === "svg" ? "svg" : "html";
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const endpoint = process.env.llm_endpoint?.trim();
  const apiKey = process.env.llm_api_key?.trim();
  const model = process.env.llm_model?.trim() || "openai-compatible-model";

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  if (!endpoint || !apiKey) {
    return NextResponse.json({
      mode,
      model: "local-fallback",
      fallback: true,
      result: mode === "svg" ? fallbackSvg(prompt) : fallbackHtml(prompt),
    });
  }

  const system = mode === "svg"
    ? "Return only safe inline SVG markup. No markdown fences, script tags, external resources, event handlers, or javascript URLs."
    : "Return only a compact safe HTML fragment for a presentation slide container. No markdown fences, script tags, event handlers, external scripts, or javascript URLs.";

  const response = await fetch(`${endpoint.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.35,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    return NextResponse.json({
      mode,
      model,
      fallback: true,
      result: mode === "svg" ? fallbackSvg(prompt) : fallbackHtml(prompt),
      error: `AI provider returned ${response.status}`,
    });
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const result = stripMarkdownCodeFence(data.choices?.[0]?.message?.content || "");
  return NextResponse.json({
    mode,
    model,
    fallback: false,
    result: result || (mode === "svg" ? fallbackSvg(prompt) : fallbackHtml(prompt)),
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
