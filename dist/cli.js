"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
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
exports.configureCLI = exports.installBinary = void 0;
const tc = __importStar(require("@actions/tool-cache"));
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const http = __importStar(require("@actions/http-client"));
const client = new http.HttpClient("action-zeet");
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
        const binaryPath = yield tc.downloadTool(url);
        let extractedPath;
        if (url.endsWith(".tar.gz")) {
            extractedPath = yield tc.extractTar(binaryPath);
        }
        else if (url.endsWith(".zip")) {
            extractedPath = yield tc.extractZip(binaryPath);
        }
        else {
            throw "Could not extract file " + url;
        }
        return extractedPath;
    });
}
function installBinary() {
    return __awaiter(this, void 0, void 0, function* () {
        const [binaryURL, tagName] = yield getBinaryURL();
        if (!tc.find("zeet", tagName)) {
            const binaryPath = yield downloadBinary(binaryURL);
            const cachedPath = yield tc.cacheDir(binaryPath, "zeet", tagName);
            core.addPath(cachedPath);
        }
    });
}
exports.installBinary = installBinary;
function configureCLI(token, apiURL) {
    return __awaiter(this, void 0, void 0, function* () {
        yield exec.exec("zeet login", [`--token=${token}`]);
        if (apiURL)
            yield exec.exec("zeet config:set", ["server=" + apiURL]);
    });
}
exports.configureCLI = configureCLI;
