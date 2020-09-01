import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";
import * as exec from "@actions/exec";
import * as io from "@actions/io";
import * as path from "path";
import * as os from "os";

const NameInput: string = "name";
const URLInput: string = "url";
const PathInArchiveInput: string = "pathInArchive";

const FromGitHubReleases: string = "fromGitHubReleases";
const Token: string = "token";
const Repo: string = "repo";
const Version: string = "version";
const IncludePrereleases: string = "includePrereleases";
const URLTemplate: string = "urlTemplate";

export function getConfig(): Configurator {
  return new Configurator(
    core.getInput(NameInput),
    core.getInput(URLInput),
    core.getInput(PathInArchiveInput),

    core.getInput(FromGitHubReleases),
    core.getInput(Token),
    core.getInput(Repo),
    core.getInput(Version),
    core.getInput(IncludePrereleases),
    core.getInput(URLTemplate)
  );
}

export class Configurator {
  name: string;
  url: string;
  pathInArchive: string;

  fromGitHubReleases: boolean;
  token: string;
  repo: string;
  version: string;
  includePrereleases: boolean;
  urlTemplate: string;

  constructor(
    name: string,
    url: string,
    pathInArchive: string,
    fromGitHubRelease: string,
    token: string,
    repo: string,
    version: string,
    includePrereleases: string,
    urlTemplate: string
  ) {
    this.name = name;
    this.url = url;
    this.pathInArchive = pathInArchive;

    this.fromGitHubReleases = fromGitHubRelease == "true";
    this.token = token;
    this.repo = repo;
    this.version = version;
    this.includePrereleases = includePrereleases == "true";
    this.urlTemplate = urlTemplate;
  }

  getArchiveType(): ArchiveType {
    if (this.url.endsWith(ArchiveType.TarGz)) return ArchiveType.TarGz;
    if (this.url.endsWith(ArchiveType.Zip)) return ArchiveType.Zip;
    if (this.url.endsWith(ArchiveType.SevenZ)) return ArchiveType.SevenZ;

    return ArchiveType.None;
  }

  async configure() {
    console.log(`Downloading tool from ${this.url}...`);
    let downloadPath: string | null = null;
    let archivePath: string | null = null;
    const tempDir = path.join(os.tmpdir(), "tmp", "runner", "temp");
    await io.mkdirP(tempDir);
    downloadPath = await tc.downloadTool(this.url);

    switch (this.getArchiveType()) {
      case ArchiveType.None:
        return this.moveToPath(downloadPath);

      case ArchiveType.TarGz:
        archivePath = await tc.extractTar(downloadPath, tempDir);
        return this.moveToPath(path.join(archivePath, this.pathInArchive));

      case ArchiveType.Zip:
        archivePath = await tc.extractZip(downloadPath, tempDir);
        return this.moveToPath(path.join(archivePath, this.pathInArchive));

      case ArchiveType.SevenZ:
        archivePath = await tc.extract7z(downloadPath, tempDir);
        return this.moveToPath(path.join(archivePath, this.pathInArchive));
    }
  }

  async moveToPath(downloadPath: string) {
    let toolPath = binPath();
    await io.mkdirP(toolPath);
    await io.mv(downloadPath, path.join(toolPath, this.name));

    if (process.platform !== "win32") {
      await exec.exec("chmod", ["+x", path.join(toolPath, this.name)]);
    }

    core.addPath(toolPath);
  }
}

export function binPath(): string {
  let baseLocation: string;
  if (process.platform === "win32") {
    // On windows use the USERPROFILE env variable
    baseLocation = process.env["USERPROFILE"] || "C:\\";
  } else {
    if (process.platform === "darwin") {
      baseLocation = "/Users";
    } else {
      baseLocation = "/home";
    }
  }

  return path.join(baseLocation, os.userInfo().username, "configurator", "bin");
}

export enum ArchiveType {
  None = "",
  TarGz = ".tar.gz",
  Zip = ".zip",
  SevenZ = ".7z",
}
