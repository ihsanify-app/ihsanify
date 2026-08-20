/** @jsxImportSource react */
import path from "node:path";
import {
	Document,
	Image,
	Page,
	pdf,
	StyleSheet,
	Text,
	View,
} from "@react-pdf/renderer";
import {
	ASSETS_DIR,
	buildFooterParts,
	buildSharedStyles,
	FONT_FAMILY,
	FooterIcon,
	HeaderPatternOverlay,
	type ReportFont,
	type ReportHeaderPattern,
} from "./shared";

export { DEFAULT_THEME_COLOR } from "./shared";

const COVER_WREATH_IMAGE = path.join(ASSETS_DIR, "circular-leaves.png");

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

const COVER_IMAGE_DIAMETER = 260;
const COVER_RING_WIDTH = 8;
// The wreath artwork's native size (see circular-leaves.png) is 635x597 —
// scaled while preserving that aspect ratio so the leaves aren't stretched
// out of shape. Kept small enough (together with the cover's other sizes/
// margins) that everything still fits on one page even with a logo.
const COVER_WREATH_WIDTH = 400;
const COVER_WREATH_HEIGHT = Math.round(COVER_WREATH_WIDTH * (537 / 575));

export type { ReportFont, ReportHeaderPattern };

export type ReportDocumentProps = {
	studentName: string;
	studentGenderLabel: string;
	subjectName: string;
	groupTypeLabel: string;
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
		...buildSharedStyles(fontFamily),
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
	});
}

export function ReportDocument({
	studentName,
	studentGenderLabel,
	subjectName,
	groupTypeLabel,
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
	const footerParts = buildFooterParts({
		footerPhone,
		footerEmail,
		footerInstagram,
		websiteUrl,
	});

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
						<View style={styles.biodataItem}>
							<Text style={styles.biodataLabel}>Tipe Kelas</Text>
							<Text style={styles.biodataValue}>{groupTypeLabel}</Text>
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
