import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { meRouter } from "../auth/me";
import { authRouter } from "../auth/register";
import { groupsRouter } from "./routes/groups";
import { lookupsRouter } from "./routes/lookups";
import { sessionsRouter } from "./routes/sessions";
import { usersRouter } from "./routes/users";

const app = new Hono();
app.use("*", cors({ origin: "http://localhost:3000" }));
console.log("Environment Variable TEST:", process.env.TEST);

app
	.get("/", (c) => {
		return c.text("Hello Hono!");
	})
	.route("/", authRouter)
	.route("/", meRouter)
	.route("/", usersRouter)
	.route("/", groupsRouter)
	.route("/", lookupsRouter)
	.route("/", sessionsRouter);

serve(
	{
		fetch: app.fetch,
		port: 8000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
