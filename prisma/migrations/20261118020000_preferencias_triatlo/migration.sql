ALTER TABLE "AthleteProfile" ADD COLUMN "planningPreferences" JSONB;
ALTER TABLE "Workout" ADD COLUMN "paused" BOOLEAN NOT NULL DEFAULT false;
