# 🌈 rodlog in GitHub Actions

## 🧭 Table of contents
- [🚀 Quick start](#-quick-start)
- [🎨 Output modes](#-output-modes)
- [🔐 Integrity and trust](#-integrity-and-trust)
- [🛠️ Troubleshooting](#️-troubleshooting)

## 🚀 Quick start

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: rodkisten/github/src/setup-rodlog@main
  - run: rodlog exec --tool=typescript --mode=transform -- npm run typecheck
  - run: rodlog exec --mode=transform -- npm run build
```

The `@main` example requires a published major-version tag. During development use `./actions/setup-rodlog` after checking out the shared repository itself.

## 🎨 Output modes
- 🌈 `--mode=transform`: readable, structured terminal diagnostics, retaining command exit status.
- 🧩 `--output=github`: recognized GitHub annotations; **does not print all raw log lines**.
- 📋 `--output=jsonl`: machine-readable diagnostic stream.
- 🪵 `--mode=raw`: preserve original command output.

## 🔐 Integrity and trust
The setup action downloads a platform-specific binary and checks its SHA-256 against the published checksum list. This verifies consistency with the mirror, **not publisher authenticity** if the mirror itself is compromised. For stronger provenance, use immutable versioned artifacts, pinned checksums, and signed releases in the future.

## 🛠️ Troubleshooting
- 🌍 **Download 404:** check the rodlog publication workflow in `rodkisten/codespaces`.
- 🔐 **Checksum mismatch:** installation fails without running the binary.
- 🧱 **Unsupported platform:** currently Linux and macOS, x64/arm64.
- 🎨 **Missing color:** GitHub log rendering may differ from a local interactive terminal.
- 🚦 **Build fails:** `rodlog exec` preserves the child command's exit code.
