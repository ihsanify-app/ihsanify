module.exports = {
	apps: [
		{
			name: "ihsanify-platform",
			cwd: "./apps/platform",
			script: "pnpm",
			// Runs the production build's server bundle, not the dev server —
			// `vite dev` always has import.meta.env.DEV === true, which used to
			// ship the TanStack devtools panel to real visitors. Requires
			// `pnpm with-env vite build` to have been run first (see README/deploy
			// notes). dist/server/server.js only exports a Web-standard `fetch`
			// handler (no http.createServer/.listen of its own) — `srvx` wraps it
			// into an actual Node listener; running it with plain `node` just
			// executes the module and exits immediately with nothing served.
			// --static is resolved relative to the entry file's own directory
			// (dist/server), not cwd — "../client" is dist/client, where vite
			// build puts the JS/CSS bundles the SSR HTML references.
			args: "with-env srvx dist/server/server.js --static ../client --prod",
			interpreter: "none",
			env: { PORT: 3000 },
		},
		{
			name: "ihsanify-admin",
			cwd: "./apps/admin",
			script: "pnpm",
			args: "with-env vite dev --port 4000 --host",
			interpreter: "none",
		},
		{
			name: "ihsanify-api",
			cwd: "./apps/api",
			script: "pnpm",
			args: "with-env tsx watch src/index.ts",
			interpreter: "none",
		},
	],
};
