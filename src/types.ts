export type Config = {
  id?: string;
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
