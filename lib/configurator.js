"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const tc = __importStar(require("@actions/tool-cache"));
const exec = __importStar(require("@actions/exec"));
const io = __importStar(require("@actions/io"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
var ArchiveType;
(function (ArchiveType) {
    ArchiveType["None"] = "";
    ArchiveType["TarGz"] = ".tar.gz";
    ArchiveType["Zip"] = ".zip";
    ArchiveType["SevenZ"] = ".7z";
})(ArchiveType = exports.ArchiveType || (exports.ArchiveType = {}));
class Configurator {
    constructor(name, url, pathInArchive) {
        this.name = name;
        this.url = url;
        this.pathInArchive = pathInArchive;
    }
    getArchiveType() {
        if (this.url.endsWith(ArchiveType.TarGz))
            return ArchiveType.TarGz;
        if (this.url.endsWith(ArchiveType.Zip))
            return ArchiveType.Zip;
        if (this.url.endsWith(ArchiveType.SevenZ))
            return ArchiveType.SevenZ;
        return ArchiveType.None;
    }
    configure() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Downloading tool from ${this.url}...`);
            let downloadPath = null;
            let archivePath = null;
            const tempDir = path.join(os.tmpdir(), 'tmp', 'runner', 'temp');
            yield io.mkdirP(tempDir);
            downloadPath = yield tc.downloadTool(this.url);
            switch (this.getArchiveType()) {
                case ArchiveType.None:
                    return this.moveToPath(downloadPath);
                case ArchiveType.TarGz:
                    archivePath = yield tc.extractTar(downloadPath, tempDir);
                    return this.moveToPath(path.join(archivePath, this.pathInArchive));
                case ArchiveType.Zip:
                    archivePath = yield tc.extractZip(downloadPath, tempDir);
                    return this.moveToPath(path.join(archivePath, this.pathInArchive));
                case ArchiveType.SevenZ:
                    archivePath = yield tc.extract7z(downloadPath, tempDir);
                    return this.moveToPath(path.join(archivePath, this.pathInArchive));
            }
        });
    }
    moveToPath(downloadPath) {
        return __awaiter(this, void 0, void 0, function* () {
            let toolPath = binPath();
            yield io.mkdirP(toolPath);
            yield io.mv(downloadPath, path.join(toolPath, this.name));
            if (process.platform !== 'win32') {
                yield exec.exec("chmod", ["+x", path.join(toolPath, this.name)]);
            }
            core.addPath(toolPath);
        });
    }
}
exports.Configurator = Configurator;
const NameInput = "name";
const URLInput = "url";
const PathInArchiveInput = "pathInArchive";
function getConfig() {
    const n = core.getInput(NameInput);
    const u = core.getInput(URLInput);
    const p = core.getInput(PathInArchiveInput);
    return new Configurator(n, u, p);
}
exports.getConfig = getConfig;
function binPath() {
    let baseLocation;
    if (process.platform === 'win32') {
        // On windows use the USERPROFILE env variable
        baseLocation = process.env['USERPROFILE'] || 'C:\\';
    }
    else {
        if (process.platform === 'darwin') {
            baseLocation = '/Users';
        }
        else {
            baseLocation = '/home';
        }
    }
    return path.join(baseLocation, os.userInfo().username, "configurator", "bin");
}
exports.binPath = binPath;
