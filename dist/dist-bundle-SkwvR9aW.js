// node_modules/universal-user-agent/index.js
function getUserAgent() {
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
		"user-agent": `octokit-endpoint.js/0.0.0-development ${getUserAgent()}`
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
		if (typeof value === "string" || typeof value === "number" || typeof value === "bigint" || typeof value === "boolean") {
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
				values.push(...getValues(context, operator, tmp[1], tmp[2] || tmp[3]));
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
function parse$1(options) {
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
	return parse$1(merge(defaults, route, options));
}
function withDefaults$1(oldDefaults, newDefaults) {
	const DEFAULTS2 = merge(oldDefaults, newDefaults);
	const endpoint2 = endpointWithDefaults.bind(null, DEFAULTS2);
	return Object.assign(endpoint2, {
		DEFAULTS: DEFAULTS2,
		defaults: withDefaults$1.bind(null, DEFAULTS2),
		merge: merge.bind(null, DEFAULTS2),
		parse: parse$1
	});
}
var endpoint = withDefaults$1(null, DEFAULTS);
// node_modules/content-type/dist/index.js
/*!
* content-type
* Copyright(c) 2015 Douglas Christopher Wilson
* MIT Licensed
*/
const SP = 32;
const HTAB = 9;
const SEMI = 59;
const EQ = 61;
const DQUOTE = 34;
const BSLASH = 92;
const COMMA = 44;
const LOWER_CASE = 1;
const OWS = 2;
const SEMI_FLAG = 4;
const COMMA_FLAG = 8;
const TOKEN_FLAG = 16;
const NON_ASCII = 65280;
const CASE_FLAGS = 65281;
/**
* Character flags used to normalize HTTP field values while scanning.
* Out-of-range reads intentionally coerce to zero in bitwise expressions.
*/
const CHAR_MAP = /* @__PURE__ */ new Uint8Array(256);
CHAR_MAP[HTAB] |= OWS;
CHAR_MAP[SP] |= OWS;
CHAR_MAP[SEMI] |= SEMI_FLAG;
CHAR_MAP[COMMA] |= COMMA_FLAG;
for (let code = 128; code <= 255; code++) CHAR_MAP[code] |= LOWER_CASE;
for (const char of "!#$%&'*+-.^_`|~") CHAR_MAP[char.charCodeAt(0)] |= TOKEN_FLAG;
for (let code = 48; code <= 57; code++) CHAR_MAP[code] |= TOKEN_FLAG;
for (let code = 65; code <= 90; code++) CHAR_MAP[code] |= 17;
for (let code = 97; code <= 122; code++) CHAR_MAP[code] |= TOKEN_FLAG;
/**
* Null object perf optimization. Faster than `Object.create(null)` and `{ __proto__: null }`.
*/
const NullObject = /* @__PURE__ */ (() => {
	const C = function() {};
	C.prototype = Object.create(null);
	return C;
})();
/**
* Parse a `Content-Type` header.
*/
function parse(header, options) {
	const stopFlags = SEMI_FLAG | (options?.comma === true ? COMMA_FLAG : 0);
	const len = header.length;
	let valueStart = options?.start ?? 0;
	while ((CHAR_MAP[header.charCodeAt(valueStart)] & OWS) !== 0) valueStart++;
	let index = valueStart;
	let typeFlags = 0;
	let whitespace = -1;
	let stop = options?.parameters === false ? COMMA_FLAG : 0;
	while (index < len) {
		const code = header.charCodeAt(index);
		const flags = CHAR_MAP[code];
		if ((flags & stopFlags) !== 0) {
			stop |= flags & COMMA_FLAG;
			break;
		}
		if ((flags & OWS) !== 0) {
			if (whitespace === -1) whitespace = index;
		} else whitespace = -1;
		typeFlags |= code & NON_ASCII | flags;
		index++;
	}
	const valueEnd = whitespace === -1 ? index : whitespace;
	const value = header.slice(valueStart, valueEnd);
	const type = (typeFlags & CASE_FLAGS) === 0 ? value : value.toLowerCase();
	if (index === len || stop !== 0) return {
		type,
		index,
		parameters: new NullObject()
	};
	return parseParameters(header, type, index, len, stopFlags);
}
/**
* Parses the parameters of a `Content-Type` header starting at the given index.
*/
function parseParameters(header, type, index, len, stopFlags) {
	const parameters = new NullObject();
	parameter: while (index < len) {
		index++;
		while ((CHAR_MAP[header.charCodeAt(index)] & OWS) !== 0) index++;
		const keyStart = index;
		let keyFlags = 0;
		let keyWhitespace = -1;
		while (index < len) {
			const code = header.charCodeAt(index);
			const flags = CHAR_MAP[code];
			if ((flags & stopFlags) !== 0) {
				if ((flags & COMMA_FLAG) !== 0) break parameter;
				continue parameter;
			}
			if (code === EQ) {
				const keyEnd = keyWhitespace === -1 ? index : keyWhitespace;
				const value = header.slice(keyStart, keyEnd);
				const key = (keyFlags & CASE_FLAGS) === 0 ? value : value.toLowerCase();
				index++;
				while ((CHAR_MAP[header.charCodeAt(index)] & OWS) !== 0) index++;
				if (index < len && header.charCodeAt(index) === DQUOTE) {
					const quotedStart = ++index;
					let escaped = false;
					while (index < len) {
						const code = header.charCodeAt(index);
						if (code === DQUOTE) {
							if (parameters[key] === void 0) parameters[key] = escaped ? unescapeQuotedPairs(header, quotedStart, index) : header.slice(quotedStart, index);
							index++;
							let stop = 0;
							while (index < len) {
								const code = header.charCodeAt(index);
								const flags = CHAR_MAP[code];
								if ((flags & stopFlags) !== 0) {
									stop = flags & COMMA_FLAG;
									break;
								}
								index++;
							}
							if (stop !== 0) break parameter;
							continue parameter;
						}
						if (code === BSLASH && index + 1 < len) {
							escaped = true;
							index += 2;
							continue;
						}
						index++;
					}
					continue parameter;
				}
				const valueStart = index;
				let stop = 0;
				let valueWhitespace = -1;
				while (index < len) {
					const code = header.charCodeAt(index);
					const flags = CHAR_MAP[code];
					if ((flags & stopFlags) !== 0) {
						stop = flags & COMMA_FLAG;
						break;
					}
					if ((flags & OWS) !== 0) {
						if (valueWhitespace === -1) valueWhitespace = index;
					} else valueWhitespace = -1;
					index++;
				}
				if (parameters[key] === void 0) {
					const valueEnd = valueWhitespace === -1 ? index : valueWhitespace;
					parameters[key] = header.slice(valueStart, valueEnd);
				}
				if (stop !== 0) break parameter;
				continue parameter;
			}
			if ((flags & OWS) !== 0) {
				if (keyWhitespace === -1) keyWhitespace = index;
			} else keyWhitespace = -1;
			keyFlags |= code & NON_ASCII | flags;
			index++;
		}
	}
	return {
		type,
		index,
		parameters
	};
}
/**
* Remove backslashes from quoted pairs in a known-terminated quoted string body.
*/
function unescapeQuotedPairs(str, start, end) {
	let result = "";
	for (let index = start; index < end; index++) if (str.charCodeAt(index) === BSLASH) {
		result += str.slice(start, index);
		start = ++index;
	}
	return result + str.slice(start, end);
}
// node_modules/json-with-bigint/json-with-bigint.js
const intRegex = /^-?\d+$/;
const noiseValue = /^-?\d+n+$/;
const originalStringify = JSON.stringify;
const originalParse = JSON.parse;
const customFormat = /^-?\d+n$/;
const bigIntsStringify = /([\[:])?"(-?\d+)n"($|\s*[,\}\]])/g;
const noiseStringify = /([\[:])?("-?\d+n+)n("$|"\s*[,\}\]])/g;
/**
* @typedef {(this: any, key: string | number | undefined, value: any) => any} Replacer
* @typedef {(key: string | number | undefined, value: any, context?: { source: string }) => any} Reviver
*/
/**
* Checks if a value is unstringifiable according to native JSON.stringify rules.
*
* @param {any} val The value to check.
* @returns {boolean} True if the value is undefined, a function, or a symbol.
*/
const isUnstringifiable = (val) => val === void 0 || typeof val === "function" || typeof val === "symbol";
/**
* Checks if a value is a native JSON.rawJSON object (Node.js 22+).
*
* @param {any} val The value to check.
* @returns {boolean} True if the value is a RawJSON instance.
*/
const isRawJSON = (val) => val !== null && typeof val === "object" && val.constructor && val.constructor.name === "RawJSON";
/**
* Iteratively converts a JS value to a JSON string.
* Used as a fallback when the native JSON.stringify hits the Maximum Call Stack size.
* Fully compliant with JSON formatting (space), replacers, and toJSON behaviors.
*
* @param {any} rootValue The value to stringify.
* @param {Replacer | Array<string | number> | null} [replacer] User's custom replacer function.
* @param {string | number} [spaceParam] Indentation for pretty-printing.
* @returns {string | undefined} The generated JSON string.
*/
const stringifyIteratively = (rootValue, replacer, spaceParam) => {
	let space = "";
	if (typeof spaceParam === "number") space = " ".repeat(Math.min(10, Math.max(0, Math.floor(spaceParam))));
	else if (typeof spaceParam === "string") space = spaceParam.slice(0, 10);
	const isFunctionReplacer = typeof replacer === "function";
	const propertyList = Array.isArray(replacer) ? new Set(replacer.map(String)) : null;
	/**
	* Prepares a value for stringification by resolving toJSON, handling BigInts,
	* applying custom replacers, and unwrapping primitive objects.
	*
	* @param {object|Array} parent The parent object or array holding the value.
	* @param {string} key The key associated with the value.
	* @param {any} val The raw value to process.
	* @returns {any} The processed value ready for stringification.
	*/
	const prepareVal = (parent, key, val) => {
		if (val !== null && typeof val === "object" && typeof val.toJSON === "function") val = val.toJSON(key);
		if (typeof val === "string" && noiseValue.test(val)) return val + "n";
		if (typeof val === "bigint") {
			if ("rawJSON" in JSON) return JSON.rawJSON(val.toString());
			return val.toString() + "n";
		}
		if (isFunctionReplacer) val = replacer.call(parent, key, val);
		if (val !== null && typeof val === "object") {
			if (val instanceof Number || val instanceof String || val instanceof Boolean) val = val.valueOf();
		}
		return val;
	};
	const rootProcessed = prepareVal({ "": rootValue }, "", rootValue);
	if (isUnstringifiable(rootProcessed)) return;
	const isRootPrimitive = rootProcessed === null || typeof rootProcessed !== "object";
	const isRootNativeRawJSON = isRawJSON(rootProcessed);
	if (isRootPrimitive || isRootNativeRawJSON) return originalStringify(rootProcessed);
	const chunks = [];
	let level = 0;
	const stack = [{
		parent: { "": rootProcessed },
		key: "",
		val: rootProcessed,
		isArray: Array.isArray(rootProcessed),
		keys: Array.isArray(rootProcessed) ? null : Object.keys(rootProcessed),
		index: 0,
		first: true
	}];
	const visited = new WeakSet([rootProcessed]);
	while (stack.length > 0) {
		const node = stack[stack.length - 1];
		if (node.index === 0) {
			chunks.push(node.isArray ? "[" : "{");
			level++;
		}
		let isDone = false;
		if (node.isArray) {
			if (node.index < node.val.length) {
				if (!node.first) chunks.push(",");
				if (space) chunks.push("\n" + space.repeat(level));
				const childRaw = node.val[node.index];
				const childVal = prepareVal(node.val, String(node.index), childRaw);
				if (isUnstringifiable(childVal)) {
					chunks.push("null");
					node.first = false;
					node.index++;
				} else {
					const isComplexObject = childVal !== null && typeof childVal === "object";
					const isNativeRaw = isRawJSON(childVal);
					if (isComplexObject && !isNativeRaw) {
						if (visited.has(childVal)) throw new TypeError("Converting circular structure to JSON");
						visited.add(childVal);
						stack.push({
							parent: node.val,
							key: String(node.index),
							val: childVal,
							isArray: Array.isArray(childVal),
							keys: Array.isArray(childVal) ? null : Object.keys(childVal),
							index: 0,
							first: true
						});
						node.first = false;
						node.index++;
					} else {
						chunks.push(originalStringify(childVal));
						node.first = false;
						node.index++;
					}
				}
			} else isDone = true;
		} else {
			while (node.index < node.keys.length) {
				const k = node.keys[node.index++];
				if (propertyList && !propertyList.has(k)) continue;
				const childRaw = node.val[k];
				const childVal = prepareVal(node.val, k, childRaw);
				if (isUnstringifiable(childVal)) continue;
				if (!node.first) chunks.push(",");
				if (space) chunks.push("\n" + space.repeat(level) + originalStringify(k) + ": ");
				else chunks.push(originalStringify(k) + ":");
				const isComplexObject = childVal !== null && typeof childVal === "object";
				const isNativeRaw = isRawJSON(childVal);
				if (isComplexObject && !isNativeRaw) {
					if (visited.has(childVal)) throw new TypeError("Converting circular structure to JSON");
					visited.add(childVal);
					stack.push({
						parent: node.val,
						key: k,
						val: childVal,
						isArray: Array.isArray(childVal),
						keys: Array.isArray(childVal) ? null : Object.keys(childVal),
						index: 0,
						first: true
					});
					node.first = false;
					break;
				} else {
					chunks.push(originalStringify(childVal));
					node.first = false;
				}
			}
			if (node.index >= node.keys.length && stack[stack.length - 1] === node) isDone = true;
		}
		if (isDone) {
			level--;
			if (!node.first && space) chunks.push("\n" + space.repeat(level));
			chunks.push(node.isArray ? "]" : "}");
			visited.delete(node.val);
			stack.pop();
		}
	}
	return chunks.join("");
};
/**
* Converts a JavaScript value to a JSON string.
*
* Supports serialization of BigInt values using two strategies:
* 1. Custom format "123n" → "123" (universal fallback)
* 2. Native JSON.rawJSON() (Node.js 22+, fastest) when available
*
* All other values are serialized exactly like native JSON.stringify().
*
* @param {*} value The value to convert to a JSON string.
* @param {Replacer | Array<string | number> | null} [replacer]
* A function that alters the behavior of the stringification process,
* or an array of strings/numbers to indicate properties to exclude.
* @param {string | number} [space]
* A string or number to specify indentation or pretty-printing.
* @returns {string} The JSON string representation.
*/
const JSONStringify = (value, replacer, space) => {
	try {
		if ("rawJSON" in JSON) return originalStringify(value, (key, val) => {
			if (typeof val === "bigint") return JSON.rawJSON(val.toString());
			if (typeof replacer === "function") return replacer(key, val);
			if (Array.isArray(replacer) && replacer.includes(key)) return val;
			return val;
		}, space);
		if (!value) return originalStringify(value, replacer, space);
		return originalStringify(value, (key, val) => {
			if (typeof val === "string" && noiseValue.test(val)) return val.toString() + "n";
			if (typeof val === "bigint") return val.toString() + "n";
			if (typeof replacer === "function") return replacer(key, val);
			if (Array.isArray(replacer) && replacer.includes(key)) return val;
			return val;
		}, space).replace(bigIntsStringify, "$1$2$3").replace(noiseStringify, "$1$2$3");
	} catch (error) {
		if (error instanceof RangeError) {
			const convertedJSON = stringifyIteratively(value, replacer, space);
			if (convertedJSON === void 0) return void 0;
			if ("rawJSON" in JSON) return convertedJSON;
			return convertedJSON.replace(bigIntsStringify, "$1$2$3").replace(noiseStringify, "$1$2$3");
		}
		throw error;
	}
};
const featureCache = /* @__PURE__ */ new Map();
/**
* Detects if the current JSON.parse implementation supports the context.source feature.
*
* Uses toString() fingerprinting to cache results and automatically detect runtime
* replacements of JSON.parse (polyfills, mocks, etc.).
*
* @returns {boolean} true if context.source is supported, false otherwise.
*/
const isContextSourceSupported = () => {
	const parseFingerprint = JSON.parse.toString();
	if (featureCache.has(parseFingerprint)) return featureCache.get(parseFingerprint);
	try {
		const result = JSON.parse("1", (_, __, context) => !!context?.source && context.source === "1");
		featureCache.set(parseFingerprint, result);
		return result;
	} catch {
		featureCache.set(parseFingerprint, false);
		return false;
	}
};
/**
* Reviver function that converts custom-format BigInt strings back to BigInt values.
* Also handles "noise" strings that accidentally match the BigInt format.
*
* @param {string | number | undefined} key The object key.
* @param {*} value The value being parsed.
* @param {object} [context] Parse context (if supported by JSON.parse).
* @param {Reviver} [userReviver] User's custom reviver function.
* @returns {any} The transformed value.
*/
const convertMarkedBigIntsReviver = (key, value, context, userReviver) => {
	if (typeof value === "string" && customFormat.test(value)) return BigInt(value.slice(0, -1));
	if (typeof value === "string" && noiseValue.test(value)) return value.slice(0, -1);
	if (!(typeof userReviver === "function")) return value;
	return userReviver(key, value, context);
};
/**
* Fast JSON.parse implementation (~2x faster than classic fallback).
* Uses JSON.parse's context.source feature to detect integers and convert
* large numbers directly to BigInt without string manipulation.
*
* Does not support legacy custom format from v1 of this library.
*
* @param {string} text JSON string to parse.
* @param {Reviver} [reviver] Transform function to apply to each value.
* @returns {any} Parsed JavaScript value.
*/
const JSONParseV2 = (text, reviver) => {
	return JSON.parse(text, (key, value, context) => {
		const isBigNumber = typeof value === "number" && (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER);
		const isInt = context && intRegex.test(context.source);
		if (isBigNumber && isInt) return BigInt(context.source);
		if (!(typeof reviver === "function")) return value;
		return reviver(key, value, context);
	});
};
const MAX_INT = Number.MAX_SAFE_INTEGER.toString();
const MAX_DIGITS = MAX_INT.length;
const stringsOrLargeNumbers = /"(?:[^"\\]|\\.)*"|-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?/g;
const noiseValueWithQuotes = /^"-?\d+n+"$/;
/**
* Iteratively traverses the parsed object bottom-up (post-order),
* emulating the native JSON.parse reviver behavior.
* This avoids Call Stack overflows (RangeError) on deeply nested structures.
*
* @param {any} parsed The natively parsed JSON object.
* @param {Reviver} [userReviver] User's custom reviver function.
* @returns {any} The fully processed object.
*/
const applyReviverIteratively = (parsed, userReviver) => {
	const rootHolder = { "": parsed };
	const stack = [{
		parent: rootHolder,
		key: "",
		visited: false
	}];
	while (stack.length > 0) {
		const node = stack[stack.length - 1];
		if (!node.visited) {
			node.visited = true;
			const value = node.parent[node.key];
			if (value !== null && typeof value === "object") {
				const keys = Object.keys(value);
				for (let i = keys.length - 1; i >= 0; i--) stack.push({
					parent: value,
					key: keys[i],
					visited: false
				});
			}
		} else {
			const { parent, key } = node;
			let value = parent[key];
			if (typeof value === "string") {
				if (customFormat.test(value)) value = BigInt(value.slice(0, -1));
				else if (noiseValue.test(value)) value = value.slice(0, -1);
			}
			if (typeof userReviver === "function") value = userReviver.call(parent, key, value);
			if (value === void 0) delete parent[key];
			else parent[key] = value;
			stack.pop();
		}
	}
	return rootHolder[""];
};
/**
* Pre-processes the JSON string to mark large numbers with an 'n' suffix.
*
* @param {string} text The raw JSON string.
* @returns {string} The serialized string with marked BigInts.
*/
const serializeBigInts = (text) => {
	return text.replace(stringsOrLargeNumbers, (match, digits, fractional, exponential) => {
		const isString = match[0] === "\"";
		if (isString && noiseValueWithQuotes.test(match)) return match.substring(0, match.length - 1) + "n\"";
		const hasFractionalOrExponential = fractional || exponential;
		const isLessThanMaxSafeInt = digits && (digits.length < MAX_DIGITS || digits.length === MAX_DIGITS && digits <= MAX_INT);
		if (isString || hasFractionalOrExponential || isLessThanMaxSafeInt) return match;
		return "\"" + match + "n\"";
	});
};
/**
* Converts a JSON string into a JavaScript value.
*
* Supports parsing of large integers using two strategies:
* 1. Classic fallback: Marks large numbers with "123n" format, then converts to BigInt
* 2. Fast path (JSONParseV2): Uses context.source feature (~2x faster) when available
*
* All other JSON values are parsed exactly like native JSON.parse().
*
* @param {string} text A valid JSON string.
* @param {Reviver} [reviver]
* A function that transforms the results. This function is called for each member
* of the object. If a member contains nested objects, the nested objects are
* transformed before the parent object is.
* @returns {any} The parsed JavaScript value.
* @throws {SyntaxError} If text is not valid JSON.
*/
const JSONParse = (text, reviver) => {
	if (!text) return originalParse(text, reviver);
	try {
		if (isContextSourceSupported()) return JSONParseV2(text, reviver);
		const serializedData = serializeBigInts(text);
		return originalParse(serializedData, (key, value, context) => convertMarkedBigIntsReviver(key, value, context, reviver));
	} catch (error) {
		if (error instanceof RangeError) {
			const serializedData = serializeBigInts(text);
			const parsed = originalParse(serializedData);
			return applyReviverIteratively(parsed, reviver);
		}
		throw error;
	}
};
// node_modules/@octokit/request-error/dist-src/index.js
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
		super(message, { cause: options.cause });
		this.name = "HttpError";
		this.status = Number.parseInt(statusCode);
		if (Number.isNaN(this.status)) this.status = 0;
		/* v8 ignore else -- @preserve -- Bug with vitest coverage where it sees an else branch that doesn't exist */
		if ("response" in options) this.response = options.response;
		const requestCopy = Object.assign({}, options.request);
		if (options.request.headers.authorization) requestCopy.headers = Object.assign({}, options.request.headers, { authorization: options.request.headers.authorization.replace(/(?<! ) .*$/, " [REDACTED]") });
		requestCopy.url = requestCopy.url.replace(/\bclient_secret=\w+/g, "client_secret=[REDACTED]").replace(/\baccess_token=\w+/g, "access_token=[REDACTED]");
		this.request = requestCopy;
	}
};
// node_modules/@octokit/request/dist-bundle/index.js
var defaults_default = { headers: { "user-agent": `octokit-request.js/10.0.16 ${getUserAgent()}` } };
function isPlainObject(value) {
	if (typeof value !== "object" || value === null) return false;
	if (Object.prototype.toString.call(value) !== "[object Object]") return false;
	const proto = Object.getPrototypeOf(value);
	if (proto === null) return true;
	const Ctor = Object.prototype.hasOwnProperty.call(proto, "constructor") && proto.constructor;
	return typeof Ctor === "function" && Ctor instanceof Ctor && Function.prototype.call(Ctor) === Function.prototype.call(value);
}
var noop = () => "";
async function fetchWrapper(requestOptions) {
	const fetch = requestOptions.request?.fetch || globalThis.fetch;
	if (!fetch) throw new Error("fetch is not set. Please pass a fetch implementation as new Octokit({ request: { fetch }}). Learn more at https://github.com/octokit/octokit.js/#fetch-missing");
	const log = requestOptions.request?.log || console;
	const parseSuccessResponseBody = requestOptions.request?.parseSuccessResponseBody !== false;
	const body = isPlainObject(requestOptions.body) || Array.isArray(requestOptions.body) ? JSONStringify(requestOptions.body) : requestOptions.body;
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
		const requestError = new RequestError(message, 500, { request: requestOptions });
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
		throw new RequestError(fetchResponse.statusText, status, {
			response: octokitResponse,
			request: requestOptions
		});
	}
	if (status === 304) {
		octokitResponse.data = await getResponseData(fetchResponse);
		throw new RequestError("Not modified", status, {
			response: octokitResponse,
			request: requestOptions
		});
	}
	if (status >= 400) {
		octokitResponse.data = await getResponseData(fetchResponse);
		throw new RequestError(toErrorMessage(octokitResponse.data), status, {
			response: octokitResponse,
			request: requestOptions
		});
	}
	octokitResponse.data = parseSuccessResponseBody ? await getResponseData(fetchResponse) : fetchResponse.body;
	return octokitResponse;
}
async function getResponseData(response) {
	const contentType = response.headers.get("content-type");
	if (!contentType) return response.text().catch(noop);
	const mimetype = parse(contentType);
	if (isJSONResponse(mimetype)) {
		let text = "";
		try {
			text = await response.text();
			return JSONParse(text);
		} catch (err) {
			return text;
		}
	} else if (mimetype.type.startsWith("text/") || mimetype.parameters.charset?.toLowerCase() === "utf-8" && mimetype.type !== "application/octet-stream") return response.text().catch(noop);
	else return response.arrayBuffer().catch(
		/* v8 ignore next -- @preserve */
		() => /* @__PURE__ */ new ArrayBuffer(0)
	);
}
function isJSONResponse(mimetype) {
	return mimetype.type === "application/json" || mimetype.type === "application/scim+json";
}
function toErrorMessage(data) {
	if (typeof data === "string") return data;
	if (data instanceof ArrayBuffer) return "Unknown error";
	if (typeof data === "object" && data !== null && "message" in data) {
		const objectData = data;
		const suffix = "documentation_url" in objectData ? ` - ${objectData.documentation_url}` : "";
		return Array.isArray(objectData.errors) ? `${objectData.message}: ${objectData.errors.map((v) => JSON.stringify(v)).join(", ")}${suffix}` : `${objectData.message}${suffix}`;
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
/* v8 ignore next -- @preserve */
/* v8 ignore else -- @preserve */
export { RequestError as n, getUserAgent as r, request as t };
