/** @jsxImportSource react */
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	Circle,
	Document,
	Font,
	Image,
	Line,
	Page,
	Path,
	pdf,
	Rect,
	StyleSheet,
	Svg,
	Text,
	View,
} from "@react-pdf/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, "fonts");
const ASSETS_DIR = path.join(__dirname, "assets");
const COVER_WREATH_IMAGE = path.join(ASSETS_DIR, "circular-leaves.png");

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
// this font explicitly (see splitMixedScriptRuns/MixedScriptText below).
Font.register({
	family: "Amiri",
	fonts: [
		{ src: path.join(FONTS_DIR, "Amiri-Regular.ttf") },
		{ src: path.join(FONTS_DIR, "Amiri-Bold.ttf"), fontWeight: 700 },
	],
});

const MONTH_NAMES = [
	"January",
	"February",
	"March",
	"April",
	"May",
	"June",
	"July",
	"August",
	"September",
	"October",
	"November",
	"December",
];

export const DEFAULT_THEME_COLOR = "#166534";

const COVER_IMAGE_DIAMETER = 260;
const COVER_RING_WIDTH = 8;
// The wreath artwork's native size (see circular-leaves.png) is 635x597 —
// scaled while preserving that aspect ratio so the leaves aren't stretched
// out of shape. Kept small enough (together with the cover's other sizes/
// margins) that everything still fits on one page even with a logo.
const COVER_WREATH_WIDTH = 400;
const COVER_WREATH_HEIGHT = Math.round(COVER_WREATH_WIDTH * (537 / 575));

export type ReportFont = "HELVETICA" | "POPPINS" | "PT_SERIF";
export type ReportHeaderPattern =
	| "NONE"
	| "LINES"
	| "DOTS"
	| "BLOCKS"
	| "SWIRL";

const FONT_FAMILY: Record<ReportFont, string> = {
	HELVETICA: "Helvetica",
	POPPINS: "Poppins",
	PT_SERIF: "PT Serif",
};

export type ReportDocumentProps = {
	studentName: string;
	studentGenderLabel: string;
	subjectName: string;
	teacherName: string;
	month: number;
	year: number;
	progress: string;
	advice: string;
	score: number;
	scoreDenominator: number;
	gradeLabel: string;
	submittedAtLabel: string | null;
	primaryColor: string;
	documentTitle: string;
	organizationName: string;
	logoUrl: string | null;
	websiteUrl: string | null;
	footerPhone: string | null;
	footerEmail: string | null;
	footerInstagram: string | null;
	font: ReportFont;
	headerPattern: ReportHeaderPattern;
	coverImageUrl: string | null;
};

// Tiled decorative overlay for the header banner, drawn in a fixed
// 595x200 design space (A4 width in points) and scaled to fill the
// container. White at low opacity so header text stays legible over
// any theme color.
function HeaderPatternOverlay({ pattern }: { pattern: ReportHeaderPattern }) {
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
// throughout the rest of the app.
function FooterIcon({
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

// Arabic (plus its Supplement/Extended-A/Presentation Forms blocks) — none
// of Helvetica/Poppins/PT Serif have these glyphs, so any Arabic substring
// inside a free-text field (teachers do write mixed Indonesian/Arabic, e.g.
// listing huruf like "خ ص ض غ") needs to be routed to the Amiri font.
// Interior spaces between Arabic letters/words are swallowed into the same
// run (not split into their own base-font segment) — isolating a single
// space between two single-character font switches produced stray glyph
// artifacts in react-pdf's text layout, and a plain space renders fine in
// Amiri anyway.
const ARABIC_CHARS = "؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿";
const ARABIC_RUN_PATTERN = new RegExp(
	`[${ARABIC_CHARS}]+(?:[ \\t]+[${ARABIC_CHARS}]+)*`,
	"g",
);

function splitMixedScriptRuns(
	text: string,
): { text: string; arabic: boolean }[] {
	const segments: { text: string; arabic: boolean }[] = [];
	let lastIndex = 0;
	for (const match of text.matchAll(ARABIC_RUN_PATTERN)) {
		const start = match.index ?? 0;
		if (start > lastIndex) {
			segments.push({ text: text.slice(lastIndex, start), arabic: false });
		}
		segments.push({ text: match[0], arabic: true });
		lastIndex = start + match[0].length;
	}
	if (lastIndex < text.length) {
		segments.push({ text: text.slice(lastIndex), arabic: false });
	}
	return segments;
}

function MixedScriptText({
	text,
	style,
	baseFontFamily,
}: {
	text: string;
	style: ReturnType<typeof StyleSheet.create>[string];
	baseFontFamily: string;
}) {
	const segments = splitMixedScriptRuns(text);
	return (
		<Text style={style}>
			{segments.map((seg, i) => (
				<Text
					key={`${i}-${seg.text.slice(0, 8)}`}
					style={{ fontFamily: seg.arabic ? "Amiri" : baseFontFamily }}
				>
					{seg.text}
				</Text>
			))}
		</Text>
	);
}

function buildStyles(fontFamily: string) {
	return StyleSheet.create({
		page: {
			fontSize: 11,
			color: "#292524",
			fontFamily,
		},
		coverPage: {
			fontFamily,
			backgroundColor: "#ffffff",
		},
		coverContent: {
			flex: 1,
			paddingTop: 12,
			paddingHorizontal: 48,
			paddingBottom: 28,
		},
		coverOrgRow: {
			flexDirection: "column",
			alignItems: "center",
			gap: 4,
		},
		coverLogo: {
			width: 110,
			height: 110,
			borderRadius: 8,
		},
		coverOrg: {
			fontSize: 30,
			color: "#292524",
			fontWeight: 700,
			letterSpacing: 1,
		},
		coverImageSection: {
			flex: 1,
			alignItems: "center",
			justifyContent: "center",
		},
		coverWreathBox: {
			position: "relative",
			width: COVER_WREATH_WIDTH,
			height: COVER_WREATH_HEIGHT,
			alignItems: "center",
			justifyContent: "center",
		},
		coverWreathImage: {
			position: "absolute",
			top: -6,
			left: -16,
			width: COVER_WREATH_WIDTH,
			height: COVER_WREATH_HEIGHT,
		},
		coverRing: {
			width: COVER_IMAGE_DIAMETER + COVER_RING_WIDTH * 2,
			height: COVER_IMAGE_DIAMETER + COVER_RING_WIDTH * 2,
			borderRadius: (COVER_IMAGE_DIAMETER + COVER_RING_WIDTH * 2) / 2,
			borderWidth: COVER_RING_WIDTH,
			alignItems: "center",
			justifyContent: "center",
		},
		coverImageCircle: {
			width: COVER_IMAGE_DIAMETER,
			height: COVER_IMAGE_DIAMETER,
			borderRadius: COVER_IMAGE_DIAMETER / 2,
			objectFit: "cover",
		},
		coverStudentName: {
			fontSize: 28,
			color: "#292524",
			fontWeight: 700,
		},
		coverTitle: {
			fontSize: 16,
			color: "#57534e",
			letterSpacing: 3,
			marginTop: 6,
		},
		coverMeta: {
			fontSize: 13,
			color: "#78716c",
			marginTop: 10,
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
		gradeRow: {
			flexDirection: "row",
			alignItems: "center",
			gap: 14,
		},
		gradeBox: {
			borderWidth: 1,
			borderStyle: "dashed",
			borderColor: "#292524",
			borderRadius: 6,
			paddingVertical: 10,
			paddingHorizontal: 16,
			alignSelf: "flex-start",
		},
		gradeText: {
			fontSize: 13,
			fontWeight: 700,
			textTransform: "uppercase",
		},
		scoreText: {
			fontSize: 14,
			fontWeight: 700,
			color: "#57534e",
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
	});
}

export function ReportDocument({
	studentName,
	studentGenderLabel,
	subjectName,
	teacherName,
	month,
	year,
	progress,
	advice,
	score,
	scoreDenominator,
	gradeLabel,
	submittedAtLabel,
	primaryColor,
	documentTitle,
	organizationName,
	logoUrl,
	websiteUrl,
	footerPhone,
	footerEmail,
	footerInstagram,
	font,
	headerPattern,
	coverImageUrl,
}: ReportDocumentProps) {
	const period = `${MONTH_NAMES[month - 1] ?? month} ${year}`;
	const styles = buildStyles(FONT_FAMILY[font]);
	const footerParts: {
		kind: "phone" | "mail" | "instagram" | "globe";
		value: string;
	}[] = [];
	if (footerPhone) footerParts.push({ kind: "phone", value: footerPhone });
	if (footerEmail) footerParts.push({ kind: "mail", value: footerEmail });
	if (footerInstagram)
		footerParts.push({ kind: "instagram", value: footerInstagram });
	if (websiteUrl) footerParts.push({ kind: "globe", value: websiteUrl });

	return (
		<Document>
			<Page size="A4" style={styles.coverPage}>
				<View style={styles.coverContent}>
					<View style={styles.coverOrgRow}>
						{logoUrl && <Image src={logoUrl} style={styles.coverLogo} />}
						<Text style={styles.coverOrg}>
							{organizationName.toUpperCase()}
						</Text>
					</View>

					<View style={styles.coverImageSection}>
						<View style={styles.coverWreathBox}>
							<Image src={COVER_WREATH_IMAGE} style={styles.coverWreathImage} />
							<View style={[styles.coverRing, { borderColor: primaryColor }]}>
								{coverImageUrl ? (
									<Image src={coverImageUrl} style={styles.coverImageCircle} />
								) : (
									<View
										style={[
											styles.coverImageCircle,
											{ backgroundColor: primaryColor },
										]}
									/>
								)}
							</View>
						</View>
					</View>

					<View>
						<Text style={styles.coverStudentName}>{studentName}</Text>
						<Text style={styles.coverTitle}>{documentTitle.toUpperCase()}</Text>
						<Text style={styles.coverMeta}>{subjectName}</Text>
						<Text style={styles.coverMeta}>{period}</Text>
					</View>
				</View>
			</Page>

			<Page size="A4" style={styles.page}>
				<View style={[styles.header, { backgroundColor: primaryColor }]}>
					<HeaderPatternOverlay pattern={headerPattern} />
					{logoUrl && <Image src={logoUrl} style={styles.headerLogo} />}
					<Text style={styles.headerTitle}>{documentTitle}</Text>
					<Text style={styles.headerSubtitle}>{period}</Text>

					<View style={styles.biodataRow}>
						<View style={styles.biodataItem}>
							<Text style={styles.biodataLabel}>Nama Pelajar</Text>
							<Text style={styles.biodataValue}>{studentName}</Text>
						</View>
						<View style={styles.biodataItem}>
							<Text style={styles.biodataLabel}>Jenis Kelamin</Text>
							<Text style={styles.biodataValue}>{studentGenderLabel}</Text>
						</View>
						<View style={styles.biodataItem}>
							<Text style={styles.biodataLabel}>Kategori Halaqoh</Text>
							<Text style={styles.biodataValue}>{subjectName}</Text>
						</View>
					</View>
				</View>

				<View style={styles.body}>
					<View style={styles.section} wrap={false}>
						<Text style={styles.sectionLabel}>Progress</Text>
						<MixedScriptText
							text={progress}
							style={styles.sectionText}
							baseFontFamily={FONT_FAMILY[font]}
						/>
					</View>

					<View style={styles.section} wrap={false}>
						<Text style={styles.sectionLabel}>Saran</Text>
						<MixedScriptText
							text={advice}
							style={styles.sectionText}
							baseFontFamily={FONT_FAMILY[font]}
						/>
					</View>

					<View style={styles.section} wrap={false}>
						<Text style={styles.sectionLabel}>Grade Bulanan</Text>
						<View style={styles.gradeRow}>
							<View style={styles.gradeBox}>
								<Text style={styles.gradeText}>{gradeLabel}</Text>
							</View>
							<Text style={styles.scoreText}>
								{score}/{scoreDenominator}
							</Text>
						</View>
					</View>

					<View style={styles.footerRow}>
						<View>
							<Text style={styles.footerLabel}>Dibuat oleh Pengajar</Text>
							<Text style={styles.footerValue}>{teacherName}</Text>
						</View>
						{submittedAtLabel && (
							<View>
								<Text style={styles.footerLabel}>Tanggal Submit</Text>
								<Text style={styles.footerValue}>{submittedAtLabel}</Text>
							</View>
						)}
					</View>
				</View>

				{footerParts.length > 0 && (
					<View style={[styles.bottomBar, { backgroundColor: primaryColor }]}>
						{footerParts.map((part) => (
							<View key={part.kind} style={styles.bottomBarItem}>
								<FooterIcon kind={part.kind} size={10} color="#ffffff" />
								<Text style={styles.bottomBarText}>{part.value}</Text>
							</View>
						))}
					</View>
				)}
			</Page>
		</Document>
	);
}

export async function renderReportPdf(
	props: ReportDocumentProps,
): Promise<Buffer> {
	const stream = await pdf(<ReportDocument {...props} />).toBuffer();
	const chunks: Buffer[] = [];
	for await (const chunk of stream) {
		chunks.push(chunk as Buffer);
	}
	return Buffer.concat(chunks);
}
