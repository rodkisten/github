# Universal executor

Keep src/run (workflow dispatch) backward compatible. Introduce src/execute for workspace bootstrap and custom execution, then consider a compatibility facade.

Detection precedence: explicit manager, packageManager, unique lockfile, npm for package.json, none otherwise. Conflicting lockfiles without an explicit choice fail. Node engine ranges are metadata, not yet resolved to a concrete version.

Planned inputs: runtime, package-manager, node-version, package-manager-version, working-directory, install, install-args, cache, language, script, file, args, token. Exactly one of script or file. Shell and JavaScript execution must preserve exit status and expose outputs. Use official setup/cache actions where possible; never interpolate untrusted GitHub event fields into executable source. Keep secrets scoped to execution.

Phase 1: detection and tests. Phase 2: bootstrap and shell execution. Phase 3: JavaScript context and helpers. Phase 4: consumer migration (Userscripts and Manage first).
