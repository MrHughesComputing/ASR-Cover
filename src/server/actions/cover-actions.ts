"use server";

import { z } from "zod";
import { assertPermission } from "@/server/auth/permissions";

export const assignCoverSchema = z.object({
  absenceId: z.string().min(1),
  absentPersonId: z.string().min(1),
  coveringPersonId: z.string().min(1),
  date: z.iso.date(),
  periodId: z.string().min(1),
  teachingEventId: z.string().optional(),
  overrideReason: z.string().optional(),
});

export async function assignCover(input: z.infer<typeof assignCoverSchema>) {
  assertPermission("ADMIN", "assign:cover");
  const payload = assignCoverSchema.parse(input);

  return {
    status: "accepted" as const,
    auditAction: "cover assigned",
    payload,
  };
}
