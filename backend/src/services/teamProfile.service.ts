import { prisma } from "../lib/prisma";

export const getTeamProfile = async (userId: string) => {
  const profile = await prisma.teamProfile.findUnique({ where: { userId } });

  return profile ?? { rules: [] };
};

export const upsertTeamProfile = async (userId: string, rules: string[]) => {
  return prisma.teamProfile.upsert({
    where: { userId },
    create: { userId, rules },
    update: { rules },
  });
};