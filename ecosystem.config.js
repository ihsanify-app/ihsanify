module.exports = {
	apps: [
		{
			name: "ihsanify-platform",
			cwd: "./apps/platform",
			script: "pnpm",
			args: "with-env vite dev --port 3000 --host",
			interpreter: "none",
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
