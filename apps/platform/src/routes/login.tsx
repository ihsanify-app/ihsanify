import { createFileRoute } from "@tanstack/react-router";
import { Eye, EyeOff, Sprout } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "../lib/apiClient";
import { setStoredAuth } from "../lib/auth";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (!email || !password) {
			setError("Email and password is required.");
			return;
		}
		setIsLoading(true);
		setError("");
		try {
			const { ok, body } = await apiFetch("/auth/login", {
				method: "POST",
				body: JSON.stringify({ email, password }),
			});
			if (!ok || !body?.success) {
				setError(body?.message ?? "Something went wrong. Please try again.");
				return;
			}
			setStoredAuth(
				{
					id: body.data.user.id,
					teacherId: null,
					studentId: null,
					role: body.data.user.role.toLowerCase(),
					name: body.data.user.name,
				},
				body.data.token,
			);
			// Full page navigation so authUser (read once at module load) picks up
			// the freshly stored auth instead of the stale pre-login value.
			window.location.href = "/dashboard";
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setIsLoading(false);
		}
	}
	return (
		<section className="flex items-center justify-center mx-auto w-full max-w-sm p-6 min-h-screen bg-green-50">
			<form
				onSubmit={handleSubmit}
				className="w-full flex flex-col gap-8 bg-white p-10 rounded-3xl shadow-lg border border-green-100"
			>
				<div className="flex flex-col items-center gap-2">
					<div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
						<Sprout className="text-green-700" size={28} />
					</div>
					<h2 className="text-2xl font-heading font-bold text-green-800">
						Welcome Back
					</h2>
					<p className="text-sm text-stone-500">Log in to continue learning</p>
				</div>
				<div className="flex flex-col gap-4">
					<input
						className="border border-stone-300 focus:border-green-500 rounded-xl px-4 py-3 w-full outline-none transition-colors"
						type="email"
						placeholder="Enter your email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
					<div className="relative">
						<input
							className="border border-stone-300 focus:border-green-500 rounded-xl px-4 py-3 pr-11 w-full outline-none transition-colors"
							type={showPassword ? "text" : "password"}
							placeholder="Enter your password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
						/>
						<button
							type="button"
							onClick={() => setShowPassword((prev) => !prev)}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
							aria-label={showPassword ? "Hide password" : "Show password"}
						>
							{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
						</button>
					</div>
					{error && (
						<p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2">
							{error}
						</p>
					)}
				</div>
				<button
					type="submit"
					disabled={isLoading}
					className="cursor-pointer bg-green-600 hover:bg-green-700 disabled:opacity-60 transition-colors text-white font-semibold w-full py-3 rounded-full"
				>
					{isLoading ? "Logging In..." : "Log In"}
				</button>
			</form>
		</section>
	);
}
