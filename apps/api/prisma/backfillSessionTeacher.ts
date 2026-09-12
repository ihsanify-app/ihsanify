// One-time backfill for the `Session.teacherId` column (see the migration
// `add_teacher_id_to_session`): existing rows predate that column, so this
// computes who was actually assigned to teach each session's group *as of
// that session's own date* — the same historical-replay logic new sessions
// use at creation time — and writes it in. Safe to re-run; it only touches
// rows where teacherId is still null.
//
// Some sessions predate their group's earliest recorded assignment (seed
// data with fabricated historical session dates is the known cause — see
// SOLUTION.md). For those, we only guess if the group has had exactly one
// teacher for its entire recorded history (a single ASSIGN, never a
// REMOVED) — there's no real ambiguity about who else it could have been.
// Groups with more than one teacher ever, or none at all, are left null
// and reported for manual review instead of guessed at.
import { getCurrentTeacherId } from "../src/utils/groupState";
import { prisma } from "../src/utils/prisma";

async function main() {
	const sessions = await prisma.session.findMany({
		where: { teacherId: null },
		select: { id: true, groupId: true, date: true },
	});

	console.log(`Found ${sessions.length} session(s) to backfill.`);

	// groupId -> the one teacher ever assigned, or null if not safe to assume.
	const soleTeacherByGroup = new Map<string, string | null>();
	const ambiguousGroups = new Set<string>();
	const neverAssignedGroups = new Set<string>();

	let resolvedDirectly = 0;
	let resolvedBySoleTeacherFallback = 0;
	let leftUnresolved = 0;

	for (const session of sessions) {
		const direct = await getCurrentTeacherId(session.groupId, session.date);
		if (direct) {
			await prisma.session.update({
				where: { id: session.id },
				data: { teacherId: direct },
			});
			resolvedDirectly++;
			continue;
		}

		if (!soleTeacherByGroup.has(session.groupId)) {
			const history = await prisma.groupTeacher.findMany({
				where: { groupId: session.groupId },
				orderBy: { date: "asc" },
			});
			const everRemoved = history.some((h) => h.action === "REMOVED");
			const distinctTeachers = new Set(history.map((h) => h.teacherId));
			if (!everRemoved && distinctTeachers.size === 1) {
				soleTeacherByGroup.set(session.groupId, history[0].teacherId);
			} else {
				soleTeacherByGroup.set(session.groupId, null);
				if (history.length === 0) neverAssignedGroups.add(session.groupId);
				else ambiguousGroups.add(session.groupId);
			}
		}

		const soleTeacherId = soleTeacherByGroup.get(session.groupId);
		if (soleTeacherId) {
			await prisma.session.update({
				where: { id: session.id },
				data: { teacherId: soleTeacherId },
			});
			resolvedBySoleTeacherFallback++;
		} else {
			leftUnresolved++;
		}
	}

	console.log(
		`Resolved directly (assignment recorded by session date): ${resolvedDirectly}`,
	);
	console.log(
		`Resolved via sole-teacher-ever fallback: ${resolvedBySoleTeacherFallback}`,
	);
	console.log(`Left unresolved: ${leftUnresolved}`);
	if (ambiguousGroups.size > 0) {
		console.log(
			`\nGroups with more than one teacher ever — needs manual review:\n  ${[...ambiguousGroups].join("\n  ")}`,
		);
	}
	if (neverAssignedGroups.size > 0) {
		console.log(
			`\nGroups with no teacher ever recorded — needs manual review:\n  ${[...neverAssignedGroups].join("\n  ")}`,
		);
	}
}

main()
	.catch((err) => {
		console.error(err);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
