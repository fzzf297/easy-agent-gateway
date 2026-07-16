import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer, request as proxyRequest } from "node:http";
import { join } from "node:path";

const host = "127.0.0.1";
const port = 8081;
const applicationBackend = new URL("http://118.196.83.236:8080");
const agentBackend = new URL("http://118.196.83.236");
const pluginPath = join(
  process.cwd(),
  "..",
  "frontend",
  "packages",
  "agent-web",
  "dist",
  "index.js"
);
const agentMarkup = `
<script type="module" src="/frontend/packages/agent-web/dist/index.js"></script>
<easy-agent-chat api-base-url="/agent-gateway-proxy" user-label="ruoyi-user" title="业务助手"></easy-agent-chat>
`;

function stripHopByHopHeaders(headers) {
  const copied = { ...headers };
  delete copied.host;
  delete copied.connection;
  delete copied["content-length"];
  delete copied["accept-encoding"];
  return copied;
}

function localLocation(location, backend) {
  if (!location) return location;
  return location.startsWith(backend.origin) ? location.slice(backend.origin.length) || "/" : location;
}

async function servePlugin(response) {
  try {
    const info = await stat(pluginPath);
    response.writeHead(200, {
      "Content-Type": "application/javascript; charset=utf-8",
      "Content-Length": info.size
    });
    createReadStream(pluginPath).pipe(response);
  } catch {
    response.writeHead(404).end("Easy Agent plugin was not found.");
  }
}

createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host || `${host}:${port}`}`);
  if (requestUrl.pathname === "/frontend/packages/agent-web/dist/index.js") {
    void servePlugin(response);
    return;
  }

  const isAgentRequest = requestUrl.pathname.startsWith("/agent-gateway-proxy/");
  const upstreamPath = isAgentRequest
    ? requestUrl.pathname.slice("/agent-gateway-proxy".length)
    : requestUrl.pathname;
  const backend = isAgentRequest ? agentBackend : applicationBackend;
  const upstream = proxyRequest(
    {
      protocol: backend.protocol,
      hostname: backend.hostname,
      port: backend.port,
      method: request.method,
      path: `${upstreamPath}${requestUrl.search}`,
      headers: {
        ...stripHopByHopHeaders(request.headers),
        host: backend.host,
        "accept-encoding": "identity"
      }
    },
    (upstreamResponse) => {
      const headers = { ...upstreamResponse.headers };
      delete headers.connection;
      delete headers["transfer-encoding"];
      if (headers.location) headers.location = localLocation(headers.location, backend);

      const isHtml = (headers["content-type"] || "").includes("text/html");
      const shouldInject = isHtml && (requestUrl.pathname === "/index" || requestUrl.pathname === "/");
      if (!shouldInject) {
        response.writeHead(upstreamResponse.statusCode || 502, headers);
        upstreamResponse.pipe(response);
        return;
      }

      const chunks = [];
      upstreamResponse.on("data", (chunk) => chunks.push(chunk));
      upstreamResponse.on("end", () => {
        const source = Buffer.concat(chunks).toString("utf8");
        const html = source.includes("<easy-agent-chat")
          ? source
          : source.replace("</body>", `${agentMarkup}</body>`);
        delete headers["content-length"];
        response.writeHead(upstreamResponse.statusCode || 502, headers);
        response.end(html);
      });
    }
  );

  upstream.on("error", (error) => {
    response.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(`无法连接后端：${error.message}`);
  });
  request.pipe(upstream);
}).listen(port, host, () => {
  console.log(`Local frontend proxy: http://${host}:${port}`);
});
