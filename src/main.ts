// noinspection ExceptionCaughtLocallyJS

import path from "node:path";
import * as core from "@actions/core";
import { shake, template } from "radash";
import { downloadTool, getVersion } from "./install";
import presets from "./presets";
import type { Config } from "./types";

export async function main() {
  try {
    const templateArgs = {
      os: process.platform === "win32" ? "windows" : process.platform,
      arch: process.arch === "x64" ? "amd64" : process.arch,
      arch2: process.arch,
      exe: process.platform === "win32" ? ".exe" : "",
      archive: process.platform === "win32" ? "zip" : "tar.gz",
    };

    // load config
    let config: Config = {
      id: core.getInput("id"),
      preset: core.getInput("preset"),
      repo: core.getInput("repo"),
      version: core.getInput("version"),
      versionUrl: core.getInput("version_url"),
      versionRegex: core.getInput("version_regex"),
      downloadUrl: core.getInput("download_url"),
      downloadName: core.getInput("download_name"),
      binPath: core.getInput("bin_path"),
      cache: core.getBooleanInput("cache"),
    };

    core.debug(`loaded config: ${JSON.stringify(config)}`);

    // if preset is set, load preset config
    if (config.preset) {
      if (!presets[config.preset])
        throw new Error(`Preset not found: ${config.preset}`);
      config = {
        ...config,
        ...presets[config.preset],
        ...shake(config, (x) => x === ""),
      };
    }

    // set defaults
    if (config.versionRegex && typeof config.versionRegex === "string")
      config.versionRegex = new RegExp(config.versionRegex);
    if (!config.versionUrl && !config.versionPath && config.repo)
      config.versionPath = "tag_name";
    if (!config.versionUrl && config.repo)
      config.versionUrl = `https://api.github.com/repos/${config.repo}/releases/latest`;

    core.debug(`resolved config: ${JSON.stringify(config)}`);

    if (!config.downloadUrl) {
      throw new Error("Download URL missing");
    }

    // fetch latest version if not fixed
    if (config.version === "latest") {
      const version = await getVersion(config);
      if (!version) throw new Error("Version not found");
      config.version = version;
      core.debug(`resolved version: ${config.version}`);
    }

    // template download url
    config.downloadUrl = template(config.downloadUrl, {
      ...config,
      ...templateArgs,
    });
    if (config.downloadUrl.startsWith("/") && config.repo)
      config.downloadUrl = `https://github.com/${config.repo}${config.downloadUrl}`;

    core.debug(`templated download url: ${config.downloadUrl}`);

    // download or pull from cache
    const toolPath = await downloadTool(config);

    if (config.binPath !== "") {
      config.binPath = template(config.binPath, {
        ...config,
        ...templateArgs,
      });
    }

    core.debug(`cached path: ${toolPath}`);
    core.addPath(path.join(toolPath, config.binPath));
    core.info(`Successfully installed version ${config.version}`);

    core.setOutput("path", toolPath);
    core.setOutput("version", config.version);
  } catch (error) {
    // fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message);
  }
}

main();
