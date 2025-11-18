// import { createServer } from "node:http";
// import { join } from "node:path";
// import { hostname } from "node:os";
import wisp from "wisp-server-node";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import { H } from "@highlight-run/node";
import { resolve } from "node:path";

// Initialize Highlight
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

// Static paths
import { publicPath } from "ultraviolet-static";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
// import { epoxyPath } from "./node_modules/@mercuryworkshop/epoxy-transport/lib/index.cjs";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
let epoxyImportPath = resolve(
	baremuxPath + "/../../epoxy-transport/lib/index.cjs"
);
let ePath = "";
// import {epoxyPath} from `${epoxyImportPath}`;

console.log(ePath, "<- epoxy path");
const fastify = Fastify();
// Register static files
fastify.register(fastifyStatic, {
	root: publicPath,
	decorateReply: true,
});

// Serve UV config file
fastify.get("/uv/uv.config.js", (req, res) => {
	return res.sendFile("uv/uv.config.js", publicPath);
});

// Register additional static routes
fastify.register(fastifyStatic, {
	root: uvPath,
	prefix: "/uv/",
	decorateReply: false,
});
(async () => {
	await import(epoxyImportPath).then(function (v) {
		ePath = v.epoxyPath;
	});
	fastify.register(fastifyStatic, {
		root: ePath,
		prefix: "/epoxy/",
		decorateReply: false,
	});

	// ePath = epoxyPath;
})();

fastify.register(fastifyStatic, {
	root: baremuxPath,
	prefix: "/baremux/",
	decorateReply: false,
});

// Handling WebSocket upgrades
fastify.server.on("upgrade", (req, socket, head) => {
	// console.log(`Upgrade Request: ${socket.addListener}`);
	if (req.url.endsWith("/wisp/")) {
		wisp.routeRequest(req, socket, head);
	} else if (req.url && req.url.startsWith("/uv/service/")) {
		console.log(`WebSocket Upgrade URL: ${req.url}`);
	} else {
		console.log("ended socket");
		socket.end(); // Close the connection for unsupported routes
	}
});

// Start the server
const port = parseInt(process.env.PORT) || 8080;
fastify.listen({
	port: port,
	host: "0.0.0.0",
});
// Graceful shutdown
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
	console.log("Shutting down server...");
	fastify.close(() => process.exit(0));
}
export default { fastify };
