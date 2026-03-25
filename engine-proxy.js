import http from "http";

const TARGET = "https://evercrafted-engine-production.up.railway.app/run-engine";
const PORT = process.env.ENGINE_PROXY_PORT || 8787;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
}

const server = http.createServer(async (req, res) => {
  setCors(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url !== "/engine-proxy") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 1_000_000) {
      res.writeHead(413, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Payload too large" }));
      req.destroy();
    }
  });

  req.on("end", async () => {
    try {
      console.log(`[engine-proxy] Forwarding ${req.method} ${req.url} -> ${TARGET}`);
      const response = await fetch(TARGET, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body
      });
      const text = await response.text();
      console.log(`[engine-proxy] Engine response (${response.status}): ${text.slice(0, 500)}`);
      res.writeHead(response.status, {
        "Content-Type": response.headers.get("content-type") || "application/json"
      });
      res.end(text);
    } catch (err) {
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Proxy failed" }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`Engine proxy running on http://127.0.0.1:${PORT}/engine-proxy`);
});
