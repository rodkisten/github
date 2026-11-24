import { n as __require, r as __toESM, t as __commonJSMin } from "./rolldown-runtime-DegdyBIC.js";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { a as style, c as require_tunnel, i as logger, n as setOutputs, o as require_core$1, r as runAction, t as getInputs } from "./inputs-DOIaVO8E.js";
import { t as require_undici } from "./undici-BWhVEOOo.js";
import { n as cmd } from "./cmd-DSJikFMl.js";
// node_modules/@actions/tool-cache/node_modules/@actions/core/lib/utils.js
var require_utils = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.toCommandProperties = exports.toCommandValue = void 0;
	/**
	* Sanitizes an input into a string so it can be passed into issueCommand safely
	* @param input input to sanitize into a string
	*/
	function toCommandValue(input) {
		if (input === null || input === void 0) return "";
		else if (typeof input === "string" || input instanceof String) return input;
		return JSON.stringify(input);
	}
	exports.toCommandValue = toCommandValue;
	/**
	*
	* @param annotationProperties
	* @returns The command properties to send with the actual annotation command
	* See IssueCommandProperties: https://github.com/actions/runner/blob/main/src/Runner.Worker/ActionCommandManager.cs#L646
	*/
	function toCommandProperties(annotationProperties) {
		if (!Object.keys(annotationProperties).length) return {};
		return {
			title: annotationProperties.title,
			file: annotationProperties.file,
			line: annotationProperties.startLine,
			endLine: annotationProperties.endLine,
			col: annotationProperties.startColumn,
			endColumn: annotationProperties.endColumn
		};
	}
	exports.toCommandProperties = toCommandProperties;
}));
// node_modules/@actions/tool-cache/node_modules/@actions/core/lib/command.js
var require_command = /* @__PURE__ */ __commonJSMin(((exports, module, this$16) => {
	var __createBinding = this$16 && this$16.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = this$16 && this$16.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = this$16 && this$16.__importStar || function(mod) {
		if (mod && mod.__esModule) return mod;
		var result = {};
		if (mod != null) {
			for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		}
		__setModuleDefault(result, mod);
		return result;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.issue = exports.issueCommand = void 0;
	const os = __importStar(__require("os"));
	const utils_1 = require_utils();
	/**
	* Commands
	*
	* Command Format:
	*   ::name key=value,key=value::message
	*
	* Examples:
	*   ::warning::This is the message
	*   ::set-env name=MY_VAR::some value
	*/
	function issueCommand(command, properties, message) {
		const cmd = new Command(command, properties, message);
		process.stdout.write(cmd.toString() + os.EOL);
	}
	exports.issueCommand = issueCommand;
	function issue(name, message = "") {
		issueCommand(name, {}, message);
	}
	exports.issue = issue;
	const CMD_STRING = "::";
	var Command = class {
		constructor(command, properties, message) {
			if (!command) command = "missing.command";
			this.command = command;
			this.properties = properties;
			this.message = message;
		}
		toString() {
			let cmdStr = CMD_STRING + this.command;
			if (this.properties && Object.keys(this.properties).length > 0) {
				cmdStr += " ";
				let first = true;
				for (const key in this.properties) if (this.properties.hasOwnProperty(key)) {
					const val = this.properties[key];
					if (val) {
						if (first) first = false;
						else cmdStr += ",";
						cmdStr += `${key}=${escapeProperty(val)}`;
					}
				}
			}
			cmdStr += `${CMD_STRING}${escapeData(this.message)}`;
			return cmdStr;
		}
	};
	function escapeData(s) {
		return (0, utils_1.toCommandValue)(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A");
	}
	function escapeProperty(s) {
		return (0, utils_1.toCommandValue)(s).replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A").replace(/:/g, "%3A").replace(/,/g, "%2C");
	}
}));
// node_modules/@actions/tool-cache/node_modules/@actions/core/lib/file-command.js
var require_file_command = /* @__PURE__ */ __commonJSMin(((exports, module, this$15) => {
	var __createBinding = this$15 && this$15.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = this$15 && this$15.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = this$15 && this$15.__importStar || function(mod) {
		if (mod && mod.__esModule) return mod;
		var result = {};
		if (mod != null) {
			for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		}
		__setModuleDefault(result, mod);
		return result;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.prepareKeyValueMessage = exports.issueFileCommand = void 0;
	const crypto = __importStar(__require("crypto"));
	const fs = __importStar(__require("fs"));
	const os = __importStar(__require("os"));
	const utils_1 = require_utils();
	function issueFileCommand(command, message) {
		const filePath = process.env[`GITHUB_${command}`];
		if (!filePath) throw new Error(`Unable to find environment variable for file command ${command}`);
		if (!fs.existsSync(filePath)) throw new Error(`Missing file at path: ${filePath}`);
		fs.appendFileSync(filePath, `${(0, utils_1.toCommandValue)(message)}${os.EOL}`, { encoding: "utf8" });
	}
	exports.issueFileCommand = issueFileCommand;
	function prepareKeyValueMessage(key, value) {
		const delimiter = `ghadelimiter_${crypto.randomUUID()}`;
		const convertedValue = (0, utils_1.toCommandValue)(value);
		if (key.includes(delimiter)) throw new Error(`Unexpected input: name should not contain the delimiter "${delimiter}"`);
		if (convertedValue.includes(delimiter)) throw new Error(`Unexpected input: value should not contain the delimiter "${delimiter}"`);
		return `${key}<<${delimiter}${os.EOL}${convertedValue}${os.EOL}${delimiter}`;
	}
	exports.prepareKeyValueMessage = prepareKeyValueMessage;
}));
// node_modules/@actions/tool-cache/node_modules/@actions/http-client/lib/proxy.js
var require_proxy = /* @__PURE__ */ __commonJSMin(((exports) => {
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.checkBypass = exports.getProxyUrl = void 0;
	function getProxyUrl(reqUrl) {
		const usingSsl = reqUrl.protocol === "https:";
		if (checkBypass(reqUrl)) return;
		const proxyVar = (() => {
			if (usingSsl) return process.env["https_proxy"] || process.env["HTTPS_PROXY"];
			else return process.env["http_proxy"] || process.env["HTTP_PROXY"];
		})();
		if (proxyVar) try {
			return new DecodedURL(proxyVar);
		} catch (_a) {
			if (!proxyVar.startsWith("http://") && !proxyVar.startsWith("https://")) return new DecodedURL(`http://${proxyVar}`);
		}
		else return;
	}
	exports.getProxyUrl = getProxyUrl;
	function checkBypass(reqUrl) {
		if (!reqUrl.hostname) return false;
		if (isLoopbackAddress(reqUrl.hostname)) return true;
		const noProxy = process.env["no_proxy"] || process.env["NO_PROXY"] || "";
		if (!noProxy) return false;
		let reqPort;
		if (reqUrl.port) reqPort = Number(reqUrl.port);
		else if (reqUrl.protocol === "http:") reqPort = 80;
		else if (reqUrl.protocol === "https:") reqPort = 443;
		const upperReqHosts = [reqUrl.hostname.toUpperCase()];
		if (typeof reqPort === "number") upperReqHosts.push(`${upperReqHosts[0]}:${reqPort}`);
		for (const upperNoProxyItem of noProxy.split(",").map((x) => x.trim().toUpperCase()).filter((x) => x)) if (upperNoProxyItem === "*" || upperReqHosts.some((x) => x === upperNoProxyItem || x.endsWith(`.${upperNoProxyItem}`) || upperNoProxyItem.startsWith(".") && x.endsWith(`${upperNoProxyItem}`))) return true;
		return false;
	}
	exports.checkBypass = checkBypass;
	function isLoopbackAddress(host) {
		const hostLower = host.toLowerCase();
		return hostLower === "localhost" || hostLower.startsWith("127.") || hostLower.startsWith("[::1]") || hostLower.startsWith("[0:0:0:0:0:0:0:1]");
	}
	var DecodedURL = class extends URL {
		constructor(url, base) {
			super(url, base);
			this._decodedUsername = decodeURIComponent(super.username);
			this._decodedPassword = decodeURIComponent(super.password);
		}
		get username() {
			return this._decodedUsername;
		}
		get password() {
			return this._decodedPassword;
		}
	};
}));
// node_modules/@actions/tool-cache/node_modules/@actions/http-client/lib/index.js
var require_lib = /* @__PURE__ */ __commonJSMin(((exports, module, this$14) => {
	var __createBinding = this$14 && this$14.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = this$14 && this$14.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = this$14 && this$14.__importStar || function(mod) {
		if (mod && mod.__esModule) return mod;
		var result = {};
		if (mod != null) {
			for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		}
		__setModuleDefault(result, mod);
		return result;
	};
	var __awaiter = this$14 && this$14.__awaiter || function(thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P ? value : new P(function(resolve) {
				resolve(value);
			});
		}
		return new (P || (P = Promise))(function(resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.HttpClient = exports.isHttps = exports.HttpClientResponse = exports.HttpClientError = exports.getProxyUrl = exports.MediaTypes = exports.Headers = exports.HttpCodes = void 0;
	const http = __importStar(__require("http"));
	const https = __importStar(__require("https"));
	const pm = __importStar(require_proxy());
	const tunnel = __importStar(require_tunnel());
	const undici_1 = require_undici();
	var HttpCodes;
	(function(HttpCodes) {
		HttpCodes[HttpCodes["OK"] = 200] = "OK";
		HttpCodes[HttpCodes["MultipleChoices"] = 300] = "MultipleChoices";
		HttpCodes[HttpCodes["MovedPermanently"] = 301] = "MovedPermanently";
		HttpCodes[HttpCodes["ResourceMoved"] = 302] = "ResourceMoved";
		HttpCodes[HttpCodes["SeeOther"] = 303] = "SeeOther";
		HttpCodes[HttpCodes["NotModified"] = 304] = "NotModified";
		HttpCodes[HttpCodes["UseProxy"] = 305] = "UseProxy";
		HttpCodes[HttpCodes["SwitchProxy"] = 306] = "SwitchProxy";
		HttpCodes[HttpCodes["TemporaryRedirect"] = 307] = "TemporaryRedirect";
		HttpCodes[HttpCodes["PermanentRedirect"] = 308] = "PermanentRedirect";
		HttpCodes[HttpCodes["BadRequest"] = 400] = "BadRequest";
		HttpCodes[HttpCodes["Unauthorized"] = 401] = "Unauthorized";
		HttpCodes[HttpCodes["PaymentRequired"] = 402] = "PaymentRequired";
		HttpCodes[HttpCodes["Forbidden"] = 403] = "Forbidden";
		HttpCodes[HttpCodes["NotFound"] = 404] = "NotFound";
		HttpCodes[HttpCodes["MethodNotAllowed"] = 405] = "MethodNotAllowed";
		HttpCodes[HttpCodes["NotAcceptable"] = 406] = "NotAcceptable";
		HttpCodes[HttpCodes["ProxyAuthenticationRequired"] = 407] = "ProxyAuthenticationRequired";
		HttpCodes[HttpCodes["RequestTimeout"] = 408] = "RequestTimeout";
		HttpCodes[HttpCodes["Conflict"] = 409] = "Conflict";
		HttpCodes[HttpCodes["Gone"] = 410] = "Gone";
		HttpCodes[HttpCodes["TooManyRequests"] = 429] = "TooManyRequests";
		HttpCodes[HttpCodes["InternalServerError"] = 500] = "InternalServerError";
		HttpCodes[HttpCodes["NotImplemented"] = 501] = "NotImplemented";
		HttpCodes[HttpCodes["BadGateway"] = 502] = "BadGateway";
		HttpCodes[HttpCodes["ServiceUnavailable"] = 503] = "ServiceUnavailable";
		HttpCodes[HttpCodes["GatewayTimeout"] = 504] = "GatewayTimeout";
	})(HttpCodes || (exports.HttpCodes = HttpCodes = {}));
	var Headers;
	(function(Headers) {
		Headers["Accept"] = "accept";
		Headers["ContentType"] = "content-type";
	})(Headers || (exports.Headers = Headers = {}));
	var MediaTypes;
	(function(MediaTypes) {
		MediaTypes["ApplicationJson"] = "application/json";
	})(MediaTypes || (exports.MediaTypes = MediaTypes = {}));
	/**
	* Returns the proxy URL, depending upon the supplied url and proxy environment variables.
	* @param serverUrl  The server URL where the request will be sent. For example, https://api.github.com
	*/
	function getProxyUrl(serverUrl) {
		const proxyUrl = pm.getProxyUrl(new URL(serverUrl));
		return proxyUrl ? proxyUrl.href : "";
	}
	exports.getProxyUrl = getProxyUrl;
	const HttpRedirectCodes = [
		HttpCodes.MovedPermanently,
		HttpCodes.ResourceMoved,
		HttpCodes.SeeOther,
		HttpCodes.TemporaryRedirect,
		HttpCodes.PermanentRedirect
	];
	const HttpResponseRetryCodes = [
		HttpCodes.BadGateway,
		HttpCodes.ServiceUnavailable,
		HttpCodes.GatewayTimeout
	];
	const RetryableHttpVerbs = [
		"OPTIONS",
		"GET",
		"DELETE",
		"HEAD"
	];
	const ExponentialBackoffCeiling = 10;
	const ExponentialBackoffTimeSlice = 5;
	var HttpClientError = class HttpClientError extends Error {
		constructor(message, statusCode) {
			super(message);
			this.name = "HttpClientError";
			this.statusCode = statusCode;
			Object.setPrototypeOf(this, HttpClientError.prototype);
		}
	};
	exports.HttpClientError = HttpClientError;
	var HttpClientResponse = class {
		constructor(message) {
			this.message = message;
		}
		readBody() {
			return __awaiter(this, void 0, void 0, function* () {
				return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
					let output = Buffer.alloc(0);
					this.message.on("data", (chunk) => {
						output = Buffer.concat([output, chunk]);
					});
					this.message.on("end", () => {
						resolve(output.toString());
					});
				}));
			});
		}
		readBodyBuffer() {
			return __awaiter(this, void 0, void 0, function* () {
				return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
					const chunks = [];
					this.message.on("data", (chunk) => {
						chunks.push(chunk);
					});
					this.message.on("end", () => {
						resolve(Buffer.concat(chunks));
					});
				}));
			});
		}
	};
	exports.HttpClientResponse = HttpClientResponse;
	function isHttps(requestUrl) {
		return new URL(requestUrl).protocol === "https:";
	}
	exports.isHttps = isHttps;
	var HttpClient = class {
		constructor(userAgent, handlers, requestOptions) {
			this._ignoreSslError = false;
			this._allowRedirects = true;
			this._allowRedirectDowngrade = false;
			this._maxRedirects = 50;
			this._allowRetries = false;
			this._maxRetries = 1;
			this._keepAlive = false;
			this._disposed = false;
			this.userAgent = userAgent;
			this.handlers = handlers || [];
			this.requestOptions = requestOptions;
			if (requestOptions) {
				if (requestOptions.ignoreSslError != null) this._ignoreSslError = requestOptions.ignoreSslError;
				this._socketTimeout = requestOptions.socketTimeout;
				if (requestOptions.allowRedirects != null) this._allowRedirects = requestOptions.allowRedirects;
				if (requestOptions.allowRedirectDowngrade != null) this._allowRedirectDowngrade = requestOptions.allowRedirectDowngrade;
				if (requestOptions.maxRedirects != null) this._maxRedirects = Math.max(requestOptions.maxRedirects, 0);
				if (requestOptions.keepAlive != null) this._keepAlive = requestOptions.keepAlive;
				if (requestOptions.allowRetries != null) this._allowRetries = requestOptions.allowRetries;
				if (requestOptions.maxRetries != null) this._maxRetries = requestOptions.maxRetries;
			}
		}
		options(requestUrl, additionalHeaders) {
			return __awaiter(this, void 0, void 0, function* () {
				return this.request("OPTIONS", requestUrl, null, additionalHeaders || {});
			});
		}
		get(requestUrl, additionalHeaders) {
			return __awaiter(this, void 0, void 0, function* () {
				return this.request("GET", requestUrl, null, additionalHeaders || {});
			});
		}
		del(requestUrl, additionalHeaders) {
			return __awaiter(this, void 0, void 0, function* () {
				return this.request("DELETE", requestUrl, null, additionalHeaders || {});
			});
		}
		post(requestUrl, data, additionalHeaders) {
			return __awaiter(this, void 0, void 0, function* () {
				return this.request("POST", requestUrl, data, additionalHeaders || {});
			});
		}
		patch(requestUrl, data, additionalHeaders) {
			return __awaiter(this, void 0, void 0, function* () {
				return this.request("PATCH", requestUrl, data, additionalHeaders || {});
			});
		}
		put(requestUrl, data, additionalHeaders) {
			return __awaiter(this, void 0, void 0, function* () {
				return this.request("PUT", requestUrl, data, additionalHeaders || {});
			});
		}
		head(requestUrl, additionalHeaders) {
			return __awaiter(this, void 0, void 0, function* () {
				return this.request("HEAD", requestUrl, null, additionalHeaders || {});
			});
		}
		sendStream(verb, requestUrl, stream, additionalHeaders) {
			return __awaiter(this, void 0, void 0, function* () {
				return this.request(verb, requestUrl, stream, additionalHeaders);
			});
		}
		/**
		* Gets a typed object from an endpoint
		* Be aware that not found returns a null.  Other errors (4xx, 5xx) reject the promise
		*/
		getJson(requestUrl, additionalHeaders = {}) {
			return __awaiter(this, void 0, void 0, function* () {
				additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
				const res = yield this.get(requestUrl, additionalHeaders);
				return this._processResponse(res, this.requestOptions);
			});
		}
		postJson(requestUrl, obj, additionalHeaders = {}) {
			return __awaiter(this, void 0, void 0, function* () {
				const data = JSON.stringify(obj, null, 2);
				additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
				additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.ContentType, MediaTypes.ApplicationJson);
				const res = yield this.post(requestUrl, data, additionalHeaders);
				return this._processResponse(res, this.requestOptions);
			});
		}
		putJson(requestUrl, obj, additionalHeaders = {}) {
			return __awaiter(this, void 0, void 0, function* () {
				const data = JSON.stringify(obj, null, 2);
				additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
				additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.ContentType, MediaTypes.ApplicationJson);
				const res = yield this.put(requestUrl, data, additionalHeaders);
				return this._processResponse(res, this.requestOptions);
			});
		}
		patchJson(requestUrl, obj, additionalHeaders = {}) {
			return __awaiter(this, void 0, void 0, function* () {
				const data = JSON.stringify(obj, null, 2);
				additionalHeaders[Headers.Accept] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.Accept, MediaTypes.ApplicationJson);
				additionalHeaders[Headers.ContentType] = this._getExistingOrDefaultHeader(additionalHeaders, Headers.ContentType, MediaTypes.ApplicationJson);
				const res = yield this.patch(requestUrl, data, additionalHeaders);
				return this._processResponse(res, this.requestOptions);
			});
		}
		/**
		* Makes a raw http request.
		* All other methods such as get, post, patch, and request ultimately call this.
		* Prefer get, del, post and patch
		*/
		request(verb, requestUrl, data, headers) {
			return __awaiter(this, void 0, void 0, function* () {
				if (this._disposed) throw new Error("Client has already been disposed.");
				const parsedUrl = new URL(requestUrl);
				let info = this._prepareRequest(verb, parsedUrl, headers);
				const maxTries = this._allowRetries && RetryableHttpVerbs.includes(verb) ? this._maxRetries + 1 : 1;
				let numTries = 0;
				let response;
				do {
					response = yield this.requestRaw(info, data);
					if (response && response.message && response.message.statusCode === HttpCodes.Unauthorized) {
						let authenticationHandler;
						for (const handler of this.handlers) if (handler.canHandleAuthentication(response)) {
							authenticationHandler = handler;
							break;
						}
						if (authenticationHandler) return authenticationHandler.handleAuthentication(this, info, data);
						else return response;
					}
					let redirectsRemaining = this._maxRedirects;
					while (response.message.statusCode && HttpRedirectCodes.includes(response.message.statusCode) && this._allowRedirects && redirectsRemaining > 0) {
						const redirectUrl = response.message.headers["location"];
						if (!redirectUrl) break;
						const parsedRedirectUrl = new URL(redirectUrl);
						if (parsedUrl.protocol === "https:" && parsedUrl.protocol !== parsedRedirectUrl.protocol && !this._allowRedirectDowngrade) throw new Error("Redirect from HTTPS to HTTP protocol. This downgrade is not allowed for security reasons. If you want to allow this behavior, set the allowRedirectDowngrade option to true.");
						yield response.readBody();
						if (parsedRedirectUrl.hostname !== parsedUrl.hostname) {
							for (const header in headers) if (header.toLowerCase() === "authorization") delete headers[header];
						}
						info = this._prepareRequest(verb, parsedRedirectUrl, headers);
						response = yield this.requestRaw(info, data);
						redirectsRemaining--;
					}
					if (!response.message.statusCode || !HttpResponseRetryCodes.includes(response.message.statusCode)) return response;
					numTries += 1;
					if (numTries < maxTries) {
						yield response.readBody();
						yield this._performExponentialBackoff(numTries);
					}
				} while (numTries < maxTries);
				return response;
			});
		}
		/**
		* Needs to be called if keepAlive is set to true in request options.
		*/
		dispose() {
			if (this._agent) this._agent.destroy();
			this._disposed = true;
		}
		/**
		* Raw request.
		* @param info
		* @param data
		*/
		requestRaw(info, data) {
			return __awaiter(this, void 0, void 0, function* () {
				return new Promise((resolve, reject) => {
					function callbackForResult(err, res) {
						if (err) reject(err);
						else if (!res) reject(/* @__PURE__ */ new Error("Unknown error"));
						else resolve(res);
					}
					this.requestRawWithCallback(info, data, callbackForResult);
				});
			});
		}
		/**
		* Raw request with callback.
		* @param info
		* @param data
		* @param onResult
		*/
		requestRawWithCallback(info, data, onResult) {
			if (typeof data === "string") {
				if (!info.options.headers) info.options.headers = {};
				info.options.headers["Content-Length"] = Buffer.byteLength(data, "utf8");
			}
			let callbackCalled = false;
			function handleResult(err, res) {
				if (!callbackCalled) {
					callbackCalled = true;
					onResult(err, res);
				}
			}
			const req = info.httpModule.request(info.options, (msg) => {
				handleResult(void 0, new HttpClientResponse(msg));
			});
			let socket;
			req.on("socket", (sock) => {
				socket = sock;
			});
			req.setTimeout(this._socketTimeout || 18e4, () => {
				if (socket) socket.end();
				handleResult(/* @__PURE__ */ new Error(`Request timeout: ${info.options.path}`));
			});
			req.on("error", function(err) {
				handleResult(err);
			});
			if (data && typeof data === "string") req.write(data, "utf8");
			if (data && typeof data !== "string") {
				data.on("close", function() {
					req.end();
				});
				data.pipe(req);
			} else req.end();
		}
		/**
		* Gets an http agent. This function is useful when you need an http agent that handles
		* routing through a proxy server - depending upon the url and proxy environment variables.
		* @param serverUrl  The server URL where the request will be sent. For example, https://api.github.com
		*/
		getAgent(serverUrl) {
			const parsedUrl = new URL(serverUrl);
			return this._getAgent(parsedUrl);
		}
		getAgentDispatcher(serverUrl) {
			const parsedUrl = new URL(serverUrl);
			const proxyUrl = pm.getProxyUrl(parsedUrl);
			if (!(proxyUrl && proxyUrl.hostname)) return;
			return this._getProxyAgentDispatcher(parsedUrl, proxyUrl);
		}
		_prepareRequest(method, requestUrl, headers) {
			const info = {};
			info.parsedUrl = requestUrl;
			const usingSsl = info.parsedUrl.protocol === "https:";
			info.httpModule = usingSsl ? https : http;
			const defaultPort = usingSsl ? 443 : 80;
			info.options = {};
			info.options.host = info.parsedUrl.hostname;
			info.options.port = info.parsedUrl.port ? parseInt(info.parsedUrl.port) : defaultPort;
			info.options.path = (info.parsedUrl.pathname || "") + (info.parsedUrl.search || "");
			info.options.method = method;
			info.options.headers = this._mergeHeaders(headers);
			if (this.userAgent != null) info.options.headers["user-agent"] = this.userAgent;
			info.options.agent = this._getAgent(info.parsedUrl);
			if (this.handlers) for (const handler of this.handlers) handler.prepareRequest(info.options);
			return info;
		}
		_mergeHeaders(headers) {
			if (this.requestOptions && this.requestOptions.headers) return Object.assign({}, lowercaseKeys(this.requestOptions.headers), lowercaseKeys(headers || {}));
			return lowercaseKeys(headers || {});
		}
		_getExistingOrDefaultHeader(additionalHeaders, header, _default) {
			let clientHeader;
			if (this.requestOptions && this.requestOptions.headers) clientHeader = lowercaseKeys(this.requestOptions.headers)[header];
			return additionalHeaders[header] || clientHeader || _default;
		}
		_getAgent(parsedUrl) {
			let agent;
			const proxyUrl = pm.getProxyUrl(parsedUrl);
			const useProxy = proxyUrl && proxyUrl.hostname;
			if (this._keepAlive && useProxy) agent = this._proxyAgent;
			if (!useProxy) agent = this._agent;
			if (agent) return agent;
			const usingSsl = parsedUrl.protocol === "https:";
			let maxSockets = 100;
			if (this.requestOptions) maxSockets = this.requestOptions.maxSockets || http.globalAgent.maxSockets;
			if (proxyUrl && proxyUrl.hostname) {
				const agentOptions = {
					maxSockets,
					keepAlive: this._keepAlive,
					proxy: Object.assign(Object.assign({}, (proxyUrl.username || proxyUrl.password) && { proxyAuth: `${proxyUrl.username}:${proxyUrl.password}` }), {
						host: proxyUrl.hostname,
						port: proxyUrl.port
					})
				};
				let tunnelAgent;
				const overHttps = proxyUrl.protocol === "https:";
				if (usingSsl) tunnelAgent = overHttps ? tunnel.httpsOverHttps : tunnel.httpsOverHttp;
				else tunnelAgent = overHttps ? tunnel.httpOverHttps : tunnel.httpOverHttp;
				agent = tunnelAgent(agentOptions);
				this._proxyAgent = agent;
			}
			if (!agent) {
				const options = {
					keepAlive: this._keepAlive,
					maxSockets
				};
				agent = usingSsl ? new https.Agent(options) : new http.Agent(options);
				this._agent = agent;
			}
			if (usingSsl && this._ignoreSslError) agent.options = Object.assign(agent.options || {}, { rejectUnauthorized: false });
			return agent;
		}
		_getProxyAgentDispatcher(parsedUrl, proxyUrl) {
			let proxyAgent;
			if (this._keepAlive) proxyAgent = this._proxyAgentDispatcher;
			if (proxyAgent) return proxyAgent;
			const usingSsl = parsedUrl.protocol === "https:";
			proxyAgent = new undici_1.ProxyAgent(Object.assign({
				uri: proxyUrl.href,
				pipelining: !this._keepAlive ? 0 : 1
			}, (proxyUrl.username || proxyUrl.password) && { token: `Basic ${Buffer.from(`${proxyUrl.username}:${proxyUrl.password}`).toString("base64")}` }));
			this._proxyAgentDispatcher = proxyAgent;
			if (usingSsl && this._ignoreSslError) proxyAgent.options = Object.assign(proxyAgent.options.requestTls || {}, { rejectUnauthorized: false });
			return proxyAgent;
		}
		_performExponentialBackoff(retryNumber) {
			return __awaiter(this, void 0, void 0, function* () {
				retryNumber = Math.min(ExponentialBackoffCeiling, retryNumber);
				const ms = ExponentialBackoffTimeSlice * Math.pow(2, retryNumber);
				return new Promise((resolve) => setTimeout(() => resolve(), ms));
			});
		}
		_processResponse(res, options) {
			return __awaiter(this, void 0, void 0, function* () {
				return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
					const statusCode = res.message.statusCode || 0;
					const response = {
						statusCode,
						result: null,
						headers: {}
					};
					if (statusCode === HttpCodes.NotFound) resolve(response);
					function dateTimeDeserializer(key, value) {
						if (typeof value === "string") {
							const a = new Date(value);
							if (!isNaN(a.valueOf())) return a;
						}
						return value;
					}
					let obj;
					let contents;
					try {
						contents = yield res.readBody();
						if (contents && contents.length > 0) {
							if (options && options.deserializeDates) obj = JSON.parse(contents, dateTimeDeserializer);
							else obj = JSON.parse(contents);
							response.result = obj;
						}
						response.headers = res.message.headers;
					} catch (err) {}
					if (statusCode > 299) {
						let msg;
						if (obj && obj.message) msg = obj.message;
						else if (contents && contents.length > 0) msg = contents;
						else msg = `Failed request: (${statusCode})`;
						const err = new HttpClientError(msg, statusCode);
						err.result = response.result;
						reject(err);
					} else resolve(response);
				}));
			});
		}
	};
	exports.HttpClient = HttpClient;
	const lowercaseKeys = (obj) => Object.keys(obj).reduce((c, k) => (c[k.toLowerCase()] = obj[k], c), {});
}));
// node_modules/@actions/tool-cache/node_modules/@actions/http-client/lib/auth.js
var require_auth = /* @__PURE__ */ __commonJSMin(((exports, module, this$13) => {
	var __awaiter = this$13 && this$13.__awaiter || function(thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P ? value : new P(function(resolve) {
				resolve(value);
			});
		}
		return new (P || (P = Promise))(function(resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.PersonalAccessTokenCredentialHandler = exports.BearerCredentialHandler = exports.BasicCredentialHandler = void 0;
	var BasicCredentialHandler = class {
		constructor(username, password) {
			this.username = username;
			this.password = password;
		}
		prepareRequest(options) {
			if (!options.headers) throw Error("The request has no headers");
			options.headers["Authorization"] = `Basic ${Buffer.from(`${this.username}:${this.password}`).toString("base64")}`;
		}
		canHandleAuthentication() {
			return false;
		}
		handleAuthentication() {
			return __awaiter(this, void 0, void 0, function* () {
				throw new Error("not implemented");
			});
		}
	};
	exports.BasicCredentialHandler = BasicCredentialHandler;
	var BearerCredentialHandler = class {
		constructor(token) {
			this.token = token;
		}
		prepareRequest(options) {
			if (!options.headers) throw Error("The request has no headers");
			options.headers["Authorization"] = `Bearer ${this.token}`;
		}
		canHandleAuthentication() {
			return false;
		}
		handleAuthentication() {
			return __awaiter(this, void 0, void 0, function* () {
				throw new Error("not implemented");
			});
		}
	};
	exports.BearerCredentialHandler = BearerCredentialHandler;
	var PersonalAccessTokenCredentialHandler = class {
		constructor(token) {
			this.token = token;
		}
		prepareRequest(options) {
			if (!options.headers) throw Error("The request has no headers");
			options.headers["Authorization"] = `Basic ${Buffer.from(`PAT:${this.token}`).toString("base64")}`;
		}
		canHandleAuthentication() {
			return false;
		}
		handleAuthentication() {
			return __awaiter(this, void 0, void 0, function* () {
				throw new Error("not implemented");
			});
		}
	};
	exports.PersonalAccessTokenCredentialHandler = PersonalAccessTokenCredentialHandler;
}));
// node_modules/@actions/tool-cache/node_modules/@actions/core/lib/oidc-utils.js
var require_oidc_utils = /* @__PURE__ */ __commonJSMin(((exports, module, this$12) => {
	var __awaiter = this$12 && this$12.__awaiter || function(thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P ? value : new P(function(resolve) {
				resolve(value);
			});
		}
		return new (P || (P = Promise))(function(resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.OidcClient = void 0;
	const http_client_1 = require_lib();
	const auth_1 = require_auth();
	const core_1 = require_core();
	exports.OidcClient = class OidcClient {
		static createHttpClient(allowRetry = true, maxRetry = 10) {
			const requestOptions = {
				allowRetries: allowRetry,
				maxRetries: maxRetry
			};
			return new http_client_1.HttpClient("actions/oidc-client", [new auth_1.BearerCredentialHandler(OidcClient.getRequestToken())], requestOptions);
		}
		static getRequestToken() {
			const token = process.env["ACTIONS_ID_TOKEN_REQUEST_TOKEN"];
			if (!token) throw new Error("Unable to get ACTIONS_ID_TOKEN_REQUEST_TOKEN env variable");
			return token;
		}
		static getIDTokenUrl() {
			const runtimeUrl = process.env["ACTIONS_ID_TOKEN_REQUEST_URL"];
			if (!runtimeUrl) throw new Error("Unable to get ACTIONS_ID_TOKEN_REQUEST_URL env variable");
			return runtimeUrl;
		}
		static getCall(id_token_url) {
			var _a;
			return __awaiter(this, void 0, void 0, function* () {
				const id_token = (_a = (yield OidcClient.createHttpClient().getJson(id_token_url).catch((error) => {
					throw new Error(`Failed to get ID Token. \n 
        Error Code : ${error.statusCode}\n 
        Error Message: ${error.message}`);
				})).result) === null || _a === void 0 ? void 0 : _a.value;
				if (!id_token) throw new Error("Response json body do not have ID Token field");
				return id_token;
			});
		}
		static getIDToken(audience) {
			return __awaiter(this, void 0, void 0, function* () {
				try {
					let id_token_url = OidcClient.getIDTokenUrl();
					if (audience) {
						const encodedAudience = encodeURIComponent(audience);
						id_token_url = `${id_token_url}&audience=${encodedAudience}`;
					}
					(0, core_1.debug)(`ID token url is ${id_token_url}`);
					const id_token = yield OidcClient.getCall(id_token_url);
					(0, core_1.setSecret)(id_token);
					return id_token;
				} catch (error) {
					throw new Error(`Error message: ${error.message}`);
				}
			});
		}
	};
}));
// node_modules/@actions/tool-cache/node_modules/@actions/core/lib/summary.js
var require_summary = /* @__PURE__ */ __commonJSMin(((exports, module, this$11) => {
	var __awaiter = this$11 && this$11.__awaiter || function(thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P ? value : new P(function(resolve) {
				resolve(value);
			});
		}
		return new (P || (P = Promise))(function(resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.summary = exports.markdownSummary = exports.SUMMARY_DOCS_URL = exports.SUMMARY_ENV_VAR = void 0;
	const os_1 = __require("os");
	const fs_1 = __require("fs");
	const { access, appendFile, writeFile } = fs_1.promises;
	exports.SUMMARY_ENV_VAR = "GITHUB_STEP_SUMMARY";
	exports.SUMMARY_DOCS_URL = "https://docs.github.com/actions/using-workflows/workflow-commands-for-github-actions#adding-a-job-summary";
	var Summary = class {
		constructor() {
			this._buffer = "";
		}
		/**
		* Finds the summary file path from the environment, rejects if env var is not found or file does not exist
		* Also checks r/w permissions.
		*
		* @returns step summary file path
		*/
		filePath() {
			return __awaiter(this, void 0, void 0, function* () {
				if (this._filePath) return this._filePath;
				const pathFromEnv = process.env[exports.SUMMARY_ENV_VAR];
				if (!pathFromEnv) throw new Error(`Unable to find environment variable for $${exports.SUMMARY_ENV_VAR}. Check if your runtime environment supports job summaries.`);
				try {
					yield access(pathFromEnv, fs_1.constants.R_OK | fs_1.constants.W_OK);
				} catch (_a) {
					throw new Error(`Unable to access summary file: '${pathFromEnv}'. Check if the file has correct read/write permissions.`);
				}
				this._filePath = pathFromEnv;
				return this._filePath;
			});
		}
		/**
		* Wraps content in an HTML tag, adding any HTML attributes
		*
		* @param {string} tag HTML tag to wrap
		* @param {string | null} content content within the tag
		* @param {[attribute: string]: string} attrs key-value list of HTML attributes to add
		*
		* @returns {string} content wrapped in HTML element
		*/
		wrap(tag, content, attrs = {}) {
			const htmlAttrs = Object.entries(attrs).map(([key, value]) => ` ${key}="${value}"`).join("");
			if (!content) return `<${tag}${htmlAttrs}>`;
			return `<${tag}${htmlAttrs}>${content}</${tag}>`;
		}
		/**
		* Writes text in the buffer to the summary buffer file and empties buffer. Will append by default.
		*
		* @param {SummaryWriteOptions} [options] (optional) options for write operation
		*
		* @returns {Promise<Summary>} summary instance
		*/
		write(options) {
			return __awaiter(this, void 0, void 0, function* () {
				const overwrite = !!(options === null || options === void 0 ? void 0 : options.overwrite);
				const filePath = yield this.filePath();
				yield (overwrite ? writeFile : appendFile)(filePath, this._buffer, { encoding: "utf8" });
				return this.emptyBuffer();
			});
		}
		/**
		* Clears the summary buffer and wipes the summary file
		*
		* @returns {Summary} summary instance
		*/
		clear() {
			return __awaiter(this, void 0, void 0, function* () {
				return this.emptyBuffer().write({ overwrite: true });
			});
		}
		/**
		* Returns the current summary buffer as a string
		*
		* @returns {string} string of summary buffer
		*/
		stringify() {
			return this._buffer;
		}
		/**
		* If the summary buffer is empty
		*
		* @returns {boolen} true if the buffer is empty
		*/
		isEmptyBuffer() {
			return this._buffer.length === 0;
		}
		/**
		* Resets the summary buffer without writing to summary file
		*
		* @returns {Summary} summary instance
		*/
		emptyBuffer() {
			this._buffer = "";
			return this;
		}
		/**
		* Adds raw text to the summary buffer
		*
		* @param {string} text content to add
		* @param {boolean} [addEOL=false] (optional) append an EOL to the raw text (default: false)
		*
		* @returns {Summary} summary instance
		*/
		addRaw(text, addEOL = false) {
			this._buffer += text;
			return addEOL ? this.addEOL() : this;
		}
		/**
		* Adds the operating system-specific end-of-line marker to the buffer
		*
		* @returns {Summary} summary instance
		*/
		addEOL() {
			return this.addRaw(os_1.EOL);
		}
		/**
		* Adds an HTML codeblock to the summary buffer
		*
		* @param {string} code content to render within fenced code block
		* @param {string} lang (optional) language to syntax highlight code
		*
		* @returns {Summary} summary instance
		*/
		addCodeBlock(code, lang) {
			const attrs = Object.assign({}, lang && { lang });
			const element = this.wrap("pre", this.wrap("code", code), attrs);
			return this.addRaw(element).addEOL();
		}
		/**
		* Adds an HTML list to the summary buffer
		*
		* @param {string[]} items list of items to render
		* @param {boolean} [ordered=false] (optional) if the rendered list should be ordered or not (default: false)
		*
		* @returns {Summary} summary instance
		*/
		addList(items, ordered = false) {
			const tag = ordered ? "ol" : "ul";
			const listItems = items.map((item) => this.wrap("li", item)).join("");
			const element = this.wrap(tag, listItems);
			return this.addRaw(element).addEOL();
		}
		/**
		* Adds an HTML table to the summary buffer
		*
		* @param {SummaryTableCell[]} rows table rows
		*
		* @returns {Summary} summary instance
		*/
		addTable(rows) {
			const tableBody = rows.map((row) => {
				const cells = row.map((cell) => {
					if (typeof cell === "string") return this.wrap("td", cell);
					const { header, data, colspan, rowspan } = cell;
					const tag = header ? "th" : "td";
					const attrs = Object.assign(Object.assign({}, colspan && { colspan }), rowspan && { rowspan });
					return this.wrap(tag, data, attrs);
				}).join("");
				return this.wrap("tr", cells);
			}).join("");
			const element = this.wrap("table", tableBody);
			return this.addRaw(element).addEOL();
		}
		/**
		* Adds a collapsable HTML details element to the summary buffer
		*
		* @param {string} label text for the closed state
		* @param {string} content collapsable content
		*
		* @returns {Summary} summary instance
		*/
		addDetails(label, content) {
			const element = this.wrap("details", this.wrap("summary", label) + content);
			return this.addRaw(element).addEOL();
		}
		/**
		* Adds an HTML image tag to the summary buffer
		*
		* @param {string} src path to the image you to embed
		* @param {string} alt text description of the image
		* @param {SummaryImageOptions} options (optional) addition image attributes
		*
		* @returns {Summary} summary instance
		*/
		addImage(src, alt, options) {
			const { width, height } = options || {};
			const attrs = Object.assign(Object.assign({}, width && { width }), height && { height });
			const element = this.wrap("img", null, Object.assign({
				src,
				alt
			}, attrs));
			return this.addRaw(element).addEOL();
		}
		/**
		* Adds an HTML section heading element
		*
		* @param {string} text heading text
		* @param {number | string} [level=1] (optional) the heading level, default: 1
		*
		* @returns {Summary} summary instance
		*/
		addHeading(text, level) {
			const tag = `h${level}`;
			const allowedTag = [
				"h1",
				"h2",
				"h3",
				"h4",
				"h5",
				"h6"
			].includes(tag) ? tag : "h1";
			const element = this.wrap(allowedTag, text);
			return this.addRaw(element).addEOL();
		}
		/**
		* Adds an HTML thematic break (<hr>) to the summary buffer
		*
		* @returns {Summary} summary instance
		*/
		addSeparator() {
			const element = this.wrap("hr", null);
			return this.addRaw(element).addEOL();
		}
		/**
		* Adds an HTML line break (<br>) to the summary buffer
		*
		* @returns {Summary} summary instance
		*/
		addBreak() {
			const element = this.wrap("br", null);
			return this.addRaw(element).addEOL();
		}
		/**
		* Adds an HTML blockquote to the summary buffer
		*
		* @param {string} text quote text
		* @param {string} cite (optional) citation url
		*
		* @returns {Summary} summary instance
		*/
		addQuote(text, cite) {
			const attrs = Object.assign({}, cite && { cite });
			const element = this.wrap("blockquote", text, attrs);
			return this.addRaw(element).addEOL();
		}
		/**
		* Adds an HTML anchor tag to the summary buffer
		*
		* @param {string} text link text/content
		* @param {string} href hyperlink
		*
		* @returns {Summary} summary instance
		*/
		addLink(text, href) {
			const element = this.wrap("a", text, { href });
			return this.addRaw(element).addEOL();
		}
	};
	const _summary = new Summary();
	/**
	* @deprecated use `core.summary`
	*/
	exports.markdownSummary = _summary;
	exports.summary = _summary;
}));
// node_modules/@actions/tool-cache/node_modules/@actions/core/lib/path-utils.js
var require_path_utils = /* @__PURE__ */ __commonJSMin(((exports, module, this$10) => {
	var __createBinding = this$10 && this$10.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = this$10 && this$10.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = this$10 && this$10.__importStar || function(mod) {
		if (mod && mod.__esModule) return mod;
		var result = {};
		if (mod != null) {
			for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		}
		__setModuleDefault(result, mod);
		return result;
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.toPlatformPath = exports.toWin32Path = exports.toPosixPath = void 0;
	const path = __importStar(__require("path"));
	/**
	* toPosixPath converts the given path to the posix form. On Windows, \\ will be
	* replaced with /.
	*
	* @param pth. Path to transform.
	* @return string Posix path.
	*/
	function toPosixPath(pth) {
		return pth.replace(/[\\]/g, "/");
	}
	exports.toPosixPath = toPosixPath;
	/**
	* toWin32Path converts the given path to the win32 form. On Linux, / will be
	* replaced with \\.
	*
	* @param pth. Path to transform.
	* @return string Win32 path.
	*/
	function toWin32Path(pth) {
		return pth.replace(/[/]/g, "\\");
	}
	exports.toWin32Path = toWin32Path;
	/**
	* toPlatformPath converts the given path to a platform-specific path. It does
	* this by replacing instances of / and \ with the platform-specific path
	* separator.
	*
	* @param pth The path to platformize.
	* @return string The platform-specific path.
	*/
	function toPlatformPath(pth) {
		return pth.replace(/[/\\]/g, path.sep);
	}
	exports.toPlatformPath = toPlatformPath;
}));
// node_modules/@actions/tool-cache/node_modules/@actions/io/lib/io-util.js
var require_io_util = /* @__PURE__ */ __commonJSMin(((exports, module, this$9) => {
	var __createBinding = this$9 && this$9.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		Object.defineProperty(o, k2, {
			enumerable: true,
			get: function() {
				return m[k];
			}
		});
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = this$9 && this$9.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = this$9 && this$9.__importStar || function(mod) {
		if (mod && mod.__esModule) return mod;
		var result = {};
		if (mod != null) {
			for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		}
		__setModuleDefault(result, mod);
		return result;
	};
	var __awaiter = this$9 && this$9.__awaiter || function(thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P ? value : new P(function(resolve) {
				resolve(value);
			});
		}
		return new (P || (P = Promise))(function(resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
	var _a;
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getCmdPath = exports.tryGetExecutablePath = exports.isRooted = exports.isDirectory = exports.exists = exports.READONLY = exports.UV_FS_O_EXLOCK = exports.IS_WINDOWS = exports.unlink = exports.symlink = exports.stat = exports.rmdir = exports.rm = exports.rename = exports.readlink = exports.readdir = exports.open = exports.mkdir = exports.lstat = exports.copyFile = exports.chmod = void 0;
	const fs = __importStar(__require("fs"));
	const path = __importStar(__require("path"));
	_a = fs.promises, exports.chmod = _a.chmod, exports.copyFile = _a.copyFile, exports.lstat = _a.lstat, exports.mkdir = _a.mkdir, exports.open = _a.open, exports.readdir = _a.readdir, exports.readlink = _a.readlink, exports.rename = _a.rename, exports.rm = _a.rm, exports.rmdir = _a.rmdir, exports.stat = _a.stat, exports.symlink = _a.symlink, exports.unlink = _a.unlink;
	exports.IS_WINDOWS = process.platform === "win32";
	exports.UV_FS_O_EXLOCK = 268435456;
	exports.READONLY = fs.constants.O_RDONLY;
	function exists(fsPath) {
		return __awaiter(this, void 0, void 0, function* () {
			try {
				yield exports.stat(fsPath);
			} catch (err) {
				if (err.code === "ENOENT") return false;
				throw err;
			}
			return true;
		});
	}
	exports.exists = exists;
	function isDirectory(fsPath, useStat = false) {
		return __awaiter(this, void 0, void 0, function* () {
			return (useStat ? yield exports.stat(fsPath) : yield exports.lstat(fsPath)).isDirectory();
		});
	}
	exports.isDirectory = isDirectory;
	/**
	* On OSX/Linux, true if path starts with '/'. On Windows, true for paths like:
	* \, \hello, \\hello\share, C:, and C:\hello (and corresponding alternate separator cases).
	*/
	function isRooted(p) {
		p = normalizeSeparators(p);
		if (!p) throw new Error("isRooted() parameter \"p\" cannot be empty");
		if (exports.IS_WINDOWS) return p.startsWith("\\") || /^[A-Z]:/i.test(p);
		return p.startsWith("/");
	}
	exports.isRooted = isRooted;
	/**
	* Best effort attempt to determine whether a file exists and is executable.
	* @param filePath    file path to check
	* @param extensions  additional file extensions to try
	* @return if file exists and is executable, returns the file path. otherwise empty string.
	*/
	function tryGetExecutablePath(filePath, extensions) {
		return __awaiter(this, void 0, void 0, function* () {
			let stats = void 0;
			try {
				stats = yield exports.stat(filePath);
			} catch (err) {
				if (err.code !== "ENOENT") console.log(`Unexpected error attempting to determine if executable file exists '${filePath}': ${err}`);
			}
			if (stats && stats.isFile()) {
				if (exports.IS_WINDOWS) {
					const upperExt = path.extname(filePath).toUpperCase();
					if (extensions.some((validExt) => validExt.toUpperCase() === upperExt)) return filePath;
				} else if (isUnixExecutable(stats)) return filePath;
			}
			const originalFilePath = filePath;
			for (const extension of extensions) {
				filePath = originalFilePath + extension;
				stats = void 0;
				try {
					stats = yield exports.stat(filePath);
				} catch (err) {
					if (err.code !== "ENOENT") console.log(`Unexpected error attempting to determine if executable file exists '${filePath}': ${err}`);
				}
				if (stats && stats.isFile()) {
					if (exports.IS_WINDOWS) {
						try {
							const directory = path.dirname(filePath);
							const upperName = path.basename(filePath).toUpperCase();
							for (const actualName of yield exports.readdir(directory)) if (upperName === actualName.toUpperCase()) {
								filePath = path.join(directory, actualName);
								break;
							}
						} catch (err) {
							console.log(`Unexpected error attempting to determine the actual case of the file '${filePath}': ${err}`);
						}
						return filePath;
					} else if (isUnixExecutable(stats)) return filePath;
				}
			}
			return "";
		});
	}
	exports.tryGetExecutablePath = tryGetExecutablePath;
	function normalizeSeparators(p) {
		p = p || "";
		if (exports.IS_WINDOWS) {
			p = p.replace(/\//g, "\\");
			return p.replace(/\\\\+/g, "\\");
		}
		return p.replace(/\/\/+/g, "/");
	}
	function isUnixExecutable(stats) {
		return (stats.mode & 1) > 0 || (stats.mode & 8) > 0 && stats.gid === process.getgid() || (stats.mode & 64) > 0 && stats.uid === process.getuid();
	}
	function getCmdPath() {
		var _a;
		return (_a = process.env["COMSPEC"]) !== null && _a !== void 0 ? _a : `cmd.exe`;
	}
	exports.getCmdPath = getCmdPath;
}));
// node_modules/@actions/tool-cache/node_modules/@actions/io/lib/io.js
var require_io = /* @__PURE__ */ __commonJSMin(((exports, module, this$8) => {
	var __createBinding = this$8 && this$8.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		Object.defineProperty(o, k2, {
			enumerable: true,
			get: function() {
				return m[k];
			}
		});
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = this$8 && this$8.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = this$8 && this$8.__importStar || function(mod) {
		if (mod && mod.__esModule) return mod;
		var result = {};
		if (mod != null) {
			for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		}
		__setModuleDefault(result, mod);
		return result;
	};
	var __awaiter = this$8 && this$8.__awaiter || function(thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P ? value : new P(function(resolve) {
				resolve(value);
			});
		}
		return new (P || (P = Promise))(function(resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.findInPath = exports.which = exports.mkdirP = exports.rmRF = exports.mv = exports.cp = void 0;
	const assert_1 = __require("assert");
	const path = __importStar(__require("path"));
	const ioUtil = __importStar(require_io_util());
	/**
	* Copies a file or folder.
	* Based off of shelljs - https://github.com/shelljs/shelljs/blob/9237f66c52e5daa40458f94f9565e18e8132f5a6/src/cp.js
	*
	* @param     source    source path
	* @param     dest      destination path
	* @param     options   optional. See CopyOptions.
	*/
	function cp(source, dest, options = {}) {
		return __awaiter(this, void 0, void 0, function* () {
			const { force, recursive, copySourceDirectory } = readCopyOptions(options);
			const destStat = (yield ioUtil.exists(dest)) ? yield ioUtil.stat(dest) : null;
			if (destStat && destStat.isFile() && !force) return;
			const newDest = destStat && destStat.isDirectory() && copySourceDirectory ? path.join(dest, path.basename(source)) : dest;
			if (!(yield ioUtil.exists(source))) throw new Error(`no such file or directory: ${source}`);
			if ((yield ioUtil.stat(source)).isDirectory()) {
				if (!recursive) throw new Error(`Failed to copy. ${source} is a directory, but tried to copy without recursive flag.`);
				else yield cpDirRecursive(source, newDest, 0, force);
			} else {
				if (path.relative(source, newDest) === "") throw new Error(`'${newDest}' and '${source}' are the same file`);
				yield copyFile(source, newDest, force);
			}
		});
	}
	exports.cp = cp;
	/**
	* Moves a path.
	*
	* @param     source    source path
	* @param     dest      destination path
	* @param     options   optional. See MoveOptions.
	*/
	function mv(source, dest, options = {}) {
		return __awaiter(this, void 0, void 0, function* () {
			if (yield ioUtil.exists(dest)) {
				let destExists = true;
				if (yield ioUtil.isDirectory(dest)) {
					dest = path.join(dest, path.basename(source));
					destExists = yield ioUtil.exists(dest);
				}
				if (destExists) {
					if (options.force == null || options.force) yield rmRF(dest);
					else throw new Error("Destination already exists");
				}
			}
			yield mkdirP(path.dirname(dest));
			yield ioUtil.rename(source, dest);
		});
	}
	exports.mv = mv;
	/**
	* Remove a path recursively with force
	*
	* @param inputPath path to remove
	*/
	function rmRF(inputPath) {
		return __awaiter(this, void 0, void 0, function* () {
			if (ioUtil.IS_WINDOWS) {
				if (/[*"<>|]/.test(inputPath)) throw new Error("File path must not contain `*`, `\"`, `<`, `>` or `|` on Windows");
			}
			try {
				yield ioUtil.rm(inputPath, {
					force: true,
					maxRetries: 3,
					recursive: true,
					retryDelay: 300
				});
			} catch (err) {
				throw new Error(`File was unable to be removed ${err}`);
			}
		});
	}
	exports.rmRF = rmRF;
	/**
	* Make a directory.  Creates the full path with folders in between
	* Will throw if it fails
	*
	* @param   fsPath        path to create
	* @returns Promise<void>
	*/
	function mkdirP(fsPath) {
		return __awaiter(this, void 0, void 0, function* () {
			assert_1.ok(fsPath, "a path argument must be provided");
			yield ioUtil.mkdir(fsPath, { recursive: true });
		});
	}
	exports.mkdirP = mkdirP;
	/**
	* Returns path of a tool had the tool actually been invoked.  Resolves via paths.
	* If you check and the tool does not exist, it will throw.
	*
	* @param     tool              name of the tool
	* @param     check             whether to check if tool exists
	* @returns   Promise<string>   path to tool
	*/
	function which(tool, check) {
		return __awaiter(this, void 0, void 0, function* () {
			if (!tool) throw new Error("parameter 'tool' is required");
			if (check) {
				const result = yield which(tool, false);
				if (!result) {
					if (ioUtil.IS_WINDOWS) throw new Error(`Unable to locate executable file: ${tool}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also verify the file has a valid extension for an executable file.`);
					else throw new Error(`Unable to locate executable file: ${tool}. Please verify either the file path exists or the file can be found within a directory specified by the PATH environment variable. Also check the file mode to verify the file is executable.`);
				}
				return result;
			}
			const matches = yield findInPath(tool);
			if (matches && matches.length > 0) return matches[0];
			return "";
		});
	}
	exports.which = which;
	/**
	* Returns a list of all occurrences of the given tool on the system path.
	*
	* @returns   Promise<string[]>  the paths of the tool
	*/
	function findInPath(tool) {
		return __awaiter(this, void 0, void 0, function* () {
			if (!tool) throw new Error("parameter 'tool' is required");
			const extensions = [];
			if (ioUtil.IS_WINDOWS && process.env["PATHEXT"]) {
				for (const extension of process.env["PATHEXT"].split(path.delimiter)) if (extension) extensions.push(extension);
			}
			if (ioUtil.isRooted(tool)) {
				const filePath = yield ioUtil.tryGetExecutablePath(tool, extensions);
				if (filePath) return [filePath];
				return [];
			}
			if (tool.includes(path.sep)) return [];
			const directories = [];
			if (process.env.PATH) {
				for (const p of process.env.PATH.split(path.delimiter)) if (p) directories.push(p);
			}
			const matches = [];
			for (const directory of directories) {
				const filePath = yield ioUtil.tryGetExecutablePath(path.join(directory, tool), extensions);
				if (filePath) matches.push(filePath);
			}
			return matches;
		});
	}
	exports.findInPath = findInPath;
	function readCopyOptions(options) {
		return {
			force: options.force == null ? true : options.force,
			recursive: Boolean(options.recursive),
			copySourceDirectory: options.copySourceDirectory == null ? true : Boolean(options.copySourceDirectory)
		};
	}
	function cpDirRecursive(sourceDir, destDir, currentDepth, force) {
		return __awaiter(this, void 0, void 0, function* () {
			if (currentDepth >= 255) return;
			currentDepth++;
			yield mkdirP(destDir);
			const files = yield ioUtil.readdir(sourceDir);
			for (const fileName of files) {
				const srcFile = `${sourceDir}/${fileName}`;
				const destFile = `${destDir}/${fileName}`;
				if ((yield ioUtil.lstat(srcFile)).isDirectory()) yield cpDirRecursive(srcFile, destFile, currentDepth, force);
				else yield copyFile(srcFile, destFile, force);
			}
			yield ioUtil.chmod(destDir, (yield ioUtil.stat(sourceDir)).mode);
		});
	}
	function copyFile(srcFile, destFile, force) {
		return __awaiter(this, void 0, void 0, function* () {
			if ((yield ioUtil.lstat(srcFile)).isSymbolicLink()) {
				try {
					yield ioUtil.lstat(destFile);
					yield ioUtil.unlink(destFile);
				} catch (e) {
					if (e.code === "EPERM") {
						yield ioUtil.chmod(destFile, "0666");
						yield ioUtil.unlink(destFile);
					}
				}
				const symlinkFull = yield ioUtil.readlink(srcFile);
				yield ioUtil.symlink(symlinkFull, destFile, ioUtil.IS_WINDOWS ? "junction" : null);
			} else if (!(yield ioUtil.exists(destFile)) || force) yield ioUtil.copyFile(srcFile, destFile);
		});
	}
}));
// node_modules/@actions/tool-cache/node_modules/@actions/exec/lib/toolrunner.js
var require_toolrunner = /* @__PURE__ */ __commonJSMin(((exports, module, this$7) => {
	var __createBinding = this$7 && this$7.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		Object.defineProperty(o, k2, {
			enumerable: true,
			get: function() {
				return m[k];
			}
		});
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = this$7 && this$7.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = this$7 && this$7.__importStar || function(mod) {
		if (mod && mod.__esModule) return mod;
		var result = {};
		if (mod != null) {
			for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		}
		__setModuleDefault(result, mod);
		return result;
	};
	var __awaiter = this$7 && this$7.__awaiter || function(thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P ? value : new P(function(resolve) {
				resolve(value);
			});
		}
		return new (P || (P = Promise))(function(resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.argStringToArray = exports.ToolRunner = void 0;
	const os = __importStar(__require("os"));
	const events = __importStar(__require("events"));
	const child = __importStar(__require("child_process"));
	const path = __importStar(__require("path"));
	const io = __importStar(require_io());
	const ioUtil = __importStar(require_io_util());
	const timers_1 = __require("timers");
	const IS_WINDOWS = process.platform === "win32";
	var ToolRunner = class extends events.EventEmitter {
		constructor(toolPath, args, options) {
			super();
			if (!toolPath) throw new Error("Parameter 'toolPath' cannot be null or empty.");
			this.toolPath = toolPath;
			this.args = args || [];
			this.options = options || {};
		}
		_debug(message) {
			if (this.options.listeners && this.options.listeners.debug) this.options.listeners.debug(message);
		}
		_getCommandString(options, noPrefix) {
			const toolPath = this._getSpawnFileName();
			const args = this._getSpawnArgs(options);
			let cmd = noPrefix ? "" : "[command]";
			if (IS_WINDOWS) {
				if (this._isCmdFile()) {
					cmd += toolPath;
					for (const a of args) cmd += ` ${a}`;
				} else if (options.windowsVerbatimArguments) {
					cmd += `"${toolPath}"`;
					for (const a of args) cmd += ` ${a}`;
				} else {
					cmd += this._windowsQuoteCmdArg(toolPath);
					for (const a of args) cmd += ` ${this._windowsQuoteCmdArg(a)}`;
				}
			} else {
				cmd += toolPath;
				for (const a of args) cmd += ` ${a}`;
			}
			return cmd;
		}
		_processLineBuffer(data, strBuffer, onLine) {
			try {
				let s = strBuffer + data.toString();
				let n = s.indexOf(os.EOL);
				while (n > -1) {
					onLine(s.substring(0, n));
					s = s.substring(n + os.EOL.length);
					n = s.indexOf(os.EOL);
				}
				return s;
			} catch (err) {
				this._debug(`error processing line. Failed with error ${err}`);
				return "";
			}
		}
		_getSpawnFileName() {
			if (IS_WINDOWS) {
				if (this._isCmdFile()) return process.env["COMSPEC"] || "cmd.exe";
			}
			return this.toolPath;
		}
		_getSpawnArgs(options) {
			if (IS_WINDOWS) {
				if (this._isCmdFile()) {
					let argline = `/D /S /C "${this._windowsQuoteCmdArg(this.toolPath)}`;
					for (const a of this.args) {
						argline += " ";
						argline += options.windowsVerbatimArguments ? a : this._windowsQuoteCmdArg(a);
					}
					argline += "\"";
					return [argline];
				}
			}
			return this.args;
		}
		_endsWith(str, end) {
			return str.endsWith(end);
		}
		_isCmdFile() {
			const upperToolPath = this.toolPath.toUpperCase();
			return this._endsWith(upperToolPath, ".CMD") || this._endsWith(upperToolPath, ".BAT");
		}
		_windowsQuoteCmdArg(arg) {
			if (!this._isCmdFile()) return this._uvQuoteCmdArg(arg);
			if (!arg) return "\"\"";
			const cmdSpecialChars = [
				" ",
				"	",
				"&",
				"(",
				")",
				"[",
				"]",
				"{",
				"}",
				"^",
				"=",
				";",
				"!",
				"'",
				"+",
				",",
				"`",
				"~",
				"|",
				"<",
				">",
				"\""
			];
			let needsQuotes = false;
			for (const char of arg) if (cmdSpecialChars.some((x) => x === char)) {
				needsQuotes = true;
				break;
			}
			if (!needsQuotes) return arg;
			let reverse = "\"";
			let quoteHit = true;
			for (let i = arg.length; i > 0; i--) {
				reverse += arg[i - 1];
				if (quoteHit && arg[i - 1] === "\\") reverse += "\\";
				else if (arg[i - 1] === "\"") {
					quoteHit = true;
					reverse += "\"";
				} else quoteHit = false;
			}
			reverse += "\"";
			return reverse.split("").reverse().join("");
		}
		_uvQuoteCmdArg(arg) {
			if (!arg) return "\"\"";
			if (!arg.includes(" ") && !arg.includes("	") && !arg.includes("\"")) return arg;
			if (!arg.includes("\"") && !arg.includes("\\")) return `"${arg}"`;
			let reverse = "\"";
			let quoteHit = true;
			for (let i = arg.length; i > 0; i--) {
				reverse += arg[i - 1];
				if (quoteHit && arg[i - 1] === "\\") reverse += "\\";
				else if (arg[i - 1] === "\"") {
					quoteHit = true;
					reverse += "\\";
				} else quoteHit = false;
			}
			reverse += "\"";
			return reverse.split("").reverse().join("");
		}
		_cloneExecOptions(options) {
			options = options || {};
			const result = {
				cwd: options.cwd || process.cwd(),
				env: options.env || process.env,
				silent: options.silent || false,
				windowsVerbatimArguments: options.windowsVerbatimArguments || false,
				failOnStdErr: options.failOnStdErr || false,
				ignoreReturnCode: options.ignoreReturnCode || false,
				delay: options.delay || 1e4
			};
			result.outStream = options.outStream || process.stdout;
			result.errStream = options.errStream || process.stderr;
			return result;
		}
		_getSpawnOptions(options, toolPath) {
			options = options || {};
			const result = {};
			result.cwd = options.cwd;
			result.env = options.env;
			result["windowsVerbatimArguments"] = options.windowsVerbatimArguments || this._isCmdFile();
			if (options.windowsVerbatimArguments) result.argv0 = `"${toolPath}"`;
			return result;
		}
		/**
		* Exec a tool.
		* Output will be streamed to the live console.
		* Returns promise with return code
		*
		* @param     tool     path to tool to exec
		* @param     options  optional exec options.  See ExecOptions
		* @returns   number
		*/
		exec() {
			return __awaiter(this, void 0, void 0, function* () {
				if (!ioUtil.isRooted(this.toolPath) && (this.toolPath.includes("/") || IS_WINDOWS && this.toolPath.includes("\\"))) this.toolPath = path.resolve(process.cwd(), this.options.cwd || process.cwd(), this.toolPath);
				this.toolPath = yield io.which(this.toolPath, true);
				return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
					this._debug(`exec tool: ${this.toolPath}`);
					this._debug("arguments:");
					for (const arg of this.args) this._debug(`   ${arg}`);
					const optionsNonNull = this._cloneExecOptions(this.options);
					if (!optionsNonNull.silent && optionsNonNull.outStream) optionsNonNull.outStream.write(this._getCommandString(optionsNonNull) + os.EOL);
					const state = new ExecState(optionsNonNull, this.toolPath);
					state.on("debug", (message) => {
						this._debug(message);
					});
					if (this.options.cwd && !(yield ioUtil.exists(this.options.cwd))) return reject(/* @__PURE__ */ new Error(`The cwd: ${this.options.cwd} does not exist!`));
					const fileName = this._getSpawnFileName();
					const cp = child.spawn(fileName, this._getSpawnArgs(optionsNonNull), this._getSpawnOptions(this.options, fileName));
					let stdbuffer = "";
					if (cp.stdout) cp.stdout.on("data", (data) => {
						if (this.options.listeners && this.options.listeners.stdout) this.options.listeners.stdout(data);
						if (!optionsNonNull.silent && optionsNonNull.outStream) optionsNonNull.outStream.write(data);
						stdbuffer = this._processLineBuffer(data, stdbuffer, (line) => {
							if (this.options.listeners && this.options.listeners.stdline) this.options.listeners.stdline(line);
						});
					});
					let errbuffer = "";
					if (cp.stderr) cp.stderr.on("data", (data) => {
						state.processStderr = true;
						if (this.options.listeners && this.options.listeners.stderr) this.options.listeners.stderr(data);
						if (!optionsNonNull.silent && optionsNonNull.errStream && optionsNonNull.outStream) (optionsNonNull.failOnStdErr ? optionsNonNull.errStream : optionsNonNull.outStream).write(data);
						errbuffer = this._processLineBuffer(data, errbuffer, (line) => {
							if (this.options.listeners && this.options.listeners.errline) this.options.listeners.errline(line);
						});
					});
					cp.on("error", (err) => {
						state.processError = err.message;
						state.processExited = true;
						state.processClosed = true;
						state.CheckComplete();
					});
					cp.on("exit", (code) => {
						state.processExitCode = code;
						state.processExited = true;
						this._debug(`Exit code ${code} received from tool '${this.toolPath}'`);
						state.CheckComplete();
					});
					cp.on("close", (code) => {
						state.processExitCode = code;
						state.processExited = true;
						state.processClosed = true;
						this._debug(`STDIO streams have closed for tool '${this.toolPath}'`);
						state.CheckComplete();
					});
					state.on("done", (error, exitCode) => {
						if (stdbuffer.length > 0) this.emit("stdline", stdbuffer);
						if (errbuffer.length > 0) this.emit("errline", errbuffer);
						cp.removeAllListeners();
						if (error) reject(error);
						else resolve(exitCode);
					});
					if (this.options.input) {
						if (!cp.stdin) throw new Error("child process missing stdin");
						cp.stdin.end(this.options.input);
					}
				}));
			});
		}
	};
	exports.ToolRunner = ToolRunner;
	/**
	* Convert an arg string to an array of args. Handles escaping
	*
	* @param    argString   string of arguments
	* @returns  string[]    array of arguments
	*/
	function argStringToArray(argString) {
		const args = [];
		let inQuotes = false;
		let escaped = false;
		let arg = "";
		function append(c) {
			if (escaped && c !== "\"") arg += "\\";
			arg += c;
			escaped = false;
		}
		for (let i = 0; i < argString.length; i++) {
			const c = argString.charAt(i);
			if (c === "\"") {
				if (!escaped) inQuotes = !inQuotes;
				else append(c);
				continue;
			}
			if (c === "\\" && escaped) {
				append(c);
				continue;
			}
			if (c === "\\" && inQuotes) {
				escaped = true;
				continue;
			}
			if (c === " " && !inQuotes) {
				if (arg.length > 0) {
					args.push(arg);
					arg = "";
				}
				continue;
			}
			append(c);
		}
		if (arg.length > 0) args.push(arg.trim());
		return args;
	}
	exports.argStringToArray = argStringToArray;
	var ExecState = class ExecState extends events.EventEmitter {
		constructor(options, toolPath) {
			super();
			this.processClosed = false;
			this.processError = "";
			this.processExitCode = 0;
			this.processExited = false;
			this.processStderr = false;
			this.delay = 1e4;
			this.done = false;
			this.timeout = null;
			if (!toolPath) throw new Error("toolPath must not be empty");
			this.options = options;
			this.toolPath = toolPath;
			if (options.delay) this.delay = options.delay;
		}
		CheckComplete() {
			if (this.done) return;
			if (this.processClosed) this._setResult();
			else if (this.processExited) this.timeout = timers_1.setTimeout(ExecState.HandleTimeout, this.delay, this);
		}
		_debug(message) {
			this.emit("debug", message);
		}
		_setResult() {
			let error;
			if (this.processExited) {
				if (this.processError) error = /* @__PURE__ */ new Error(`There was an error when attempting to execute the process '${this.toolPath}'. This may indicate the process failed to start. Error: ${this.processError}`);
				else if (this.processExitCode !== 0 && !this.options.ignoreReturnCode) error = /* @__PURE__ */ new Error(`The process '${this.toolPath}' failed with exit code ${this.processExitCode}`);
				else if (this.processStderr && this.options.failOnStdErr) error = /* @__PURE__ */ new Error(`The process '${this.toolPath}' failed because one or more lines were written to the STDERR stream`);
			}
			if (this.timeout) {
				clearTimeout(this.timeout);
				this.timeout = null;
			}
			this.done = true;
			this.emit("done", error, this.processExitCode);
		}
		static HandleTimeout(state) {
			if (state.done) return;
			if (!state.processClosed && state.processExited) {
				const message = `The STDIO streams did not close within ${state.delay / 1e3} seconds of the exit event from process '${state.toolPath}'. This may indicate a child process inherited the STDIO streams and has not yet exited.`;
				state._debug(message);
			}
			state._setResult();
		}
	};
}));
// node_modules/@actions/tool-cache/node_modules/@actions/exec/lib/exec.js
var require_exec = /* @__PURE__ */ __commonJSMin(((exports, module, this$6) => {
	var __createBinding = this$6 && this$6.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		Object.defineProperty(o, k2, {
			enumerable: true,
			get: function() {
				return m[k];
			}
		});
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = this$6 && this$6.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = this$6 && this$6.__importStar || function(mod) {
		if (mod && mod.__esModule) return mod;
		var result = {};
		if (mod != null) {
			for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		}
		__setModuleDefault(result, mod);
		return result;
	};
	var __awaiter = this$6 && this$6.__awaiter || function(thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P ? value : new P(function(resolve) {
				resolve(value);
			});
		}
		return new (P || (P = Promise))(function(resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getExecOutput = exports.exec = void 0;
	const string_decoder_1 = __require("string_decoder");
	const tr = __importStar(require_toolrunner());
	/**
	* Exec a command.
	* Output will be streamed to the live console.
	* Returns promise with return code
	*
	* @param     commandLine        command to execute (can include additional args). Must be correctly escaped.
	* @param     args               optional arguments for tool. Escaping is handled by the lib.
	* @param     options            optional exec options.  See ExecOptions
	* @returns   Promise<number>    exit code
	*/
	function exec(commandLine, args, options) {
		return __awaiter(this, void 0, void 0, function* () {
			const commandArgs = tr.argStringToArray(commandLine);
			if (commandArgs.length === 0) throw new Error(`Parameter 'commandLine' cannot be null or empty.`);
			const toolPath = commandArgs[0];
			args = commandArgs.slice(1).concat(args || []);
			return new tr.ToolRunner(toolPath, args, options).exec();
		});
	}
	exports.exec = exec;
	/**
	* Exec a command and get the output.
	* Output will be streamed to the live console.
	* Returns promise with the exit code and collected stdout and stderr
	*
	* @param     commandLine           command to execute (can include additional args). Must be correctly escaped.
	* @param     args                  optional arguments for tool. Escaping is handled by the lib.
	* @param     options               optional exec options.  See ExecOptions
	* @returns   Promise<ExecOutput>   exit code, stdout, and stderr
	*/
	function getExecOutput(commandLine, args, options) {
		var _a, _b;
		return __awaiter(this, void 0, void 0, function* () {
			let stdout = "";
			let stderr = "";
			const stdoutDecoder = new string_decoder_1.StringDecoder("utf8");
			const stderrDecoder = new string_decoder_1.StringDecoder("utf8");
			const originalStdoutListener = (_a = options === null || options === void 0 ? void 0 : options.listeners) === null || _a === void 0 ? void 0 : _a.stdout;
			const originalStdErrListener = (_b = options === null || options === void 0 ? void 0 : options.listeners) === null || _b === void 0 ? void 0 : _b.stderr;
			const stdErrListener = (data) => {
				stderr += stderrDecoder.write(data);
				if (originalStdErrListener) originalStdErrListener(data);
			};
			const stdOutListener = (data) => {
				stdout += stdoutDecoder.write(data);
				if (originalStdoutListener) originalStdoutListener(data);
			};
			const listeners = Object.assign(Object.assign({}, options === null || options === void 0 ? void 0 : options.listeners), {
				stdout: stdOutListener,
				stderr: stdErrListener
			});
			const exitCode = yield exec(commandLine, args, Object.assign(Object.assign({}, options), { listeners }));
			stdout += stdoutDecoder.end();
			stderr += stderrDecoder.end();
			return {
				exitCode,
				stdout,
				stderr
			};
		});
	}
	exports.getExecOutput = getExecOutput;
}));
// node_modules/@actions/tool-cache/node_modules/@actions/core/lib/platform.js
var require_platform = /* @__PURE__ */ __commonJSMin(((exports, module, this$5) => {
	var __createBinding = this$5 && this$5.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = this$5 && this$5.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = this$5 && this$5.__importStar || function(mod) {
		if (mod && mod.__esModule) return mod;
		var result = {};
		if (mod != null) {
			for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		}
		__setModuleDefault(result, mod);
		return result;
	};
	var __awaiter = this$5 && this$5.__awaiter || function(thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P ? value : new P(function(resolve) {
				resolve(value);
			});
		}
		return new (P || (P = Promise))(function(resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
	var __importDefault = this$5 && this$5.__importDefault || function(mod) {
		return mod && mod.__esModule ? mod : { "default": mod };
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.getDetails = exports.isLinux = exports.isMacOS = exports.isWindows = exports.arch = exports.platform = void 0;
	const os_1 = __importDefault(__require("os"));
	const exec = __importStar(require_exec());
	const getWindowsInfo = () => __awaiter(void 0, void 0, void 0, function* () {
		const { stdout: version } = yield exec.getExecOutput("powershell -command \"(Get-CimInstance -ClassName Win32_OperatingSystem).Version\"", void 0, { silent: true });
		const { stdout: name } = yield exec.getExecOutput("powershell -command \"(Get-CimInstance -ClassName Win32_OperatingSystem).Caption\"", void 0, { silent: true });
		return {
			name: name.trim(),
			version: version.trim()
		};
	});
	const getMacOsInfo = () => __awaiter(void 0, void 0, void 0, function* () {
		var _a, _b, _c, _d;
		const { stdout } = yield exec.getExecOutput("sw_vers", void 0, { silent: true });
		const version = (_b = (_a = stdout.match(/ProductVersion:\s*(.+)/)) === null || _a === void 0 ? void 0 : _a[1]) !== null && _b !== void 0 ? _b : "";
		return {
			name: (_d = (_c = stdout.match(/ProductName:\s*(.+)/)) === null || _c === void 0 ? void 0 : _c[1]) !== null && _d !== void 0 ? _d : "",
			version
		};
	});
	const getLinuxInfo = () => __awaiter(void 0, void 0, void 0, function* () {
		const { stdout } = yield exec.getExecOutput("lsb_release", [
			"-i",
			"-r",
			"-s"
		], { silent: true });
		const [name, version] = stdout.trim().split("\n");
		return {
			name,
			version
		};
	});
	exports.platform = os_1.default.platform();
	exports.arch = os_1.default.arch();
	exports.isWindows = exports.platform === "win32";
	exports.isMacOS = exports.platform === "darwin";
	exports.isLinux = exports.platform === "linux";
	function getDetails() {
		return __awaiter(this, void 0, void 0, function* () {
			return Object.assign(Object.assign({}, yield exports.isWindows ? getWindowsInfo() : exports.isMacOS ? getMacOsInfo() : getLinuxInfo()), {
				platform: exports.platform,
				arch: exports.arch,
				isWindows: exports.isWindows,
				isMacOS: exports.isMacOS,
				isLinux: exports.isLinux
			});
		});
	}
	exports.getDetails = getDetails;
}));
// node_modules/@actions/tool-cache/node_modules/@actions/core/lib/core.js
var require_core = /* @__PURE__ */ __commonJSMin(((exports, module, this$4) => {
	var __createBinding = this$4 && this$4.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = this$4 && this$4.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = this$4 && this$4.__importStar || function(mod) {
		if (mod && mod.__esModule) return mod;
		var result = {};
		if (mod != null) {
			for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		}
		__setModuleDefault(result, mod);
		return result;
	};
	var __awaiter = this$4 && this$4.__awaiter || function(thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P ? value : new P(function(resolve) {
				resolve(value);
			});
		}
		return new (P || (P = Promise))(function(resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.platform = exports.toPlatformPath = exports.toWin32Path = exports.toPosixPath = exports.markdownSummary = exports.summary = exports.getIDToken = exports.getState = exports.saveState = exports.group = exports.endGroup = exports.startGroup = exports.info = exports.notice = exports.warning = exports.error = exports.debug = exports.isDebug = exports.setFailed = exports.setCommandEcho = exports.setOutput = exports.getBooleanInput = exports.getMultilineInput = exports.getInput = exports.addPath = exports.setSecret = exports.exportVariable = exports.ExitCode = void 0;
	const command_1 = require_command();
	const file_command_1 = require_file_command();
	const utils_1 = require_utils();
	const os = __importStar(__require("os"));
	const path = __importStar(__require("path"));
	const oidc_utils_1 = require_oidc_utils();
	/**
	* The code to exit an action
	*/
	var ExitCode;
	(function(ExitCode) {
		/**
		* A code indicating that the action was successful
		*/
		ExitCode[ExitCode["Success"] = 0] = "Success";
		/**
		* A code indicating that the action was a failure
		*/
		ExitCode[ExitCode["Failure"] = 1] = "Failure";
	})(ExitCode || (exports.ExitCode = ExitCode = {}));
	/**
	* Sets env variable for this action and future actions in the job
	* @param name the name of the variable to set
	* @param val the value of the variable. Non-string values will be converted to a string via JSON.stringify
	*/
	function exportVariable(name, val) {
		const convertedVal = (0, utils_1.toCommandValue)(val);
		process.env[name] = convertedVal;
		if (process.env["GITHUB_ENV"] || "") return (0, file_command_1.issueFileCommand)("ENV", (0, file_command_1.prepareKeyValueMessage)(name, val));
		(0, command_1.issueCommand)("set-env", { name }, convertedVal);
	}
	exports.exportVariable = exportVariable;
	/**
	* Registers a secret which will get masked from logs
	* @param secret value of the secret
	*/
	function setSecret(secret) {
		(0, command_1.issueCommand)("add-mask", {}, secret);
	}
	exports.setSecret = setSecret;
	/**
	* Prepends inputPath to the PATH (for this action and future actions)
	* @param inputPath
	*/
	function addPath(inputPath) {
		if (process.env["GITHUB_PATH"] || "") (0, file_command_1.issueFileCommand)("PATH", inputPath);
		else (0, command_1.issueCommand)("add-path", {}, inputPath);
		process.env["PATH"] = `${inputPath}${path.delimiter}${process.env["PATH"]}`;
	}
	exports.addPath = addPath;
	/**
	* Gets the value of an input.
	* Unless trimWhitespace is set to false in InputOptions, the value is also trimmed.
	* Returns an empty string if the value is not defined.
	*
	* @param     name     name of the input to get
	* @param     options  optional. See InputOptions.
	* @returns   string
	*/
	function getInput(name, options) {
		const val = process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] || "";
		if (options && options.required && !val) throw new Error(`Input required and not supplied: ${name}`);
		if (options && options.trimWhitespace === false) return val;
		return val.trim();
	}
	exports.getInput = getInput;
	/**
	* Gets the values of an multiline input.  Each value is also trimmed.
	*
	* @param     name     name of the input to get
	* @param     options  optional. See InputOptions.
	* @returns   string[]
	*
	*/
	function getMultilineInput(name, options) {
		const inputs = getInput(name, options).split("\n").filter((x) => x !== "");
		if (options && options.trimWhitespace === false) return inputs;
		return inputs.map((input) => input.trim());
	}
	exports.getMultilineInput = getMultilineInput;
	/**
	* Gets the input value of the boolean type in the YAML 1.2 "core schema" specification.
	* Support boolean input list: `true | True | TRUE | false | False | FALSE` .
	* The return value is also in boolean type.
	* ref: https://yaml.org/spec/1.2/spec.html#id2804923
	*
	* @param     name     name of the input to get
	* @param     options  optional. See InputOptions.
	* @returns   boolean
	*/
	function getBooleanInput(name, options) {
		const trueValue = [
			"true",
			"True",
			"TRUE"
		];
		const falseValue = [
			"false",
			"False",
			"FALSE"
		];
		const val = getInput(name, options);
		if (trueValue.includes(val)) return true;
		if (falseValue.includes(val)) return false;
		throw new TypeError(`Input does not meet YAML 1.2 "Core Schema" specification: ${name}\nSupport boolean input list: \`true | True | TRUE | false | False | FALSE\``);
	}
	exports.getBooleanInput = getBooleanInput;
	/**
	* Sets the value of an output.
	*
	* @param     name     name of the output to set
	* @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
	*/
	function setOutput(name, value) {
		if (process.env["GITHUB_OUTPUT"] || "") return (0, file_command_1.issueFileCommand)("OUTPUT", (0, file_command_1.prepareKeyValueMessage)(name, value));
		process.stdout.write(os.EOL);
		(0, command_1.issueCommand)("set-output", { name }, (0, utils_1.toCommandValue)(value));
	}
	exports.setOutput = setOutput;
	/**
	* Enables or disables the echoing of commands into stdout for the rest of the step.
	* Echoing is disabled by default if ACTIONS_STEP_DEBUG is not set.
	*
	*/
	function setCommandEcho(enabled) {
		(0, command_1.issue)("echo", enabled ? "on" : "off");
	}
	exports.setCommandEcho = setCommandEcho;
	/**
	* Sets the action status to failed.
	* When the action exits it will be with an exit code of 1
	* @param message add error issue message
	*/
	function setFailed(message) {
		process.exitCode = ExitCode.Failure;
		error(message);
	}
	exports.setFailed = setFailed;
	/**
	* Gets whether Actions Step Debug is on or not
	*/
	function isDebug() {
		return process.env["RUNNER_DEBUG"] === "1";
	}
	exports.isDebug = isDebug;
	/**
	* Writes debug message to user log
	* @param message debug message
	*/
	function debug(message) {
		(0, command_1.issueCommand)("debug", {}, message);
	}
	exports.debug = debug;
	/**
	* Adds an error issue
	* @param message error issue message. Errors will be converted to string via toString()
	* @param properties optional properties to add to the annotation.
	*/
	function error(message, properties = {}) {
		(0, command_1.issueCommand)("error", (0, utils_1.toCommandProperties)(properties), message instanceof Error ? message.toString() : message);
	}
	exports.error = error;
	/**
	* Adds a warning issue
	* @param message warning issue message. Errors will be converted to string via toString()
	* @param properties optional properties to add to the annotation.
	*/
	function warning(message, properties = {}) {
		(0, command_1.issueCommand)("warning", (0, utils_1.toCommandProperties)(properties), message instanceof Error ? message.toString() : message);
	}
	exports.warning = warning;
	/**
	* Adds a notice issue
	* @param message notice issue message. Errors will be converted to string via toString()
	* @param properties optional properties to add to the annotation.
	*/
	function notice(message, properties = {}) {
		(0, command_1.issueCommand)("notice", (0, utils_1.toCommandProperties)(properties), message instanceof Error ? message.toString() : message);
	}
	exports.notice = notice;
	/**
	* Writes info to log with console.log.
	* @param message info message
	*/
	function info(message) {
		process.stdout.write(message + os.EOL);
	}
	exports.info = info;
	/**
	* Begin an output group.
	*
	* Output until the next `groupEnd` will be foldable in this group
	*
	* @param name The name of the output group
	*/
	function startGroup(name) {
		(0, command_1.issue)("group", name);
	}
	exports.startGroup = startGroup;
	/**
	* End an output group.
	*/
	function endGroup() {
		(0, command_1.issue)("endgroup");
	}
	exports.endGroup = endGroup;
	/**
	* Wrap an asynchronous function call in a group.
	*
	* Returns the same type as the function itself.
	*
	* @param name The name of the group
	* @param fn The function to wrap in the group
	*/
	function group(name, fn) {
		return __awaiter(this, void 0, void 0, function* () {
			startGroup(name);
			let result;
			try {
				result = yield fn();
			} finally {
				endGroup();
			}
			return result;
		});
	}
	exports.group = group;
	/**
	* Saves state for current action, the state can only be retrieved by this action's post job execution.
	*
	* @param     name     name of the state to store
	* @param     value    value to store. Non-string values will be converted to a string via JSON.stringify
	*/
	function saveState(name, value) {
		if (process.env["GITHUB_STATE"] || "") return (0, file_command_1.issueFileCommand)("STATE", (0, file_command_1.prepareKeyValueMessage)(name, value));
		(0, command_1.issueCommand)("save-state", { name }, (0, utils_1.toCommandValue)(value));
	}
	exports.saveState = saveState;
	/**
	* Gets the value of an state set by this action's main execution.
	*
	* @param     name     name of the state to get
	* @returns   string
	*/
	function getState(name) {
		return process.env[`STATE_${name}`] || "";
	}
	exports.getState = getState;
	function getIDToken(aud) {
		return __awaiter(this, void 0, void 0, function* () {
			return yield oidc_utils_1.OidcClient.getIDToken(aud);
		});
	}
	exports.getIDToken = getIDToken;
	/**
	* Summary exports
	*/
	var summary_1 = require_summary();
	Object.defineProperty(exports, "summary", {
		enumerable: true,
		get: function() {
			return summary_1.summary;
		}
	});
	/**
	* @deprecated use core.summary
	*/
	var summary_2 = require_summary();
	Object.defineProperty(exports, "markdownSummary", {
		enumerable: true,
		get: function() {
			return summary_2.markdownSummary;
		}
	});
	/**
	* Path exports
	*/
	var path_utils_1 = require_path_utils();
	Object.defineProperty(exports, "toPosixPath", {
		enumerable: true,
		get: function() {
			return path_utils_1.toPosixPath;
		}
	});
	Object.defineProperty(exports, "toWin32Path", {
		enumerable: true,
		get: function() {
			return path_utils_1.toWin32Path;
		}
	});
	Object.defineProperty(exports, "toPlatformPath", {
		enumerable: true,
		get: function() {
			return path_utils_1.toPlatformPath;
		}
	});
	/**
	* Platform utilities exports
	*/
	exports.platform = __importStar(require_platform());
}));
// node_modules/@actions/tool-cache/node_modules/semver/semver.js
var require_semver = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	exports = module.exports = SemVer;
	var debug;
	/* istanbul ignore next */
	if (typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG)) debug = function() {
		var args = Array.prototype.slice.call(arguments, 0);
		args.unshift("SEMVER");
		console.log.apply(console, args);
	};
	else debug = function() {};
	exports.SEMVER_SPEC_VERSION = "2.0.0";
	var MAX_LENGTH = 256;
	var MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 
	/* istanbul ignore next */ 0x1fffffffffffff;
	var MAX_SAFE_COMPONENT_LENGTH = 16;
	var MAX_SAFE_BUILD_LENGTH = MAX_LENGTH - 6;
	var re = exports.re = [];
	var safeRe = exports.safeRe = [];
	var src = exports.src = [];
	var t = exports.tokens = {};
	var R = 0;
	function tok(n) {
		t[n] = R++;
	}
	var LETTERDASHNUMBER = "[a-zA-Z0-9-]";
	var safeRegexReplacements = [
		["\\s", 1],
		["\\d", MAX_LENGTH],
		[LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH]
	];
	function makeSafeRe(value) {
		for (var i = 0; i < safeRegexReplacements.length; i++) {
			var token = safeRegexReplacements[i][0];
			var max = safeRegexReplacements[i][1];
			value = value.split(token + "*").join(token + "{0," + max + "}").split(token + "+").join(token + "{1," + max + "}");
		}
		return value;
	}
	tok("NUMERICIDENTIFIER");
	src[t.NUMERICIDENTIFIER] = "0|[1-9]\\d*";
	tok("NUMERICIDENTIFIERLOOSE");
	src[t.NUMERICIDENTIFIERLOOSE] = "\\d+";
	tok("NONNUMERICIDENTIFIER");
	src[t.NONNUMERICIDENTIFIER] = "\\d*[a-zA-Z-]" + LETTERDASHNUMBER + "*";
	tok("MAINVERSION");
	src[t.MAINVERSION] = "(" + src[t.NUMERICIDENTIFIER] + ")\\.(" + src[t.NUMERICIDENTIFIER] + ")\\.(" + src[t.NUMERICIDENTIFIER] + ")";
	tok("MAINVERSIONLOOSE");
	src[t.MAINVERSIONLOOSE] = "(" + src[t.NUMERICIDENTIFIERLOOSE] + ")\\.(" + src[t.NUMERICIDENTIFIERLOOSE] + ")\\.(" + src[t.NUMERICIDENTIFIERLOOSE] + ")";
	tok("PRERELEASEIDENTIFIER");
	src[t.PRERELEASEIDENTIFIER] = "(?:" + src[t.NUMERICIDENTIFIER] + "|" + src[t.NONNUMERICIDENTIFIER] + ")";
	tok("PRERELEASEIDENTIFIERLOOSE");
	src[t.PRERELEASEIDENTIFIERLOOSE] = "(?:" + src[t.NUMERICIDENTIFIERLOOSE] + "|" + src[t.NONNUMERICIDENTIFIER] + ")";
	tok("PRERELEASE");
	src[t.PRERELEASE] = "(?:-(" + src[t.PRERELEASEIDENTIFIER] + "(?:\\." + src[t.PRERELEASEIDENTIFIER] + ")*))";
	tok("PRERELEASELOOSE");
	src[t.PRERELEASELOOSE] = "(?:-?(" + src[t.PRERELEASEIDENTIFIERLOOSE] + "(?:\\." + src[t.PRERELEASEIDENTIFIERLOOSE] + ")*))";
	tok("BUILDIDENTIFIER");
	src[t.BUILDIDENTIFIER] = LETTERDASHNUMBER + "+";
	tok("BUILD");
	src[t.BUILD] = "(?:\\+(" + src[t.BUILDIDENTIFIER] + "(?:\\." + src[t.BUILDIDENTIFIER] + ")*))";
	tok("FULL");
	tok("FULLPLAIN");
	src[t.FULLPLAIN] = "v?" + src[t.MAINVERSION] + src[t.PRERELEASE] + "?" + src[t.BUILD] + "?";
	src[t.FULL] = "^" + src[t.FULLPLAIN] + "$";
	tok("LOOSEPLAIN");
	src[t.LOOSEPLAIN] = "[v=\\s]*" + src[t.MAINVERSIONLOOSE] + src[t.PRERELEASELOOSE] + "?" + src[t.BUILD] + "?";
	tok("LOOSE");
	src[t.LOOSE] = "^" + src[t.LOOSEPLAIN] + "$";
	tok("GTLT");
	src[t.GTLT] = "((?:<|>)?=?)";
	tok("XRANGEIDENTIFIERLOOSE");
	src[t.XRANGEIDENTIFIERLOOSE] = src[t.NUMERICIDENTIFIERLOOSE] + "|x|X|\\*";
	tok("XRANGEIDENTIFIER");
	src[t.XRANGEIDENTIFIER] = src[t.NUMERICIDENTIFIER] + "|x|X|\\*";
	tok("XRANGEPLAIN");
	src[t.XRANGEPLAIN] = "[v=\\s]*(" + src[t.XRANGEIDENTIFIER] + ")(?:\\.(" + src[t.XRANGEIDENTIFIER] + ")(?:\\.(" + src[t.XRANGEIDENTIFIER] + ")(?:" + src[t.PRERELEASE] + ")?" + src[t.BUILD] + "?)?)?";
	tok("XRANGEPLAINLOOSE");
	src[t.XRANGEPLAINLOOSE] = "[v=\\s]*(" + src[t.XRANGEIDENTIFIERLOOSE] + ")(?:\\.(" + src[t.XRANGEIDENTIFIERLOOSE] + ")(?:\\.(" + src[t.XRANGEIDENTIFIERLOOSE] + ")(?:" + src[t.PRERELEASELOOSE] + ")?" + src[t.BUILD] + "?)?)?";
	tok("XRANGE");
	src[t.XRANGE] = "^" + src[t.GTLT] + "\\s*" + src[t.XRANGEPLAIN] + "$";
	tok("XRANGELOOSE");
	src[t.XRANGELOOSE] = "^" + src[t.GTLT] + "\\s*" + src[t.XRANGEPLAINLOOSE] + "$";
	tok("COERCE");
	src[t.COERCE] = "(^|[^\\d])(\\d{1," + MAX_SAFE_COMPONENT_LENGTH + "})(?:\\.(\\d{1," + MAX_SAFE_COMPONENT_LENGTH + "}))?(?:\\.(\\d{1," + MAX_SAFE_COMPONENT_LENGTH + "}))?(?:$|[^\\d])";
	tok("COERCERTL");
	re[t.COERCERTL] = new RegExp(src[t.COERCE], "g");
	safeRe[t.COERCERTL] = new RegExp(makeSafeRe(src[t.COERCE]), "g");
	tok("LONETILDE");
	src[t.LONETILDE] = "(?:~>?)";
	tok("TILDETRIM");
	src[t.TILDETRIM] = "(\\s*)" + src[t.LONETILDE] + "\\s+";
	re[t.TILDETRIM] = new RegExp(src[t.TILDETRIM], "g");
	safeRe[t.TILDETRIM] = new RegExp(makeSafeRe(src[t.TILDETRIM]), "g");
	var tildeTrimReplace = "$1~";
	tok("TILDE");
	src[t.TILDE] = "^" + src[t.LONETILDE] + src[t.XRANGEPLAIN] + "$";
	tok("TILDELOOSE");
	src[t.TILDELOOSE] = "^" + src[t.LONETILDE] + src[t.XRANGEPLAINLOOSE] + "$";
	tok("LONECARET");
	src[t.LONECARET] = "(?:\\^)";
	tok("CARETTRIM");
	src[t.CARETTRIM] = "(\\s*)" + src[t.LONECARET] + "\\s+";
	re[t.CARETTRIM] = new RegExp(src[t.CARETTRIM], "g");
	safeRe[t.CARETTRIM] = new RegExp(makeSafeRe(src[t.CARETTRIM]), "g");
	var caretTrimReplace = "$1^";
	tok("CARET");
	src[t.CARET] = "^" + src[t.LONECARET] + src[t.XRANGEPLAIN] + "$";
	tok("CARETLOOSE");
	src[t.CARETLOOSE] = "^" + src[t.LONECARET] + src[t.XRANGEPLAINLOOSE] + "$";
	tok("COMPARATORLOOSE");
	src[t.COMPARATORLOOSE] = "^" + src[t.GTLT] + "\\s*(" + src[t.LOOSEPLAIN] + ")$|^$";
	tok("COMPARATOR");
	src[t.COMPARATOR] = "^" + src[t.GTLT] + "\\s*(" + src[t.FULLPLAIN] + ")$|^$";
	tok("COMPARATORTRIM");
	src[t.COMPARATORTRIM] = "(\\s*)" + src[t.GTLT] + "\\s*(" + src[t.LOOSEPLAIN] + "|" + src[t.XRANGEPLAIN] + ")";
	re[t.COMPARATORTRIM] = new RegExp(src[t.COMPARATORTRIM], "g");
	safeRe[t.COMPARATORTRIM] = new RegExp(makeSafeRe(src[t.COMPARATORTRIM]), "g");
	tok("HYPHENRANGE");
	src[t.HYPHENRANGE] = "^\\s*(" + src[t.XRANGEPLAIN] + ")\\s+-\\s+(" + src[t.XRANGEPLAIN] + ")\\s*$";
	tok("HYPHENRANGELOOSE");
	src[t.HYPHENRANGELOOSE] = "^\\s*(" + src[t.XRANGEPLAINLOOSE] + ")\\s+-\\s+(" + src[t.XRANGEPLAINLOOSE] + ")\\s*$";
	tok("STAR");
	src[t.STAR] = "(<|>)?=?\\s*\\*";
	for (var i = 0; i < R; i++) {
		debug(i, src[i]);
		if (!re[i]) {
			re[i] = new RegExp(src[i]);
			safeRe[i] = new RegExp(makeSafeRe(src[i]));
		}
	}
	exports.parse = parse;
	function parse(version, options) {
		if (!options || typeof options !== "object") options = {
			loose: !!options,
			includePrerelease: false
		};
		if (version instanceof SemVer) return version;
		if (typeof version !== "string") return null;
		if (version.length > MAX_LENGTH) return null;
		if (!(options.loose ? safeRe[t.LOOSE] : safeRe[t.FULL]).test(version)) return null;
		try {
			return new SemVer(version, options);
		} catch (er) {
			return null;
		}
	}
	exports.valid = valid;
	function valid(version, options) {
		var v = parse(version, options);
		return v ? v.version : null;
	}
	exports.clean = clean;
	function clean(version, options) {
		var s = parse(version.trim().replace(/^[=v]+/, ""), options);
		return s ? s.version : null;
	}
	exports.SemVer = SemVer;
	function SemVer(version, options) {
		if (!options || typeof options !== "object") options = {
			loose: !!options,
			includePrerelease: false
		};
		if (version instanceof SemVer) {
			if (version.loose === options.loose) return version;
			else version = version.version;
		} else if (typeof version !== "string") throw new TypeError("Invalid Version: " + version);
		if (version.length > MAX_LENGTH) throw new TypeError("version is longer than " + MAX_LENGTH + " characters");
		if (!(this instanceof SemVer)) return new SemVer(version, options);
		debug("SemVer", version, options);
		this.options = options;
		this.loose = !!options.loose;
		var m = version.trim().match(options.loose ? safeRe[t.LOOSE] : safeRe[t.FULL]);
		if (!m) throw new TypeError("Invalid Version: " + version);
		this.raw = version;
		this.major = +m[1];
		this.minor = +m[2];
		this.patch = +m[3];
		if (this.major > MAX_SAFE_INTEGER || this.major < 0) throw new TypeError("Invalid major version");
		if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) throw new TypeError("Invalid minor version");
		if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) throw new TypeError("Invalid patch version");
		if (!m[4]) this.prerelease = [];
		else this.prerelease = m[4].split(".").map(function(id) {
			if (/^[0-9]+$/.test(id)) {
				var num = +id;
				if (num >= 0 && num < MAX_SAFE_INTEGER) return num;
			}
			return id;
		});
		this.build = m[5] ? m[5].split(".") : [];
		this.format();
	}
	SemVer.prototype.format = function() {
		this.version = this.major + "." + this.minor + "." + this.patch;
		if (this.prerelease.length) this.version += "-" + this.prerelease.join(".");
		return this.version;
	};
	SemVer.prototype.toString = function() {
		return this.version;
	};
	SemVer.prototype.compare = function(other) {
		debug("SemVer.compare", this.version, this.options, other);
		if (!(other instanceof SemVer)) other = new SemVer(other, this.options);
		return this.compareMain(other) || this.comparePre(other);
	};
	SemVer.prototype.compareMain = function(other) {
		if (!(other instanceof SemVer)) other = new SemVer(other, this.options);
		return compareIdentifiers(this.major, other.major) || compareIdentifiers(this.minor, other.minor) || compareIdentifiers(this.patch, other.patch);
	};
	SemVer.prototype.comparePre = function(other) {
		if (!(other instanceof SemVer)) other = new SemVer(other, this.options);
		if (this.prerelease.length && !other.prerelease.length) return -1;
		else if (!this.prerelease.length && other.prerelease.length) return 1;
		else if (!this.prerelease.length && !other.prerelease.length) return 0;
		var i = 0;
		do {
			var a = this.prerelease[i];
			var b = other.prerelease[i];
			debug("prerelease compare", i, a, b);
			if (a === void 0 && b === void 0) return 0;
			else if (b === void 0) return 1;
			else if (a === void 0) return -1;
			else if (a === b) continue;
			else return compareIdentifiers(a, b);
		} while (++i);
	};
	SemVer.prototype.compareBuild = function(other) {
		if (!(other instanceof SemVer)) other = new SemVer(other, this.options);
		var i = 0;
		do {
			var a = this.build[i];
			var b = other.build[i];
			debug("prerelease compare", i, a, b);
			if (a === void 0 && b === void 0) return 0;
			else if (b === void 0) return 1;
			else if (a === void 0) return -1;
			else if (a === b) continue;
			else return compareIdentifiers(a, b);
		} while (++i);
	};
	SemVer.prototype.inc = function(release, identifier) {
		switch (release) {
			case "premajor":
				this.prerelease.length = 0;
				this.patch = 0;
				this.minor = 0;
				this.major++;
				this.inc("pre", identifier);
				break;
			case "preminor":
				this.prerelease.length = 0;
				this.patch = 0;
				this.minor++;
				this.inc("pre", identifier);
				break;
			case "prepatch":
				this.prerelease.length = 0;
				this.inc("patch", identifier);
				this.inc("pre", identifier);
				break;
			case "prerelease":
				if (this.prerelease.length === 0) this.inc("patch", identifier);
				this.inc("pre", identifier);
				break;
			case "major":
				if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) this.major++;
				this.minor = 0;
				this.patch = 0;
				this.prerelease = [];
				break;
			case "minor":
				if (this.patch !== 0 || this.prerelease.length === 0) this.minor++;
				this.patch = 0;
				this.prerelease = [];
				break;
			case "patch":
				if (this.prerelease.length === 0) this.patch++;
				this.prerelease = [];
				break;
			case "pre":
				if (this.prerelease.length === 0) this.prerelease = [0];
				else {
					var i = this.prerelease.length;
					while (--i >= 0) if (typeof this.prerelease[i] === "number") {
						this.prerelease[i]++;
						i = -2;
					}
					if (i === -1) this.prerelease.push(0);
				}
				if (identifier) {
					if (this.prerelease[0] === identifier) {
						if (isNaN(this.prerelease[1])) this.prerelease = [identifier, 0];
					} else this.prerelease = [identifier, 0];
				}
				break;
			default: throw new Error("invalid increment argument: " + release);
		}
		this.format();
		this.raw = this.version;
		return this;
	};
	exports.inc = inc;
	function inc(version, release, loose, identifier) {
		if (typeof loose === "string") {
			identifier = loose;
			loose = void 0;
		}
		try {
			return new SemVer(version, loose).inc(release, identifier).version;
		} catch (er) {
			return null;
		}
	}
	exports.diff = diff;
	function diff(version1, version2) {
		if (eq(version1, version2)) return null;
		else {
			var v1 = parse(version1);
			var v2 = parse(version2);
			var prefix = "";
			if (v1.prerelease.length || v2.prerelease.length) {
				prefix = "pre";
				var defaultResult = "prerelease";
			}
			for (var key in v1) if (key === "major" || key === "minor" || key === "patch") {
				if (v1[key] !== v2[key]) return prefix + key;
			}
			return defaultResult;
		}
	}
	exports.compareIdentifiers = compareIdentifiers;
	var numeric = /^[0-9]+$/;
	function compareIdentifiers(a, b) {
		var anum = numeric.test(a);
		var bnum = numeric.test(b);
		if (anum && bnum) {
			a = +a;
			b = +b;
		}
		return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
	}
	exports.rcompareIdentifiers = rcompareIdentifiers;
	function rcompareIdentifiers(a, b) {
		return compareIdentifiers(b, a);
	}
	exports.major = major;
	function major(a, loose) {
		return new SemVer(a, loose).major;
	}
	exports.minor = minor;
	function minor(a, loose) {
		return new SemVer(a, loose).minor;
	}
	exports.patch = patch;
	function patch(a, loose) {
		return new SemVer(a, loose).patch;
	}
	exports.compare = compare;
	function compare(a, b, loose) {
		return new SemVer(a, loose).compare(new SemVer(b, loose));
	}
	exports.compareLoose = compareLoose;
	function compareLoose(a, b) {
		return compare(a, b, true);
	}
	exports.compareBuild = compareBuild;
	function compareBuild(a, b, loose) {
		var versionA = new SemVer(a, loose);
		var versionB = new SemVer(b, loose);
		return versionA.compare(versionB) || versionA.compareBuild(versionB);
	}
	exports.rcompare = rcompare;
	function rcompare(a, b, loose) {
		return compare(b, a, loose);
	}
	exports.sort = sort;
	function sort(list, loose) {
		return list.sort(function(a, b) {
			return exports.compareBuild(a, b, loose);
		});
	}
	exports.rsort = rsort;
	function rsort(list, loose) {
		return list.sort(function(a, b) {
			return exports.compareBuild(b, a, loose);
		});
	}
	exports.gt = gt;
	function gt(a, b, loose) {
		return compare(a, b, loose) > 0;
	}
	exports.lt = lt;
	function lt(a, b, loose) {
		return compare(a, b, loose) < 0;
	}
	exports.eq = eq;
	function eq(a, b, loose) {
		return compare(a, b, loose) === 0;
	}
	exports.neq = neq;
	function neq(a, b, loose) {
		return compare(a, b, loose) !== 0;
	}
	exports.gte = gte;
	function gte(a, b, loose) {
		return compare(a, b, loose) >= 0;
	}
	exports.lte = lte;
	function lte(a, b, loose) {
		return compare(a, b, loose) <= 0;
	}
	exports.cmp = cmp;
	function cmp(a, op, b, loose) {
		switch (op) {
			case "===":
				if (typeof a === "object") a = a.version;
				if (typeof b === "object") b = b.version;
				return a === b;
			case "!==":
				if (typeof a === "object") a = a.version;
				if (typeof b === "object") b = b.version;
				return a !== b;
			case "":
			case "=":
			case "==": return eq(a, b, loose);
			case "!=": return neq(a, b, loose);
			case ">": return gt(a, b, loose);
			case ">=": return gte(a, b, loose);
			case "<": return lt(a, b, loose);
			case "<=": return lte(a, b, loose);
			default: throw new TypeError("Invalid operator: " + op);
		}
	}
	exports.Comparator = Comparator;
	function Comparator(comp, options) {
		if (!options || typeof options !== "object") options = {
			loose: !!options,
			includePrerelease: false
		};
		if (comp instanceof Comparator) {
			if (comp.loose === !!options.loose) return comp;
			else comp = comp.value;
		}
		if (!(this instanceof Comparator)) return new Comparator(comp, options);
		comp = comp.trim().split(/\s+/).join(" ");
		debug("comparator", comp, options);
		this.options = options;
		this.loose = !!options.loose;
		this.parse(comp);
		if (this.semver === ANY) this.value = "";
		else this.value = this.operator + this.semver.version;
		debug("comp", this);
	}
	var ANY = {};
	Comparator.prototype.parse = function(comp) {
		var r = this.options.loose ? safeRe[t.COMPARATORLOOSE] : safeRe[t.COMPARATOR];
		var m = comp.match(r);
		if (!m) throw new TypeError("Invalid comparator: " + comp);
		this.operator = m[1] !== void 0 ? m[1] : "";
		if (this.operator === "=") this.operator = "";
		if (!m[2]) this.semver = ANY;
		else this.semver = new SemVer(m[2], this.options.loose);
	};
	Comparator.prototype.toString = function() {
		return this.value;
	};
	Comparator.prototype.test = function(version) {
		debug("Comparator.test", version, this.options.loose);
		if (this.semver === ANY || version === ANY) return true;
		if (typeof version === "string") try {
			version = new SemVer(version, this.options);
		} catch (er) {
			return false;
		}
		return cmp(version, this.operator, this.semver, this.options);
	};
	Comparator.prototype.intersects = function(comp, options) {
		if (!(comp instanceof Comparator)) throw new TypeError("a Comparator is required");
		if (!options || typeof options !== "object") options = {
			loose: !!options,
			includePrerelease: false
		};
		var rangeTmp;
		if (this.operator === "") {
			if (this.value === "") return true;
			rangeTmp = new Range(comp.value, options);
			return satisfies(this.value, rangeTmp, options);
		} else if (comp.operator === "") {
			if (comp.value === "") return true;
			rangeTmp = new Range(this.value, options);
			return satisfies(comp.semver, rangeTmp, options);
		}
		var sameDirectionIncreasing = (this.operator === ">=" || this.operator === ">") && (comp.operator === ">=" || comp.operator === ">");
		var sameDirectionDecreasing = (this.operator === "<=" || this.operator === "<") && (comp.operator === "<=" || comp.operator === "<");
		var sameSemVer = this.semver.version === comp.semver.version;
		var differentDirectionsInclusive = (this.operator === ">=" || this.operator === "<=") && (comp.operator === ">=" || comp.operator === "<=");
		var oppositeDirectionsLessThan = cmp(this.semver, "<", comp.semver, options) && (this.operator === ">=" || this.operator === ">") && (comp.operator === "<=" || comp.operator === "<");
		var oppositeDirectionsGreaterThan = cmp(this.semver, ">", comp.semver, options) && (this.operator === "<=" || this.operator === "<") && (comp.operator === ">=" || comp.operator === ">");
		return sameDirectionIncreasing || sameDirectionDecreasing || sameSemVer && differentDirectionsInclusive || oppositeDirectionsLessThan || oppositeDirectionsGreaterThan;
	};
	exports.Range = Range;
	function Range(range, options) {
		if (!options || typeof options !== "object") options = {
			loose: !!options,
			includePrerelease: false
		};
		if (range instanceof Range) {
			if (range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease) return range;
			else return new Range(range.raw, options);
		}
		if (range instanceof Comparator) return new Range(range.value, options);
		if (!(this instanceof Range)) return new Range(range, options);
		this.options = options;
		this.loose = !!options.loose;
		this.includePrerelease = !!options.includePrerelease;
		this.raw = range.trim().split(/\s+/).join(" ");
		this.set = this.raw.split("||").map(function(range) {
			return this.parseRange(range.trim());
		}, this).filter(function(c) {
			return c.length;
		});
		if (!this.set.length) throw new TypeError("Invalid SemVer Range: " + this.raw);
		this.format();
	}
	Range.prototype.format = function() {
		this.range = this.set.map(function(comps) {
			return comps.join(" ").trim();
		}).join("||").trim();
		return this.range;
	};
	Range.prototype.toString = function() {
		return this.range;
	};
	function isWhitespace(char) {
		var code = char && char.charCodeAt(0);
		return code >= 9 && code <= 13 || code === 32 || code === 160 || code === 5760 || code >= 8192 && code <= 8202 || code === 8232 || code === 8233 || code === 8239 || code === 8287 || code === 12288 || code === 65279;
	}
	function isVersionPrefix(char) {
		return char === "v" || char === "=" || isWhitespace(char);
	}
	function isDigit(char) {
		return char !== void 0 && char >= "0" && char <= "9";
	}
	function isLetter(char) {
		return char !== void 0 && (char >= "a" && char <= "z" || char >= "A" && char <= "Z");
	}
	function isIdentifierCharacter(char) {
		return isDigit(char) || isLetter(char) || char === "-";
	}
	function isVersionStart(char) {
		return isDigit(char) || char === "x" || char === "X" || char === "*";
	}
	function findDigitsEndIndex(range, start, limit, digitRuns) {
		if (!isDigit(range[start])) return start;
		if (start >= digitRuns.start && start < digitRuns.end) return Math.min(start + limit, digitRuns.end);
		if (start >= digitRuns.previousStart && start < digitRuns.previousEnd) return Math.min(start + limit, digitRuns.previousEnd);
		var end = start + 1;
		while (isDigit(range[end])) end++;
		digitRuns.previousStart = digitRuns.start;
		digitRuns.previousEnd = digitRuns.end;
		digitRuns.start = start;
		digitRuns.end = end;
		return Math.min(start + limit, end);
	}
	function findVersionNumberEndIndex(range, start, loose, digitRuns) {
		if (!loose && range[start] === "0") return start + 1;
		return findDigitsEndIndex(range, start, loose ? MAX_LENGTH : MAX_LENGTH + 1, digitRuns);
	}
	function findPrereleaseIdentifierEndIndex(range, start, loose, digitRuns) {
		if (isDigit(range[start])) return findVersionNumberEndIndex(range, start, loose, digitRuns);
		if (!isLetter(range[start]) && range[start] !== "-") return start;
		var end = start + 1;
		var limit = end + MAX_SAFE_BUILD_LENGTH;
		while (end < limit && isIdentifierCharacter(range[end])) end++;
		return end;
	}
	function findPrereleaseEndIndex(range, start, loose, digitRuns) {
		var hyphen = range[start] === "-";
		if (!loose && !hyphen) return start;
		var identifierStart = start + (hyphen ? 1 : 0);
		var end = findPrereleaseIdentifierEndIndex(range, identifierStart, loose, digitRuns);
		if (end === identifierStart) {
			if (!loose || !hyphen) return start;
			end = findPrereleaseIdentifierEndIndex(range, start, loose, digitRuns);
		}
		while (range[end] === ".") {
			var next = findPrereleaseIdentifierEndIndex(range, end + 1, loose, digitRuns);
			if (next === end + 1) break;
			end = next;
		}
		return end;
	}
	function findBuildEndIndex(range, start) {
		if (range[start] !== "+") return start;
		var end = start + 1;
		do {
			var identifierStart = end;
			while (end - identifierStart < MAX_SAFE_BUILD_LENGTH && isIdentifierCharacter(range[end])) end++;
			if (end === identifierStart) return identifierStart === start + 1 ? start : end - 1;
			if (range[end] !== ".") return end;
			end++;
		} while (true);
	}
	function findLooseFullVersionEndIndex(range, start, digitRuns) {
		var end = start;
		for (var component = 0; component < 3; component++) {
			var next = findVersionNumberEndIndex(range, end, true, digitRuns);
			if (next === end) return start;
			end = next;
			if (component < 2) {
				if (range[end] !== ".") return start;
				end++;
			}
		}
		return findBuildEndIndex(range, findPrereleaseEndIndex(range, end, true, digitRuns));
	}
	function findPartialVersionComponentEndIndex(range, start, digitRuns) {
		if (isDigit(range[start])) return findVersionNumberEndIndex(range, start, false, digitRuns);
		return isVersionStart(range[start]) ? start + 1 : start;
	}
	function findVersionEndIndex(range, start, digitRuns) {
		var end = findLooseFullVersionEndIndex(range, start, digitRuns);
		if (end !== start) return end;
		end = findPartialVersionComponentEndIndex(range, start, digitRuns);
		for (var component = 0; component < 2; component++) {
			if (range[end] !== ".") return end;
			var next = findPartialVersionComponentEndIndex(range, end + 1, digitRuns);
			if (next === end + 1) return end;
			end = next;
		}
		return findBuildEndIndex(range, findPrereleaseEndIndex(range, end, false, digitRuns));
	}
	function findRemovableWhitespaceIndex(range, position) {
		if (isWhitespace(range[position])) position++;
		if (range[position] === "<" || range[position] === ">") position++;
		if (range[position] === "=") position++;
		return isWhitespace(range[position]) ? position : -1;
	}
	function trimComparatorWhitespace(range) {
		var result = "";
		var copyFrom = 0;
		var cursor = 0;
		var digitRuns = {
			start: -1,
			end: -1,
			previousStart: -1,
			previousEnd: -1
		};
		while (cursor < range.length) {
			var matchStart = cursor;
			if (range[cursor] === "<" || range[cursor] === ">") cursor++;
			else if (!isVersionPrefix(range[cursor]) && !isVersionStart(range[cursor])) {
				cursor++;
				continue;
			}
			while (cursor < range.length && isVersionPrefix(range[cursor])) cursor++;
			if (!isVersionStart(range[cursor])) continue;
			var whitespacePosition = findRemovableWhitespaceIndex(range, matchStart);
			if (whitespacePosition !== -1) {
				result += range.slice(copyFrom, whitespacePosition);
				copyFrom = whitespacePosition + 1;
			}
			cursor = findVersionEndIndex(range, cursor, digitRuns);
		}
		return result + range.slice(copyFrom);
	}
	Range.prototype.parseRange = function(range) {
		var loose = this.options.loose;
		var hr = loose ? safeRe[t.HYPHENRANGELOOSE] : safeRe[t.HYPHENRANGE];
		range = range.replace(hr, hyphenReplace);
		debug("hyphen replace", range);
		range = trimComparatorWhitespace(range);
		debug("comparator trim", range);
		range = range.replace(safeRe[t.TILDETRIM], tildeTrimReplace);
		range = range.replace(safeRe[t.CARETTRIM], caretTrimReplace);
		range = range.split(/\s+/).join(" ");
		var compRe = loose ? safeRe[t.COMPARATORLOOSE] : safeRe[t.COMPARATOR];
		var set = range.split(" ").map(function(comp) {
			return parseComparator(comp, this.options);
		}, this).join(" ").split(/\s+/);
		if (this.options.loose) set = set.filter(function(comp) {
			return !!comp.match(compRe);
		});
		set = set.map(function(comp) {
			return new Comparator(comp, this.options);
		}, this);
		return set;
	};
	Range.prototype.intersects = function(range, options) {
		if (!(range instanceof Range)) throw new TypeError("a Range is required");
		return this.set.some(function(thisComparators) {
			return isSatisfiable(thisComparators, options) && range.set.some(function(rangeComparators) {
				return isSatisfiable(rangeComparators, options) && thisComparators.every(function(thisComparator) {
					return rangeComparators.every(function(rangeComparator) {
						return thisComparator.intersects(rangeComparator, options);
					});
				});
			});
		});
	};
	function isSatisfiable(comparators, options) {
		var result = true;
		var remainingComparators = comparators.slice();
		var testComparator = remainingComparators.pop();
		while (result && remainingComparators.length) {
			result = remainingComparators.every(function(otherComparator) {
				return testComparator.intersects(otherComparator, options);
			});
			testComparator = remainingComparators.pop();
		}
		return result;
	}
	exports.toComparators = toComparators;
	function toComparators(range, options) {
		return new Range(range, options).set.map(function(comp) {
			return comp.map(function(c) {
				return c.value;
			}).join(" ").trim().split(" ");
		});
	}
	function parseComparator(comp, options) {
		debug("comp", comp, options);
		comp = replaceCarets(comp, options);
		debug("caret", comp);
		comp = replaceTildes(comp, options);
		debug("tildes", comp);
		comp = replaceXRanges(comp, options);
		debug("xrange", comp);
		comp = replaceStars(comp, options);
		debug("stars", comp);
		return comp;
	}
	function isX(id) {
		return !id || id.toLowerCase() === "x" || id === "*";
	}
	function replaceTildes(comp, options) {
		return comp.trim().split(/\s+/).map(function(comp) {
			return replaceTilde(comp, options);
		}).join(" ");
	}
	function replaceTilde(comp, options) {
		var r = options.loose ? safeRe[t.TILDELOOSE] : safeRe[t.TILDE];
		return comp.replace(r, function(_, M, m, p, pr) {
			debug("tilde", comp, _, M, m, p, pr);
			var ret;
			if (isX(M)) ret = "";
			else if (isX(m)) ret = ">=" + M + ".0.0 <" + (+M + 1) + ".0.0";
			else if (isX(p)) ret = ">=" + M + "." + m + ".0 <" + M + "." + (+m + 1) + ".0";
			else if (pr) {
				debug("replaceTilde pr", pr);
				ret = ">=" + M + "." + m + "." + p + "-" + pr + " <" + M + "." + (+m + 1) + ".0";
			} else ret = ">=" + M + "." + m + "." + p + " <" + M + "." + (+m + 1) + ".0";
			debug("tilde return", ret);
			return ret;
		});
	}
	function replaceCarets(comp, options) {
		return comp.trim().split(/\s+/).map(function(comp) {
			return replaceCaret(comp, options);
		}).join(" ");
	}
	function replaceCaret(comp, options) {
		debug("caret", comp, options);
		var r = options.loose ? safeRe[t.CARETLOOSE] : safeRe[t.CARET];
		return comp.replace(r, function(_, M, m, p, pr) {
			debug("caret", comp, _, M, m, p, pr);
			var ret;
			if (isX(M)) ret = "";
			else if (isX(m)) ret = ">=" + M + ".0.0 <" + (+M + 1) + ".0.0";
			else if (isX(p)) {
				if (M === "0") ret = ">=" + M + "." + m + ".0 <" + M + "." + (+m + 1) + ".0";
				else ret = ">=" + M + "." + m + ".0 <" + (+M + 1) + ".0.0";
			} else if (pr) {
				debug("replaceCaret pr", pr);
				if (M === "0") {
					if (m === "0") ret = ">=" + M + "." + m + "." + p + "-" + pr + " <" + M + "." + m + "." + (+p + 1);
					else ret = ">=" + M + "." + m + "." + p + "-" + pr + " <" + M + "." + (+m + 1) + ".0";
				} else ret = ">=" + M + "." + m + "." + p + "-" + pr + " <" + (+M + 1) + ".0.0";
			} else {
				debug("no pr");
				if (M === "0") {
					if (m === "0") ret = ">=" + M + "." + m + "." + p + " <" + M + "." + m + "." + (+p + 1);
					else ret = ">=" + M + "." + m + "." + p + " <" + M + "." + (+m + 1) + ".0";
				} else ret = ">=" + M + "." + m + "." + p + " <" + (+M + 1) + ".0.0";
			}
			debug("caret return", ret);
			return ret;
		});
	}
	function replaceXRanges(comp, options) {
		debug("replaceXRanges", comp, options);
		return comp.split(/\s+/).map(function(comp) {
			return replaceXRange(comp, options);
		}).join(" ");
	}
	function replaceXRange(comp, options) {
		comp = comp.trim();
		var r = options.loose ? safeRe[t.XRANGELOOSE] : safeRe[t.XRANGE];
		return comp.replace(r, function(ret, gtlt, M, m, p, pr) {
			debug("xRange", comp, ret, gtlt, M, m, p, pr);
			var xM = isX(M);
			var xm = xM || isX(m);
			var xp = xm || isX(p);
			var anyX = xp;
			if (gtlt === "=" && anyX) gtlt = "";
			pr = options.includePrerelease ? "-0" : "";
			if (xM) {
				if (gtlt === ">" || gtlt === "<") ret = "<0.0.0-0";
				else ret = "*";
			} else if (gtlt && anyX) {
				if (xm) m = 0;
				p = 0;
				if (gtlt === ">") {
					gtlt = ">=";
					if (xm) {
						M = +M + 1;
						m = 0;
						p = 0;
					} else {
						m = +m + 1;
						p = 0;
					}
				} else if (gtlt === "<=") {
					gtlt = "<";
					if (xm) M = +M + 1;
					else m = +m + 1;
				}
				ret = gtlt + M + "." + m + "." + p + pr;
			} else if (xm) ret = ">=" + M + ".0.0" + pr + " <" + (+M + 1) + ".0.0" + pr;
			else if (xp) ret = ">=" + M + "." + m + ".0" + pr + " <" + M + "." + (+m + 1) + ".0" + pr;
			debug("xRange return", ret);
			return ret;
		});
	}
	function replaceStars(comp, options) {
		debug("replaceStars", comp, options);
		return comp.trim().replace(safeRe[t.STAR], "");
	}
	function hyphenReplace($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr, tb) {
		if (isX(fM)) from = "";
		else if (isX(fm)) from = ">=" + fM + ".0.0";
		else if (isX(fp)) from = ">=" + fM + "." + fm + ".0";
		else from = ">=" + from;
		if (isX(tM)) to = "";
		else if (isX(tm)) to = "<" + (+tM + 1) + ".0.0";
		else if (isX(tp)) to = "<" + tM + "." + (+tm + 1) + ".0";
		else if (tpr) to = "<=" + tM + "." + tm + "." + tp + "-" + tpr;
		else to = "<=" + to;
		return (from + " " + to).trim();
	}
	Range.prototype.test = function(version) {
		if (!version) return false;
		if (typeof version === "string") try {
			version = new SemVer(version, this.options);
		} catch (er) {
			return false;
		}
		for (var i = 0; i < this.set.length; i++) if (testSet(this.set[i], version, this.options)) return true;
		return false;
	};
	function testSet(set, version, options) {
		for (var i = 0; i < set.length; i++) if (!set[i].test(version)) return false;
		if (version.prerelease.length && !options.includePrerelease) {
			for (i = 0; i < set.length; i++) {
				debug(set[i].semver);
				if (set[i].semver === ANY) continue;
				if (set[i].semver.prerelease.length > 0) {
					var allowed = set[i].semver;
					if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) return true;
				}
			}
			return false;
		}
		return true;
	}
	exports.satisfies = satisfies;
	function satisfies(version, range, options) {
		try {
			range = new Range(range, options);
		} catch (er) {
			return false;
		}
		return range.test(version);
	}
	exports.maxSatisfying = maxSatisfying;
	function maxSatisfying(versions, range, options) {
		var max = null;
		var maxSV = null;
		try {
			var rangeObj = new Range(range, options);
		} catch (er) {
			return null;
		}
		versions.forEach(function(v) {
			if (rangeObj.test(v)) {
				if (!max || maxSV.compare(v) === -1) {
					max = v;
					maxSV = new SemVer(max, options);
				}
			}
		});
		return max;
	}
	exports.minSatisfying = minSatisfying;
	function minSatisfying(versions, range, options) {
		var min = null;
		var minSV = null;
		try {
			var rangeObj = new Range(range, options);
		} catch (er) {
			return null;
		}
		versions.forEach(function(v) {
			if (rangeObj.test(v)) {
				if (!min || minSV.compare(v) === 1) {
					min = v;
					minSV = new SemVer(min, options);
				}
			}
		});
		return min;
	}
	exports.minVersion = minVersion;
	function minVersion(range, loose) {
		range = new Range(range, loose);
		var minver = new SemVer("0.0.0");
		if (range.test(minver)) return minver;
		minver = new SemVer("0.0.0-0");
		if (range.test(minver)) return minver;
		minver = null;
		for (var i = 0; i < range.set.length; ++i) range.set[i].forEach(function(comparator) {
			var compver = new SemVer(comparator.semver.version);
			switch (comparator.operator) {
				case ">":
					if (compver.prerelease.length === 0) compver.patch++;
					else compver.prerelease.push(0);
					compver.raw = compver.format();
				case "":
				case ">=":
					if (!minver || gt(minver, compver)) minver = compver;
					break;
				case "<":
				case "<=": break;
				/* istanbul ignore next */
				default: throw new Error("Unexpected operation: " + comparator.operator);
			}
		});
		if (minver && range.test(minver)) return minver;
		return null;
	}
	exports.validRange = validRange;
	function validRange(range, options) {
		try {
			return new Range(range, options).range || "*";
		} catch (er) {
			return null;
		}
	}
	exports.ltr = ltr;
	function ltr(version, range, options) {
		return outside(version, range, "<", options);
	}
	exports.gtr = gtr;
	function gtr(version, range, options) {
		return outside(version, range, ">", options);
	}
	exports.outside = outside;
	function outside(version, range, hilo, options) {
		version = new SemVer(version, options);
		range = new Range(range, options);
		var gtfn, ltefn, ltfn, comp, ecomp;
		switch (hilo) {
			case ">":
				gtfn = gt;
				ltefn = lte;
				ltfn = lt;
				comp = ">";
				ecomp = ">=";
				break;
			case "<":
				gtfn = lt;
				ltefn = gte;
				ltfn = gt;
				comp = "<";
				ecomp = "<=";
				break;
			default: throw new TypeError("Must provide a hilo val of \"<\" or \">\"");
		}
		if (satisfies(version, range, options)) return false;
		for (var i = 0; i < range.set.length; ++i) {
			var comparators = range.set[i];
			var high = null;
			var low = null;
			comparators.forEach(function(comparator) {
				if (comparator.semver === ANY) comparator = new Comparator(">=0.0.0");
				high = high || comparator;
				low = low || comparator;
				if (gtfn(comparator.semver, high.semver, options)) high = comparator;
				else if (ltfn(comparator.semver, low.semver, options)) low = comparator;
			});
			if (high.operator === comp || high.operator === ecomp) return false;
			if ((!low.operator || low.operator === comp) && ltefn(version, low.semver)) return false;
			else if (low.operator === ecomp && ltfn(version, low.semver)) return false;
		}
		return true;
	}
	exports.prerelease = prerelease;
	function prerelease(version, options) {
		var parsed = parse(version, options);
		return parsed && parsed.prerelease.length ? parsed.prerelease : null;
	}
	exports.intersects = intersects;
	function intersects(r1, r2, options) {
		r1 = new Range(r1, options);
		r2 = new Range(r2, options);
		return r1.intersects(r2);
	}
	exports.coerce = coerce;
	function coerce(version, options) {
		if (version instanceof SemVer) return version;
		if (typeof version === "number") version = String(version);
		if (typeof version !== "string") return null;
		options = options || {};
		var match = null;
		if (!options.rtl) match = version.match(safeRe[t.COERCE]);
		else {
			var next;
			while ((next = safeRe[t.COERCERTL].exec(version)) && (!match || match.index + match[0].length !== version.length)) {
				if (!match || next.index + next[0].length !== match.index + match[0].length) match = next;
				safeRe[t.COERCERTL].lastIndex = next.index + next[1].length + next[2].length;
			}
			safeRe[t.COERCERTL].lastIndex = -1;
		}
		if (match === null) return null;
		return parse(match[2] + "." + (match[3] || "0") + "." + (match[4] || "0"), options);
	}
}));
// node_modules/@actions/tool-cache/lib/manifest.js
var require_manifest = /* @__PURE__ */ __commonJSMin(((exports, module, this$3) => {
	var __createBinding = this$3 && this$3.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = this$3 && this$3.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = this$3 && this$3.__importStar || function(mod) {
		if (mod && mod.__esModule) return mod;
		var result = {};
		if (mod != null) {
			for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		}
		__setModuleDefault(result, mod);
		return result;
	};
	var __awaiter = this$3 && this$3.__awaiter || function(thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P ? value : new P(function(resolve) {
				resolve(value);
			});
		}
		return new (P || (P = Promise))(function(resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports._readLinuxVersionFile = exports._getOsVersion = exports._findMatch = void 0;
	const semver = __importStar(require_semver());
	const core_1 = require_core();
	const os = __require("os");
	const cp = __require("child_process");
	const fs = __require("fs");
	function _findMatch(versionSpec, stable, candidates, archFilter) {
		return __awaiter(this, void 0, void 0, function* () {
			const platFilter = os.platform();
			let result;
			let match;
			let file;
			for (const candidate of candidates) {
				const version = candidate.version;
				(0, core_1.debug)(`check ${version} satisfies ${versionSpec}`);
				if (semver.satisfies(version, versionSpec) && (!stable || candidate.stable === stable)) {
					file = candidate.files.find((item) => {
						(0, core_1.debug)(`${item.arch}===${archFilter} && ${item.platform}===${platFilter}`);
						let chk = item.arch === archFilter && item.platform === platFilter;
						if (chk && item.platform_version) {
							const osVersion = module.exports._getOsVersion();
							if (osVersion === item.platform_version) chk = true;
							else chk = semver.satisfies(osVersion, item.platform_version);
						}
						return chk;
					});
					if (file) {
						(0, core_1.debug)(`matched ${candidate.version}`);
						match = candidate;
						break;
					}
				}
			}
			if (match && file) {
				result = Object.assign({}, match);
				result.files = [file];
			}
			return result;
		});
	}
	exports._findMatch = _findMatch;
	function _getOsVersion() {
		const plat = os.platform();
		let version = "";
		if (plat === "darwin") version = cp.execSync("sw_vers -productVersion").toString();
		else if (plat === "linux") {
			const lsbContents = module.exports._readLinuxVersionFile();
			if (lsbContents) {
				const lines = lsbContents.split("\n");
				for (const line of lines) {
					const parts = line.split("=");
					if (parts.length === 2 && (parts[0].trim() === "VERSION_ID" || parts[0].trim() === "DISTRIB_RELEASE")) {
						version = parts[1].trim().replace(/^"/, "").replace(/"$/, "");
						break;
					}
				}
			}
		}
		return version;
	}
	exports._getOsVersion = _getOsVersion;
	function _readLinuxVersionFile() {
		const lsbReleaseFile = "/etc/lsb-release";
		const osReleaseFile = "/etc/os-release";
		let contents = "";
		if (fs.existsSync(lsbReleaseFile)) contents = fs.readFileSync(lsbReleaseFile).toString();
		else if (fs.existsSync(osReleaseFile)) contents = fs.readFileSync(osReleaseFile).toString();
		return contents;
	}
	exports._readLinuxVersionFile = _readLinuxVersionFile;
}));
// node_modules/@actions/tool-cache/lib/retry-helper.js
var require_retry_helper = /* @__PURE__ */ __commonJSMin(((exports, module, this$2) => {
	var __createBinding = this$2 && this$2.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = this$2 && this$2.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = this$2 && this$2.__importStar || function(mod) {
		if (mod && mod.__esModule) return mod;
		var result = {};
		if (mod != null) {
			for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		}
		__setModuleDefault(result, mod);
		return result;
	};
	var __awaiter = this$2 && this$2.__awaiter || function(thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P ? value : new P(function(resolve) {
				resolve(value);
			});
		}
		return new (P || (P = Promise))(function(resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.RetryHelper = void 0;
	const core = __importStar(require_core());
	/**
	* Internal class for retries
	*/
	var RetryHelper = class {
		constructor(maxAttempts, minSeconds, maxSeconds) {
			if (maxAttempts < 1) throw new Error("max attempts should be greater than or equal to 1");
			this.maxAttempts = maxAttempts;
			this.minSeconds = Math.floor(minSeconds);
			this.maxSeconds = Math.floor(maxSeconds);
			if (this.minSeconds > this.maxSeconds) throw new Error("min seconds should be less than or equal to max seconds");
		}
		execute(action, isRetryable) {
			return __awaiter(this, void 0, void 0, function* () {
				let attempt = 1;
				while (attempt < this.maxAttempts) {
					try {
						return yield action();
					} catch (err) {
						if (isRetryable && !isRetryable(err)) throw err;
						core.info(err.message);
					}
					const seconds = this.getSleepAmount();
					core.info(`Waiting ${seconds} seconds before trying again`);
					yield this.sleep(seconds);
					attempt++;
				}
				return yield action();
			});
		}
		getSleepAmount() {
			return Math.floor(Math.random() * (this.maxSeconds - this.minSeconds + 1)) + this.minSeconds;
		}
		sleep(seconds) {
			return __awaiter(this, void 0, void 0, function* () {
				return new Promise((resolve) => setTimeout(resolve, seconds * 1e3));
			});
		}
	};
	exports.RetryHelper = RetryHelper;
}));
// node_modules/@actions/tool-cache/lib/tool-cache.js
var require_tool_cache = /* @__PURE__ */ __commonJSMin(((exports, module, this$1) => {
	var __dirname = import.meta.dirname;
	var __createBinding = this$1 && this$1.__createBinding || (Object.create ? (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		var desc = Object.getOwnPropertyDescriptor(m, k);
		if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
			enumerable: true,
			get: function() {
				return m[k];
			}
		};
		Object.defineProperty(o, k2, desc);
	}) : (function(o, m, k, k2) {
		if (k2 === void 0) k2 = k;
		o[k2] = m[k];
	}));
	var __setModuleDefault = this$1 && this$1.__setModuleDefault || (Object.create ? (function(o, v) {
		Object.defineProperty(o, "default", {
			enumerable: true,
			value: v
		});
	}) : function(o, v) {
		o["default"] = v;
	});
	var __importStar = this$1 && this$1.__importStar || function(mod) {
		if (mod && mod.__esModule) return mod;
		var result = {};
		if (mod != null) {
			for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
		}
		__setModuleDefault(result, mod);
		return result;
	};
	var __awaiter = this$1 && this$1.__awaiter || function(thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P ? value : new P(function(resolve) {
				resolve(value);
			});
		}
		return new (P || (P = Promise))(function(resolve, reject) {
			function fulfilled(value) {
				try {
					step(generator.next(value));
				} catch (e) {
					reject(e);
				}
			}
			function rejected(value) {
				try {
					step(generator["throw"](value));
				} catch (e) {
					reject(e);
				}
			}
			function step(result) {
				result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
			}
			step((generator = generator.apply(thisArg, _arguments || [])).next());
		});
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.evaluateVersions = exports.isExplicitVersion = exports.findFromManifest = exports.getManifestFromRepo = exports.findAllVersions = exports.find = exports.cacheFile = exports.cacheDir = exports.extractZip = exports.extractXar = exports.extractTar = exports.extract7z = exports.downloadTool = exports.HTTPError = void 0;
	const core = __importStar(require_core());
	const io = __importStar(require_io());
	const crypto = __importStar(__require("crypto"));
	const fs = __importStar(__require("fs"));
	const mm = __importStar(require_manifest());
	const os = __importStar(__require("os"));
	const path = __importStar(__require("path"));
	const httpm = __importStar(require_lib());
	const semver = __importStar(require_semver());
	const stream = __importStar(__require("stream"));
	const util = __importStar(__require("util"));
	const assert_1 = __require("assert");
	const exec_1 = require_exec();
	const retry_helper_1 = require_retry_helper();
	var HTTPError = class extends Error {
		constructor(httpStatusCode) {
			super(`Unexpected HTTP response: ${httpStatusCode}`);
			this.httpStatusCode = httpStatusCode;
			Object.setPrototypeOf(this, new.target.prototype);
		}
	};
	exports.HTTPError = HTTPError;
	const IS_WINDOWS = process.platform === "win32";
	const IS_MAC = process.platform === "darwin";
	const userAgent = "actions/tool-cache";
	/**
	* Download a tool from an url and stream it into a file
	*
	* @param url       url of tool to download
	* @param dest      path to download tool
	* @param auth      authorization header
	* @param headers   other headers
	* @returns         path to downloaded tool
	*/
	function downloadTool(url, dest, auth, headers) {
		return __awaiter(this, void 0, void 0, function* () {
			dest = dest || path.join(_getTempDirectory(), crypto.randomUUID());
			yield io.mkdirP(path.dirname(dest));
			core.debug(`Downloading ${url}`);
			core.debug(`Destination ${dest}`);
			const maxAttempts = 3;
			const minSeconds = _getGlobal("TEST_DOWNLOAD_TOOL_RETRY_MIN_SECONDS", 10);
			const maxSeconds = _getGlobal("TEST_DOWNLOAD_TOOL_RETRY_MAX_SECONDS", 20);
			return yield new retry_helper_1.RetryHelper(maxAttempts, minSeconds, maxSeconds).execute(() => __awaiter(this, void 0, void 0, function* () {
				return yield downloadToolAttempt(url, dest || "", auth, headers);
			}), (err) => {
				if (err instanceof HTTPError && err.httpStatusCode) {
					if (err.httpStatusCode < 500 && err.httpStatusCode !== 408 && err.httpStatusCode !== 429) return false;
				}
				return true;
			});
		});
	}
	exports.downloadTool = downloadTool;
	function downloadToolAttempt(url, dest, auth, headers) {
		return __awaiter(this, void 0, void 0, function* () {
			if (fs.existsSync(dest)) throw new Error(`Destination file path ${dest} already exists`);
			const http = new httpm.HttpClient(userAgent, [], { allowRetries: false });
			if (auth) {
				core.debug("set auth");
				if (headers === void 0) headers = {};
				headers.authorization = auth;
			}
			const response = yield http.get(url, headers);
			if (response.message.statusCode !== 200) {
				const err = new HTTPError(response.message.statusCode);
				core.debug(`Failed to download from "${url}". Code(${response.message.statusCode}) Message(${response.message.statusMessage})`);
				throw err;
			}
			const pipeline = util.promisify(stream.pipeline);
			const readStream = _getGlobal("TEST_DOWNLOAD_TOOL_RESPONSE_MESSAGE_FACTORY", () => response.message)();
			let succeeded = false;
			try {
				yield pipeline(readStream, fs.createWriteStream(dest));
				core.debug("download complete");
				succeeded = true;
				return dest;
			} finally {
				if (!succeeded) {
					core.debug("download failed");
					try {
						yield io.rmRF(dest);
					} catch (err) {
						core.debug(`Failed to delete '${dest}'. ${err.message}`);
					}
				}
			}
		});
	}
	/**
	* Extract a .7z file
	*
	* @param file     path to the .7z file
	* @param dest     destination directory. Optional.
	* @param _7zPath  path to 7zr.exe. Optional, for long path support. Most .7z archives do not have this
	* problem. If your .7z archive contains very long paths, you can pass the path to 7zr.exe which will
	* gracefully handle long paths. By default 7zdec.exe is used because it is a very small program and is
	* bundled with the tool lib. However it does not support long paths. 7zr.exe is the reduced command line
	* interface, it is smaller than the full command line interface, and it does support long paths. At the
	* time of this writing, it is freely available from the LZMA SDK that is available on the 7zip website.
	* Be sure to check the current license agreement. If 7zr.exe is bundled with your action, then the path
	* to 7zr.exe can be pass to this function.
	* @returns        path to the destination directory
	*/
	function extract7z(file, dest, _7zPath) {
		return __awaiter(this, void 0, void 0, function* () {
			(0, assert_1.ok)(IS_WINDOWS, "extract7z() not supported on current OS");
			(0, assert_1.ok)(file, "parameter \"file\" is required");
			dest = yield _createExtractFolder(dest);
			const originalCwd = process.cwd();
			process.chdir(dest);
			if (_7zPath) try {
				const args = [
					"x",
					core.isDebug() ? "-bb1" : "-bb0",
					"-bd",
					"-sccUTF-8",
					file
				];
				yield (0, exec_1.exec)(`"${_7zPath}"`, args, { silent: true });
			} finally {
				process.chdir(originalCwd);
			}
			else {
				const args = [
					"-NoLogo",
					"-Sta",
					"-NoProfile",
					"-NonInteractive",
					"-ExecutionPolicy",
					"Unrestricted",
					"-Command",
					`& '${path.join(__dirname, "..", "scripts", "Invoke-7zdec.ps1").replace(/'/g, "''").replace(/"|\n|\r/g, "")}' -Source '${file.replace(/'/g, "''").replace(/"|\n|\r/g, "")}' -Target '${dest.replace(/'/g, "''").replace(/"|\n|\r/g, "")}'`
				];
				const options = { silent: true };
				try {
					const powershellPath = yield io.which("powershell", true);
					yield (0, exec_1.exec)(`"${powershellPath}"`, args, options);
				} finally {
					process.chdir(originalCwd);
				}
			}
			return dest;
		});
	}
	exports.extract7z = extract7z;
	/**
	* Extract a compressed tar archive
	*
	* @param file     path to the tar
	* @param dest     destination directory. Optional.
	* @param flags    flags for the tar command to use for extraction. Defaults to 'xz' (extracting gzipped tars). Optional.
	* @returns        path to the destination directory
	*/
	function extractTar(file, dest, flags = "xz") {
		return __awaiter(this, void 0, void 0, function* () {
			if (!file) throw new Error("parameter 'file' is required");
			dest = yield _createExtractFolder(dest);
			core.debug("Checking tar --version");
			let versionOutput = "";
			yield (0, exec_1.exec)("tar --version", [], {
				ignoreReturnCode: true,
				silent: true,
				listeners: {
					stdout: (data) => versionOutput += data.toString(),
					stderr: (data) => versionOutput += data.toString()
				}
			});
			core.debug(versionOutput.trim());
			const isGnuTar = versionOutput.toUpperCase().includes("GNU TAR");
			let args;
			if (flags instanceof Array) args = flags;
			else args = [flags];
			if (core.isDebug() && !flags.includes("v")) args.push("-v");
			let destArg = dest;
			let fileArg = file;
			if (IS_WINDOWS && isGnuTar) {
				args.push("--force-local");
				destArg = dest.replace(/\\/g, "/");
				fileArg = file.replace(/\\/g, "/");
			}
			if (isGnuTar) {
				args.push("--warning=no-unknown-keyword");
				args.push("--overwrite");
			}
			args.push("-C", destArg, "-f", fileArg);
			yield (0, exec_1.exec)(`tar`, args);
			return dest;
		});
	}
	exports.extractTar = extractTar;
	/**
	* Extract a xar compatible archive
	*
	* @param file     path to the archive
	* @param dest     destination directory. Optional.
	* @param flags    flags for the xar. Optional.
	* @returns        path to the destination directory
	*/
	function extractXar(file, dest, flags = []) {
		return __awaiter(this, void 0, void 0, function* () {
			(0, assert_1.ok)(IS_MAC, "extractXar() not supported on current OS");
			(0, assert_1.ok)(file, "parameter \"file\" is required");
			dest = yield _createExtractFolder(dest);
			let args;
			if (flags instanceof Array) args = flags;
			else args = [flags];
			args.push("-x", "-C", dest, "-f", file);
			if (core.isDebug()) args.push("-v");
			const xarPath = yield io.which("xar", true);
			yield (0, exec_1.exec)(`"${xarPath}"`, _unique(args));
			return dest;
		});
	}
	exports.extractXar = extractXar;
	/**
	* Extract a zip
	*
	* @param file     path to the zip
	* @param dest     destination directory. Optional.
	* @returns        path to the destination directory
	*/
	function extractZip(file, dest) {
		return __awaiter(this, void 0, void 0, function* () {
			if (!file) throw new Error("parameter 'file' is required");
			dest = yield _createExtractFolder(dest);
			if (IS_WINDOWS) yield extractZipWin(file, dest);
			else yield extractZipNix(file, dest);
			return dest;
		});
	}
	exports.extractZip = extractZip;
	function extractZipWin(file, dest) {
		return __awaiter(this, void 0, void 0, function* () {
			const escapedFile = file.replace(/'/g, "''").replace(/"|\n|\r/g, "");
			const escapedDest = dest.replace(/'/g, "''").replace(/"|\n|\r/g, "");
			const pwshPath = yield io.which("pwsh", false);
			if (pwshPath) {
				const args = [
					"-NoLogo",
					"-NoProfile",
					"-NonInteractive",
					"-ExecutionPolicy",
					"Unrestricted",
					"-Command",
					[
						`$ErrorActionPreference = 'Stop' ;`,
						`try { Add-Type -AssemblyName System.IO.Compression.ZipFile } catch { } ;`,
						`try { [System.IO.Compression.ZipFile]::ExtractToDirectory('${escapedFile}', '${escapedDest}', $true) }`,
						`catch { if (($_.Exception.GetType().FullName -eq 'System.Management.Automation.MethodException') -or ($_.Exception.GetType().FullName -eq 'System.Management.Automation.RuntimeException') ){ Expand-Archive -LiteralPath '${escapedFile}' -DestinationPath '${escapedDest}' -Force } else { throw $_ } } ;`
					].join(" ")
				];
				core.debug(`Using pwsh at path: ${pwshPath}`);
				yield (0, exec_1.exec)(`"${pwshPath}"`, args);
			} else {
				const args = [
					"-NoLogo",
					"-Sta",
					"-NoProfile",
					"-NonInteractive",
					"-ExecutionPolicy",
					"Unrestricted",
					"-Command",
					[
						`$ErrorActionPreference = 'Stop' ;`,
						`try { Add-Type -AssemblyName System.IO.Compression.FileSystem } catch { } ;`,
						`if ((Get-Command -Name Expand-Archive -Module Microsoft.PowerShell.Archive -ErrorAction Ignore)) { Expand-Archive -LiteralPath '${escapedFile}' -DestinationPath '${escapedDest}' -Force }`,
						`else {[System.IO.Compression.ZipFile]::ExtractToDirectory('${escapedFile}', '${escapedDest}', $true) }`
					].join(" ")
				];
				const powershellPath = yield io.which("powershell", true);
				core.debug(`Using powershell at path: ${powershellPath}`);
				yield (0, exec_1.exec)(`"${powershellPath}"`, args);
			}
		});
	}
	function extractZipNix(file, dest) {
		return __awaiter(this, void 0, void 0, function* () {
			const unzipPath = yield io.which("unzip", true);
			const args = [file];
			if (!core.isDebug()) args.unshift("-q");
			args.unshift("-o");
			yield (0, exec_1.exec)(`"${unzipPath}"`, args, { cwd: dest });
		});
	}
	/**
	* Caches a directory and installs it into the tool cacheDir
	*
	* @param sourceDir    the directory to cache into tools
	* @param tool          tool name
	* @param version       version of the tool.  semver format
	* @param arch          architecture of the tool.  Optional.  Defaults to machine architecture
	*/
	function cacheDir(sourceDir, tool, version, arch) {
		return __awaiter(this, void 0, void 0, function* () {
			version = semver.clean(version) || version;
			arch = arch || os.arch();
			core.debug(`Caching tool ${tool} ${version} ${arch}`);
			core.debug(`source dir: ${sourceDir}`);
			if (!fs.statSync(sourceDir).isDirectory()) throw new Error("sourceDir is not a directory");
			const destPath = yield _createToolPath(tool, version, arch);
			for (const itemName of fs.readdirSync(sourceDir)) {
				const s = path.join(sourceDir, itemName);
				yield io.cp(s, destPath, { recursive: true });
			}
			_completeToolPath(tool, version, arch);
			return destPath;
		});
	}
	exports.cacheDir = cacheDir;
	/**
	* Caches a downloaded file (GUID) and installs it
	* into the tool cache with a given targetName
	*
	* @param sourceFile    the file to cache into tools.  Typically a result of downloadTool which is a guid.
	* @param targetFile    the name of the file name in the tools directory
	* @param tool          tool name
	* @param version       version of the tool.  semver format
	* @param arch          architecture of the tool.  Optional.  Defaults to machine architecture
	*/
	function cacheFile(sourceFile, targetFile, tool, version, arch) {
		return __awaiter(this, void 0, void 0, function* () {
			version = semver.clean(version) || version;
			arch = arch || os.arch();
			core.debug(`Caching tool ${tool} ${version} ${arch}`);
			core.debug(`source file: ${sourceFile}`);
			if (!fs.statSync(sourceFile).isFile()) throw new Error("sourceFile is not a file");
			const destFolder = yield _createToolPath(tool, version, arch);
			const destPath = path.join(destFolder, targetFile);
			core.debug(`destination file ${destPath}`);
			yield io.cp(sourceFile, destPath);
			_completeToolPath(tool, version, arch);
			return destFolder;
		});
	}
	exports.cacheFile = cacheFile;
	/**
	* Finds the path to a tool version in the local installed tool cache
	*
	* @param toolName      name of the tool
	* @param versionSpec   version of the tool
	* @param arch          optional arch.  defaults to arch of computer
	*/
	function find(toolName, versionSpec, arch) {
		if (!toolName) throw new Error("toolName parameter is required");
		if (!versionSpec) throw new Error("versionSpec parameter is required");
		arch = arch || os.arch();
		if (!isExplicitVersion(versionSpec)) versionSpec = evaluateVersions(findAllVersions(toolName, arch), versionSpec);
		let toolPath = "";
		if (versionSpec) {
			versionSpec = semver.clean(versionSpec) || "";
			const cachePath = path.join(_getCacheDirectory(), toolName, versionSpec, arch);
			core.debug(`checking cache: ${cachePath}`);
			if (fs.existsSync(cachePath) && fs.existsSync(`${cachePath}.complete`)) {
				core.debug(`Found tool in cache ${toolName} ${versionSpec} ${arch}`);
				toolPath = cachePath;
			} else core.debug("not found");
		}
		return toolPath;
	}
	exports.find = find;
	/**
	* Finds the paths to all versions of a tool that are installed in the local tool cache
	*
	* @param toolName  name of the tool
	* @param arch      optional arch.  defaults to arch of computer
	*/
	function findAllVersions(toolName, arch) {
		const versions = [];
		arch = arch || os.arch();
		const toolPath = path.join(_getCacheDirectory(), toolName);
		if (fs.existsSync(toolPath)) {
			const children = fs.readdirSync(toolPath);
			for (const child of children) if (isExplicitVersion(child)) {
				const fullPath = path.join(toolPath, child, arch || "");
				if (fs.existsSync(fullPath) && fs.existsSync(`${fullPath}.complete`)) versions.push(child);
			}
		}
		return versions;
	}
	exports.findAllVersions = findAllVersions;
	function getManifestFromRepo(owner, repo, auth, branch = "master") {
		return __awaiter(this, void 0, void 0, function* () {
			let releases = [];
			const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}`;
			const http = new httpm.HttpClient("tool-cache");
			const headers = {};
			if (auth) {
				core.debug("set auth");
				headers.authorization = auth;
			}
			const response = yield http.getJson(treeUrl, headers);
			if (!response.result) return releases;
			let manifestUrl = "";
			for (const item of response.result.tree) if (item.path === "versions-manifest.json") {
				manifestUrl = item.url;
				break;
			}
			headers["accept"] = "application/vnd.github.VERSION.raw";
			let versionsRaw = yield (yield http.get(manifestUrl, headers)).readBody();
			if (versionsRaw) {
				versionsRaw = versionsRaw.replace(/^\uFEFF/, "");
				try {
					releases = JSON.parse(versionsRaw);
				} catch (_a) {
					core.debug("Invalid json");
				}
			}
			return releases;
		});
	}
	exports.getManifestFromRepo = getManifestFromRepo;
	function findFromManifest(versionSpec, stable, manifest, archFilter = os.arch()) {
		return __awaiter(this, void 0, void 0, function* () {
			return yield mm._findMatch(versionSpec, stable, manifest, archFilter);
		});
	}
	exports.findFromManifest = findFromManifest;
	function _createExtractFolder(dest) {
		return __awaiter(this, void 0, void 0, function* () {
			if (!dest) dest = path.join(_getTempDirectory(), crypto.randomUUID());
			yield io.mkdirP(dest);
			return dest;
		});
	}
	function _createToolPath(tool, version, arch) {
		return __awaiter(this, void 0, void 0, function* () {
			const folderPath = path.join(_getCacheDirectory(), tool, semver.clean(version) || version, arch || "");
			core.debug(`destination ${folderPath}`);
			const markerPath = `${folderPath}.complete`;
			yield io.rmRF(folderPath);
			yield io.rmRF(markerPath);
			yield io.mkdirP(folderPath);
			return folderPath;
		});
	}
	function _completeToolPath(tool, version, arch) {
		const markerPath = `${path.join(_getCacheDirectory(), tool, semver.clean(version) || version, arch || "")}.complete`;
		fs.writeFileSync(markerPath, "");
		core.debug("finished caching tool");
	}
	/**
	* Check if version string is explicit
	*
	* @param versionSpec      version string to check
	*/
	function isExplicitVersion(versionSpec) {
		const c = semver.clean(versionSpec) || "";
		core.debug(`isExplicit: ${c}`);
		const valid = semver.valid(c) != null;
		core.debug(`explicit? ${valid}`);
		return valid;
	}
	exports.isExplicitVersion = isExplicitVersion;
	/**
	* Get the highest satisfiying semantic version in `versions` which satisfies `versionSpec`
	*
	* @param versions        array of versions to evaluate
	* @param versionSpec     semantic version spec to satisfy
	*/
	function evaluateVersions(versions, versionSpec) {
		let version = "";
		core.debug(`evaluating ${versions.length} versions`);
		versions = versions.sort((a, b) => {
			if (semver.gt(a, b)) return 1;
			return -1;
		});
		for (let i = versions.length - 1; i >= 0; i--) {
			const potential = versions[i];
			if (semver.satisfies(potential, versionSpec)) {
				version = potential;
				break;
			}
		}
		if (version) core.debug(`matched: ${version}`);
		else core.debug("match not found");
		return version;
	}
	exports.evaluateVersions = evaluateVersions;
	/**
	* Gets RUNNER_TOOL_CACHE
	*/
	function _getCacheDirectory() {
		const cacheDirectory = process.env["RUNNER_TOOL_CACHE"] || "";
		(0, assert_1.ok)(cacheDirectory, "Expected RUNNER_TOOL_CACHE to be defined");
		return cacheDirectory;
	}
	/**
	* Gets RUNNER_TEMP
	*/
	function _getTempDirectory() {
		const tempDirectory = process.env["RUNNER_TEMP"] || "";
		(0, assert_1.ok)(tempDirectory, "Expected RUNNER_TEMP to be defined");
		return tempDirectory;
	}
	/**
	* Gets a global variable
	*/
	function _getGlobal(key, defaultValue) {
		const value = global[key];
		return value !== void 0 ? value : defaultValue;
	}
	/**
	* Returns an array of unique values.
	* @param values Values to make unique.
	*/
	function _unique(values) {
		return Array.from(new Set(values));
	}
}));
// src/setup-node/index.ts
var import_core = /* @__PURE__ */ __toESM(require_core$1(), 1);
var import_tool_cache = /* @__PURE__ */ __toESM(require_tool_cache(), 1);
runAction("Setup Node Workspace", async () => {
	const inputs = getInputs({
		"node-version": { default: "24" },
		"working-directory": { default: "." },
		install: {
			type: "boolean",
			default: true
		}
	});
	const cwd = resolve(inputs["working-directory"]);
	logger.banner("Setup Node Workspace", `Node ${inputs["node-version"]} · ${cwd}`);
	await logger.step("Verify Node.js runtime", async () => {
		const cachedPath = import_tool_cache.find("node", inputs["node-version"]);
		if (cachedPath) {
			import_core.addPath(join(cachedPath, "bin"));
			logger.item("Tool cache", cachedPath);
		}
		const versionRes = await cmd("node -v").cwd(cwd).nothrow();
		const npmRes = await cmd("npm -v").cwd(cwd).nothrow();
		logger.item("Node active", versionRes.stdout || "unknown");
		logger.item("npm active", npmRes.stdout || "unknown", true);
		setOutputs({ "node-version": versionRes.stdout.replace(/^v/, "") });
	});
	if (inputs.install) await logger.step("Install workspace dependencies", async () => {
		const hasLockfile = existsSync(join(cwd, "package-lock.json"));
		const installCmd = hasLockfile ? "npm ci --no-audit --no-fund" : "npm install --no-audit --no-fund";
		logger.item("Strategy", hasLockfile ? "npm ci (lockfile found)" : "npm install");
		logger.item("Directory", cwd, true);
		await cmd(installCmd).cwd(cwd).spin(`Installing dependencies in ${inputs["working-directory"]}`);
	});
	else logger.info("Dependency installation skipped (install=false)");
	logger.success(`Node workspace ready at ${style.bold(cwd)}`);
	logger.divider("", "═");
});
export {};
