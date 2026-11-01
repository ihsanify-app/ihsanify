-- CreateTable
CREATE TABLE "QuestionSetAttempt" (
    "id" TEXT NOT NULL,
    "questionSetId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuestionSetAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionAttemptAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,

    CONSTRAINT "QuestionAttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "QuestionSetAttempt_questionSetId_studentId_key" ON "QuestionSetAttempt"("questionSetId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionAttemptAnswer_attemptId_questionId_key" ON "QuestionAttemptAnswer"("attemptId", "questionId");

-- AddForeignKey
ALTER TABLE "QuestionSetAttempt" ADD CONSTRAINT "QuestionSetAttempt_questionSetId_fkey" FOREIGN KEY ("questionSetId") REFERENCES "QuestionSet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionSetAttempt" ADD CONSTRAINT "QuestionSetAttempt_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttemptAnswer" ADD CONSTRAINT "QuestionAttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "QuestionSetAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttemptAnswer" ADD CONSTRAINT "QuestionAttemptAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionAttemptAnswer" ADD CONSTRAINT "QuestionAttemptAnswer_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "QuestionOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
