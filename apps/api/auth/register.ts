import { hash } from "bcryptjs";
import { Hono } from "hono";
import { prisma } from "../src/utils/prisma";

export const authRouter = new Hono();

authRouter.post("/auth/register", async (c) => {
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
});
