import { z } from "zod";

export const postStorySchema = z.object({
  type: z.enum(["text", "image"]).default("text"),
  content: z
    .string()
    .min(1, "Konten tidak boleh kosong")
    .max(5000, "Konten terlalu panjang (maks 5000 karakter)"),
  caption: z.string().max(500, "Caption terlalu panjang (maks 500 karakter)").optional(),
  backgroundColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Format warna tidak valid")
    .default("#000000")
    .optional(),
  font: z.number().int().min(1).max(5).default(1).optional(),
  instanceName: z.string().min(1, "Instance name tidak boleh kosong").optional(),
  config: z.object({
    backendType: z.enum(["evolution", "waha", "custom"]),
    baseUrl: z.string().url(),
    apiKey: z.string()
  }).optional()
});

export type PostStoryInput = z.infer<typeof postStorySchema>;

export const validatePostStory = (body: unknown) => {
  return postStorySchema.safeParse(body);
};

