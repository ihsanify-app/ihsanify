import { createRequire } from "node:module";
import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

// Product version lives once in the monorepo root package.json — every app
// reads it from there rather than keeping its own copy that could drift.
const require = createRequire(import.meta.url);
const rootPackageJson = require("../../package.json");

const config = defineConfig(({ mode }) => {
	// Load env vars from the monorepo root .env (not just this app's folder)
	const env = loadEnv(
		mode,
		fileURLToPath(new URL("../..", import.meta.url)),
		"",
	);

	return {
		define: {
			__APP_VERSION__: JSON.stringify(rootPackageJson.version),
		},
		resolve: {
			alias: {
				"@": fileURLToPath(new URL("./src", import.meta.url)),
			},
		},
		server: {
			host: true,
			allowedHosts: env.VITE_ALLOWED_HOST ? [env.VITE_ALLOWED_HOST] : [],
		},
		plugins: [
			// Distinct port from apps/platform's devtools (default 42069) — both
			// apps run concurrently under `pnpm dev`, and the devtools event bus
			// binds a fixed port per app, so they can't share the default.
			devtools({ eventBusConfig: { port: 42070 } }),
			// this is the plugin that enables path aliases
			viteTsConfigPaths({
				projects: ["./tsconfig.json"],
			}),
			tailwindcss(),
			tanstackStart(),
			viteReact(),
		],
	};
});

export default config;
