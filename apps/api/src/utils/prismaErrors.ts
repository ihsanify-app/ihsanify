import { Prisma } from "../generated/prisma/client";

// Prisma error codes we translate into user-facing API responses:
// P2002 unique-constraint violation, P2003 foreign-key constraint,
// P2025 record not found. Anything else is rethrown so the global
// error handler turns it into a 500 instead of being swallowed here.
export function isPrismaErrorCode(
	error: unknown,
	code: string,
): error is Prisma.PrismaClientKnownRequestError {
	return (
		error instanceof Prisma.PrismaClientKnownRequestError && error.code === code
	);
}
