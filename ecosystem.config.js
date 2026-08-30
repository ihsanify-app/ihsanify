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
			// notes) — this only starts the already-built dist/server/server.js.
			args: "with-env node dist/server/server.js",
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
