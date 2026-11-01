export type DbDifficultyLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type ApiDifficultyLevel = "beginner" | "intermediate" | "advanced";

export function toApiLevel(level: DbDifficultyLevel): ApiDifficultyLevel {
	return level.toLowerCase() as ApiDifficultyLevel;
}

export function toDbLevel(level: ApiDifficultyLevel): DbDifficultyLevel {
	return level.toUpperCase() as DbDifficultyLevel;
}

export function isApiLevel(value: unknown): value is ApiDifficultyLevel {
	return (
		value === "beginner" || value === "intermediate" || value === "advanced"
	);
}
