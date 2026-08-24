import { S3Client } from "@aws-sdk/client-s3";
import { getMediaConfig } from "../../../config/media.config";

let client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!client) {
    const config = getMediaConfig();
    client = new S3Client({
      region: config.S3_REGION ?? "auto",
      endpoint: config.S3_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.S3_ACCESS_KEY_ID,
        secretAccessKey: config.S3_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}
