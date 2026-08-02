import { Hono } from "hono";
import jwt from "jsonwebtoken";
import type { TokenPayload } from "../src/types";
import { prisma } from "../src/utils/prisma";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set in .env");

export const meRouter = new Hono();

meRouter.get("/me", async (c) => {
	const authHeader = c.req.header("Authorization");
	// console.log(authHeader)
	// return c.json({ authHeader })
	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return c.json({ success: false, message: "No token provided." }, 401);
	}
	const token = authHeader.split(" ")[1];
	try {
		const verifiedMe = jwt.verify(token, JWT_SECRET) as TokenPayload;
		const verifiedUser = await prisma.user.findUnique({
			where: {
				id: verifiedMe.userId,
			},
		});
		if (!verifiedUser) {
			return c.json(
				{
					success: false,
					message: "User doesn't exist.",
				},
				400,
			);
		}
		// exclude password
		const { password, ...safeUser } = verifiedUser;

		return c.json(
			{
				success: true,
				message: "User is verified.",
				data: safeUser,
			},
			200,
		);
	} catch (_error) {
		return c.json(
			{
				success: false,
				message: "This is not your account.",
			},
			401,
		);
	}
});
