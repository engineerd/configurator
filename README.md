# @engineerd/configurator

Cross-platform GitHub Action for downloading statically compiled tools (or extracting them from an archive) and adding them to the path.
This has been tested on `ubuntu-latest` and `windows-latest`.

Inputs:

- `name`: name your tool will be configured with (required)
- `url`: URL to download your tool from (required)
- `pathInArchive`: if the URL points to an archive, this field is required, and points to the path of the tool to configure (relative to the archive root).


Examples:

- cross platform action:

```yaml
jobs:
  configurator:
    runs-on: ${{ matrix.config.os }}
    strategy:
      matrix:
        config:
        - {os: "ubuntu-latest", url: "https://get.helm.sh/helm-v3.0.0-beta.3-linux-amd64.tar.gz", name: "hb3", pathInArchive: "linux-amd64/helm" }
        - {os: "windows-latest", url: "https://get.helm.sh/helm-v3.0.0-beta.3-windows-amd64.zip", name: "hb3.exe", pathInArchive: "windows-amd64/helm.exe" }
    steps:
      - uses: engineerd/configurator@v0.0.1
        with:
          name: ${{ matrix.config.name }}
          url: ${{ matrix.config.url }}
          pathInArchive: ${{ matrix.config.pathInArchive }}
      - name: Testing
        run: |
          hb3 --help
```


- download an executable from a given URL and move it to a folder in path with the given name:

```yaml
name: "Test plain file"
on: [pull_request, push]

jobs:
  kind:
    runs-on: ubuntu-latest
    steps:
      - uses: engineerd/configurator@v0.0.1
        with:
          name: "kind"
          url: "https://github.com/kubernetes-sigs/kind/releases/download/v0.5.1/kind-linux-amd64"
      - name: Testing
        run: |
          kind --help
```

- download a `.tar.gz` archive from a given URL, and move a certain file from the archive directory to a folder in path, with a given name:

```yaml
name: "Test .tar.gz"
on: [pull_request, push]

jobs:
  kind:
    runs-on: ubuntu-latest
    steps:
      - uses: engineerd/configurator@v0.0.1
        with:
          name: "hb3"
          url: "https://get.helm.sh/helm-v3.0.0-beta.3-linux-amd64.tar.gz"
          pathInArchive: "linux-amd64/helm"
      - name: Testing
        run: |
          hb3 --help
```

- download a `.zip` archive on Windows from a given URL, and move a certain file from the archive directory to a folder in path, with a given name:

```yaml
name: "Test .zip"
on: [pull_request, push]

jobs:
  kind:
    runs-on: windows-latest
    steps:
      - uses: engineerd/configurator@v0.0.1
        with:
          name: "hb3.exe"
          url: "https://get.helm.sh/helm-v3.0.0-beta.3-windows-amd64.zip"
          pathInArchive: "windows-amd64/helm.exe"
      - name: Testing
        run: |
          hb3 --help
```

> Note: usually, Windows-specific tooling uses `.zip` archives - and the `tar` utility on Windows doesn't seem to handle `.tar.gz` files properly.

> Note: for Linux, `chmod +x` is called on the target file before moving it to the path, ensuring it is executable. On Windows this is skipped.