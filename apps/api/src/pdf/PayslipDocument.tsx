/** @jsxImportSource react */
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
	buildFooterParts,
	buildSharedStyles,
	FONT_FAMILY,
	FooterIcon,
	HeaderPatternOverlay,
	type ReportFont,
	type ReportHeaderPattern,
} from "./shared";

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

export type PayslipLineData = {
	groupId: string;
	studentId: string;
	groupName: string;
	studentName: string;
	groupTypeLabel: string;
	sessionsAttended: number;
	sessionsTotal: number;
	rate: number;
};

export type PayslipDocumentProps = {
	teacherName: string;
	month: number;
	year: number;
	issuedAtLabel: string;
	lines: PayslipLineData[];
	totalPayment: number;
	primaryColor: string;
	organizationName: string;
	logoUrl: string | null;
	websiteUrl: string | null;
	footerPhone: string | null;
	footerEmail: string | null;
	footerInstagram: string | null;
	font: ReportFont;
	headerPattern: ReportHeaderPattern;
};

function formatPrice(price: number) {
	return `Rp ${price.toLocaleString("id-ID")}`;
}

function buildStyles(fontFamily: string) {
	return StyleSheet.create({
		...buildSharedStyles(fontFamily),
		priceValue: {
			fontSize: 26,
			fontWeight: 700,
			color: "#292524",
		},
		totalAlignRight: {
			textAlign: "right",
		},
		lineRow: {
			flexDirection: "row",
			justifyContent: "space-between",
			alignItems: "flex-start",
		},
		lineGroupName: {
			fontSize: 15,
			fontWeight: 700,
			color: "#292524",
		},
		lineMeta: {
			fontSize: 11,
			color: "#78716c",
			marginTop: 2,
		},
		lineRight: {
			alignItems: "flex-end",
		},
		lineSessionCount: {
			fontSize: 11,
			color: "#78716c",
		},
		linePrice: {
			fontSize: 15,
			fontWeight: 700,
			color: "#292524",
			marginTop: 2,
		},
	});
}

// A payslip is the teacher's own pay statement — it deliberately shows only
// their per-line rate/earnings, never the parent-facing `price` (what the
// school billed the family). That's a separate figure the school keeps for
// its own margin and isn't the teacher's business.
export function PayslipDocument({
	teacherName,
	month,
	year,
	issuedAtLabel,
	lines,
	totalPayment,
	primaryColor,
	organizationName,
	logoUrl,
	websiteUrl,
	footerPhone,
	footerEmail,
	footerInstagram,
	font,
	headerPattern,
}: PayslipDocumentProps) {
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
			<Page size="A4" style={styles.page}>
				<View style={[styles.header, { backgroundColor: primaryColor }]}>
					<HeaderPatternOverlay pattern={headerPattern} />
					{logoUrl && <Image src={logoUrl} style={styles.headerLogo} />}
					<Text style={styles.headerTitle}>Payslip</Text>
					<Text style={styles.headerSubtitle}>
						{organizationName} — {period}
					</Text>

					<View style={styles.biodataRow}>
						<View style={styles.biodataItem}>
							<Text style={styles.biodataLabel}>Teacher</Text>
							<Text style={styles.biodataValue}>{teacherName}</Text>
						</View>
						<View style={styles.biodataItem}>
							<Text style={styles.biodataLabel}>Jumlah Kelompok</Text>
							<Text style={styles.biodataValue}>
								{new Set(lines.map((l) => l.groupId)).size}
							</Text>
						</View>
					</View>
				</View>

				<View style={styles.body}>
					{lines.map((line) => (
						<View
							key={`${line.groupId}-${line.studentId}`}
							style={styles.section}
							wrap={false}
						>
							<View style={styles.lineRow}>
								<View>
									<Text style={styles.lineGroupName}>{line.groupName}</Text>
									<Text style={styles.lineMeta}>
										{line.studentName} • {line.groupTypeLabel}
									</Text>
								</View>
								<View style={styles.lineRight}>
									<Text style={styles.lineSessionCount}>
										{line.sessionsAttended}/{line.sessionsTotal} sesi dihadiri
									</Text>
									<Text style={styles.linePrice}>{formatPrice(line.rate)}</Text>
								</View>
							</View>
						</View>
					))}

					<View style={styles.section} wrap={false}>
						<Text style={[styles.sectionLabel, styles.totalAlignRight]}>
							Total Payment
						</Text>
						<Text style={[styles.priceValue, styles.totalAlignRight]}>
							{formatPrice(totalPayment)}
						</Text>
					</View>

					<View style={styles.footerRow}>
						<View>
							<Text style={styles.footerLabel}>Tanggal Terbit</Text>
							<Text style={styles.footerValue}>{issuedAtLabel}</Text>
						</View>
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

export async function renderPayslipPdf(
	props: PayslipDocumentProps,
): Promise<Buffer> {
	const stream = await pdf(<PayslipDocument {...props} />).toBuffer();
	const chunks: Buffer[] = [];
	for await (const chunk of stream) {
		chunks.push(chunk as Buffer);
	}
	return Buffer.concat(chunks);
}
