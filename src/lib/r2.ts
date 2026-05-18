import 'server-only';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';

let _client: S3Client | null = null;

function getClient(): S3Client {
  if (_client) return _client;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2 is not configured. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.'
    );
  }
  _client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
  return _client;
}

function getBucket(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) throw new Error('R2_BUCKET_NAME is not configured.');
  return bucket;
}

function safeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 100);
}

export function buildObjectKey(userId: string, fileName: string): string {
  const ext = safeFileName(fileName);
  const random = randomBytes(8).toString('hex');
  const now = Date.now();
  return `users/${userId}/${now}-${random}-${ext}`;
}

export async function uploadToR2(params: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<void> {
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType,
    })
  );
}

export async function deleteFromR2(key: string): Promise<void> {
  const client = getClient();
  await client.send(
    new DeleteObjectCommand({ Bucket: getBucket(), Key: key })
  );
}

export async function getFromR2(key: string): Promise<{
  body: ReadableStream;
  contentType: string | undefined;
  contentLength: number | undefined;
}> {
  const client = getClient();
  const res = await client.send(
    new GetObjectCommand({ Bucket: getBucket(), Key: key })
  );
  if (!res.Body) throw new Error('R2 object has no body');
  return {
    body: res.Body.transformToWebStream(),
    contentType: res.ContentType,
    contentLength: res.ContentLength,
  };
}

const KEY_PREFIX_RE = /^https?:\/\/[^/]+\//;

export function objectKeyFromUrl(fileUrl: string): string | null {
  if (!fileUrl) return null;
  if (fileUrl.startsWith('r2://')) return fileUrl.slice('r2://'.length);
  const stripped = fileUrl.replace(KEY_PREFIX_RE, '');
  return stripped || null;
}
