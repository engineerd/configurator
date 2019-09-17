import * as path from 'path';
const toolDir = path.join(__dirname, 'tmp', 'runner', 'tools');
const tempDir = path.join(__dirname, 'tmp', 'runner', 'temp');
const dataDir = path.join(__dirname, 'tmp', 'data');

process.env['RUNNER_TOOL_CACHE'] = toolDir;
process.env['RUNNER_TEMP'] = tempDir;

import "mocha";
import { assert } from "chai";
import * as cfg from '../src/configurator';
import * as fs from 'fs';
import * as rimraf from 'rimraf';

describe("test archive type", () => {
    it("correctly chooses the NONE archive type", () => {
        const archiveTypeNoneInput = {
            INPUT_URL: 'https://github.com/<some-repo>/releases/download/<release>/some-binary',
        };
        for (const key in archiveTypeNoneInput)
            process.env[key] = archiveTypeNoneInput[key]
        
        let c = cfg.getConfig();
        assert.equal(cfg.ArchiveType.None, c.getArchiveType());
    });

    it("correctly chooses the TAR.GZ archive type", () => {
        const archiveTypeTarInput = {
            INPUT_URL: 'https://github.com/<some-repo>/releases/download/<release>/some-tar-archive.tar.gz',
        };
        for (const key in archiveTypeTarInput)
            process.env[key] = archiveTypeTarInput[key]
        
        let c = cfg.getConfig();
        assert.equal(cfg.ArchiveType.TarGz, c.getArchiveType());
    });

    it("correctly chooses the ZIP archive type", () => {
        const archiveTypeZipInput = {
            INPUT_URL: 'https://github.com/<some-repo>/releases/download/<release>/some-tar-archive.zip',
        };
        for (const key in archiveTypeZipInput)
            process.env[key] = archiveTypeZipInput[key]
        
        let c = cfg.getConfig();
        assert.equal(cfg.ArchiveType.Zip, c.getArchiveType());
    });

    it("correctly chooses the 7Z archive type", () => {
        const archiveTypeZipInput = {
            INPUT_URL: 'https://github.com/<some-repo>/releases/download/<release>/some-tar-archive.7z',
        };
        for (const key in archiveTypeZipInput)
            process.env[key] = archiveTypeZipInput[key];
        
        let c = cfg.getConfig();
        assert.equal(cfg.ArchiveType.SevenZ, c.getArchiveType());
    });
});

describe("test download", async () => {
    after(() => {
        rimraf.sync(tempDir);
        rimraf.sync(cfg.binPath());
    });

    it("correctly downloads plain files", async () => {
        const input = {
            INPUT_URL: 'https://github.com/kubernetes-sigs/kind/releases/download/v0.5.1/kind-linux-amd64',
            INPUT_NAME: 'kind',
        }
        for (const key in input)
            process.env[key] = input[key];
        
        let c = cfg.getConfig();
        await c.configure();

        assert.equal(fs.existsSync(path.join(cfg.binPath(), c.name)), true);
    });


    it("correctly downloads .tar.gz files", async () => {
        const input = {
            INPUT_URL: 'https://get.helm.sh/helm-v3.0.0-beta.3-linux-amd64.tar.gz',
            INPUT_NAME: 'hb3',
            INPUT_PATHINARCHIVE: 'linux-amd64/helm'
        }
        for (const key in input)
            process.env[key] = input[key];
        
        let c = cfg.getConfig();
        await c.configure();

        assert.equal(fs.existsSync(path.join(cfg.binPath(), c.name)), true);
    });

    it("correctly downloads .zip files", async () => {
        const input = {
            INPUT_URL: 'https://get.helm.sh/helm-v3.0.0-beta.3-windows-amd64.zip',
            INPUT_NAME: 'helm.exe',
            INPUT_PATHINARCHIVE: 'windows-amd64/helm.exe'
        }
        for (const key in input)
            process.env[key] = input[key];
        
        let c = cfg.getConfig();
        await c.configure();

        assert.equal(fs.existsSync(path.join(cfg.binPath(), c.name)), true);
    });
})