ALTER TABLE "AthleteProfile" ADD COLUMN "carbohydrateRateGPerHour" DOUBLE PRECISION;

ALTER TABLE "TargetRace" ADD COLUMN "segmentTargets" JSONB;

ALTER TABLE "WorkoutLog"
  ADD COLUMN "normalizedPowerWatts" DOUBLE PRECISION,
  ADD COLUMN "averagePowerWatts" DOUBLE PRECISION,
  ADD COLUMN "metricThreshold" JSONB;
