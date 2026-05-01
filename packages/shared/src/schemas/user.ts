import { z } from "zod";
import { Id } from "./common";

export const UserRole = z.enum(["USER", "EDITOR", "ADMIN", "SUPERADMIN"]);
export const UserStatus = z.enum(["ACTIVE", "BANNED", "DELETED"]);

export const UpdateProfile = z.object({
  displayName: z.string().min(1).max(40).optional(),
  bio: z.string().max(200).optional().nullable(),
  image: z.string().url().optional().nullable(),
});

export const AdminUpdateUser = z.object({
  id: Id,
  role: UserRole.optional(),
  status: UserStatus.optional(),
  banReason: z.string().max(200).optional().nullable(),
  coinBalance: z.number().int().min(0).optional(),
});
