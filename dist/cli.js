"use strict";
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
exports.installBinary = void 0;
const tool_cache_1 = __importDefault(require("@actions/tool-cache"));
const core_1 = __importDefault(require("@actions/core"));
const exec_1 = __importDefault(require("@actions/exec"));
const http_client_1 = __importDefault(require("@actions/http-client"));
const client = new http_client_1.default.HttpClient("action-zeet");
function getBinaryURL() {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield client.get("https://api.github.com/repos/zeet-dev/cli/releases/latest");
        const body = yield res.readBody();
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
            asset = obj.assets.find((a) => a.name.includes(`linux_${arch}`));
        }
        if (process.platform === "win32") {
            asset = obj.assets.find((a) => a.name.includes(`windows_${arch}`));
        }
        if (process.platform === "darwin") {
            asset = obj.assets.find((a) => a.name.includes(`darwin_${arch}`));
        }
        if (!asset) {
            throw new Error("Asset for the OS/arch not found");
        }
        return [asset.browser_download_url, obj.tag_name];
    });
}
function downloadBinary(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const binaryPath = yield tool_cache_1.default.downloadTool(url);
        let extractedPath;
        if (url.endsWith(".tar.gz")) {
            extractedPath = yield tool_cache_1.default.extractTar(binaryPath);
        }
        if (url.endsWith(".zip")) {
            extractedPath = yield tool_cache_1.default.extractZip(binaryPath);
        }
        else {
            throw "Could not extract file";
        }
        return extractedPath;
    });
}
function installBinary() {
    return __awaiter(this, void 0, void 0, function* () {
        const [binaryURL, tagName] = yield getBinaryURL();
        if (!tool_cache_1.default.find("zeet", tagName)) {
            const binaryPath = yield downloadBinary(binaryURL);
            const cachedPath = yield tool_cache_1.default.cacheDir(binaryPath, "zeet", tagName);
            core_1.default.addPath(cachedPath);
        }
        // Configure api url
        const apiURL = core_1.default.getInput("api_url", { required: true });
        yield exec_1.default.exec("zeet", ["config:set", `server=${apiURL}`]);
        const token = core_1.default.getInput("token", { required: true });
        yield exec_1.default.exec("zeet", ["login", `--token=${token}`]);
    });
}
exports.installBinary = installBinary;
