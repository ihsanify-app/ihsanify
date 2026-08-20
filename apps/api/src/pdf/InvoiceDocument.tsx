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

export type InvoiceLineData = {
	groupId: string;
	groupName: string;
	subjectName: string;
	teacherName: string;
	price: number;
	sessionCount: number;
};

export type InvoiceDocumentProps = {
	invoiceNumber: string;
	studentName: string;
	month: number;
	year: number;
	issuedAtLabel: string;
	lines: InvoiceLineData[];
	totalPrice: number;
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
		invoiceNumber: {
			fontSize: 11,
			color: "#ffffff",
			opacity: 0.85,
			marginTop: 10,
		},
		priceValue: {
			fontSize: 26,
			fontWeight: 700,
			color: "#292524",
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

export function InvoiceDocument({
	invoiceNumber,
	studentName,
	month,
	year,
	issuedAtLabel,
	lines,
	totalPrice,
	primaryColor,
	organizationName,
	logoUrl,
	websiteUrl,
	footerPhone,
	footerEmail,
	footerInstagram,
	font,
	headerPattern,
}: InvoiceDocumentProps) {
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
					<Text style={styles.headerTitle}>Invoice</Text>
					<Text style={styles.headerSubtitle}>
						{organizationName} — {period}
					</Text>
					<Text style={styles.invoiceNumber}>No. {invoiceNumber}</Text>

					<View style={styles.biodataRow}>
						<View style={styles.biodataItem}>
							<Text style={styles.biodataLabel}>Nama Pelajar</Text>
							<Text style={styles.biodataValue}>{studentName}</Text>
						</View>
						<View style={styles.biodataItem}>
							<Text style={styles.biodataLabel}>Jumlah Kelompok</Text>
							<Text style={styles.biodataValue}>{lines.length}</Text>
						</View>
					</View>
				</View>

				<View style={styles.body}>
					{lines.map((line) => (
						<View key={line.groupId} style={styles.section} wrap={false}>
							<View style={styles.lineRow}>
								<View>
									<Text style={styles.lineGroupName}>{line.groupName}</Text>
									<Text style={styles.lineMeta}>
										{line.subjectName} • {line.teacherName}
									</Text>
								</View>
								<View style={styles.lineRight}>
									<Text style={styles.lineSessionCount}>
										{line.sessionCount} sesi dihadiri
									</Text>
									<Text style={styles.linePrice}>
										{formatPrice(line.price)}
									</Text>
								</View>
							</View>
						</View>
					))}

					<View style={styles.section} wrap={false}>
						<Text style={styles.sectionLabel}>Total Tagihan</Text>
						<Text style={styles.priceValue}>{formatPrice(totalPrice)}</Text>
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

export async function renderInvoicePdf(
	props: InvoiceDocumentProps,
): Promise<Buffer> {
	const stream = await pdf(<InvoiceDocument {...props} />).toBuffer();
	const chunks: Buffer[] = [];
	for await (const chunk of stream) {
		chunks.push(chunk as Buffer);
	}
	return Buffer.concat(chunks);
}
