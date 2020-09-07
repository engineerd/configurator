import * as path from "path";
import * as os from "os";
import "mocha";
import * as chai from "chai";
import { assert, expect } from "chai";
import * as cfg from "../src/configurator";
import * as fs from "fs";
import * as rimraf from "rimraf";
import { getTag } from "../src/release";

chai.use(require("chai-as-promised"));

const toolDir = path.join(os.tmpdir(), "runner", "tools");
const tempDir = path.join(os.tmpdir(), "tmp", "runner", "temp");
const dataDir = path.join(os.tmpdir(), "tmp", "data");

process.env["RUNNER_TOOL_CACHE"] = toolDir;
process.env["RUNNER_TEMP"] = tempDir;

describe("test archive type", () => {
  afterEach(() => cleanEnv());

  it("correctly chooses the NONE archive type", () => {
    const archiveTypeNoneInput = {
      INPUT_NAME: "some-binary",
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
      INPUT_NAME: "some-binary",
      INPUT_PATHINARCHIVE: "some-path",
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
      INPUT_NAME: "some-binary",
      INPUT_PATHINARCHIVE: "some-path",
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
      INPUT_NAME: "some-binary",
      INPUT_PATHINARCHIVE: "some-path",
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
  afterEach(() => cleanEnv());
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
  afterEach(() => {
    cleanEnv();
  });
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

// given that `getTag` returns the latest version that satisfies certain constraints,
// there is a possibility that certain tests here would have to be updated over time
describe("correctly select GitHub release based on version constraints", async () => {
  afterEach(() => cleanEnv());
  let token: string = process.env["GITHUB_TOKEN"] || "";
  it("select exact Helm version", async () => {
    let tag = await getTag(token, "helm/helm", "v2.1.0", false);
    assert.equal(tag, "v2.1.0");
  });

  it("correctly selects the latest v2.15 Helm release", async () => {
    let tag = await getTag(token, "helm/helm", "~v2.15", false);
    assert.equal(tag, "v2.15.2");
  });

  it("check latest prerelease", async () => {
    let tag = await getTag(token, "engineerd/setup-kind", "latest", true);
    assert.equal(tag, "v0.4.0");
  });

  it("check latest non-prerelease", async () => {
    let tag = await getTag(token, "engineerd/setup-kind", "latest", false);
    assert.equal(tag, "v0.3.0");
  });
});

describe("input validation", async () => {
  afterEach(() => {
    cleanEnv();
  });
  it("name is empty", async () => {
    const input = {
      INPUT_NAME: "",
    };

    for (const key in input) process.env[key] = input[key];

    let c = cfg.getConfig();
    await expect(c.configure()).to.be.rejectedWith(
      Error,
      `"name" is required. This is used to set the executable name of the tool.`
    );
  });

  it("url is empty", async () => {
    const input = {
      INPUT_NAME: "some-name",
    };

    for (const key in input) process.env[key] = input[key];

    let c = cfg.getConfig();
    await expect(c.configure()).to.be.rejectedWith(
      Error,
      `"url" is required when downloading a tool directly.`
    );
  });

  it("fromGitHubRelease is false and invalid url", async () => {
    const input = {
      INPUT_NAME: "test-name",
      INPUT_URL: "asd",
      INPUT_FROMGITHUBRELEASES: "false",
    };

    for (const key in input) process.env[key] = input[key];
    let c = cfg.getConfig();
    await expect(c.configure()).to.be.rejectedWith(
      Error,
      `"url" supplied as input is not a valid URL.`
    );
  });

  it("fromGitHubRelease is true and invalid urlTemplate", async () => {
    const input = {
      INPUT_NAME: "test-name",
      INPUT_FROMGITHUBRELEASES: "true",
      INPUT_URLTEMPLATE: "asd",
      INPUT_REPO: "some-repo",
      INPUT_TOKEN: "some-token",
      INPUT_VERSION: "some-version",
    };

    for (const key in input) process.env[key] = input[key];
    let c = cfg.getConfig();
    await expect(c.configure()).to.be.rejectedWith(
      Error,
      `"urlTemplate" supplied as input is not a valid URL.`
    );
  });

  it("url is archive and pathInArchive is empty", async () => {
    const input = {
      INPUT_NAME: "test-name",
      INPUT_URL:
        "https://github.com/<some-repo>/releases/download/<release>/some-tar-archive.tar.gz",
    };
    for (const key in input) process.env[key] = input[key];
    let c = cfg.getConfig();
    await expect(c.configure()).to.be.rejectedWith(
      Error,
      `"pathInArchive" is required when "url" points to an archive file`
    );
  });

  it("urlTemplate is archive and pathInArchive is empty", async () => {
    const input = {
      INPUT_NAME: "h3",
      INPUT_FROMGITHUBRELEASES: "true",
      INPUT_URLTEMPLATE:
        "https://get.helm.sh/helm-{{version}}-darwin-amd64.tar.gz",
    };
    for (const key in input) process.env[key] = input[key];
    let c = cfg.getConfig();
    await expect(c.configure()).to.be.rejectedWith(
      Error,
      `"pathInArchive" is required when "urlTemplate" points to an archive file.`
    );
  });

  it("fromGitHubReleases is true and token is missing", async () => {
    const input = {
      INPUT_NAME: "h3",
      INPUT_PATHINARCHIVE: "darwin-amd64/helm",
      INPUT_FROMGITHUBRELEASES: "true",
      INPUT_TOKEN: "",
      INPUT_REPO: "helm/helm",
      INPUT_VERSION: "^v3.1.2",
      INPUT_INCLUDEPRERELEASES: "false",
      INPUT_URLTEMPLATE:
        "https://get.helm.sh/helm-{{version}}-darwin-amd64.tar.gz",
    };

    for (const key in input) process.env[key] = input[key];

    let c = cfg.getConfig();
    await expect(c.configure()).to.be.rejectedWith(
      Error,
      `if trying to fetch version from GitHub releases, "token", "repo", "version", and "urlTemplate" are required.`
    );
  });

  it("fromGitHubReleases is true and repo is missing", async () => {
    const input = {
      INPUT_NAME: "h3",
      INPUT_PATHINARCHIVE: "darwin-amd64/helm",

      INPUT_FROMGITHUBRELEASES: "true",
      INPUT_TOKEN: "some-token",
      INPUT_REPO: "",
      INPUT_VERSION: "^v3.1.2",
      INPUT_INCLUDEPRERELEASES: "false",
      INPUT_URLTEMPLATE:
        "https://get.helm.sh/helm-{{version}}-darwin-amd64.tar.gz",
    };

    for (const key in input) process.env[key] = input[key];

    let c = cfg.getConfig();
    await expect(c.configure()).to.be.rejectedWith(
      Error,
      `if trying to fetch version from GitHub releases, "token", "repo", "version", and "urlTemplate" are required.`
    );
  });

  it("fromGitHubReleases is true and version is missing", async () => {
    const input = {
      INPUT_NAME: "h3",
      INPUT_PATHINARCHIVE: "darwin-amd64/helm",
      INPUT_FROMGITHUBRELEASES: "true",
      INPUT_TOKEN: "some-token",
      INPUT_REPO: "helm/helm",
      INPUT_VERSION: "",
      INPUT_INCLUDEPRERELEASES: "false",
      INPUT_URLTEMPLATE:
        "https://get.helm.sh/helm-{{version}}-darwin-amd64.tar.gz",
    };

    for (const key in input) process.env[key] = input[key];

    let c = cfg.getConfig();
    await expect(c.configure()).to.be.rejectedWith(
      Error,
      `if trying to fetch version from GitHub releases, "token", "repo", "version", and "urlTemplate" are required.`
    );
  });

  it("fromGitHubReleases is true and urlTemplate is missing", async () => {
    const input = {
      INPUT_NAME: "h3",
      INPUT_PATHINARCHIVE: "darwin-amd64/helm",
      INPUT_FROMGITHUBRELEASES: "true",
      INPUT_TOKEN: "some-token",
      INPUT_REPO: "helm/helm",
      INPUT_VERSION: "^v3.1.2",
      INPUT_INCLUDEPRERELEASES: "false",
      INPUT_URLTEMPLATE: "",
    };

    for (const key in input) process.env[key] = input[key];

    let c = cfg.getConfig();
    await expect(c.configure()).to.be.rejectedWith(
      Error,
      `"urlTemplate" supplied as input is not a valid URL.`
    );
  });
});

function cleanEnv() {
  const inputVars = [
    "INPUT_NAME",
    "INPUT_URL",
    "INPUT_PATHINARCHIVE",
    "INPUT_FROMGITHUBRELEASES",
    "INPUT_TOKEN",
    "INPUT_REPO",
    "INPUT_VERSION",
    "INPUT_INCLUDEPRERELEASES",
    "INPUT_URLTEMPLATE",
  ];

  inputVars.forEach((i) => {
    process.env[i] = "";
  });
}
