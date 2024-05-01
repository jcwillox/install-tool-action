# Install Tool Action

[![License](https://img.shields.io/github/license/jcwillox/install-tool-action?style=flat-square)](https://github.com/jcwillox/install-tool-action/blob/main/LICENSE)
[![Version](https://img.shields.io/github/v/release/jcwillox/install-tool-action?style=flat-square)](https://github.com/jcwillox/install-tool-action/releases)
[![Size](https://img.shields.io/github/size/jcwillox/install-tool-action/dist%2Findex.js?branch=main&style=flat-square)](dist/index.js)
[![Code style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)

Install any tool or binary with full cache, dynamic latest version, easy to configure and has presets.

- Blazingly fast ⚡
- Cache downloads using the tool cache 📦
- Supports fetching and caching latest version dynamically 🚀
- Can be configured to install almost any tool or binary 🛠️
- Has built-in [presets](#presets) for common tools like 🧰

## Usage

```yaml
- name: "Checkout the repository"
  uses: actions/checkout@v4

- name: "Install Cloud SQL Proxy"
  id: install-tool
  uses: jcwillox/install-tool-action@v1
  with:
    preset: "cloud-sql-proxy"

- name: "Show Outputs"
  run: |
    echo "path=${{ steps.install-tool.outputs.path }}"
    echo "version=${{ steps.install-tool.outputs.version }}"

- name: "Print Version"
  run: |
    cloud-sql-proxy --version
```

## Inputs

| Name            | Description                                                                                                                      | Default               |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `preset`        | Preset to use, see [Presets](#presets)                                                                                           |                       |
| `version`       | Version of the tool to install                                                                                                   | `latest`              |
| `repo`          | Repository to use for defaults, see [Repository](#repository)                                                                    |                       |
| `id`            | Id to use for tool cache when not using `preset` or `repo`                                                                       |                       |
| `version_url`   | URL to fetch the latest version from, see [Version URL](#version-url)                                                            |                       |
| `version_path`  | JSON path like expression to extract version from the response, see [radash.get](https://radash-docs.vercel.app/docs/object/get) |                       |
| `version_regex` | Regex to extract the version from the response, see [Version URL](#version-url)                                                  | `(?<version>[\\d.]+)` |
| `download_url`  | URL to download the tool from, see [Download URL](#download-url)                                                                 |                       |
| `download_name` | Rename downloaded binaries, does not work with archives, see [Download Name](#download-name)                                     |                       |
| `bin_path`      | Sub-path of a downloaded archive to add to PATH                                                                                  |                       |
| `cache`         | Set to `false` to disable use of the tool cache                                                                                  | `true`                |
| `token`         | Token to use for GitHub requests                                                                                                 | `GITHUB_TOKEN`        |

## Outputs

| Name      | Description                                                                                   |
| --------- | --------------------------------------------------------------------------------------------- |
| `path`    | Path to the installed tool, will be the directory of the tool and does not include `bin_path` |
| `version` | The resolved version of the tool                                                              |

## Presets

| Name              | URL                                                    |
| ----------------- | ------------------------------------------------------ |
| `infisical-cli`   | https://github.com/Infisical/infisical                 |
| `cloud-sql-proxy` | https://github.com/GoogleCloudPlatform/cloud-sql-proxy |

## Custom Config

See [presets/index.ts](src/presets/index.ts) for examples of how to configure a custom tool.

Custom presets are very simple to create, for example to the `infisical-cli` all you need to set is

```yaml
repo: "infisical/infisical"
download_url: "/releases/download/infisical-cli/v{{version}}/infisical_{{version}}_{{os}}_{{arch}}.{{archive}}"
```

### Repository

Setting the `repo` input will set defaults for the tool, this includes

- `version_url` - `https://api.github.com/repos/${repo}/releases/latest`
- `version_path` - `tag_name`
- `download_url` - when `download_url` starts with `/`, e.g. is a relative url
  - `https://github.com/${repo}/${download_url}`

### Version URL

The URL to fetch the latest version from defaults to `https://api.github.com/repos/${repo}/releases/latest` for GitHub repositories, this can be overridden using the `version_url` input.

The version can be extracted from the response using `version_path` and `version_regex`, the response payload is JSON [radash.get](https://radash-docs.vercel.app/docs/object/get) is used to extract the version from the response which is JSON-path like.

Additionally or alternatively you can use `version_regex` to extract the version from the response, or result from `version_path`, the regex can have a named capture group called `version` which will be used as the version, otherwise the entire match will be used. The regex defaults to `(?<version>[\\d.]+)`.

### Download URL

The `download_url` field supports templating, using [radash.template](https://radash-docs.vercel.app/docs/string/template), the following variables are available in addition to the inputs

```ts
const templateArgs = {
  ...config, // input values are merged
  os: process.platform === "win32" ? "windows" : process.platform,
  arch: process.arch === "x64" ? "amd64" : process.arch,
  arch2: process.arch,
  exe: process.platform === "win32" ? ".exe" : "",
  archive: process.platform === "win32" ? "zip" : "tar.gz",
};
```

If the downloaded file is an archive, it will be automatically extracted base on the extension, additionally the `bin_path` input can be used to specify a sub-path of the archive to add to PATH, it defaults to the root.

### Download Name

When downloading a binary (not an archive), you can rename the downloaded file using the `download_name` input, this is useful when the downloaded file has a version or arch in the name, e.g. `cloud-sql-proxy.linux.amd64` can be renamed to `cloud-sql-proxy` using `download_name: cloud-sql-proxy`.
