ALTER TABLE "AthleteProfile" ADD COLUMN "heightCm" DOUBLE PRECISION,
ADD COLUMN "dailyMinutes" JSONB,
ADD COLUMN "inactivityWeeks" INTEGER,
ADD COLUMN "strengthAvailable" BOOLEAN;
ALTER TABLE "TargetRace" ADD COLUMN "priority" TEXT;
