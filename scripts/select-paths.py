#!/usr/bin/env python3
"""Select and validate repository-specific dorny/paths-filter rules."""
import argparse
import json
from pathlib import Path
import yaml

def select(config, repository):
    if config.get("version") != 1:
        raise ValueError("Unsupported paths config version")
    repositories = config.get("repositories") or {}
    if repository not in repositories:
        raise ValueError(f"No path filters configured for {repository!r}")
    defaults = (config.get("defaults") or {}).get("filters") or {}
    custom = (repositories[repository] or {}).get("filters") or {}
    result = {**defaults, **custom}
    if not result:
        raise ValueError("At least one filter is required")
    for name, patterns in result.items():
        if not isinstance(name, str) or not isinstance(patterns, list) or not patterns:
            raise ValueError(f"Invalid filter {name!r}")
        if not all(isinstance(p, str) and p.strip() for p in patterns):
            raise ValueError(f"Invalid glob in filter {name!r}")
    return result

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", required=True)
    parser.add_argument("--repository", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    with Path(args.config).open() as stream:
        config = yaml.safe_load(stream)
    rules = select(config, args.repository)
    with Path(args.output).open("w") as stream:
        yaml.safe_dump(rules, stream, sort_keys=True)
    print(json.dumps({"repository": args.repository, "filters": list(rules)}))

if __name__ == "__main__":
    main()
