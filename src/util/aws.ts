import { Environment } from "@/types/cloudflare";
import { S3Client } from "@aws-sdk/client-s3";

export const createAWSClient = (env: Environment) =>
  new S3Client({
    endpoint: `https://${env.ACCOUNT_ID}.r2.cloudflarestorage.com`,
    region: "auto",
    credentials: {
      accessKeyId: `${env.ACCESS_KEY_ID}`,
      secretAccessKey: env.SECRET_ACCESS_KEY,
    },
  });
