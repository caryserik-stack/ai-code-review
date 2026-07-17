-- CreateTable
CREATE TABLE "team_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rules" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_profiles_userId_key" ON "team_profiles"("userId");

-- AddForeignKey
ALTER TABLE "team_profiles" ADD CONSTRAINT "team_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
