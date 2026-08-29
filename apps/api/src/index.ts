import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { meRouter } from "../auth/me";
import { authRouter } from "../auth/register";
import { assignmentsRouter } from "./routes/assignments";
import { groupsRouter } from "./routes/groups";
import { invoiceSettingsRouter } from "./routes/invoiceSettings";
import { invoicesRouter } from "./routes/invoices";
import { lookupsRouter } from "./routes/lookups";
import { notificationsRouter } from "./routes/notifications";
import { payrollRouter } from "./routes/payroll";
import { profileRouter } from "./routes/profile";
import { publicRouter } from "./routes/public";
import { reportSettingsRouter } from "./routes/reportSettings";
import { reportsRouter } from "./routes/reports";
import { reportThemesRouter } from "./routes/reportThemes";
import { sessionsRouter } from "./routes/sessions";
import { subjectsRouter } from "./routes/subjects";
import { testimonialsRouter } from "./routes/testimonials";
import { usersRouter } from "./routes/users";

const app = new Hono();
// Comma-separated list in CORS_ORIGINS (e.g. "http://localhost:3000,http://103.187.146.151:3000")
// so this doesn't need a code change every time the frontend is accessed from
// a new host/IP — defaults to localhost for local dev.
const allowedOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:3000")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);
app.use("*", cors({ origin: allowedOrigins }));
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
	.route("/", notificationsRouter)
	.route("/", publicRouter)
	.route("/", payrollRouter)
	.route("/", profileRouter)
	.route("/", sessionsRouter)
	.route("/", reportsRouter)
	.route("/", assignmentsRouter)
	.route("/", invoicesRouter)
	.route("/", invoiceSettingsRouter)
	.route("/", subjectsRouter)
	.route("/", reportThemesRouter)
	.route("/", reportSettingsRouter)
	.route("/", testimonialsRouter);

serve(
	{
		fetch: app.fetch,
		port: 8000,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
