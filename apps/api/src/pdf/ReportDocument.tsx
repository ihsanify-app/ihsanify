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
	pdf,
	Rect,
	StyleSheet,
	Svg,
	Text,
	View,
} from "@react-pdf/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, "fonts");

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
	reportTitle: string;
	progress: string;
	advice: string;
	gradeLabel: string;
	submittedAtLabel: string | null;
	primaryColor: string;
	documentTitle: string;
	organizationName: string;
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

function buildStyles(fontFamily: string) {
	return StyleSheet.create({
		page: {
			fontSize: 11,
			color: "#292524",
			fontFamily,
		},
		coverPage: {
			fontFamily,
		},
		coverBackground: {
			position: "absolute",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
		},
		coverTint: {
			position: "absolute",
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			opacity: 0.55,
		},
		coverContent: {
			flex: 1,
			justifyContent: "space-between",
			padding: 48,
		},
		coverOrg: {
			fontSize: 13,
			color: "#ffffff",
			fontWeight: 700,
			letterSpacing: 1,
		},
		coverTitle: {
			fontSize: 30,
			color: "#ffffff",
			fontWeight: 700,
		},
		coverStudentName: {
			fontSize: 22,
			color: "#ffffff",
			fontWeight: 700,
			marginTop: 8,
		},
		coverMeta: {
			fontSize: 13,
			color: "#ffffff",
			marginTop: 4,
		},
		header: {
			position: "relative",
			paddingVertical: 28,
			paddingHorizontal: 36,
			overflow: "hidden",
		},
		headerTitle: {
			fontSize: 22,
			fontWeight: 700,
			color: "#ffffff",
		},
		headerSubtitle: {
			fontSize: 13,
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
			padding: 36,
		},
		section: {
			marginBottom: 18,
		},
		sectionLabel: {
			fontSize: 10,
			fontWeight: 700,
			textTransform: "uppercase",
			color: "#57534e",
			marginBottom: 6,
		},
		sectionText: {
			fontSize: 11,
			lineHeight: 1.5,
			color: "#292524",
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
		footerRow: {
			marginTop: 30,
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
	reportTitle,
	progress,
	advice,
	gradeLabel,
	submittedAtLabel,
	primaryColor,
	documentTitle,
	organizationName,
	footerPhone,
	footerEmail,
	footerInstagram,
	font,
	headerPattern,
	coverImageUrl,
}: ReportDocumentProps) {
	const period = `${MONTH_NAMES[month - 1] ?? month} ${year}`;
	const styles = buildStyles(FONT_FAMILY[font]);
	const footerParts = [
		footerPhone && `P: ${footerPhone}`,
		footerEmail && `E: ${footerEmail}`,
		footerInstagram && `IG: ${footerInstagram}`,
	].filter(Boolean);

	return (
		<Document>
			<Page size="A4" style={styles.coverPage}>
				{coverImageUrl ? (
					<Image src={coverImageUrl} style={styles.coverBackground} />
				) : (
					<View
						style={[styles.coverBackground, { backgroundColor: primaryColor }]}
					/>
				)}
				{coverImageUrl && (
					<View style={[styles.coverTint, { backgroundColor: primaryColor }]} />
				)}
				<View style={styles.coverContent}>
					<Text style={styles.coverOrg}>{organizationName.toUpperCase()}</Text>
					<View>
						<Text style={styles.coverTitle}>{documentTitle}</Text>
						<Text style={styles.coverStudentName}>{studentName}</Text>
						<Text style={styles.coverMeta}>{subjectName}</Text>
						<Text style={styles.coverMeta}>{period}</Text>
					</View>
				</View>
			</Page>

			<Page size="A4" style={styles.page}>
				<View style={[styles.header, { backgroundColor: primaryColor }]}>
					<HeaderPatternOverlay pattern={headerPattern} />
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
					<View style={styles.section}>
						<Text style={styles.sectionLabel}>{reportTitle}</Text>
					</View>

					<View style={styles.section}>
						<Text style={styles.sectionLabel}>Progress</Text>
						<Text style={styles.sectionText}>{progress}</Text>
					</View>

					<View style={styles.section}>
						<Text style={styles.sectionLabel}>Saran</Text>
						<Text style={styles.sectionText}>{advice}</Text>
					</View>

					<View style={styles.section}>
						<Text style={styles.sectionLabel}>Grade Bulanan</Text>
						<View style={styles.gradeBox}>
							<Text style={styles.gradeText}>{gradeLabel}</Text>
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
							<Text key={part} style={styles.bottomBarText}>
								{part}
							</Text>
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
