import * as fs from "node:fs/promises";
import path from "node:path";
import * as core from "@actions/core";
import { exec } from "@actions/exec";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { main } from "./main";

const RUNNER_TEMP = path.join(process.cwd(), ".tmp");
const RUNNER_TOOL_CACHE = path.join(RUNNER_TEMP, "./tool-cache");

const verifyBinary = async (binPath: string | undefined, binary: string) => {
  if (!binPath) throw new Error("Bin path not found");

  const extension = process.platform === "win32" ? ".exe" : "";
  const filePath = path.join(binPath, binary + extension);
  expect(filePath.startsWith(RUNNER_TOOL_CACHE)).toBe(true);

  // check if binary exists
  await fs.lstat(filePath);

  // try executing the binary
  await exec(filePath, ["--version"]);
};

describe("action", () => {
  beforeAll(async () => {
    await fs.mkdir(RUNNER_TEMP, { recursive: true });
    await fs.rm(RUNNER_TEMP, { recursive: true });
  });

  beforeEach(() => {
    // set default values
    vi.stubEnv("INPUT_CACHE", "true");
    vi.stubEnv("INPUT_VERSION", "latest");
    vi.stubEnv("INPUT_VERSION_REGEX", "(?<version>[\\d.]+)");
    vi.stubEnv("RUNNER_TOOL_CACHE", RUNNER_TOOL_CACHE);
    vi.stubEnv("RUNNER_TEMP", RUNNER_TEMP);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("install infisical-cli", async () => {
    vi.stubEnv("INPUT_PRESET", "infisical-cli");
    const spy = vi.spyOn(core, "addPath");
    await main();
    expect(spy).toHaveBeenCalled();
    await verifyBinary(spy.mock.lastCall?.[0], "infisical");
  }, 10000);

  test("install cloud-sql-proxy", async () => {
    vi.stubEnv("INPUT_PRESET", "cloud-sql-proxy");
    const spy = vi.spyOn(core, "addPath");
    await main();
    expect(spy).toHaveBeenCalled();
    await verifyBinary(spy.mock.lastCall?.[0], "cloud-sql-proxy");
  }, 10000);

  test("install github-cli", async () => {
    vi.stubEnv("INPUT_PRESET", "github-cli");
    const spy = vi.spyOn(core, "addPath");
    await main();
    expect(spy).toHaveBeenCalled();
    await verifyBinary(spy.mock.lastCall?.[0], "gh");
  }, 10000);
});
