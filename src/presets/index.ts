import { Config } from "../types";

const presets: Record<string, Partial<Config>> = {
  "infisical-cli": {
    repo: "infisical/infisical",
    downloadUrl:
      "/releases/download/infisical-cli/v{{version}}/infisical_{{version}}_{{os}}_{{arch}}.{{archive}}",
  },
  "cloud-sql-proxy": {
    repo: "GoogleCloudPlatform/cloudsql-proxy",
    downloadUrl:
      "https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v{{version}}/cloud-sql-proxy.{{os}}.{{arch}}",
    downloadName: "cloud-sql-proxy",
  },
};

export default presets;
