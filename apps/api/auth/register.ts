import { compare, hash } from "bcryptjs";
import { Hono } from "hono";
import jwt from "jsonwebtoken";
import type { TokenPayload } from "../src/types";
import { prisma } from "../src/utils/prisma";

export const authRouter = new Hono();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error("JWT_SECRET is not set in .env");

authRouter
	.post("/auth/register", async (c) => {
		try {
			const body = (await c.req.json()) as any;
			if (!body.email || !body.password || !body.name) {
				return c.json(
					{
						success: false,
						message: "Email, password, and name is required.",
					},
					400,
				);
			}

			if (!body.email.includes("@") || body.email.length < 5) {
				return c.json({
					success: false,
					message: "Email is not valid.",
				});
			}

			if (body.password.length < 6) {
				return c.json({
					success: false,
					message: "Password has to be 6 digits minimally.",
				});
			}

			const hashedPassword = await hash(body.password, 10);

			const newUser = await prisma.user.create({
				data: {
					email: body.email,
					password: hashedPassword,
					name: body.name,
					role: "STUDENT",
				},
			});

			return c.json(
				{
					success: true,
					message: `User ${body.name} is registered successfully.`,
					userId: newUser.id,
				},
				201,
			);
		} catch (error: any) {
			if (error.code === "P2002") {
				return c.json(
					{
						success: false,
						message: "This email has already existed.",
					},
					400,
				);
			}
			return c.json({ success: false, message: "Internal server error." }, 500);
		}
	})
	.post("/auth/login", async (c) => {
		try {
			const body = (await c.req.json()) as any;

			if (!body.email || !body.password) {
				return c.json(
					{
						success: false,
						message: "Email and Password can't be empty",
					},
					400,
				);
			}

			const user = await prisma.user.findUnique({
				where: {
					email: body.email.toLowerCase(),
				},
			});

			const isPasswordValid = user
				? await compare(body.password, user.password)
				: false;
			if (!user || !isPasswordValid) {
				return c.json(
					{
						success: false,
						message: "Invalid email or password.",
					},
					401,
				);
			}

			if (!user.isActive) {
				return c.json(
					{
						success: false,
						message: "This account has been deactivated.",
					},
					401,
				);
			}

			const token = jwt.sign(
				{
					userId: user.id,
					email: user.email,
				} as TokenPayload,
				JWT_SECRET,
				{ expiresIn: "7d" },
			);
			return c.json({
				success: true,
				message: "Login is Successful",
				data: {
					user: {
						id: user.id,
						email: user.email,
						name: user.name,
						role: user.role,
					},
					token: token,
				},
			});
		} catch (_error: any) {
			return c.json(
				{
					success: false,
					message: "Invalid credentials",
				},
				400,
			);
		}
	});
