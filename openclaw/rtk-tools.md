# RTK - Rust Token Killer

**Usage**: Token-optimized CLI proxy (60-90% savings on dev operations)

## How It Works

The RTK plugin automatically rewrites your `exec` commands to use RTK filters.
For example, `git status` becomes `rtk git status` transparently.
You do NOT need to manually prefix commands with `rtk` — the plugin handles it.

## Meta Commands (use these directly)

```bash
rtk gain              # Show token savings analytics
rtk gain --history    # Show command usage history with savings
rtk discover          # Analyze session history for missed opportunities
rtk proxy <cmd>       # Execute raw command without filtering (for debugging)
```

## Installation Verification

```bash
rtk --version         # Should show: rtk X.Y.Z
rtk gain              # Should work (not "command not found")
which rtk             # Verify correct binary
```

## Hook-Based Usage

All other commands are automatically rewritten by the OpenClaw RTK plugin.
Example: `git status` → `rtk git status` (transparent, 0 tokens overhead)
