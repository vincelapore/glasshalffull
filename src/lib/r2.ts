import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import {
  MEDIA_CACHE_CONTROL,
  MEDIA_CONTENT_TYPE,
  PRESIGN_TTL_SECONDS,
  mediaObjectKey,
  mediaUrl,
  type UploadKind,
} from "@/lib/media";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${requiredEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    },
    // R2 rejects the default CRC32 checksums AWS SDK v3 adds to presigned PUTs.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
  });
}

export async function createPresignedUpload(
  kind: UploadKind,
  ownerUserId?: string
) {
  const bucket = requiredEnv("R2_BUCKET_NAME");
  const key = mediaObjectKey(kind, ownerUserId);
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: MEDIA_CONTENT_TYPE,
    CacheControl: MEDIA_CACHE_CONTROL,
  });

  const uploadUrl = await getSignedUrl(getR2Client(), command, {
    expiresIn: PRESIGN_TTL_SECONDS,
  });

  return {
    uploadUrl,
    key,
    publicUrl: mediaUrl(key) ?? "",
  };
}

/** Deletes are free on R2. Missing keys are ignored. */
export async function deleteMediaObjects(keys: string[]) {
  if (keys.length === 0) return;

  const bucket = requiredEnv("R2_BUCKET_NAME");
  const client = getR2Client();
  await Promise.all(
    keys.map((key) =>
      client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      )
    )
  );
}
