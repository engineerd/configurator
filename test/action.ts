import * as path from "path";
import * as os from "os";
const toolDir = path.join(os.tmpdir(), "runner", "tools");
const tempDir = path.join(os.tmpdir(), "tmp", "runner", "temp");
const dataDir = path.join(os.tmpdir(), "tmp", "data");

process.env["RUNNER_TOOL_CACHE"] = toolDir;
process.env["RUNNER_TEMP"] = tempDir;

import "mocha";
import { assert } from "chai";
import * as cfg from "../src/configurator";
import * as fs from "fs";
import * as rimraf from "rimraf";

describe("test archive type", () => {
  it("correctly chooses the NONE archive type", () => {
    const archiveTypeNoneInput = {
      INPUT_URL:
        "https://github.com/<some-repo>/releases/download/<release>/some-binary",
    };
    for (const key in archiveTypeNoneInput)
      process.env[key] = archiveTypeNoneInput[key];

    let c = cfg.getConfig();
    assert.equal(cfg.ArchiveType.None, cfg.getArchiveType(c.url));
  });

  it("correctly chooses the TAR.GZ archive type", () => {
    const archiveTypeTarInput = {
      INPUT_URL:
        "https://github.com/<some-repo>/releases/download/<release>/some-tar-archive.tar.gz",
    };
    for (const key in archiveTypeTarInput)
      process.env[key] = archiveTypeTarInput[key];

    let c = cfg.getConfig();
    assert.equal(cfg.ArchiveType.TarGz, cfg.getArchiveType(c.url));
  });

  it("correctly chooses the ZIP archive type", () => {
    const archiveTypeZipInput = {
      INPUT_URL:
        "https://github.com/<some-repo>/releases/download/<release>/some-tar-archive.zip",
    };
    for (const key in archiveTypeZipInput)
      process.env[key] = archiveTypeZipInput[key];

    let c = cfg.getConfig();
    assert.equal(cfg.ArchiveType.Zip, cfg.getArchiveType(c.url));
  });

  it("correctly chooses the 7Z archive type", () => {
    const archiveTypeZipInput = {
      INPUT_URL:
        "https://github.com/<some-repo>/releases/download/<release>/some-tar-archive.7z",
    };
    for (const key in archiveTypeZipInput)
      process.env[key] = archiveTypeZipInput[key];

    let c = cfg.getConfig();
    assert.equal(cfg.ArchiveType.SevenZ, cfg.getArchiveType(c.url));
  });
});

describe("test URL download", async () => {
  after(() => {
    rimraf.sync(tempDir);
    rimraf.sync(cfg.binPath());
  });

  it("correctly downloads plain files", async () => {
    const input = {
      INPUT_URL:
        "https://github.com/kubernetes-sigs/kind/releases/download/v0.5.1/kind-linux-amd64",
      INPUT_NAME: "kind",
    };
    for (const key in input) process.env[key] = input[key];

    let c = cfg.getConfig();
    await c.configure();

    assert.equal(fs.existsSync(path.join(cfg.binPath(), c.name)), true);
  });

  it("correctly downloads .tar.gz files", async () => {
    if (process.platform === "win32") {
      // there seems to be an error with the tar utility on Windows - skipping the test for now
      return;
    }

    const input = {
      INPUT_URL: "https://get.helm.sh/helm-v3.0.0-beta.3-linux-amd64.tar.gz",
      INPUT_NAME: "hb3",
      INPUT_PATHINARCHIVE: "linux-amd64/helm",
    };
    for (const key in input) process.env[key] = input[key];

    let c = cfg.getConfig();
    await c.configure();

    assert.equal(fs.existsSync(path.join(cfg.binPath(), c.name)), true);
  });

  it("correctly downloads .zip files", async () => {
    const input = {
      INPUT_URL: "https://get.helm.sh/helm-v3.0.0-beta.3-windows-amd64.zip",
      INPUT_NAME: "helm.exe",
      INPUT_PATHINARCHIVE: "windows-amd64/helm.exe",
    };
    for (const key in input) process.env[key] = input[key];

    let c = cfg.getConfig();
    await c.configure();

    assert.equal(fs.existsSync(path.join(cfg.binPath(), c.name)), true);
  });
});

describe("test GitHub release download", async () => {
  after(() => {
    rimraf.sync(tempDir);
    rimraf.sync(cfg.binPath());
  });

  it("correctly downloads based on GitHub release input", async () => {
    const input = {
      INPUT_NAME: "h3",
      INPUT_PATHINARCHIVE: "darwin-amd64/helm",
      INPUT_FROMGITHUBRELEASES: "true",
      // before running this test, run export GITHUB_TOKEN=<github-token>
      INPUT_TOKEN: process.env["GITHUB_TOKEN"],
      INPUT_REPO: "helm/helm",
      INPUT_VERSION: "^v3.1.2",
      INPUT_INCLUDEPRERELEASES: "false",
      INPUT_URLTEMPLATE:
        "https://get.helm.sh/helm-{{version}}-darwin-amd64.tar.gz",
    };

    for (const key in input) process.env[key] = input[key];

    let c = cfg.getConfig();
    await c.configure();
    assert.equal(fs.existsSync(path.join(cfg.binPath(), c.name)), true);
  });
});
