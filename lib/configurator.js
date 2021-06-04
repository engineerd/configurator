"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArchiveType = exports.binPath = exports.getArchiveType = exports.Configurator = exports.getConfig = void 0;
const core = __importStar(require("@actions/core"));
const tc = __importStar(require("@actions/tool-cache"));
const exec = __importStar(require("@actions/exec"));
const io = __importStar(require("@actions/io"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const release_1 = require("./release");
const mustache_1 = __importDefault(require("mustache"));
const uuid_1 = require("uuid");
const NameInput = "name";
const URLInput = "url";
const PathInArchiveInput = "pathInArchive";
const FromGitHubReleases = "fromGitHubReleases";
const Token = "token";
const Repo = "repo";
const Version = "version";
const IncludePrereleases = "includePrereleases";
const URLTemplate = "urlTemplate";
function getConfig() {
    return new Configurator(core.getInput(NameInput), core.getInput(URLInput), core.getInput(PathInArchiveInput), core.getInput(FromGitHubReleases), core.getInput(Token), core.getInput(Repo), core.getInput(Version), core.getInput(IncludePrereleases), core.getInput(URLTemplate));
}
exports.getConfig = getConfig;
class Configurator {
    constructor(name, url, pathInArchive, fromGitHubRelease, token, repo, version, includePrereleases, urlTemplate) {
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
    configure() {
        return __awaiter(this, void 0, void 0, function* () {
            this.validate();
            let downloadURL;
            if (this.fromGitHubReleases) {
                let tag = yield release_1.getTag(this.token, this.repo, this.version, this.includePrereleases);
                const rawVersion = tag.startsWith("v") ? tag.substr(1) : tag;
                downloadURL = mustache_1.default.render(this.urlTemplate, {
                    version: tag,
                    rawVersion: rawVersion,
                });
            }
            else {
                downloadURL = this.url;
            }
            console.log(`Downloading tool from ${downloadURL}`);
            let downloadPath = null;
            let archivePath = null;
            let randomDir = uuid_1.v4();
            const tempDir = path.join(os.tmpdir(), "tmp", "runner", randomDir);
            console.log(`Creating tempdir ${tempDir}`);
            yield io.mkdirP(tempDir);
            downloadPath = yield tc.downloadTool(downloadURL);
            switch (getArchiveType(downloadURL)) {
                case ArchiveType.None:
                    yield this.moveToPath(downloadPath);
                    break;
                case ArchiveType.TarGz:
                    archivePath = yield tc.extractTar(downloadPath, tempDir);
                    yield this.moveToPath(path.join(archivePath, this.pathInArchive));
                    break;
                case ArchiveType.TarXz:
                    archivePath = yield tc.extractTar(downloadPath, tempDir, "x");
                    yield this.moveToPath(path.join(archivePath, this.pathInArchive));
                    break;
                case ArchiveType.Tgz:
                    archivePath = yield tc.extractTar(downloadPath, tempDir);
                    yield this.moveToPath(path.join(archivePath, this.pathInArchive));
                    break;
                case ArchiveType.Zip:
                    archivePath = yield tc.extractZip(downloadPath, tempDir);
                    yield this.moveToPath(path.join(archivePath, this.pathInArchive));
                    break;
                case ArchiveType.SevenZ:
                    archivePath = yield tc.extract7z(downloadPath, tempDir);
                    yield this.moveToPath(path.join(archivePath, this.pathInArchive));
                    break;
            }
            // Clean up the tempdir when done (this step is important for self-hosted runners)
            return io.rmRF(tempDir);
        });
    }
    moveToPath(downloadPath) {
        return __awaiter(this, void 0, void 0, function* () {
            let toolPath = binPath();
            yield io.mkdirP(toolPath);
            yield io.mv(downloadPath, path.join(toolPath, this.name));
            if (process.platform !== "win32") {
                yield exec.exec("chmod", ["+x", path.join(toolPath, this.name)]);
            }
            core.addPath(toolPath);
        });
    }
    validate() {
        if (!this.name) {
            throw new Error(`"name" is required. This is used to set the executable name of the tool.`);
        }
        if (!this.fromGitHubReleases && !this.url) {
            throw new Error(`"url" is required when downloading a tool directly.`);
        }
        if (!this.fromGitHubReleases && !matchesUrlRegex(this.url)) {
            throw new Error(`"url" supplied as input is not a valid URL.`);
        }
        if (this.fromGitHubReleases && !matchesUrlRegex(this.urlTemplate)) {
            throw new Error(`"urlTemplate" supplied as input is not a valid URL.`);
        }
        if (getArchiveType(this.url) !== ArchiveType.None && !this.pathInArchive) {
            throw new Error(`"pathInArchive" is required when "url" points to an archive file`);
        }
        if (this.fromGitHubReleases &&
            getArchiveType(this.urlTemplate) !== ArchiveType.None &&
            !this.pathInArchive) {
            throw new Error(`"pathInArchive" is required when "urlTemplate" points to an archive file.`);
        }
        if (this.fromGitHubReleases &&
            (!this.token || !this.repo || !this.version || !this.urlTemplate)) {
            throw new Error(`if trying to fetch version from GitHub releases, "token", "repo", "version", and "urlTemplate" are required.`);
        }
    }
}
exports.Configurator = Configurator;
function getArchiveType(downloadURL) {
    if (downloadURL.endsWith(ArchiveType.TarGz))
        return ArchiveType.TarGz;
    if (downloadURL.endsWith(ArchiveType.TarXz))
        return ArchiveType.TarXz;
    if (downloadURL.endsWith(ArchiveType.Tgz))
        return ArchiveType.Tgz;
    if (downloadURL.endsWith(ArchiveType.Zip))
        return ArchiveType.Zip;
    if (downloadURL.endsWith(ArchiveType.SevenZ))
        return ArchiveType.SevenZ;
    return ArchiveType.None;
}
exports.getArchiveType = getArchiveType;
function binPath() {
    let baseLocation;
    if (process.platform === "win32") {
        // On windows use the USERPROFILE env variable
        baseLocation = process.env["USERPROFILE"] || "C:\\";
    }
    else {
        if (process.platform === "darwin") {
            baseLocation = "/Users";
        }
        else {
            baseLocation = "/home";
        }
    }
    return path.join(baseLocation, os.userInfo().username, "configurator", "bin");
}
exports.binPath = binPath;
var ArchiveType;
(function (ArchiveType) {
    ArchiveType["None"] = "";
    ArchiveType["TarGz"] = ".tar.gz";
    ArchiveType["TarXz"] = ".tar.xz";
    ArchiveType["Tgz"] = ".tgz";
    ArchiveType["Zip"] = ".zip";
    ArchiveType["SevenZ"] = ".7z";
})(ArchiveType = exports.ArchiveType || (exports.ArchiveType = {}));
function matchesUrlRegex(input) {
    var reg = new RegExp("^(http://www.|https://www.|http://|https://)?[a-z0-9]+([-.]{1}[a-z0-9]+)*.[a-z]{2,5}(:[0-9]{1,5})?(/.*)?$");
    return reg.test(input);
}
