import { z } from 'zod';

const optionalText = z
  .preprocess(
    (v) => (typeof v === 'string' ? v.trim() : v),
    z.union([z.string(), z.null(), z.undefined()])
  )
  .transform((v) => (v == null || v === '' ? null : v));

const optionalUrl = z
  .preprocess(
    (v) => (typeof v === 'string' ? v.trim() : v),
    z.union([z.string(), z.null(), z.undefined()])
  )
  .transform((v) => (v == null || v === '' ? null : v))
  .refine(
    (v) => v === null || /^https?:\/\/.+/i.test(v),
    'Must be a valid URL'
  );

export const updateItemSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: optionalText,
  content: optionalText,
  url: optionalUrl,
  language: optionalText,
  tags: z
    .array(z.string())
    .default([])
    .transform((arr) => arr.map((t) => t.trim()).filter((t) => t.length > 0)),
});

export type UpdateItemInput = z.input<typeof updateItemSchema>;
export type UpdateItemParsed = z.output<typeof updateItemSchema>;
