export async function chatJson({ apiKey, baseUrl, model, system, user }) {
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.8,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    const err = new Error(text.slice(0, 400) || `LLM HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("LLM returned non-JSON.");
  }

  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("LLM response missing content.");
  }
  return content;
}
