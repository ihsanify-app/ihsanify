import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sprout } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");
	const navigate = useNavigate();

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (!email || !password) {
			setError("Email and password is required.");
			return;
		}
		setIsLoading(true);
		setError("");
		try {
			const res = await fetch("http://localhost:8000/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});
			const data = await res.json();
			if (!res.ok) {
				setError(data.message);
				return;
			}
			localStorage.setItem("token", data.body);
			alert("Login is successful! Redirecting...");
			navigate({ to: "/dashboard" });
			console.log(data);
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
					<input
						className="border border-stone-300 focus:border-green-500 rounded-xl px-4 py-3 w-full outline-none transition-colors"
						type="password"
						placeholder="Enter your password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
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
