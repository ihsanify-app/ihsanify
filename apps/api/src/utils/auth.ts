import { createMiddleware } from "hono/factory";
import jwt from "jsonwebtoken";
import type { TokenPayload } from "../types";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set in .env");

export type AuthedUser = {
	id: string;
	email: string;
	name: string;
	role: "ADMIN" | "TEACHER" | "STUDENT";
};

declare module "hono" {
	interface ContextVariableMap {
		authUser: AuthedUser;
	}
}

// requireAuth runs on every authenticated request, so writing lastActiveAt
// unconditionally would mean a DB write per click. Throttled to at most once
// per this window instead.
const LAST_ACTIVE_THROTTLE_MS = 60_000;

export const requireAuth = createMiddleware(async (c, next) => {
	const authHeader = c.req.header("Authorization");
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return c.json({ success: false, message: "No token provided." }, 401);
	}
	const token = authHeader.split(" ")[1];
	try {
		const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
		const user = await prisma.user.findUnique({
			where: { id: payload.userId },
		});
		if (!user || !user.isActive) {
			return c.json(
				{ success: false, message: "Account is inactive or does not exist." },
				401,
			);
		}
		// Best-effort, not awaited: this is bookkeeping, not something
		// that should add latency to every authenticated request or
		// (since it's inside this function's try/catch) turn a
		// transient DB hiccup here into a false "Invalid or expired
		// token" response.
		if (
			!user.lastActiveAt ||
			Date.now() - user.lastActiveAt.getTime() > LAST_ACTIVE_THROTTLE_MS
		) {
			prisma.user
				.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } })
				.catch(() => {});
		}

		c.set("authUser", {
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
		});
		await next();
	} catch {
		return c.json(
			{ success: false, message: "Invalid or expired token." },
			401,
		);
	}
});

export function requireRole(...roles: AuthedUser["role"][]) {
	return createMiddleware(async (c, next) => {
		const user = c.get("authUser");
		if (!roles.includes(user.role)) {
			return c.json(
				{ success: false, message: "You don't have access to this resource." },
				403,
			);
		}
		await next();
	});
}
