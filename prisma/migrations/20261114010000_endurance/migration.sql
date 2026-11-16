-- AlterTable
ALTER TABLE "User" ADD COLUMN     "authVersion" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "username" TEXT;

-- AlterTable
ALTER TABLE "AthleteProfile" ADD COLUMN     "maxHeartRate" INTEGER,
ADD COLUMN     "recentRaceDate" TIMESTAMP(3),
ADD COLUMN     "recentRaceDistanceKm" DOUBLE PRECISION,
ADD COLUMN     "recentRaceTimeSeconds" INTEGER,
ADD COLUMN     "restingHeartRate" INTEGER,
ADD COLUMN     "runThresholdPace" TEXT,
ADD COLUMN     "swimCssPace" TEXT,
ADD COLUMN     "thresholdHeartRate" INTEGER;

-- AlterTable
ALTER TABLE "TrainingPlan" ADD COLUMN     "summary" JSONB;

-- AlterTable
ALTER TABLE "Workout" ADD COLUMN     "structure" JSONB;

-- AlterTable
ALTER TABLE "WorkoutLog" ADD COLUMN     "fatigueScore" INTEGER,
ADD COLUMN     "painScore" INTEGER,
ADD COLUMN     "sleepHours" DOUBLE PRECISION;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
