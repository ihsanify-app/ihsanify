/** @jsxImportSource react */
import {
	Document,
	Page,
	pdf,
	StyleSheet,
	Text,
	View,
} from "@react-pdf/renderer";

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

export type ReportDocumentProps = {
	studentName: string;
	studentGenderLabel: string;
	subjectName: string;
	teacherName: string;
	month: number;
	year: number;
	title: string;
	progress: string;
	advice: string;
	gradeLabel: string;
	submittedAtLabel: string | null;
	primaryColor: string;
};

const styles = StyleSheet.create({
	page: {
		fontSize: 11,
		color: "#292524",
	},
	header: {
		paddingVertical: 28,
		paddingHorizontal: 36,
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
	footer: {
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
		height: 14,
		marginTop: "auto",
	},
});

export function ReportDocument({
	studentName,
	studentGenderLabel,
	subjectName,
	teacherName,
	month,
	year,
	title,
	progress,
	advice,
	gradeLabel,
	submittedAtLabel,
	primaryColor,
}: ReportDocumentProps) {
	const period = `${MONTH_NAMES[month - 1] ?? month} ${year}`;

	return (
		<Document>
			<Page size="A4" style={styles.page}>
				<View style={[styles.header, { backgroundColor: primaryColor }]}>
					<Text style={styles.headerTitle}>Laporan Belajar</Text>
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
						<Text style={styles.sectionLabel}>{title}</Text>
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

					<View style={styles.footer}>
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

				<View style={[styles.bottomBar, { backgroundColor: primaryColor }]} />
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
