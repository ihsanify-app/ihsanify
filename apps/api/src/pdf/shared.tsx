/** @jsxImportSource react */
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	Circle,
	Font,
	Line,
	Path,
	Rect,
	type StyleSheet,
	Svg,
} from "@react-pdf/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const FONTS_DIR = path.join(__dirname, "fonts");
export const ASSETS_DIR = path.join(__dirname, "assets");

Font.register({
	family: "Poppins",
	fonts: [
		{ src: path.join(FONTS_DIR, "Poppins-Regular.ttf") },
		{ src: path.join(FONTS_DIR, "Poppins-Bold.ttf"), fontWeight: 700 },
	],
});
Font.register({
	family: "PT Serif",
	fonts: [
		{ src: path.join(FONTS_DIR, "PTSerif-Regular.ttf") },
		{ src: path.join(FONTS_DIR, "PTSerif-Bold.ttf"), fontWeight: 700 },
	],
});
// Amiri is a classical Naskh typeface with proper Arabic shaping (GSUB
// contextual forms/ligatures) — none of the Latin fonts above have Arabic
// glyphs at all, so free-text fields need to route Arabic runs through
// this font explicitly (see splitMixedScriptRuns/MixedScriptText in
// ReportDocument.tsx).
Font.register({
	family: "Amiri",
	fonts: [
		{ src: path.join(FONTS_DIR, "Amiri-Regular.ttf") },
		{ src: path.join(FONTS_DIR, "Amiri-Bold.ttf"), fontWeight: 700 },
	],
});

export const DEFAULT_THEME_COLOR = "#166534";

export type ReportFont = "HELVETICA" | "POPPINS" | "PT_SERIF";
export type ReportHeaderPattern =
	| "NONE"
	| "LINES"
	| "DOTS"
	| "BLOCKS"
	| "SWIRL";

export const FONT_FAMILY: Record<ReportFont, string> = {
	HELVETICA: "Helvetica",
	POPPINS: "Poppins",
	PT_SERIF: "PT Serif",
};

// Tiled decorative overlay for the header banner, drawn in a fixed
// 595x200 design space (A4 width in points) and scaled to fill the
// container. White at low opacity so header text stays legible over
// any theme color. Shared by every document that uses the colored
// header banner (reports, invoices).
export function HeaderPatternOverlay({
	pattern,
}: {
	pattern: ReportHeaderPattern;
}) {
	if (pattern === "NONE") return null;

	const W = 595;
	const H = 200;
	const stroke = "#ffffff";
	const opacity = 0.18;

	if (pattern === "LINES") {
		const lines = [];
		for (let x = -H; x < W + H; x += 26) {
			lines.push(
				<Line
					key={x}
					x1={x}
					y1={H}
					x2={x + H}
					y2={0}
					stroke={stroke}
					strokeWidth={2}
					opacity={opacity}
				/>,
			);
		}
		return (
			<Svg
				viewBox={`0 0 ${W} ${H}`}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
				}}
			>
				{lines}
			</Svg>
		);
	}

	if (pattern === "DOTS") {
		const dots = [];
		for (let y = 10; y < H; y += 22) {
			for (let x = 10; x < W; x += 22) {
				dots.push(
					<Circle
						key={`${x}-${y}`}
						cx={x}
						cy={y}
						r={2.2}
						fill={stroke}
						opacity={opacity}
					/>,
				);
			}
		}
		return (
			<Svg
				viewBox={`0 0 ${W} ${H}`}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
				}}
			>
				{dots}
			</Svg>
		);
	}

	if (pattern === "BLOCKS") {
		const blocks = [];
		const size = 16;
		const gap = 10;
		for (let y = 8, row = 0; y < H; y += size + gap, row++) {
			for (
				let x = row % 2 === 0 ? 8 : 8 + (size + gap) / 2;
				x < W;
				x += size + gap
			) {
				blocks.push(
					<Rect
						key={`${x}-${y}`}
						x={x}
						y={y}
						width={size}
						height={size}
						rx={3}
						fill={stroke}
						opacity={opacity}
					/>,
				);
			}
		}
		return (
			<Svg
				viewBox={`0 0 ${W} ${H}`}
				style={{
					position: "absolute",
					top: 0,
					left: 0,
					width: "100%",
					height: "100%",
				}}
			>
				{blocks}
			</Svg>
		);
	}

	// SWIRL — overlapping circles of varying size, loosely scattered, to
	// suggest a soft bubble/swirl motif without needing true spiral paths.
	const circles = [];
	const seedPositions = [
		[40, 30, 26],
		[140, 90, 40],
		[260, 40, 20],
		[360, 120, 34],
		[480, 50, 28],
		[80, 150, 18],
		[220, 160, 30],
		[400, 30, 16],
		[540, 130, 24],
		[20, 100, 14],
		[320, 170, 22],
		[480, 170, 18],
	];
	for (const [cx, cy, r] of seedPositions) {
		circles.push(
			<Circle
				key={`${cx}-${cy}`}
				cx={cx}
				cy={cy}
				r={r}
				stroke={stroke}
				strokeWidth={2}
				fill="none"
				opacity={opacity}
			/>,
		);
	}
	return (
		<Svg
			viewBox={`0 0 ${W} ${H}`}
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				width: "100%",
				height: "100%",
			}}
		>
			{circles}
		</Svg>
	);
}

// Simple icon glyphs for the footer, redrawn from lucide's (ISC-licensed)
// 24x24 stroke path data so the PDF's footer icons match the ones used
// throughout the rest of the app. Shared by every document with a
// contact-info footer bar (reports, invoices).
export function FooterIcon({
	kind,
	size,
	color,
}: {
	kind: "phone" | "mail" | "instagram" | "globe";
	size: number;
	color: string;
}) {
	const common = {
		stroke: color,
		strokeWidth: 2,
		strokeLinecap: "round" as const,
		strokeLinejoin: "round" as const,
		fill: "none",
	};

	return (
		<Svg viewBox="0 0 24 24" style={{ width: size, height: size }}>
			{kind === "phone" && (
				<Path
					d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"
					{...common}
				/>
			)}
			{kind === "mail" && (
				<>
					<Path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" {...common} />
					<Rect x={2} y={4} width={20} height={16} rx={2} {...common} />
				</>
			)}
			{kind === "instagram" && (
				<>
					<Rect x={2} y={2} width={20} height={20} rx={5} ry={5} {...common} />
					<Path
						d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"
						{...common}
					/>
					<Line x1={17.5} y1={6.5} x2={17.51} y2={6.5} {...common} />
				</>
			)}
			{kind === "globe" && (
				<>
					<Circle cx={12} cy={12} r={10} {...common} />
					<Path
						d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"
						{...common}
					/>
					<Path d="M2 12h20" {...common} />
				</>
			)}
		</Svg>
	);
}

// The header banner / bordered-section / footer-bar look shared by every
// document built on this style (reports, invoices). Each document's own
// buildStyles() spreads this into its own StyleSheet.create() call and
// adds whatever's specific to it (e.g. the report's cover-page styles).
export function buildSharedStyles(fontFamily: string) {
	return {
		page: {
			fontSize: 11,
			color: "#292524",
			fontFamily,
		},
		header: {
			position: "relative",
			paddingVertical: 28,
			paddingHorizontal: 36,
			overflow: "hidden",
		},
		headerLogo: {
			position: "absolute",
			top: 28,
			right: 36,
			width: 80,
			height: 80,
			borderRadius: 8,
		},
		headerTitle: {
			fontSize: 28,
			fontWeight: 700,
			color: "#ffffff",
		},
		headerSubtitle: {
			fontSize: 15,
			color: "#ffffff",
			marginTop: 2,
		},
		biodataRow: {
			flexDirection: "row",
			marginTop: 18,
			gap: 24,
		},
		biodataItem: {
			flex: 1,
		},
		biodataLabel: {
			fontSize: 9,
			color: "#ffffff",
			opacity: 0.8,
			textTransform: "uppercase",
		},
		biodataValue: {
			fontSize: 12,
			color: "#ffffff",
			marginTop: 2,
			fontWeight: 700,
		},
		body: {
			flex: 1,
			padding: 36,
		},
		section: {
			// marginTop (rather than relying on the parent's padding) so this
			// still applies when the section lands at the top of an overflow
			// page — react-pdf doesn't replay a fragmented container's own
			// top padding on continuation pages, but a child's own margin
			// still applies wherever it's placed.
			marginTop: 20,
			marginBottom: 16,
			borderWidth: 1,
			borderColor: "#d6d3d1",
			borderRadius: 10,
			padding: 14,
		},
		sectionLabel: {
			fontSize: 18,
			fontWeight: 700,
			textTransform: "uppercase",
			color: "#57534e",
			marginBottom: 6,
		},
		sectionText: {
			fontSize: 17,
			lineHeight: 1.5,
			color: "#292524",
		},
		footerRow: {
			marginTop: "auto",
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "flex-end",
		},
		footerLabel: {
			fontSize: 9,
			color: "#78716c",
		},
		footerValue: {
			fontSize: 11,
			fontWeight: 700,
			marginTop: 2,
		},
		bottomBar: {
			marginTop: "auto",
			paddingVertical: 8,
			paddingHorizontal: 36,
			flexDirection: "row",
			justifyContent: "center",
			gap: 16,
		},
		bottomBarItem: {
			flexDirection: "row",
			alignItems: "center",
			gap: 5,
		},
		bottomBarText: {
			fontSize: 9,
			color: "#ffffff",
		},
	} satisfies Record<string, ReturnType<typeof StyleSheet.create>[string]>;
}

export type FooterContactPart = {
	kind: "phone" | "mail" | "instagram" | "globe";
	value: string;
};

// Shared shape for the bottom contact bar's inputs — every document that
// has one builds this list the same way.
export function buildFooterParts(contact: {
	footerPhone: string | null;
	footerEmail: string | null;
	footerInstagram: string | null;
	websiteUrl: string | null;
}): FooterContactPart[] {
	const parts: FooterContactPart[] = [];
	if (contact.footerPhone)
		parts.push({ kind: "phone", value: contact.footerPhone });
	if (contact.footerEmail)
		parts.push({ kind: "mail", value: contact.footerEmail });
	if (contact.footerInstagram)
		parts.push({ kind: "instagram", value: contact.footerInstagram });
	if (contact.websiteUrl)
		parts.push({ kind: "globe", value: contact.websiteUrl });
	return parts;
}
