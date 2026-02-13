/**
 * RTK Bootstrap Hook for OpenClaw
 *
 * Injects RTK awareness instructions into the agent's bootstrap context
 * so the agent knows about meta commands and the rewrite plugin.
 */

import type { HookHandler } from "../../src/hooks/hooks.js";

const RTK_AWARENESS = `# RTK - Rust Token Killer

**Usage**: Token-optimized CLI proxy (60-90% savings on dev operations)

## How It Works

The RTK plugin automatically rewrites your \`exec\` commands to use RTK filters.
For example, \`git status\` becomes \`rtk git status\` transparently.
You do NOT need to manually prefix commands with \`rtk\` — the plugin handles it.

## Meta Commands (use these directly)

\`\`\`bash
rtk gain              # Show token savings analytics
rtk gain --history    # Show command usage history with savings
rtk gain --graph      # ASCII graph of daily savings
rtk discover          # Analyze session history for missed opportunities
rtk proxy <cmd>       # Execute raw command without filtering (for debugging)
\`\`\`

## Installation Verification

\`\`\`bash
rtk --version         # Should show: rtk X.Y.Z
rtk gain              # Should work (not "command not found")
\`\`\`

## Supported Commands

RTK filters output from: git, cargo, gh, grep, ls, cat/read, docker, kubectl,
curl, pnpm, npm, vitest, playwright, prisma, tsc, eslint, prettier, next,
pytest, ruff, pip, go, golangci-lint, and more.
`;

const handler: HookHandler = async (event) => {
  if (event.type !== "agent" || event.action !== "bootstrap") {
    return;
  }

  // Inject RTK awareness into bootstrap files
  if (event.context?.bootstrapFiles) {
    event.context.bootstrapFiles.push({
      name: "RTK.md",
      content: RTK_AWARENESS,
    });
  }

  console.log("[rtk-bootstrap] Injected RTK awareness into agent context");
};

export default handler;
