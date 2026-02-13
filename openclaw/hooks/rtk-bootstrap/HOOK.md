---
name: rtk-bootstrap
description: "Injects RTK (Rust Token Killer) awareness into agent context for token-optimized command execution"
homepage: https://github.com/aimagist/openrtklaw
metadata:
  {
    "openclaw":
      {
        "emoji": "⚡",
        "events": ["agent:bootstrap"],
        "requires": { "bins": ["rtk"] },
      },
  }
---

# RTK Bootstrap Hook

Injects RTK awareness instructions into the agent's bootstrap context so the agent knows about RTK meta commands (`rtk gain`, `rtk discover`, `rtk proxy`) and understands that shell commands are being transparently rewritten by the RTK plugin.

## What It Does

- Listens for `agent:bootstrap` events
- Appends a slim RTK awareness document to `context.bootstrapFiles`
- Teaches the agent about RTK meta commands and verification
- Minimal token footprint (~15 lines)

## Requirements

- `rtk` binary must be installed and on PATH
- Works alongside the `rtk-rewrite` plugin for full integration

## Configuration

No configuration needed. Enable/disable via `openclaw hooks enable/disable rtk-bootstrap`.
