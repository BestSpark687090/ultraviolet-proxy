import { createServer } from "node:http";
import { join } from "node:path";
import { hostname } from "node:os";
import wisp from "wisp-server-node";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { H } from "@highlight-run/node";
import * as fs from "fs";

H.init({
	projectID: "132006",
	serviceName: "node-highlight-proxy",
	environment: "prod",
	networkRecording: {
		enabled: true,
		recordHeadersAndBody: true,
	},
	tracingOrigins: true,
	privacySetting: "none",
});
// static paths
import { publicPath } from "ultraviolet-static";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";

const fastify = Fastify({
	serverFactory: (handler) => {
		return createServer((req, res) => {
			if (req.url.startsWith("/uv/")) {
				console.log(req.url);
			}
			res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
			res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
			// console.log(req.url);
			// if (req.url.includes("index.js")) {
			// 	return res.sendFile("index.js", publicPath);
			// }
			handler(req, res);
		}).on("upgrade", (req, socket, head) => {
			if (req.url.endsWith("/wisp/")) wisp.routeRequest(req, socket, head);
			else if (req.url.includes("/uv/")) console.log(req.url);
			else socket.end();
		});
	},
});
fastify.addHook("onRequest", (request, reply, done) => {
	if (request.url.startsWith("/uv/")) {
		console.log(`Log URL: ${request.url}`);
	}
	done();
});

fastify.register(fastifyStatic, {
	root: publicPath,
	decorateReply: true,
});
fastify.get("/index.js", (req, res) => {
	let index = fs.readFileSync(publicPath + "index.js");
	console.log("index.");
	if (index.includes("WORKING")) {
		console.log("hello then?");
	}
	return res.send(index);
});
fastify.get("/uv/uv.config.js", (req, res) => {
	return res.sendFile("uv/uv.config.js", publicPath);
});
fastify.register(fastifyStatic, {
	root: uvPath,
	prefix: "/uv/",
	decorateReply: false,
	logSerializers: "hello",
});

fastify.register(fastifyStatic, {
	root: epoxyPath,
	prefix: "/epoxy/",
	decorateReply: false,
});

fastify.register(fastifyStatic, {
	root: baremuxPath,
	prefix: "/baremux/",
	decorateReply: false,
});

fastify.server.on("listening", () => {
	const address = fastify.server.address();

	// by default we are listening on 0.0.0.0 (every interface)
	// we just need to list a few
	console.log("Listening.");
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
	console.log("SIGTERM signal received: closing HTTP server");
	fastify.close();
	process.exit(0);
}

let port = parseInt(process.env.PORT || "");

if (isNaN(port)) port = 8080;

fastify.listen({
	port: port,
	host: "0.0.0.0",
});
