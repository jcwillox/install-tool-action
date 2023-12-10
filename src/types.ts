export type Config = {
  repo?: string;
  version: string;
  versionUrl?: string;
  versionRegex?: string | RegExp;
  versionPath?: string;
  downloadUrl?: string;
  downloadName?: string;
  binPath: string;
  preset?: string;
  cache: boolean;
};
