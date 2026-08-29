import { Hono } from "hono";
import { requireAuth, requireRole } from "../utils/auth";
import { prisma } from "../utils/prisma";

export const testimonialsRouter = new Hono();

function serializeTestimonial(t: {
	id: string;
	name: string;
	message: string;
	givenAt: Date;
	createdAt: Date;
}) {
	return {
		testimonialId: t.id,
		name: t.name,
		message: t.message,
		givenAt: t.givenAt.toISOString(),
		createdAt: t.createdAt.toISOString(),
	};
}

testimonialsRouter.post(
	"/testimonials",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const body = (await c.req.json()) as {
			name?: string;
			message?: string;
			givenAt?: string;
		};
		if (!body.name?.trim() || !body.message?.trim()) {
			return c.json(
				{ success: false, message: "name and message are required." },
				400,
			);
		}
		if (body.givenAt && Number.isNaN(Date.parse(body.givenAt))) {
			return c.json({ success: false, message: "Invalid givenAt date." }, 400);
		}

		const testimonial = await prisma.testimonial.create({
			data: {
				name: body.name.trim(),
				message: body.message.trim(),
				...(body.givenAt && { givenAt: new Date(body.givenAt) }),
			},
		});
		return c.json(
			{ success: true, data: serializeTestimonial(testimonial) },
			201,
		);
	},
);

testimonialsRouter.patch(
	"/testimonials/:id",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		const body = (await c.req.json()) as {
			name?: string;
			message?: string;
			givenAt?: string;
		};
		if (body.givenAt && Number.isNaN(Date.parse(body.givenAt))) {
			return c.json({ success: false, message: "Invalid givenAt date." }, 400);
		}
		try {
			const testimonial = await prisma.testimonial.update({
				where: { id: c.req.param("id") },
				data: {
					...(body.name !== undefined && { name: body.name.trim() }),
					...(body.message !== undefined && {
						message: body.message.trim(),
					}),
					...(body.givenAt !== undefined && {
						givenAt: new Date(body.givenAt),
					}),
				},
			});
			return c.json({ success: true, data: serializeTestimonial(testimonial) });
		} catch (error: any) {
			if (error.code === "P2025") {
				return c.json(
					{ success: false, message: "Testimonial not found." },
					404,
				);
			}
			return c.json({ success: false, message: "Internal server error." }, 500);
		}
	},
);

testimonialsRouter.delete(
	"/testimonials/:id",
	requireAuth,
	requireRole("ADMIN"),
	async (c) => {
		try {
			await prisma.testimonial.delete({ where: { id: c.req.param("id") } });
			return c.json({ success: true });
		} catch (error: any) {
			if (error.code === "P2025") {
				return c.json(
					{ success: false, message: "Testimonial not found." },
					404,
				);
			}
			return c.json({ success: false, message: "Internal server error." }, 500);
		}
	},
);
