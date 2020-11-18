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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTag = void 0;
const github = __importStar(require("@actions/github"));
const semver = __importStar(require("semver"));
function getTag(token, repo, version, includePrereleases) {
    return __awaiter(this, void 0, void 0, function* () {
        // the `version` input field can either be a valid semver version, or a
        // version range. If none of them are valid, throw an error.
        if (semver.valid(version) === null &&
            semver.validRange(version) === null &&
            version !== "latest") {
            throw new Error(`version input: ${version} is not a valid semver version or range.`);
        }
        let client = github.getOctokit(token);
        let owner = repo.split("/")[0];
        let repoName = repo.split("/")[1];
        // by default, the GitHub releases API returns the first 30 releases.
        // while we haven't found a suitable release, increment the page index
        // and iterate through the results.
        let result;
        let pageIndex = 1;
        while (result === undefined) {
            let releases = yield client.repos.listReleases({
                owner: owner,
                repo: repoName,
                page: pageIndex,
            });
            // if result is still undefined and there are no more releases it means there are actually
            // no releases that satisty the version constrained. If this happens, throw an error.
            if (releases.data.length === 0 && result === undefined) {
                throw new Error(`cannot find suitable release for version constraint ${version} for repo ${owner}/${repo}`);
            }
            result = searchSatisfyingRelease(releases.data, version, includePrereleases);
            pageIndex++;
        }
        console.log(`selected release version ${result.tag_name}, which can be viewed at ${result.url}`);
        return result.tag_name;
    });
}
exports.getTag = getTag;
function searchSatisfyingRelease(releases, version, includePrereleases) {
    // normally the release array returned by the API should be ordered by the release date, so
    // we iterate through it until we find the latest version that satisfies the version constraint.
    // The initial assumption is that, given that users _should_ want to use recently released versions,
    // and the number of releases is not (normally) very large, the complexity of this loop should not
    // be an issue.
    // However, given that this is an ordered array, we could explore a binary search here.
    for (let i = 0; i < releases.length; i++) {
        if (version === "latest") {
            if ((includePrereleases && releases[i].prerelease) ||
                !releases[i].prerelease) {
                return releases[i];
            }
        }
        if (includePrereleases === false && releases[i].prerelease === true) {
            continue;
        }
        if (semver.satisfies(releases[i].tag_name, version, {
            includePrerelease: includePrereleases,
        })) {
            return releases[i];
        }
    }
    return undefined;
}
