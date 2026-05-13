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

export const CREATABLE_ITEM_TYPES = [
  'snippet',
  'prompt',
  'command',
  'note',
  'link',
] as const;

export type CreatableItemType = (typeof CREATABLE_ITEM_TYPES)[number];

const requiredUrl = z
  .preprocess(
    (v) => (typeof v === 'string' ? v.trim() : v),
    z.string()
  )
  .refine((v) => /^https?:\/\/.+/i.test(v), 'Must be a valid URL');

export const createItemSchema = z
  .object({
    type: z.enum(CREATABLE_ITEM_TYPES),
    title: z.string().trim().min(1, 'Title is required'),
    description: optionalText,
    content: optionalText,
    url: optionalText,
    language: optionalText,
    tags: z
      .array(z.string())
      .default([])
      .transform((arr) => arr.map((t) => t.trim()).filter((t) => t.length > 0)),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'link') {
      const parsed = requiredUrl.safeParse(data.url);
      if (!parsed.success) {
        ctx.addIssue({
          code: 'custom',
          path: ['url'],
          message: parsed.error.issues[0]?.message ?? 'URL is required',
        });
      }
    } else {
      if (!data.content || data.content.trim().length === 0) {
        ctx.addIssue({
          code: 'custom',
          path: ['content'],
          message: 'Content is required',
        });
      }
    }
  });

export type CreateItemInput = z.input<typeof createItemSchema>;
export type CreateItemParsed = z.output<typeof createItemSchema>;
