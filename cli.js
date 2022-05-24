const tc = require('@actions/tool-cache');
const core = require('@actions/core');
const exec = require("@actions/exec");
const http = require('@actions/http-client');

const client = new http.HttpClient("action-zeet")

async function getBinaryURL() {
    const res = await client.get("https://api.github.com/repos/zeet-dev/cli/releases/latest");
    const body = await res.readBody();
    const obj = JSON.parse(body);

    let arch;
    if (process.arch === "arm") {
        arch = "armv6";
    }
    if (process.arch === "arm64") {
        arch = "arm64";
    }
    if (process.arch === "x64") {
        arch = "x86_64";
    }

    let asset;
    if (process.platform === "linux") {
        asset = obj.assets.find(a => a.name.includes(`linux_${arch}`));
    }
    if (process.platform === "win32") {
        asset = obj.assets.find(a => a.name.includes(`windows_${arch}`));
    }
    if (process.platform === "darwin") {
        asset = obj.assets.find(a => a.name.includes(`darwin_${arch}`));
    }

    if (!asset) {
        throw new Error("Asset for the OS/arch not found")
    }

    return [asset.browser_download_url, obj.tag_name];
}

async function downloadBinary(url) {
    const binaryPath = await tc.downloadTool(url)

    let extractedPath;
    if (url.endsWith(".tar.gz")) {
        extractedPath = await tc.extractTar(binaryPath)
    }
    if (url.endsWith(".zip")) {
        extractedPath = await tc.extractZip(binaryPath)
    }

    return extractedPath
}

export async function installBinary() {
    const [binaryURL, tagName] = await getBinaryURL();

    if (!tc.find("zeet", tagName)) {
        const binaryPath = await downloadBinary(binaryURL)
        const cachedPath = await tc.cacheDir(binaryPath, "zeet", tagName);
        core.addPath(cachedPath);
    }

    // Configure api url
    const apiURL = core.getInput('api_url', {required: true});
    await exec.exec('zeet', ['config:set', `server=${apiURL}`]);

    const token = core.getInput('token', {required: true});
    await exec.exec('zeet', ['login', `--token=${token}`]);
}