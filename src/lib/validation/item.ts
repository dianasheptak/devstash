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
  collectionIds: z.array(z.string()).default([]),
});

export type UpdateItemInput = z.input<typeof updateItemSchema>;
export type UpdateItemParsed = z.output<typeof updateItemSchema>;

export const CREATABLE_ITEM_TYPES = [
  'snippet',
  'prompt',
  'command',
  'note',
  'link',
  'file',
  'image',
] as const;

export type CreatableItemType = (typeof CREATABLE_ITEM_TYPES)[number];

const FILE_TYPES = ['file', 'image'] as const;
type FileType = (typeof FILE_TYPES)[number];
export const isFileItemType = (t: string): t is FileType =>
  (FILE_TYPES as readonly string[]).includes(t);

const requiredUrl = z
  .preprocess(
    (v) => (typeof v === 'string' ? v.trim() : v),
    z.string()
  )
  .refine((v) => /^https?:\/\/.+/i.test(v), 'Must be a valid URL');

const filePayloadSchema = z.object({
  fileUrl: z.string().min(1, 'fileUrl is required'),
  fileName: z.string().min(1, 'fileName is required'),
  fileSize: z.number().int().positive('fileSize must be positive'),
});

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
    collectionIds: z.array(z.string()).default([]),
    file: filePayloadSchema.nullable().optional().default(null),
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
    } else if (isFileItemType(data.type)) {
      if (!data.file) {
        ctx.addIssue({
          code: 'custom',
          path: ['file'],
          message: 'File upload is required',
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
