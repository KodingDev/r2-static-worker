export interface Environment {
  BUCKET: R2Bucket;
  API_KEY: string;
  BUCKET_NAME: string;

  ACCOUNT_ID: string;
  ACCESS_KEY_ID: string;
  SECRET_ACCESS_KEY: string;
}

export class StatusError extends Error {
  private static readonly statusCodes = new Map<number, string>([
    [400, "Bad Request"],
    [401, "Unauthorized"],
    [403, "Forbidden"],
    [404, "Not Found"],
    [405, "Method Not Allowed"],
  ]);

  constructor(public status: number, message?: string) {
    super(message || StatusError.statusCodes.get(status) || "Unknown Error");
  }
}
