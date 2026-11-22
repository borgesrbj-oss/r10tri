-- AlterTable
ALTER TABLE "Workout" ADD COLUMN     "coachManaged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "coachPublicationId" TEXT;

-- CreateTable
CREATE TABLE "CoachAthlete" (
    "id" TEXT NOT NULL,
    "coachId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "revision" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "CoachAthlete_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachDraft" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL,
    "instructions" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachPublication" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "changes" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachPublication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachAudit" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachAudit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachAthlete_athleteId_status_idx" ON "CoachAthlete"("athleteId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CoachAthlete_coachId_athleteId_key" ON "CoachAthlete"("coachId", "athleteId");

-- CreateIndex
CREATE INDEX "CoachDraft_linkId_status_idx" ON "CoachDraft"("linkId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CoachPublication_draftId_key" ON "CoachPublication"("draftId");

-- CreateIndex
CREATE INDEX "CoachPublication_linkId_createdAt_idx" ON "CoachPublication"("linkId", "createdAt");

-- CreateIndex
CREATE INDEX "CoachAudit_linkId_createdAt_idx" ON "CoachAudit"("linkId", "createdAt");

-- AddForeignKey
ALTER TABLE "CoachAthlete" ADD CONSTRAINT "CoachAthlete_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachAthlete" ADD CONSTRAINT "CoachAthlete_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachDraft" ADD CONSTRAINT "CoachDraft_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "CoachAthlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachPublication" ADD CONSTRAINT "CoachPublication_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "CoachAthlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachPublication" ADD CONSTRAINT "CoachPublication_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "CoachDraft"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachAudit" ADD CONSTRAINT "CoachAudit_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "CoachAthlete"("id") ON DELETE CASCADE ON UPDATE CASCADE;

