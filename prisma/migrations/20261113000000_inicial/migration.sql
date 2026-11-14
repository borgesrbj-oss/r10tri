-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'atleta',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoachMessage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "coachId" TEXT,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "AthleteProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentWeight" DOUBLE PRECISION,
    "targetWeight" DOUBLE PRECISION,
    "level" TEXT NOT NULL DEFAULT 'intermediario',
    "modality" TEXT NOT NULL DEFAULT 'triatlo',
    "nickname" TEXT,
    "photoUrl" TEXT,
    "whatsapp" TEXT,
    "runStructure" TEXT,
    "dashboardPrefs" TEXT,
    "aboutMe" TEXT,
    "birthDate" TIMESTAMP(3),
    "sex" TEXT,
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "daySchedule" TEXT,
    "bikeEnvByDay" TEXT,
    "runEnvByDay" TEXT,
    "availableDays" TEXT[],
    "limitations" TEXT,
    "ftp" DOUBLE PRECISION,
    "vo2max" DOUBLE PRECISION,
    "swimPace" TEXT,
    "runPace" TEXT,
    "raceHistory" TEXT,
    "trainingYears" INTEGER,
    "weeklyHours" DOUBLE PRECISION,
    "currentWeeklyVol" DOUBLE PRECISION,
    "swimLevel" TEXT,
    "bikeLevel" TEXT,
    "runLevel" TEXT,
    "weakestSport" TEXT,
    "strongestSport" TEXT,
    "goalType" TEXT,
    "goalTime" TEXT,
    "injuryHistory" TEXT,
    "currentInjuries" TEXT,
    "medicalConditions" TEXT,
    "sleepHours" DOUBLE PRECISION,
    "stressLevel" TEXT,
    "hasPoolAccess" BOOLEAN NOT NULL DEFAULT true,
    "poolSize" TEXT,
    "hasTrainer" BOOLEAN NOT NULL DEFAULT false,
    "hasPowerMeter" BOOLEAN NOT NULL DEFAULT false,
    "hasHRM" BOOLEAN NOT NULL DEFAULT true,
    "bikeType" TEXT,
    "dietaryNotes" TEXT,
    "workSchedule" TEXT,
    "travelFrequency" TEXT,
    "previousPlanExp" TEXT,
    "testCSS400" TEXT,
    "testCSS200" TEXT,
    "testCSSPace" TEXT,
    "testFTP20min" DOUBLE PRECISION,
    "testFTPEstimated" DOUBLE PRECISION,
    "testFTPHR" INTEGER,
    "testRun30min" DOUBLE PRECISION,
    "testRunPace" TEXT,
    "testRunHR" INTEGER,
    "testRun3km" TEXT,
    "canSwim" BOOLEAN NOT NULL DEFAULT true,
    "testsCompleted" BOOLEAN NOT NULL DEFAULT false,
    "coachAssessmentDone" BOOLEAN NOT NULL DEFAULT false,
    "intervalsIcuApiKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AthleteProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetRace" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "distance" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TargetRace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrainingPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "raceId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "generatedBy" TEXT NOT NULL DEFAULT 'ai',
    "nutritionPlan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrainingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workout" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "modality" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "targetZone" TEXT,
    "tssEstimate" DOUBLE PRECISION,
    "phase" TEXT,
    "weekNumber" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workout_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutLog" (
    "id" TEXT NOT NULL,
    "workoutId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actualDuration" INTEGER,
    "actualDistance" DOUBLE PRECISION,
    "rpe" INTEGER,
    "weight" DOUBLE PRECISION,
    "heartRateAvg" INTEGER,
    "notes" TEXT,
    "stravaActivityId" TEXT,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkoutLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeightLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeightLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StravaToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" INTEGER NOT NULL,
    "athleteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StravaToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "CoachMessage_userId_idx" ON "CoachMessage"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "AthleteProfile_userId_key" ON "AthleteProfile"("userId");

-- CreateIndex
CREATE INDEX "TargetRace_userId_idx" ON "TargetRace"("userId");

-- CreateIndex
CREATE INDEX "TargetRace_date_idx" ON "TargetRace"("date");

-- CreateIndex
CREATE INDEX "TrainingPlan_userId_idx" ON "TrainingPlan"("userId");

-- CreateIndex
CREATE INDEX "TrainingPlan_status_idx" ON "TrainingPlan"("status");

-- CreateIndex
CREATE INDEX "Workout_userId_idx" ON "Workout"("userId");

-- CreateIndex
CREATE INDEX "Workout_planId_idx" ON "Workout"("planId");

-- CreateIndex
CREATE INDEX "Workout_date_idx" ON "Workout"("date");

-- CreateIndex
CREATE INDEX "Workout_modality_idx" ON "Workout"("modality");

-- CreateIndex
CREATE UNIQUE INDEX "WorkoutLog_workoutId_key" ON "WorkoutLog"("workoutId");

-- CreateIndex
CREATE INDEX "WorkoutLog_userId_idx" ON "WorkoutLog"("userId");

-- CreateIndex
CREATE INDEX "WorkoutLog_completedAt_idx" ON "WorkoutLog"("completedAt");

-- CreateIndex
CREATE INDEX "WeightLog_userId_idx" ON "WeightLog"("userId");

-- CreateIndex
CREATE INDEX "WeightLog_date_idx" ON "WeightLog"("date");

-- CreateIndex
CREATE UNIQUE INDEX "StravaToken_userId_key" ON "StravaToken"("userId");

-- AddForeignKey
ALTER TABLE "CoachMessage" ADD CONSTRAINT "CoachMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AthleteProfile" ADD CONSTRAINT "AthleteProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetRace" ADD CONSTRAINT "TargetRace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrainingPlan" ADD CONSTRAINT "TrainingPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workout" ADD CONSTRAINT "Workout_planId_fkey" FOREIGN KEY ("planId") REFERENCES "TrainingPlan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutLog" ADD CONSTRAINT "WorkoutLog_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutLog" ADD CONSTRAINT "WorkoutLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeightLog" ADD CONSTRAINT "WeightLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StravaToken" ADD CONSTRAINT "StravaToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
