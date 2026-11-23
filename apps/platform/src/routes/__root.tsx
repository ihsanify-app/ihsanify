import { TanStackDevtools } from "@tanstack/react-devtools";
import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useEffect } from "react";
import { useBrandLogo } from "../lib/useBrandLogo";
import appCss from "../styles.css?url";
import "@lmsproject/ui/globals.css";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: "Madrasatul 'Ilmin Naafi'",
			},
			{
				name: "description",
				content:
					"A warm, simple learning platform for teachers, students, and families.",
			},
			// Open Graph / Twitter Card — without these, a share-preview crawler
			// (Threads/Instagram/Facebook, WhatsApp, etc.) has nothing to go on
			// and falls back to guessing an image from the page. It was picking
			// the Instagram social-link icon (one of the only static <img> tags
			// always present in the server-rendered HTML, since the real school
			// logo loads client-side via a hook) instead of the actual logo.
			{ property: "og:type", content: "website" },
			{ property: "og:title", content: "Madrasatul 'Ilmin Naafi'" },
			{
				property: "og:description",
				content:
					"A warm, simple learning platform for teachers, students, and families.",
			},
			{
				property: "og:image",
				content: "https://ilminnaafi.com/landing/logo-mark.png",
			},
			{ property: "og:url", content: "https://ilminnaafi.com/" },
			{ name: "twitter:card", content: "summary" },
			{ name: "twitter:title", content: "Madrasatul 'Ilmin Naafi'" },
			{
				name: "twitter:description",
				content:
					"A warm, simple learning platform for teachers, students, and families.",
			},
			{
				name: "twitter:image",
				content: "https://ilminnaafi.com/landing/logo-mark.png",
			},
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{
				rel: "icon",
				href: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌱</text></svg>",
			},
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	const logoUrl = useBrandLogo();

	useEffect(() => {
		if (!logoUrl) return;
		const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
		if (link) link.href = logoUrl;
	}, [logoUrl]);

	return (
		<html lang="en">
			<head>
				<HeadContent />
			</head>
			<body>
				{children}
				{import.meta.env.DEV && (
					<TanStackDevtools
						config={{
							position: "bottom-right",
						}}
						plugins={[
							{
								name: "Tanstack Router",
								render: <TanStackRouterDevtoolsPanel />,
							},
						]}
					/>
				)}
				<Scripts />
			</body>
		</html>
	);
}
