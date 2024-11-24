import path from "node:path";
import * as core from "@actions/core";
import { exec } from "@actions/exec";
import * as tc from "@actions/tool-cache";
import { get } from "radash";
import type { Config } from "./types";

export async function getVersion(config: Config) {
  if (!config.versionUrl) throw new Error("Version URL missing");

  const ghToken = process.env.GITHUB_TOKEN || core.getInput("token");
  const ghOptions: RequestInit = ghToken
    ? {
        headers: {
          Authorization: `Bearer ${ghToken}`,
        },
      }
    : {};

  const res = await fetch(config.versionUrl, {
    ...(config.versionUrl.startsWith("https://api.github.com")
      ? ghOptions
      : undefined),
  });
  let data = await res.text();
  if (config.versionPath) {
    data = String(get(JSON.parse(data), config.versionPath));
  }
  if (config.versionRegex) {
    const match = data.match(config.versionRegex);
    if (match) {
      if (match.groups) return match.groups.version;
      return match[0];
    }
  }
  return data;
}

export async function downloadTool(config: Config) {
  if (!config.downloadUrl) throw new Error("Download URL missing");
  if (!config.version) throw new Error("Version missing");

  const toolName = config.preset || config.repo || config.id;
  if (config.cache && !toolName) {
    config.cache = false;
    core.warning("Tool name missing, disabling cache");
  }

  // check cache
  if (config.cache && toolName) {
    const toolPath = tc.find(toolName, config.version);
    if (toolPath) {
      core.debug(`cache hit: ${toolName}@${config.version}`);
      return toolPath;
    }
    core.debug(`cache miss: ${toolName}@${config.version}`);
    const versions = tc.findAllVersions(toolName).join(", ");
    if (versions) core.debug(`available versions: ${versions}`);
  }

  // download file
  const downloadPath = await tc.downloadTool(config.downloadUrl);
  core.debug(`downloaded path: ${downloadPath}`);

  // handle extracting downloaded file
  let extractedPath: string | undefined;
  if (config.downloadUrl.endsWith(".tar.gz")) {
    extractedPath = await tc.extractTar(downloadPath);
  } else if (config.downloadUrl.endsWith(".7z")) {
    extractedPath = await tc.extract7z(downloadPath);
  } else if (config.downloadUrl.endsWith(".zip")) {
    extractedPath = await tc.extractZip(downloadPath);
  } else if (config.downloadUrl.endsWith(".pkg")) {
    extractedPath = await tc.extractXar(downloadPath);
  }
  core.debug(`extracted path: ${extractedPath}`);

  // ensure binaries are executable
  if (!extractedPath && process.platform !== "win32")
    await exec("chmod", ["+x", downloadPath]);

  // cache downloaded or extracted path
  if (config.cache && toolName)
    return extractedPath
      ? await tc.cacheDir(extractedPath, toolName, config.version)
      : await tc.cacheFile(
          downloadPath,
          config.downloadName || path.basename(config.downloadUrl),
          toolName,
          config.version,
        );
  return extractedPath || downloadPath;
}
