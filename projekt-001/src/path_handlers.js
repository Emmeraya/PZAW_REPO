import { readFileSync } from "node:fs";

const index_html = readFileSync("./sitrese/index.html");
const favicon_ico =readFileSync("./sitrese/favicon.ico");

const pathConfigs = [
  {
    path: "/",
    allowed_methods: ["GET"],
    handler: (req, res) => {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(index_html);
    },
  },
  {
    path: "/a",
    allowed_methods: ["GET"],
    handler: (req, res) => {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("hello world, a!\n");
    },
  },
  {
    path: "/favicon.ico",
    allowed_methods: ["GET"],
    handler: (req, res) => {
      res.writeHead(200, { "Content-Type": "image/vnd.microsoft.icon" });
      res.end(favicon_ico);
    },
  },
];

export function handlePath(path, req, res) {
  for (let config of pathConfigs) {
    if (path === config.path) {
      if (config.allowed_methods.includes(req.method)) {
        config.handler(req, res);
      } else {
        res.writeHead(405, { "Content-Type": "text/plain" });
        res.end("NUH UH\n");
      }
      break;
    }
  }
}