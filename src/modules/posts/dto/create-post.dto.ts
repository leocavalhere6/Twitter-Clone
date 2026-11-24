import { z } from "zod";

export const createPostSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Post content must not be empty.")
    .max(500, "Post content must be at most 500 characters."),
});

export type CreatePostDto = z.infer<typeof createPostSchema>;
