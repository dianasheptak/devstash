import { z } from 'zod';

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z
    .preprocess(
      (v) => (typeof v === 'string' ? v.trim() : v),
      z.union([z.string(), z.null(), z.undefined()])
    )
    .transform((v) => (v == null || v === '' ? null : v)),
});

export type CreateCollectionInput = z.input<typeof createCollectionSchema>;
export type CreateCollectionParsed = z.output<typeof createCollectionSchema>;
