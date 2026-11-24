import { r as __toESM, t as __commonJSMin } from "./rolldown-runtime-DegdyBIC.js";
import { a as style, i as logger, n as setOutputs, o as require_core, r as runAction, t as getInputs } from "./inputs-BuTruFqa.js";
import { createPrivateKey, subtle } from "node:crypto";
// node_modules/@octokit/auth-app/node_modules/universal-user-agent/index.js
var import_core = /* @__PURE__ */ __toESM(require_core(), 1);
function getUserAgent$5() {
	if (typeof navigator === "object" && "userAgent" in navigator) return navigator.userAgent;
	if (typeof process === "object" && process.version !== void 0) return `Node.js/${process.version.substr(1)} (${process.platform}; ${process.arch})`;
	return "<environment undetectable>";
}
// node_modules/@octokit/endpoint/node_modules/universal-user-agent/index.js
function getUserAgent$4() {
	if (typeof navigator === "object" && "userAgent" in navigator) return navigator.userAgent;
	if (typeof process === "object" && process.version !== void 0) return `Node.js/${process.version.substr(1)} (${process.platform}; ${process.arch})`;
	return "<environment undetectable>";
}
// node_modules/@octokit/endpoint/dist-bundle/index.js
var DEFAULTS = {
	method: "GET",
	baseUrl: "https://api.github.com",
	headers: {
		accept: "application/vnd.github.v3+json",
		"user-agent": `octokit-endpoint.js/0.0.0-development ${getUserAgent$4()}`
	},
	mediaType: { format: "" }
};
function lowercaseKeys(object) {
	if (!object) return {};
	return Object.keys(object).reduce((newObj, key) => {
		newObj[key.toLowerCase()] = object[key];
		return newObj;
	}, {});
}
function isPlainObject$1(value) {
	if (typeof value !== "object" || value === null) return false;
	if (Object.prototype.toString.call(value) !== "[object Object]") return false;
	const proto = Object.getPrototypeOf(value);
	if (proto === null) return true;
	const Ctor = Object.prototype.hasOwnProperty.call(proto, "constructor") && proto.constructor;
	return typeof Ctor === "function" && Ctor instanceof Ctor && Function.prototype.call(Ctor) === Function.prototype.call(value);
}
function mergeDeep(defaults, options) {
	const result = Object.assign({}, defaults);
	Object.keys(options).forEach((key) => {
		if (isPlainObject$1(options[key])) {
			if (!(key in defaults)) Object.assign(result, { [key]: options[key] });
			else result[key] = mergeDeep(defaults[key], options[key]);
		} else Object.assign(result, { [key]: options[key] });
	});
	return result;
}
function removeUndefinedProperties(obj) {
	for (const key in obj) if (obj[key] === void 0) delete obj[key];
	return obj;
}
function merge(defaults, route, options) {
	if (typeof route === "string") {
		let [method, url] = route.split(" ");
		options = Object.assign(url ? {
			method,
			url
		} : { url: method }, options);
	} else options = Object.assign({}, route);
	options.headers = lowercaseKeys(options.headers);
	removeUndefinedProperties(options);
	removeUndefinedProperties(options.headers);
	const mergedOptions = mergeDeep(defaults || {}, options);
	if (options.url === "/graphql") {
		if (defaults && defaults.mediaType.previews?.length) mergedOptions.mediaType.previews = defaults.mediaType.previews.filter((preview) => !mergedOptions.mediaType.previews.includes(preview)).concat(mergedOptions.mediaType.previews);
		mergedOptions.mediaType.previews = (mergedOptions.mediaType.previews || []).map((preview) => preview.replace(/-preview/, ""));
	}
	return mergedOptions;
}
function addQueryParameters(url, parameters) {
	const separator = /\?/.test(url) ? "&" : "?";
	const names = Object.keys(parameters);
	if (names.length === 0) return url;
	return url + separator + names.map((name) => {
		if (name === "q") return "q=" + parameters.q.split("+").map(encodeURIComponent).join("+");
		return `${name}=${encodeURIComponent(parameters[name])}`;
	}).join("&");
}
var urlVariableRegex = /\{[^{}}]+\}/g;
function removeNonChars(variableName) {
	return variableName.replace(/(?:^\W+)|(?:(?<!\W)\W+$)/g, "").split(/,/);
}
function extractUrlVariableNames(url) {
	const matches = url.match(urlVariableRegex);
	if (!matches) return [];
	return matches.map(removeNonChars).reduce((a, b) => a.concat(b), []);
}
function omit(object, keysToOmit) {
	const result = { __proto__: null };
	for (const key of Object.keys(object)) if (keysToOmit.indexOf(key) === -1) result[key] = object[key];
	return result;
}
function encodeReserved(str) {
	return str.split(/(%[0-9A-Fa-f]{2})/g).map(function(part) {
		if (!/%[0-9A-Fa-f]/.test(part)) part = encodeURI(part).replace(/%5B/g, "[").replace(/%5D/g, "]");
		return part;
	}).join("");
}
function encodeUnreserved(str) {
	return encodeURIComponent(str).replace(/[!'()*]/g, function(c) {
		return "%" + c.charCodeAt(0).toString(16).toUpperCase();
	});
}
function encodeValue(operator, value, key) {
	value = operator === "+" || operator === "#" ? encodeReserved(value) : encodeUnreserved(value);
	if (key) return encodeUnreserved(key) + "=" + value;
	else return value;
}
function isDefined(value) {
	return value !== void 0 && value !== null;
}
function isKeyOperator(operator) {
	return operator === ";" || operator === "&" || operator === "?";
}
function getValues(context, operator, key, modifier) {
	var value = context[key], result = [];
	if (isDefined(value) && value !== "") {
		if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
			value = value.toString();
			if (modifier && modifier !== "*") value = value.substring(0, parseInt(modifier, 10));
			result.push(encodeValue(operator, value, isKeyOperator(operator) ? key : ""));
		} else if (modifier === "*") {
			if (Array.isArray(value)) value.filter(isDefined).forEach(function(value2) {
				result.push(encodeValue(operator, value2, isKeyOperator(operator) ? key : ""));
			});
			else Object.keys(value).forEach(function(k) {
				if (isDefined(value[k])) result.push(encodeValue(operator, value[k], k));
			});
		} else {
			const tmp = [];
			if (Array.isArray(value)) value.filter(isDefined).forEach(function(value2) {
				tmp.push(encodeValue(operator, value2));
			});
			else Object.keys(value).forEach(function(k) {
				if (isDefined(value[k])) {
					tmp.push(encodeUnreserved(k));
					tmp.push(encodeValue(operator, value[k].toString()));
				}
			});
			if (isKeyOperator(operator)) result.push(encodeUnreserved(key) + "=" + tmp.join(","));
			else if (tmp.length !== 0) result.push(tmp.join(","));
		}
	} else if (operator === ";") {
		if (isDefined(value)) result.push(encodeUnreserved(key));
	} else if (value === "" && (operator === "&" || operator === "?")) result.push(encodeUnreserved(key) + "=");
	else if (value === "") result.push("");
	return result;
}
function parseUrl(template) {
	return { expand: expand.bind(null, template) };
}
function expand(template, context) {
	var operators = [
		"+",
		"#",
		".",
		"/",
		";",
		"?",
		"&"
	];
	template = template.replace(/\{([^\{\}]+)\}|([^\{\}]+)/g, function(_, expression, literal) {
		if (expression) {
			let operator = "";
			const values = [];
			if (operators.indexOf(expression.charAt(0)) !== -1) {
				operator = expression.charAt(0);
				expression = expression.substr(1);
			}
			expression.split(/,/g).forEach(function(variable) {
				var tmp = /([^:\*]*)(?::(\d+)|(\*))?/.exec(variable);
				values.push(getValues(context, operator, tmp[1], tmp[2] || tmp[3]));
			});
			if (operator && operator !== "+") {
				var separator = ",";
				if (operator === "?") separator = "&";
				else if (operator !== "#") separator = operator;
				return (values.length !== 0 ? operator : "") + values.join(separator);
			} else return values.join(",");
		} else return encodeReserved(literal);
	});
	if (template === "/") return template;
	else return template.replace(/\/$/, "");
}
function parse(options) {
	let method = options.method.toUpperCase();
	let url = (options.url || "/").replace(/:([a-z]\w+)/g, "{$1}");
	let headers = Object.assign({}, options.headers);
	let body;
	let parameters = omit(options, [
		"method",
		"baseUrl",
		"url",
		"headers",
		"request",
		"mediaType"
	]);
	const urlVariableNames = extractUrlVariableNames(url);
	url = parseUrl(url).expand(parameters);
	if (!/^http/.test(url)) url = options.baseUrl + url;
	const remainingParameters = omit(parameters, Object.keys(options).filter((option) => urlVariableNames.includes(option)).concat("baseUrl"));
	if (!/application\/octet-stream/i.test(headers.accept)) {
		if (options.mediaType.format) headers.accept = headers.accept.split(/,/).map((format) => format.replace(/application\/vnd(\.\w+)(\.v3)?(\.\w+)?(\+json)?$/, `application/vnd$1$2.${options.mediaType.format}`)).join(",");
		if (url.endsWith("/graphql")) {
			if (options.mediaType.previews?.length) headers.accept = (headers.accept.match(/(?<![\w-])[\w-]+(?=-preview)/g) || []).concat(options.mediaType.previews).map((preview) => {
				return `application/vnd.github.${preview}-preview${options.mediaType.format ? `.${options.mediaType.format}` : "+json"}`;
			}).join(",");
		}
	}
	if (["GET", "HEAD"].includes(method)) url = addQueryParameters(url, remainingParameters);
	else if ("data" in remainingParameters) body = remainingParameters.data;
	else if (Object.keys(remainingParameters).length) body = remainingParameters;
	if (!headers["content-type"] && typeof body !== "undefined") headers["content-type"] = "application/json; charset=utf-8";
	if (["PATCH", "PUT"].includes(method) && typeof body === "undefined") body = "";
	return Object.assign({
		method,
		url,
		headers
	}, typeof body !== "undefined" ? { body } : null, options.request ? { request: options.request } : null);
}
function endpointWithDefaults(defaults, route, options) {
	return parse(merge(defaults, route, options));
}
function withDefaults$1(oldDefaults, newDefaults) {
	const DEFAULTS2 = merge(oldDefaults, newDefaults);
	const endpoint2 = endpointWithDefaults.bind(null, DEFAULTS2);
	return Object.assign(endpoint2, {
		DEFAULTS: DEFAULTS2,
		defaults: withDefaults$1.bind(null, DEFAULTS2),
		merge: merge.bind(null, DEFAULTS2),
		parse
	});
}
var endpoint = withDefaults$1(null, DEFAULTS);
// node_modules/@octokit/request/node_modules/universal-user-agent/index.js
function getUserAgent$3() {
	if (typeof navigator === "object" && "userAgent" in navigator) return navigator.userAgent;
	if (typeof process === "object" && process.version !== void 0) return `Node.js/${process.version.substr(1)} (${process.platform}; ${process.arch})`;
	return "<environment undetectable>";
}
// node_modules/@octokit/request/node_modules/@octokit/request-error/dist-src/index.js
var import_fast_content_type_parse = (/* @__PURE__ */ __commonJSMin(((exports, module) => {
	const NullObject = function NullObject() {};
	NullObject.prototype = Object.create(null);
	/**
	* RegExp to match *( ";" parameter ) in RFC 7231 sec 3.1.1.1
	*
	* parameter     = token "=" ( token / quoted-string )
	* token         = 1*tchar
	* tchar         = "!" / "#" / "$" / "%" / "&" / "'" / "*"
	*               / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~"
	*               / DIGIT / ALPHA
	*               ; any VCHAR, except delimiters
	* quoted-string = DQUOTE *( qdtext / quoted-pair ) DQUOTE
	* qdtext        = HTAB / SP / %x21 / %x23-5B / %x5D-7E / obs-text
	* obs-text      = %x80-FF
	* quoted-pair   = "\" ( HTAB / SP / VCHAR / obs-text )
	*/
	const paramRE = /; *([!#$%&'*+.^\w`|~-]+)=("(?:[\v\u0020\u0021\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\v\u0020-\u00ff])*"|[!#$%&'*+.^\w`|~-]+) */gu;
	/**
	* RegExp to match quoted-pair in RFC 7230 sec 3.2.6
	*
	* quoted-pair = "\" ( HTAB / SP / VCHAR / obs-text )
	* obs-text    = %x80-FF
	*/
	const quotedPairRE = /\\([\v\u0020-\u00ff])/gu;
	/**
	* RegExp to match type in RFC 7231 sec 3.1.1.1
	*
	* media-type = type "/" subtype
	* type       = token
	* subtype    = token
	*/
	const mediaTypeRE = /^[!#$%&'*+.^\w|~-]+\/[!#$%&'*+.^\w|~-]+$/u;
	const defaultContentType = {
		type: "",
		parameters: new NullObject()
	};
	Object.freeze(defaultContentType.parameters);
	Object.freeze(defaultContentType);
	/**
	* Parse media type to object.
	*
	* @param {string|object} header
	* @return {Object}
	* @public
	*/
	function parse(header) {
		if (typeof header !== "string") throw new TypeError("argument header is required and must be a string");
		let index = header.indexOf(";");
		const type = index !== -1 ? header.slice(0, index).trim() : header.trim();
		if (mediaTypeRE.test(type) === false) throw new TypeError("invalid media type");
		const result = {
			type: type.toLowerCase(),
			parameters: new NullObject()
		};
		if (index === -1) return result;
		let key;
		let match;
		let value;
		paramRE.lastIndex = index;
		while (match = paramRE.exec(header)) {
			if (match.index !== index) throw new TypeError("invalid parameter format");
			index += match[0].length;
			key = match[1].toLowerCase();
			value = match[2];
			if (value[0] === "\"") {
				value = value.slice(1, value.length - 1);
				quotedPairRE.test(value) && (value = value.replace(quotedPairRE, "$1"));
			}
			result.parameters[key] = value;
		}
		if (index !== header.length) throw new TypeError("invalid parameter format");
		return result;
	}
	function safeParse(header) {
		if (typeof header !== "string") return defaultContentType;
		let index = header.indexOf(";");
		const type = index !== -1 ? header.slice(0, index).trim() : header.trim();
		if (mediaTypeRE.test(type) === false) return defaultContentType;
		const result = {
			type: type.toLowerCase(),
			parameters: new NullObject()
		};
		if (index === -1) return result;
		let key;
		let match;
		let value;
		paramRE.lastIndex = index;
		while (match = paramRE.exec(header)) {
			if (match.index !== index) return defaultContentType;
			index += match[0].length;
			key = match[1].toLowerCase();
			value = match[2];
			if (value[0] === "\"") {
				value = value.slice(1, value.length - 1);
				quotedPairRE.test(value) && (value = value.replace(quotedPairRE, "$1"));
			}
			result.parameters[key] = value;
		}
		if (index !== header.length) return defaultContentType;
		return result;
	}
	module.exports.default = {
		parse,
		safeParse
	};
	module.exports.parse = parse;
	module.exports.safeParse = safeParse;
	module.exports.defaultContentType = defaultContentType;
})))();
var RequestError$1 = class extends Error {
	name;
	/**
	* http status code
	*/
	status;
	/**
	* Request options that lead to the error.
	*/
	request;
	/**
	* Response object if a response was received
	*/
	response;
	constructor(message, statusCode, options) {
		super(message);
		this.name = "HttpError";
		this.status = Number.parseInt(statusCode);
		if (Number.isNaN(this.status)) this.status = 0;
		if ("response" in options) this.response = options.response;
		const requestCopy = Object.assign({}, options.request);
		if (options.request.headers.authorization) requestCopy.headers = Object.assign({}, options.request.headers, { authorization: options.request.headers.authorization.replace(/(?<! ) .*$/, " [REDACTED]") });
		requestCopy.url = requestCopy.url.replace(/\bclient_secret=\w+/g, "client_secret=[REDACTED]").replace(/\baccess_token=\w+/g, "access_token=[REDACTED]");
		this.request = requestCopy;
	}
};
// node_modules/@octokit/request/dist-bundle/index.js
var defaults_default = { headers: { "user-agent": `octokit-request.js/9.2.4 ${getUserAgent$3()}` } };
function isPlainObject(value) {
	if (typeof value !== "object" || value === null) return false;
	if (Object.prototype.toString.call(value) !== "[object Object]") return false;
	const proto = Object.getPrototypeOf(value);
	if (proto === null) return true;
	const Ctor = Object.prototype.hasOwnProperty.call(proto, "constructor") && proto.constructor;
	return typeof Ctor === "function" && Ctor instanceof Ctor && Function.prototype.call(Ctor) === Function.prototype.call(value);
}
async function fetchWrapper(requestOptions) {
	const fetch = requestOptions.request?.fetch || globalThis.fetch;
	if (!fetch) throw new Error("fetch is not set. Please pass a fetch implementation as new Octokit({ request: { fetch }}). Learn more at https://github.com/octokit/octokit.js/#fetch-missing");
	const log = requestOptions.request?.log || console;
	const parseSuccessResponseBody = requestOptions.request?.parseSuccessResponseBody !== false;
	const body = isPlainObject(requestOptions.body) || Array.isArray(requestOptions.body) ? JSON.stringify(requestOptions.body) : requestOptions.body;
	const requestHeaders = Object.fromEntries(Object.entries(requestOptions.headers).map(([name, value]) => [name, String(value)]));
	let fetchResponse;
	try {
		fetchResponse = await fetch(requestOptions.url, {
			method: requestOptions.method,
			body,
			redirect: requestOptions.request?.redirect,
			headers: requestHeaders,
			signal: requestOptions.request?.signal,
			...requestOptions.body && { duplex: "half" }
		});
	} catch (error) {
		let message = "Unknown Error";
		if (error instanceof Error) {
			if (error.name === "AbortError") {
				error.status = 500;
				throw error;
			}
			message = error.message;
			if (error.name === "TypeError" && "cause" in error) {
				if (error.cause instanceof Error) message = error.cause.message;
				else if (typeof error.cause === "string") message = error.cause;
			}
		}
		const requestError = new RequestError$1(message, 500, { request: requestOptions });
		requestError.cause = error;
		throw requestError;
	}
	const status = fetchResponse.status;
	const url = fetchResponse.url;
	const responseHeaders = {};
	for (const [key, value] of fetchResponse.headers) responseHeaders[key] = value;
	const octokitResponse = {
		url,
		status,
		headers: responseHeaders,
		data: ""
	};
	if ("deprecation" in responseHeaders) {
		const matches = responseHeaders.link && responseHeaders.link.match(/<([^<>]+)>; rel="deprecation"/);
		const deprecationLink = matches && matches.pop();
		log.warn(`[@octokit/request] "${requestOptions.method} ${requestOptions.url}" is deprecated. It is scheduled to be removed on ${responseHeaders.sunset}${deprecationLink ? `. See ${deprecationLink}` : ""}`);
	}
	if (status === 204 || status === 205) return octokitResponse;
	if (requestOptions.method === "HEAD") {
		if (status < 400) return octokitResponse;
		throw new RequestError$1(fetchResponse.statusText, status, {
			response: octokitResponse,
			request: requestOptions
		});
	}
	if (status === 304) {
		octokitResponse.data = await getResponseData(fetchResponse);
		throw new RequestError$1("Not modified", status, {
			response: octokitResponse,
			request: requestOptions
		});
	}
	if (status >= 400) {
		octokitResponse.data = await getResponseData(fetchResponse);
		throw new RequestError$1(toErrorMessage(octokitResponse.data), status, {
			response: octokitResponse,
			request: requestOptions
		});
	}
	octokitResponse.data = parseSuccessResponseBody ? await getResponseData(fetchResponse) : fetchResponse.body;
	return octokitResponse;
}
async function getResponseData(response) {
	const contentType = response.headers.get("content-type");
	if (!contentType) return response.text().catch(() => "");
	const mimetype = (0, import_fast_content_type_parse.safeParse)(contentType);
	if (isJSONResponse(mimetype)) {
		let text = "";
		try {
			text = await response.text();
			return JSON.parse(text);
		} catch (err) {
			return text;
		}
	} else if (mimetype.type.startsWith("text/") || mimetype.parameters.charset?.toLowerCase() === "utf-8") return response.text().catch(() => "");
	else return response.arrayBuffer().catch(() => /* @__PURE__ */ new ArrayBuffer(0));
}
function isJSONResponse(mimetype) {
	return mimetype.type === "application/json" || mimetype.type === "application/scim+json";
}
function toErrorMessage(data) {
	if (typeof data === "string") return data;
	if (data instanceof ArrayBuffer) return "Unknown error";
	if ("message" in data) {
		const suffix = "documentation_url" in data ? ` - ${data.documentation_url}` : "";
		return Array.isArray(data.errors) ? `${data.message}: ${data.errors.map((v) => JSON.stringify(v)).join(", ")}${suffix}` : `${data.message}${suffix}`;
	}
	return `Unknown error: ${JSON.stringify(data)}`;
}
function withDefaults(oldEndpoint, newDefaults) {
	const endpoint2 = oldEndpoint.defaults(newDefaults);
	const newApi = function(route, parameters) {
		const endpointOptions = endpoint2.merge(route, parameters);
		if (!endpointOptions.request || !endpointOptions.request.hook) return fetchWrapper(endpoint2.parse(endpointOptions));
		const request2 = (route2, parameters2) => {
			return fetchWrapper(endpoint2.parse(endpoint2.merge(route2, parameters2)));
		};
		Object.assign(request2, {
			endpoint: endpoint2,
			defaults: withDefaults.bind(null, endpoint2)
		});
		return endpointOptions.request.hook(request2, endpointOptions);
	};
	return Object.assign(newApi, {
		endpoint: endpoint2,
		defaults: withDefaults.bind(null, endpoint2)
	});
}
var request = withDefaults(endpoint, defaults_default);
// node_modules/@octokit/auth-oauth-app/node_modules/universal-user-agent/index.js
function getUserAgent$2() {
	if (typeof navigator === "object" && "userAgent" in navigator) return navigator.userAgent;
	if (typeof process === "object" && process.version !== void 0) return `Node.js/${process.version.substr(1)} (${process.platform}; ${process.arch})`;
	return "<environment undetectable>";
}
// node_modules/@octokit/auth-oauth-user/node_modules/universal-user-agent/index.js
function getUserAgent$1() {
	if (typeof navigator === "object" && "userAgent" in navigator) return navigator.userAgent;
	if (typeof process === "object" && process.version !== void 0) return `Node.js/${process.version.substr(1)} (${process.platform}; ${process.arch})`;
	return "<environment undetectable>";
}
// node_modules/@octokit/auth-oauth-device/node_modules/universal-user-agent/index.js
function getUserAgent() {
	if (typeof navigator === "object" && "userAgent" in navigator) return navigator.userAgent;
	if (typeof process === "object" && process.version !== void 0) return `Node.js/${process.version.substr(1)} (${process.platform}; ${process.arch})`;
	return "<environment undetectable>";
}
// node_modules/@octokit/oauth-methods/node_modules/@octokit/request-error/dist-src/index.js
var RequestError = class extends Error {
	name;
	/**
	* http status code
	*/
	status;
	/**
	* Request options that lead to the error.
	*/
	request;
	/**
	* Response object if a response was received
	*/
	response;
	constructor(message, statusCode, options) {
		super(message);
		this.name = "HttpError";
		this.status = Number.parseInt(statusCode);
		if (Number.isNaN(this.status)) this.status = 0;
		if ("response" in options) this.response = options.response;
		const requestCopy = Object.assign({}, options.request);
		if (options.request.headers.authorization) requestCopy.headers = Object.assign({}, options.request.headers, { authorization: options.request.headers.authorization.replace(/(?<! ) .*$/, " [REDACTED]") });
		requestCopy.url = requestCopy.url.replace(/\bclient_secret=\w+/g, "client_secret=[REDACTED]").replace(/\baccess_token=\w+/g, "access_token=[REDACTED]");
		this.request = requestCopy;
	}
};
// node_modules/@octokit/oauth-methods/dist-bundle/index.js
function requestToOAuthBaseUrl(request) {
	const endpointDefaults = request.endpoint.DEFAULTS;
	return /^https:\/\/(api\.)?github\.com$/.test(endpointDefaults.baseUrl) ? "https://github.com" : endpointDefaults.baseUrl.replace("/api/v3", "");
}
async function oauthRequest(request, route, parameters) {
	const withOAuthParameters = {
		baseUrl: requestToOAuthBaseUrl(request),
		headers: { accept: "application/json" },
		...parameters
	};
	const response = await request(route, withOAuthParameters);
	if ("error" in response.data) {
		const error = new RequestError(`${response.data.error_description} (${response.data.error}, ${response.data.error_uri})`, 400, { request: request.endpoint.merge(route, withOAuthParameters) });
		error.response = response;
		throw error;
	}
	return response;
}
async function exchangeWebFlowCode(options) {
	const response = await oauthRequest(options.request || request, "POST /login/oauth/access_token", {
		client_id: options.clientId,
		client_secret: options.clientSecret,
		code: options.code,
		redirect_uri: options.redirectUrl
	});
	const authentication = {
		clientType: options.clientType,
		clientId: options.clientId,
		clientSecret: options.clientSecret,
		token: response.data.access_token,
		scopes: response.data.scope.split(/\s+/).filter(Boolean)
	};
	if (options.clientType === "github-app") {
		if ("refresh_token" in response.data) {
			const apiTimeInMs = new Date(response.headers.date).getTime();
			authentication.refreshToken = response.data.refresh_token, authentication.expiresAt = toTimestamp(apiTimeInMs, response.data.expires_in), authentication.refreshTokenExpiresAt = toTimestamp(apiTimeInMs, response.data.refresh_token_expires_in);
		}
		delete authentication.scopes;
	}
	return {
		...response,
		authentication
	};
}
function toTimestamp(apiTimeInMs, expirationInSeconds) {
	return new Date(apiTimeInMs + expirationInSeconds * 1e3).toISOString();
}
async function createDeviceCode(options) {
	const request$5 = options.request || request;
	const parameters = { client_id: options.clientId };
	if ("scopes" in options && Array.isArray(options.scopes)) parameters.scope = options.scopes.join(" ");
	return oauthRequest(request$5, "POST /login/device/code", parameters);
}
async function exchangeDeviceCode(options) {
	const response = await oauthRequest(options.request || request, "POST /login/oauth/access_token", {
		client_id: options.clientId,
		device_code: options.code,
		grant_type: "urn:ietf:params:oauth:grant-type:device_code"
	});
	const authentication = {
		clientType: options.clientType,
		clientId: options.clientId,
		token: response.data.access_token,
		scopes: response.data.scope.split(/\s+/).filter(Boolean)
	};
	if ("clientSecret" in options) authentication.clientSecret = options.clientSecret;
	if (options.clientType === "github-app") {
		if ("refresh_token" in response.data) {
			const apiTimeInMs = new Date(response.headers.date).getTime();
			authentication.refreshToken = response.data.refresh_token, authentication.expiresAt = toTimestamp2(apiTimeInMs, response.data.expires_in), authentication.refreshTokenExpiresAt = toTimestamp2(apiTimeInMs, response.data.refresh_token_expires_in);
		}
		delete authentication.scopes;
	}
	return {
		...response,
		authentication
	};
}
function toTimestamp2(apiTimeInMs, expirationInSeconds) {
	return new Date(apiTimeInMs + expirationInSeconds * 1e3).toISOString();
}
async function checkToken(options) {
	const response = await (options.request || request)("POST /applications/{client_id}/token", {
		headers: { authorization: `basic ${btoa(`${options.clientId}:${options.clientSecret}`)}` },
		client_id: options.clientId,
		access_token: options.token
	});
	const authentication = {
		clientType: options.clientType,
		clientId: options.clientId,
		clientSecret: options.clientSecret,
		token: options.token,
		scopes: response.data.scopes
	};
	if (response.data.expires_at) authentication.expiresAt = response.data.expires_at;
	if (options.clientType === "github-app") delete authentication.scopes;
	return {
		...response,
		authentication
	};
}
async function refreshToken(options) {
	const response = await oauthRequest(options.request || request, "POST /login/oauth/access_token", {
		client_id: options.clientId,
		client_secret: options.clientSecret,
		grant_type: "refresh_token",
		refresh_token: options.refreshToken
	});
	const apiTimeInMs = new Date(response.headers.date).getTime();
	const authentication = {
		clientType: "github-app",
		clientId: options.clientId,
		clientSecret: options.clientSecret,
		token: response.data.access_token,
		refreshToken: response.data.refresh_token,
		expiresAt: toTimestamp3(apiTimeInMs, response.data.expires_in),
		refreshTokenExpiresAt: toTimestamp3(apiTimeInMs, response.data.refresh_token_expires_in)
	};
	return {
		...response,
		authentication
	};
}
function toTimestamp3(apiTimeInMs, expirationInSeconds) {
	return new Date(apiTimeInMs + expirationInSeconds * 1e3).toISOString();
}
async function resetToken(options) {
	const response = await (options.request || request)("PATCH /applications/{client_id}/token", {
		headers: { authorization: `basic ${btoa(`${options.clientId}:${options.clientSecret}`)}` },
		client_id: options.clientId,
		access_token: options.token
	});
	const authentication = {
		clientType: options.clientType,
		clientId: options.clientId,
		clientSecret: options.clientSecret,
		token: response.data.token,
		scopes: response.data.scopes
	};
	if (response.data.expires_at) authentication.expiresAt = response.data.expires_at;
	if (options.clientType === "github-app") delete authentication.scopes;
	return {
		...response,
		authentication
	};
}
async function deleteToken(options) {
	return (options.request || request)("DELETE /applications/{client_id}/token", {
		headers: { authorization: `basic ${btoa(`${options.clientId}:${options.clientSecret}`)}` },
		client_id: options.clientId,
		access_token: options.token
	});
}
async function deleteAuthorization(options) {
	return (options.request || request)("DELETE /applications/{client_id}/grant", {
		headers: { authorization: `basic ${btoa(`${options.clientId}:${options.clientSecret}`)}` },
		client_id: options.clientId,
		access_token: options.token
	});
}
// node_modules/@octokit/auth-oauth-device/dist-bundle/index.js
async function getOAuthAccessToken(state, options) {
	const cachedAuthentication = getCachedAuthentication(state, options.auth);
	if (cachedAuthentication) return cachedAuthentication;
	const { data: verification } = await createDeviceCode({
		clientType: state.clientType,
		clientId: state.clientId,
		request: options.request || state.request,
		scopes: options.auth.scopes || state.scopes
	});
	await state.onVerification(verification);
	const authentication = await waitForAccessToken(options.request || state.request, state.clientId, state.clientType, verification);
	state.authentication = authentication;
	return authentication;
}
function getCachedAuthentication(state, auth2) {
	if (auth2.refresh === true) return false;
	if (!state.authentication) return false;
	if (state.clientType === "github-app") return state.authentication;
	const authentication = state.authentication;
	return ("scopes" in auth2 && auth2.scopes || state.scopes).join(" ") === authentication.scopes.join(" ") ? authentication : false;
}
async function wait(seconds) {
	await new Promise((resolve) => setTimeout(resolve, seconds * 1e3));
}
async function waitForAccessToken(request, clientId, clientType, verification) {
	try {
		const options = {
			clientId,
			request,
			code: verification.device_code
		};
		const { authentication } = clientType === "oauth-app" ? await exchangeDeviceCode({
			...options,
			clientType: "oauth-app"
		}) : await exchangeDeviceCode({
			...options,
			clientType: "github-app"
		});
		return {
			type: "token",
			tokenType: "oauth",
			...authentication
		};
	} catch (error) {
		if (!error.response) throw error;
		const errorType = error.response.data.error;
		if (errorType === "authorization_pending") {
			await wait(verification.interval);
			return waitForAccessToken(request, clientId, clientType, verification);
		}
		if (errorType === "slow_down") {
			await wait(verification.interval + 7);
			return waitForAccessToken(request, clientId, clientType, verification);
		}
		throw error;
	}
}
async function auth$3(state, authOptions) {
	return getOAuthAccessToken(state, { auth: authOptions });
}
async function hook$3(state, request, route, parameters) {
	let endpoint = request.endpoint.merge(route, parameters);
	if (/\/login\/(oauth\/access_token|device\/code)$/.test(endpoint.url)) return request(endpoint);
	const { token } = await getOAuthAccessToken(state, {
		request,
		auth: { type: "oauth" }
	});
	endpoint.headers.authorization = `token ${token}`;
	return request(endpoint);
}
var VERSION$3 = "0.0.0-development";
function createOAuthDeviceAuth(options) {
	const requestWithDefaults = options.request || request.defaults({ headers: { "user-agent": `octokit-auth-oauth-device.js/${VERSION$3} ${getUserAgent()}` } });
	const { request: request$3 = requestWithDefaults, ...otherOptions } = options;
	const state = options.clientType === "github-app" ? {
		...otherOptions,
		clientType: "github-app",
		request: request$3
	} : {
		...otherOptions,
		clientType: "oauth-app",
		request: request$3,
		scopes: options.scopes || []
	};
	if (!options.clientId) throw new Error("[@octokit/auth-oauth-device] \"clientId\" option must be set (https://github.com/octokit/auth-oauth-device.js#usage)");
	if (!options.onVerification) throw new Error("[@octokit/auth-oauth-device] \"onVerification\" option must be a function (https://github.com/octokit/auth-oauth-device.js#usage)");
	return Object.assign(auth$3.bind(null, state), { hook: hook$3.bind(null, state) });
}
// node_modules/@octokit/auth-oauth-user/dist-bundle/index.js
var VERSION$2 = "0.0.0-development";
async function getAuthentication(state) {
	if ("code" in state.strategyOptions) {
		const { authentication } = await exchangeWebFlowCode({
			clientId: state.clientId,
			clientSecret: state.clientSecret,
			clientType: state.clientType,
			onTokenCreated: state.onTokenCreated,
			...state.strategyOptions,
			request: state.request
		});
		return {
			type: "token",
			tokenType: "oauth",
			...authentication
		};
	}
	if ("onVerification" in state.strategyOptions) {
		const authentication = await createOAuthDeviceAuth({
			clientType: state.clientType,
			clientId: state.clientId,
			onTokenCreated: state.onTokenCreated,
			...state.strategyOptions,
			request: state.request
		})({ type: "oauth" });
		return {
			clientSecret: state.clientSecret,
			...authentication
		};
	}
	if ("token" in state.strategyOptions) return {
		type: "token",
		tokenType: "oauth",
		clientId: state.clientId,
		clientSecret: state.clientSecret,
		clientType: state.clientType,
		onTokenCreated: state.onTokenCreated,
		...state.strategyOptions
	};
	throw new Error("[@octokit/auth-oauth-user] Invalid strategy options");
}
async function auth$2(state, options = {}) {
	if (!state.authentication) state.authentication = state.clientType === "oauth-app" ? await getAuthentication(state) : await getAuthentication(state);
	if (state.authentication.invalid) throw new Error("[@octokit/auth-oauth-user] Token is invalid");
	const currentAuthentication = state.authentication;
	if ("expiresAt" in currentAuthentication) {
		if (options.type === "refresh" || new Date(currentAuthentication.expiresAt) < /* @__PURE__ */ new Date()) {
			const { authentication } = await refreshToken({
				clientType: "github-app",
				clientId: state.clientId,
				clientSecret: state.clientSecret,
				refreshToken: currentAuthentication.refreshToken,
				request: state.request
			});
			state.authentication = {
				tokenType: "oauth",
				type: "token",
				...authentication
			};
		}
	}
	if (options.type === "refresh") {
		if (state.clientType === "oauth-app") throw new Error("[@octokit/auth-oauth-user] OAuth Apps do not support expiring tokens");
		if (!currentAuthentication.hasOwnProperty("expiresAt")) throw new Error("[@octokit/auth-oauth-user] Refresh token missing");
		await state.onTokenCreated?.(state.authentication, { type: options.type });
	}
	if (options.type === "check" || options.type === "reset") {
		const method = options.type === "check" ? checkToken : resetToken;
		try {
			const { authentication } = await method({
				clientType: state.clientType,
				clientId: state.clientId,
				clientSecret: state.clientSecret,
				token: state.authentication.token,
				request: state.request
			});
			state.authentication = {
				tokenType: "oauth",
				type: "token",
				...authentication
			};
			if (options.type === "reset") await state.onTokenCreated?.(state.authentication, { type: options.type });
			return state.authentication;
		} catch (error) {
			if (error.status === 404) {
				error.message = "[@octokit/auth-oauth-user] Token is invalid";
				state.authentication.invalid = true;
			}
			throw error;
		}
	}
	if (options.type === "delete" || options.type === "deleteAuthorization") {
		const method = options.type === "delete" ? deleteToken : deleteAuthorization;
		try {
			await method({
				clientType: state.clientType,
				clientId: state.clientId,
				clientSecret: state.clientSecret,
				token: state.authentication.token,
				request: state.request
			});
		} catch (error) {
			if (error.status !== 404) throw error;
		}
		state.authentication.invalid = true;
		return state.authentication;
	}
	return state.authentication;
}
var ROUTES_REQUIRING_BASIC_AUTH = /\/applications\/[^/]+\/(token|grant)s?/;
function requiresBasicAuth(url) {
	return url && ROUTES_REQUIRING_BASIC_AUTH.test(url);
}
async function hook$2(state, request, route, parameters = {}) {
	const endpoint = request.endpoint.merge(route, parameters);
	if (/\/login\/(oauth\/access_token|device\/code)$/.test(endpoint.url)) return request(endpoint);
	if (requiresBasicAuth(endpoint.url)) {
		const credentials = btoa(`${state.clientId}:${state.clientSecret}`);
		endpoint.headers.authorization = `basic ${credentials}`;
		return request(endpoint);
	}
	const { token } = state.clientType === "oauth-app" ? await auth$2({
		...state,
		request
	}) : await auth$2({
		...state,
		request
	});
	endpoint.headers.authorization = "token " + token;
	return request(endpoint);
}
function createOAuthUserAuth({ clientId, clientSecret, clientType = "oauth-app", request: request$2 = request.defaults({ headers: { "user-agent": `octokit-auth-oauth-app.js/${VERSION$2} ${getUserAgent$1()}` } }), onTokenCreated, ...strategyOptions }) {
	const state = Object.assign({
		clientType,
		clientId,
		clientSecret,
		onTokenCreated,
		strategyOptions,
		request: request$2
	});
	return Object.assign(auth$2.bind(null, state), { hook: hook$2.bind(null, state) });
}
createOAuthUserAuth.VERSION = VERSION$2;
// node_modules/@octokit/auth-oauth-app/dist-bundle/index.js
async function auth$1(state, authOptions) {
	if (authOptions.type === "oauth-app") return {
		type: "oauth-app",
		clientId: state.clientId,
		clientSecret: state.clientSecret,
		clientType: state.clientType,
		headers: { authorization: `basic ${btoa(`${state.clientId}:${state.clientSecret}`)}` }
	};
	if ("factory" in authOptions) {
		const { type, ...options } = {
			...authOptions,
			...state
		};
		return authOptions.factory(options);
	}
	const common = {
		clientId: state.clientId,
		clientSecret: state.clientSecret,
		request: state.request,
		...authOptions
	};
	return (state.clientType === "oauth-app" ? await createOAuthUserAuth({
		...common,
		clientType: state.clientType
	}) : await createOAuthUserAuth({
		...common,
		clientType: state.clientType
	}))();
}
async function hook$1(state, request2, route, parameters) {
	let endpoint = request2.endpoint.merge(route, parameters);
	if (/\/login\/(oauth\/access_token|device\/code)$/.test(endpoint.url)) return request2(endpoint);
	if (state.clientType === "github-app" && !requiresBasicAuth(endpoint.url)) throw new Error(`[@octokit/auth-oauth-app] GitHub Apps cannot use their client ID/secret for basic authentication for endpoints other than "/applications/{client_id}/**". "${endpoint.method} ${endpoint.url}" is not supported.`);
	const credentials = btoa(`${state.clientId}:${state.clientSecret}`);
	endpoint.headers.authorization = `basic ${credentials}`;
	try {
		return await request2(endpoint);
	} catch (error) {
		if (error.status !== 401) throw error;
		error.message = `[@octokit/auth-oauth-app] "${endpoint.method} ${endpoint.url}" does not support clientId/clientSecret basic authentication.`;
		throw error;
	}
}
var VERSION$1 = "0.0.0-development";
function createOAuthAppAuth(options) {
	const state = Object.assign({
		request: request.defaults({ headers: { "user-agent": `octokit-auth-oauth-app.js/${VERSION$1} ${getUserAgent$2()}` } }),
		clientType: "oauth-app"
	}, options);
	return Object.assign(auth$1.bind(null, state), { hook: hook$1.bind(null, state) });
}
// node_modules/universal-github-app-jwt/lib/utils.js
/**
* @param {string} privateKey
* @returns {boolean}
*/
function isPkcs1(privateKey) {
	return privateKey.includes("-----BEGIN RSA PRIVATE KEY-----");
}
/**
* @param {string} privateKey
* @returns {boolean}
*/
function isOpenSsh(privateKey) {
	return privateKey.includes("-----BEGIN OPENSSH PRIVATE KEY-----");
}
/**
* @param {string} str
* @returns {ArrayBuffer}
*/
function string2ArrayBuffer(str) {
	const buf = new ArrayBuffer(str.length);
	const bufView = new Uint8Array(buf);
	for (let i = 0, strLen = str.length; i < strLen; i++) bufView[i] = str.charCodeAt(i);
	return buf;
}
/**
* @param {string} pem
* @returns {ArrayBuffer}
*/
function getDERfromPEM(pem) {
	const pemB64 = pem.trim().split("\n").slice(1, -1).join("");
	return string2ArrayBuffer(atob(pemB64));
}
/**
* @param {import('../internals').Header} header
* @param {import('../internals').Payload} payload
* @returns {string}
*/
function getEncodedMessage(header, payload) {
	return `${base64encodeJSON(header)}.${base64encodeJSON(payload)}`;
}
/**
* @param {ArrayBuffer} buffer
* @returns {string}
*/
function base64encode(buffer) {
	var binary = "";
	var bytes = new Uint8Array(buffer);
	var len = bytes.byteLength;
	for (var i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
	return fromBase64(btoa(binary));
}
/**
* @param {string} base64
* @returns {string}
*/
function fromBase64(base64) {
	return base64.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
/**
* @param {Record<string,unknown>} obj
* @returns {string}
*/
function base64encodeJSON(obj) {
	return fromBase64(btoa(JSON.stringify(obj)));
}
// node_modules/universal-github-app-jwt/lib/crypto-node.js
function convertPrivateKey(privateKey) {
	if (!isPkcs1(privateKey)) return privateKey;
	return createPrivateKey(privateKey).export({
		type: "pkcs8",
		format: "pem"
	});
}
// node_modules/universal-github-app-jwt/lib/get-token.js
/**
* @param {import('../internals').GetTokenOptions} options
* @returns {Promise<string>}
*/
async function getToken({ privateKey, payload }) {
	const convertedPrivateKey = convertPrivateKey(privateKey);
	/* c8 ignore start */
	if (isPkcs1(convertedPrivateKey)) throw new Error("[universal-github-app-jwt] Private Key is in PKCS#1 format, but only PKCS#8 is supported. See https://github.com/gr2m/universal-github-app-jwt#private-key-formats");
	/* c8 ignore stop */
	if (isOpenSsh(convertedPrivateKey)) throw new Error("[universal-github-app-jwt] Private Key is in OpenSSH format, but only PKCS#8 is supported. See https://github.com/gr2m/universal-github-app-jwt#private-key-formats");
	const algorithm = {
		name: "RSASSA-PKCS1-v1_5",
		hash: { name: "SHA-256" }
	};
	/** @type {import('../internals').Header} */
	const header = {
		alg: "RS256",
		typ: "JWT"
	};
	const privateKeyDER = getDERfromPEM(convertedPrivateKey);
	const importedKey = await subtle.importKey("pkcs8", privateKeyDER, algorithm, false, ["sign"]);
	const encodedMessage = getEncodedMessage(header, payload);
	const encodedMessageArrBuf = string2ArrayBuffer(encodedMessage);
	return `${encodedMessage}.${base64encode(await subtle.sign(algorithm.name, importedKey, encodedMessageArrBuf))}`;
}
// node_modules/universal-github-app-jwt/index.js
/**
* @param {import(".").Options} options
* @returns {Promise<import(".").Result>}
*/
async function githubAppJwt({ id, privateKey, now = Math.floor(Date.now() / 1e3) }) {
	const privateKeyWithNewlines = privateKey.replace(/\\n/g, "\n");
	const nowWithSafetyMargin = now - 30;
	const expiration = nowWithSafetyMargin + 600;
	return {
		appId: id,
		expiration,
		token: await getToken({
			privateKey: privateKeyWithNewlines,
			payload: {
				iat: nowWithSafetyMargin,
				exp: expiration,
				iss: id
			}
		})
	};
}
// node_modules/toad-cache/dist/toad-cache.mjs
/**
* toad-cache
*
* @copyright 2026 Igor Savin <kibertoad@gmail.com>
* @license MIT
* @version 3.7.3
*/
/**
* Validates the shared cache constructor parameters.
* Both values must be non-negative integers.
*
* @param {number} max
* @param {number} ttlInMsecs
*/
function validateCacheParams(max, ttlInMsecs) {
	if (typeof max !== "number" || !Number.isInteger(max) || max < 0) throw new Error("Invalid max value");
	if (typeof ttlInMsecs !== "number" || !Number.isInteger(ttlInMsecs) || ttlInMsecs < 0) throw new Error("Invalid ttl value");
}
var LruObject = class {
	constructor(max = 1e3, ttlInMsecs = 0) {
		validateCacheParams(max, ttlInMsecs);
		this.first = null;
		this.items = Object.create(null);
		this.last = null;
		this.size = 0;
		this.max = max;
		this.ttl = ttlInMsecs;
	}
	bumpLru(item) {
		if (this.last === item) return;
		const last = this.last;
		const next = item.next;
		const prev = item.prev;
		if (this.first === item) this.first = next;
		item.next = null;
		item.prev = last;
		last.next = item;
		if (prev !== null) prev.next = next;
		/* v8 ignore next 3 -- next is always non-null here: the early return above guarantees item !== this.last in a well-formed list */
		if (next !== null) next.prev = prev;
		this.last = item;
	}
	clear() {
		this.items = Object.create(null);
		this.first = null;
		this.last = null;
		this.size = 0;
	}
	delete(key) {
		const item = this.items[key];
		if (item !== void 0) {
			delete this.items[key];
			this.size--;
			if (item.prev !== null) item.prev.next = item.next;
			if (item.next !== null) item.next.prev = item.prev;
			if (this.first === item) this.first = item.next;
			if (this.last === item) this.last = item.prev;
		}
	}
	deleteMany(keys) {
		for (var i = 0; i < keys.length; i++) this.delete(keys[i]);
	}
	evict() {
		if (this.size > 0) {
			const item = this.first;
			delete this.items[item.key];
			if (--this.size === 0) {
				this.first = null;
				this.last = null;
			} else {
				this.first = item.next;
				this.first.prev = null;
			}
		}
	}
	expiresAt(key) {
		const item = this.items[key];
		if (item !== void 0) return item.expiry;
	}
	get(key) {
		const item = this.items[key];
		if (item !== void 0) {
			if (this.ttl > 0 && item.expiry <= Date.now()) {
				this.delete(key);
				return;
			}
			this.bumpLru(item);
			return item.value;
		}
	}
	getMany(keys) {
		const result = new Array(keys.length);
		for (var i = 0; i < keys.length; i++) result[i] = this.get(keys[i]);
		return result;
	}
	keys() {
		return Object.keys(this.items);
	}
	set(key, value) {
		const existing = this.items[key];
		if (existing !== void 0) {
			existing.value = value;
			existing.expiry = this.ttl > 0 ? Date.now() + this.ttl : this.ttl;
			this.bumpLru(existing);
			return;
		}
		if (this.max > 0 && this.size >= this.max) this.evict();
		const item = {
			expiry: this.ttl > 0 ? Date.now() + this.ttl : this.ttl,
			key,
			prev: this.last,
			next: null,
			value
		};
		this.items[key] = item;
		if (++this.size === 1) this.first = item;
		else this.last.next = item;
		this.last = item;
	}
};
// node_modules/@octokit/auth-app/dist-node/index.js
async function getAppAuthentication({ appId, privateKey, timeDifference }) {
	try {
		const authOptions = {
			id: appId,
			privateKey
		};
		if (timeDifference) Object.assign(authOptions, { now: Math.floor(Date.now() / 1e3) + timeDifference });
		const appAuthentication = await githubAppJwt(authOptions);
		return {
			type: "app",
			token: appAuthentication.token,
			appId: appAuthentication.appId,
			expiresAt: (/* @__PURE__ */ new Date(appAuthentication.expiration * 1e3)).toISOString()
		};
	} catch (error) {
		if (privateKey === "-----BEGIN RSA PRIVATE KEY-----") throw new Error("The 'privateKey` option contains only the first line '-----BEGIN RSA PRIVATE KEY-----'. If you are setting it using a `.env` file, make sure it is set on a single line with newlines replaced by '\n'");
		else throw error;
	}
}
function getCache() {
	return new LruObject(15e3, 354e4);
}
async function get(cache, options) {
	const cacheKey = optionsToCacheKey(options);
	const result = await cache.get(cacheKey);
	if (!result) return;
	const [token, createdAt, expiresAt, repositorySelection, permissionsString, singleFileName] = result.split("|");
	return {
		token,
		createdAt,
		expiresAt,
		permissions: options.permissions || permissionsString.split(/,/).reduce((permissions2, string) => {
			if (/!$/.test(string)) permissions2[string.slice(0, -1)] = "write";
			else permissions2[string] = "read";
			return permissions2;
		}, {}),
		repositoryIds: options.repositoryIds,
		repositoryNames: options.repositoryNames,
		singleFileName,
		repositorySelection
	};
}
async function set(cache, options, data) {
	const key = optionsToCacheKey(options);
	const permissionsString = options.permissions ? "" : Object.keys(data.permissions).map((name) => `${name}${data.permissions[name] === "write" ? "!" : ""}`).join(",");
	const value = [
		data.token,
		data.createdAt,
		data.expiresAt,
		data.repositorySelection,
		permissionsString,
		data.singleFileName
	].join("|");
	await cache.set(key, value);
}
function optionsToCacheKey({ installationId, permissions = {}, repositoryIds = [], repositoryNames = [] }) {
	const permissionsString = Object.keys(permissions).sort().map((name) => permissions[name] === "read" ? name : `${name}!`).join(",");
	return [
		installationId,
		repositoryIds.sort().join(","),
		repositoryNames.join(","),
		permissionsString
	].filter(Boolean).join("|");
}
function toTokenAuthentication({ installationId, token, createdAt, expiresAt, repositorySelection, permissions, repositoryIds, repositoryNames, singleFileName }) {
	return Object.assign({
		type: "token",
		tokenType: "installation",
		token,
		installationId,
		permissions,
		createdAt,
		expiresAt,
		repositorySelection
	}, repositoryIds ? { repositoryIds } : null, repositoryNames ? { repositoryNames } : null, singleFileName ? { singleFileName } : null);
}
async function getInstallationAuthentication(state, options, customRequest) {
	const installationId = Number(options.installationId || state.installationId);
	if (!installationId) throw new Error("[@octokit/auth-app] installationId option is required for installation authentication.");
	if (options.factory) {
		const { type, factory, oauthApp, ...factoryAuthOptions } = {
			...state,
			...options
		};
		return factory(factoryAuthOptions);
	}
	const request = customRequest || state.request;
	return getInstallationAuthenticationConcurrently(state, {
		...options,
		installationId
	}, request);
}
var pendingPromises = /* @__PURE__ */ new Map();
function getInstallationAuthenticationConcurrently(state, options, request) {
	const cacheKey = optionsToCacheKey(options);
	if (pendingPromises.has(cacheKey)) return pendingPromises.get(cacheKey);
	const promise = getInstallationAuthenticationImpl(state, options, request).finally(() => pendingPromises.delete(cacheKey));
	pendingPromises.set(cacheKey, promise);
	return promise;
}
async function getInstallationAuthenticationImpl(state, options, request) {
	if (!options.refresh) {
		const result = await get(state.cache, options);
		if (result) {
			const { token: token2, createdAt: createdAt2, expiresAt: expiresAt2, permissions: permissions2, repositoryIds: repositoryIds2, repositoryNames: repositoryNames2, singleFileName: singleFileName2, repositorySelection: repositorySelection2 } = result;
			return toTokenAuthentication({
				installationId: options.installationId,
				token: token2,
				createdAt: createdAt2,
				expiresAt: expiresAt2,
				permissions: permissions2,
				repositorySelection: repositorySelection2,
				repositoryIds: repositoryIds2,
				repositoryNames: repositoryNames2,
				singleFileName: singleFileName2
			});
		}
	}
	const appAuthentication = await getAppAuthentication(state);
	const payload = {
		installation_id: options.installationId,
		mediaType: { previews: ["machine-man"] },
		headers: { authorization: `bearer ${appAuthentication.token}` }
	};
	if (options.repositoryIds) Object.assign(payload, { repository_ids: options.repositoryIds });
	if (options.repositoryNames) Object.assign(payload, { repositories: options.repositoryNames });
	if (options.permissions) Object.assign(payload, { permissions: options.permissions });
	const { data: { token, expires_at: expiresAt, repositories, permissions: permissionsOptional, repository_selection: repositorySelectionOptional, single_file: singleFileName } } = await request("POST /app/installations/{installation_id}/access_tokens", payload);
	const permissions = permissionsOptional || {};
	const repositorySelection = repositorySelectionOptional || "all";
	const repositoryIds = repositories ? repositories.map((r) => r.id) : void 0;
	const repositoryNames = repositories ? repositories.map((repo) => repo.name) : void 0;
	const createdAt = (/* @__PURE__ */ new Date()).toISOString();
	const cacheOptions = {
		token,
		createdAt,
		expiresAt,
		repositorySelection,
		permissions,
		repositoryIds,
		repositoryNames
	};
	if (singleFileName) Object.assign(payload, { singleFileName });
	await set(state.cache, options, cacheOptions);
	const cacheData = {
		installationId: options.installationId,
		token,
		createdAt,
		expiresAt,
		repositorySelection,
		permissions,
		repositoryIds,
		repositoryNames
	};
	if (singleFileName) Object.assign(cacheData, { singleFileName });
	return toTokenAuthentication(cacheData);
}
async function auth(state, authOptions) {
	switch (authOptions.type) {
		case "app": return getAppAuthentication(state);
		case "oauth-app": return state.oauthApp({ type: "oauth-app" });
		case "installation": return getInstallationAuthentication(state, {
			...authOptions,
			type: "installation"
		});
		case "oauth-user": return state.oauthApp(authOptions);
		default: throw new Error(`Invalid auth type: ${authOptions.type}`);
	}
}
var PATHS = [
	"/app",
	"/app/hook/config",
	"/app/hook/deliveries",
	"/app/hook/deliveries/{delivery_id}",
	"/app/hook/deliveries/{delivery_id}/attempts",
	"/app/installations",
	"/app/installations/{installation_id}",
	"/app/installations/{installation_id}/access_tokens",
	"/app/installations/{installation_id}/suspended",
	"/app/installation-requests",
	"/marketplace_listing/accounts/{account_id}",
	"/marketplace_listing/plan",
	"/marketplace_listing/plans",
	"/marketplace_listing/plans/{plan_id}/accounts",
	"/marketplace_listing/stubbed/accounts/{account_id}",
	"/marketplace_listing/stubbed/plan",
	"/marketplace_listing/stubbed/plans",
	"/marketplace_listing/stubbed/plans/{plan_id}/accounts",
	"/orgs/{org}/installation",
	"/repos/{owner}/{repo}/installation",
	"/users/{username}/installation"
];
function routeMatcher(paths) {
	const regex = `^(?:${paths.map((p) => p.split("/").map((c) => c.startsWith("{") ? "(?:.+?)" : c).join("/")).map((r) => `(?:${r})`).join("|")})$`;
	return new RegExp(regex, "i");
}
var REGEX = routeMatcher(PATHS);
function requiresAppAuth(url) {
	return !!url && REGEX.test(url.split("?")[0]);
}
var FIVE_SECONDS_IN_MS = 5e3;
function isNotTimeSkewError(error) {
	return !(error.message.match(/'Expiration time' claim \('exp'\) must be a numeric value representing the future time at which the assertion expires/) || error.message.match(/'Issued at' claim \('iat'\) must be an Integer representing the time that the assertion was issued/));
}
async function hook(state, request, route, parameters) {
	const endpoint = request.endpoint.merge(route, parameters);
	const url = endpoint.url;
	if (/\/login\/oauth\/access_token$/.test(url)) return request(endpoint);
	if (requiresAppAuth(url.replace(request.endpoint.DEFAULTS.baseUrl, ""))) {
		const { token: token2 } = await getAppAuthentication(state);
		endpoint.headers.authorization = `bearer ${token2}`;
		let response;
		try {
			response = await request(endpoint);
		} catch (error) {
			if (isNotTimeSkewError(error)) throw error;
			if (typeof error.response.headers.date === "undefined") throw error;
			const diff = Math.floor((Date.parse(error.response.headers.date) - Date.parse((/* @__PURE__ */ new Date()).toString())) / 1e3);
			state.log.warn(error.message);
			state.log.warn(`[@octokit/auth-app] GitHub API time and system time are different by ${diff} seconds. Retrying request with the difference accounted for.`);
			const { token: token3 } = await getAppAuthentication({
				...state,
				timeDifference: diff
			});
			endpoint.headers.authorization = `bearer ${token3}`;
			return request(endpoint);
		}
		return response;
	}
	if (requiresBasicAuth(url)) {
		const authentication = await state.oauthApp({ type: "oauth-app" });
		endpoint.headers.authorization = authentication.headers.authorization;
		return request(endpoint);
	}
	const { token, createdAt } = await getInstallationAuthentication(state, {}, request.defaults({ baseUrl: endpoint.baseUrl }));
	endpoint.headers.authorization = `token ${token}`;
	return sendRequestWithRetries(state, request, endpoint, createdAt);
}
async function sendRequestWithRetries(state, request, options, createdAt, retries = 0) {
	const timeSinceTokenCreationInMs = +/* @__PURE__ */ new Date() - +new Date(createdAt);
	try {
		return await request(options);
	} catch (error) {
		if (error.status !== 401) throw error;
		if (timeSinceTokenCreationInMs >= FIVE_SECONDS_IN_MS) {
			if (retries > 0) error.message = `After ${retries} retries within ${timeSinceTokenCreationInMs / 1e3}s of creating the installation access token, the response remains 401. At this point, the cause may be an authentication problem or a system outage. Please check https://www.githubstatus.com for status information`;
			throw error;
		}
		++retries;
		const awaitTime = retries * 1e3;
		state.log.warn(`[@octokit/auth-app] Retrying after 401 response to account for token replication delay (retry: ${retries}, wait: ${awaitTime / 1e3}s)`);
		await new Promise((resolve) => setTimeout(resolve, awaitTime));
		return sendRequestWithRetries(state, request, options, createdAt, retries);
	}
}
var VERSION = "7.2.2";
function createAppAuth(options) {
	if (!options.appId) throw new Error("[@octokit/auth-app] appId option is required");
	if (!options.privateKey) throw new Error("[@octokit/auth-app] privateKey option is required");
	if ("installationId" in options && !options.installationId) throw new Error("[@octokit/auth-app] installationId is set to a falsy value");
	const log = options.log || {};
	if (typeof log.warn !== "function") log.warn = console.warn.bind(console);
	const request$1 = options.request || request.defaults({ headers: { "user-agent": `octokit-auth-app.js/${VERSION} ${getUserAgent$5()}` } });
	const state = Object.assign({
		request: request$1,
		cache: getCache()
	}, options, options.installationId ? { installationId: Number(options.installationId) } : {}, {
		log,
		oauthApp: createOAuthAppAuth({
			clientType: "github-app",
			clientId: options.clientId || "",
			clientSecret: options.clientSecret || "",
			request: request$1
		})
	});
	return Object.assign(auth.bind(null, state), { hook: hook.bind(null, state) });
}
// src/app-token/index.ts
async function resolveInstallationId(appJwt, owner) {
	return logger.spin(`Resolving GitHub App installation for "${owner}"`, async () => {
		try {
			const { data } = await request("GET /users/{username}/installation", {
				username: owner,
				headers: { authorization: `bearer ${appJwt}` }
			});
			return data.id;
		} catch {
			throw new Error(`Could not find an installation of GitHub App for owner "${owner}". Ensure the app is installed.`);
		}
	});
}
async function runMain() {
	logger.banner("GitHub App Token", "Mint scoped installation token");
	const { "app-id": appId, "private-key": privateKey, owner, repositories, permissions } = await logger.step("Load App configuration", () => {
		const parsed = getInputs({
			"app-id": { required: true },
			"private-key": {
				required: true,
				secret: true
			},
			owner: {
				default: process.env.GITHUB_REPOSITORY_OWNER || "",
				parse: (raw) => {
					const resolved = raw || process.env.GITHUB_REPOSITORY_OWNER || "";
					if (!resolved) throw new Error("Installation owner is required");
					return resolved;
				}
			},
			repositories: { type: "list" },
			"permission-contents": { default: "" },
			"permission-pull-requests": { default: "" },
			"permission-issues": { default: "" },
			"permission-actions": { default: "" }
		});
		const scopedPermissions = {};
		if (parsed["permission-contents"]) scopedPermissions.contents = parsed["permission-contents"];
		if (parsed["permission-pull-requests"]) scopedPermissions.pull_requests = parsed["permission-pull-requests"];
		if (parsed["permission-issues"]) scopedPermissions.issues = parsed["permission-issues"];
		if (parsed["permission-actions"]) scopedPermissions.actions = parsed["permission-actions"];
		const repoList = parsed.repositories.length > 0 ? parsed.repositories : void 0;
		logger.item("App ID", parsed["app-id"]);
		logger.item("Owner", parsed.owner);
		logger.item("Repositories", repoList ? repoList.join(", ") : "all accessible");
		logger.item("Permissions", Object.entries(scopedPermissions).map(([k, v]) => `${k}:${v}`).join(", ") || "default", true);
		return {
			...parsed,
			repositories: repoList,
			permissions: scopedPermissions
		};
	});
	const { token, appSlug } = await logger.step("Mint installation token", async () => {
		const auth = createAppAuth({
			appId,
			privateKey
		});
		const appAuth = await logger.spin("Authenticating as GitHub App (JWT)", () => auth({ type: "app" }));
		const appSlug = (await logger.spin("Fetching GitHub App metadata", () => request("GET /app", { headers: { authorization: `bearer ${appAuth.token}` } }))).data?.slug;
		if (!appSlug) throw new Error("GitHub App metadata did not include a slug");
		const installationId = await resolveInstallationId(appAuth.token, owner);
		logger.item("Installation ID", installationId);
		logger.item("App Slug", appSlug);
		return {
			token: (await logger.spin("Requesting scoped installation token", () => auth({
				type: "installation",
				installationId,
				repositoryNames: repositories,
				permissions
			}))).token,
			appSlug
		};
	});
	logger.divider("Outputs & State");
	import_core.setSecret(token);
	import_core.saveState("token", token);
	setOutputs({
		token,
		"app-slug": appSlug
	});
	logger.success(`Installation token minted for ${style.bold(owner)} (${appSlug}[bot])`);
	logger.divider("", "═");
}
async function runPost() {
	const token = import_core.getState("token");
	if (!token) {
		logger.debug("No installation token found in state to revoke.");
		return;
	}
	logger.banner("GitHub App Token · Cleanup", "Revoking installation token");
	await logger.step("Revoke installation token", async () => {
		try {
			await logger.spin("Calling DELETE /installation/token", () => request("DELETE /installation/token", { headers: { authorization: `token ${token}` } }));
			logger.success("Installation token revoked");
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			logger.warn(`Failed to revoke installation token: ${message}`, "Token Cleanup");
		}
	});
	logger.divider("", "═");
}
runAction("GitHub App Token", async () => {
	if (!Boolean(import_core.getState("isPost"))) {
		import_core.saveState("isPost", "true");
		await runMain();
	} else await runPost();
});
export {};
