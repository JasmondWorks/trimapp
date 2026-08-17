import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v.length ? v : null))
  .nullable()
  .optional();

export const updateProfileSchema = z.object({
  full_name: optionalText,
  username: z
    .string()
    .trim()
    .transform((v) => (v.length ? v : null))
    .nullable()
    .optional()
    .refine((v) => v === null || v === undefined || /^[a-z0-9_.-]{3,30}$/i.test(v), {
      message: "3–30 characters, letters, numbers, dot, dash or underscore",
    }),
  phone: optionalText,
  avatar_url: optionalText,
});
