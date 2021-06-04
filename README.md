# @engineerd/configurator

Cross-platform GitHub Action for downloading statically compiled tools (or
archives) and adding them to the path. This has been tested on `ubuntu-latest`,
`windows-latest`, and `macos-latest`.

This action can be used in two modes:

- directly providing a download URL (or a URL per-platform, using a
  configuration matrix)
- providing a URL template and a semver version or range to be selected from
  GitHub releases. In this mode, the action iterates through the GitHub releases
  to find the latest version that satisfies the version (or range) constraint,
  constructs the download URL, and adds the tool to the path.

## Directly downloading tools based on URL

Inputs:

- `name`: name your tool will be configured with (required)
- `url`: URL to download your tool from (required)
- `pathInArchive`: if the URL points to an archive, this field is required, and
  points to the path of the tool to configure, relative to the archive root

Examples - a cross-platform action that downloads, extracts, and adds Helm
v3.3.0 to the path:

```yaml
jobs:
  configurator:
    runs-on: ${{ matrix.config.os }}
    strategy:
      matrix:
        config:
          - {
              os: "ubuntu-latest",
              url: "https://get.helm.sh/helm-v3.3.0-linux-amd64.tar.gz",
              name: "h3",
              pathInArchive: "linux-amd64/helm",
            }
          - {
              os: "windows-latest",
              url: "https://get.helm.sh/helm-v3.3.0-windows-amd64.zip",
              name: "h3.exe",
              pathInArchive: "windows-amd64/helm.exe",
            }
    steps:
      - uses: engineerd/configurator@v0.0.8
        with:
          name: ${{ matrix.config.name }}
          url: ${{ matrix.config.url }}
          pathInArchive: ${{ matrix.config.pathInArchive }}
      - name: Testing
        run: |
          h3 --help
```

## Selecting versions from GitHub Releases

Inputs:

- `name`: name your tool will be configured with (required)
- `pathInArchive`: if the URL points to an archive, this field is required, and
  points to the path of the tool to configure, relative to the archive root
- `fromGitHubReleases`: if true, the action will attempt to get the latest
  version from the specified repository's GitHub Releases that matches the given
  semver version or range provided, and then construct the download URL using
  the provided `urlTemplate`.
- `repo`: GitHub repository of the tool. Used to list all releases and select
  the proper version. Required if `fromGitHubReleases` is true.
- `version`: an exact semver version or version range (specified with ^ or ~, as
  defined and used by [NPM](https://docs.npmjs.com/about-semantic-versioning)).
  If using semver ranges with `v0.x.x` releases, be sure to
  [understand the semver behavior here](https://docs.npmjs.com/misc/semver#caret-ranges-123-025-004).
  If `latest` is provided, the action will download the latest release
  (respecting the `includePrereleases flag`), which, can break your action.
  Required if `fromGitHubReleases` is true.
- `token`: GitHub token used _only_ to list the GitHub releases for the supplied
  repository. For most cases, its value should be `${{ secrets.GITHUB_TOKEN }}`.
  Required if `fromGitHubReleases` is true.
- `urlTemplate`: a URL template used to construct the download URL, together
  with the desired version acquired from a GitHub release. For example,
  `https://get.helm.sh/helm-{{version}}-linux-amd64.tar.gz` (the version
  inserted here is the exact tag name from GitHub - check whether the tag name
  contains any `v` before the version when constructing the URL template). Note
  that this is [Mustache template](https://mustache.github.io/) (completely
  separate from the GitHub Actions templating system - the template _must be_
  `{{version}}`). Note that if the version tag has a leading `v`, a
  `{{rawVersion}}` variable that doesn't contain the leading `v` can be used in
  the `urlTemplate`. Required if `fromGitHubReleases` is true.
- `includePrereleases`: if true, the action will include pre-releases when
  selecting a version from GitHub Releases.

Example - a cross-platform action that selects the latest Helm version that
satisfies the `^3.1.2` release constraint - meaning it selects any minor and
patch update, or, in other words, the latest `v3.x.x` version:

```yaml
jobs:
  configurator:
    runs-on: ${{ matrix.config.os }}
    strategy:
      matrix:
        config:
          - {
              os: "ubuntu-latest",
              urlTemplate: "https://get.helm.sh/helm-{{version}}-linux-amd64.tar.gz",
              name: "h3",
              pathInArchive: "linux-amd64/helm",
            }
          - {
              os: "windows-latest",
              urlTemplate: "https://get.helm.sh/helm-{{version}}-windows-amd64.zip",
              name: "h3.exe",
              pathInArchive: "windows-amd64/helm.exe",
            }
    steps:
      - uses: engineerd/configurator@v0.0.8
        with:
          name: ${{ matrix.config.name }}
          pathInArchive: ${{ matrix.config.pathInArchive }}
          fromGitHubReleases: "true"
          repo: "helm/helm"
          version: "^v3.1.2"
          urlTemplate: ${{ matrix.config.urlTemplate }}
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Testing
        run: |
          h3 --help
```

Example - an action that selects the latest non-pre-release (as marked in the
GitHub release) of Kind:

```yaml
jobs:
  kind:
    runs-on: ubuntu-latest
    steps:
      - uses: engineerd/configurator@v0.0.8
        with:
          name: "kind"
          fromGitHubReleases: "true"
          repo: "kubernetes-sigs/kind"
          urlTemplate: "https://github.com/kubernetes-sigs/kind/releases/download/{{version}}/kind-linux-amd64"
          version: "latest"
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Testing
        run: |
          kind --help
```

## Other examples

- download an executable from a given URL and move it to a folder in path with
  the given name:

```yaml
name: "Test plain file"
on: [pull_request, push]

jobs:
  kind:
    runs-on: ubuntu-latest
    steps:
      - uses: engineerd/configurator@v0.0.8
        with:
          name: "kind"
          url: "https://github.com/kubernetes-sigs/kind/releases/download/v0.8.1/kind-linux-amd64"
      - name: Testing
        run: |
          kind --help
```

- download a `.tar.gz` archive from a given URL, and move a certain file from
  the archive directory to a folder in path, with a given name:

```yaml
name: "Test .tar.gz"
on: [pull_request, push]

jobs:
  kind:
    runs-on: ubuntu-latest
    steps:
      - uses: engineerd/configurator@v0.0.8
        with:
          name: "h3"
          url: "https://get.helm.sh/helm-v3.3.0-linux-amd64.tar.gz"
          pathInArchive: "linux-amd64/helm"
      - name: Testing
        run: |
          h3 --help
```

- download a `.zip` archive on Windows from a given URL, and move a certain file
  from the archive directory to a folder in path, with a given name:

```yaml
name: "Test .zip"
on: [pull_request, push]

jobs:
  kind:
    runs-on: windows-latest
    steps:
      - uses: engineerd/configurator@v0.0.8
        with:
          name: "h3.exe"
          url: "https://get.helm.sh/helm-v3.3.0-windows-amd64.zip"
          pathInArchive: "windows-amd64/helm.exe"
      - name: Testing
        run: |
          h3 --help
```

> Note: usually, Windows-specific tooling uses `.zip` archives - and the `tar`
> utility on Windows doesn't seem to handle `.tar.gz` files properly. Note: for
> Linux, `chmod +x` is called on the target file before moving it to the path,
> ensuring it is executable. On Windows this is skipped.
