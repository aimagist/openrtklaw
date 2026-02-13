/**
 * RTK Rewrite Plugin for OpenClaw
 *
 * Transparently rewrites shell commands executed via the `exec` tool
 * to their RTK equivalents, achieving 60-90% LLM token savings.
 *
 * Equivalent to hooks/rtk-rewrite.sh for Claude Code, but as a
 * cross-platform TypeScript OpenClaw plugin using before_tool_call.
 */

import type { PluginAPI } from "openclaw/plugin-sdk";

// ---------------------------------------------------------------------------
// Rewrite rules
// ---------------------------------------------------------------------------

interface RewriteRule {
  /** Regex tested against the command string */
  pattern: RegExp;
  /** Replacement applied via String.replace(pattern, replacement) */
  replacement: string;
}

/**
 * Ordered list of rewrite rules.  First match wins.
 * Mirrors the logic in hooks/rtk-rewrite.sh exactly.
 */
const REWRITE_RULES: RewriteRule[] = [
  // --- Git commands ---
  { pattern: /^git\s+status(\s|$)/, replacement: "rtk git status$1" },
  { pattern: /^git\s+diff(\s|$)/, replacement: "rtk git diff$1" },
  { pattern: /^git\s+log(\s|$)/, replacement: "rtk git log$1" },
  { pattern: /^git\s+add(\s|$)/, replacement: "rtk git add$1" },
  { pattern: /^git\s+commit(\s|$)/, replacement: "rtk git commit$1" },
  { pattern: /^git\s+push(\s|$)/, replacement: "rtk git push$1" },
  { pattern: /^git\s+pull(\s|$)/, replacement: "rtk git pull$1" },
  { pattern: /^git\s+branch(\s|$)/, replacement: "rtk git branch$1" },
  { pattern: /^git\s+fetch(\s|$)/, replacement: "rtk git fetch$1" },
  { pattern: /^git\s+stash(\s|$)/, replacement: "rtk git stash$1" },
  { pattern: /^git\s+show(\s|$)/, replacement: "rtk git show$1" },

  // --- GitHub CLI ---
  { pattern: /^gh\s+(pr|issue|run)(\s|$)/, replacement: "rtk gh $1$2" },

  // --- Cargo ---
  { pattern: /^cargo\s+test(\s|$)/, replacement: "rtk cargo test$1" },
  { pattern: /^cargo\s+build(\s|$)/, replacement: "rtk cargo build$1" },
  { pattern: /^cargo\s+clippy(\s|$)/, replacement: "rtk cargo clippy$1" },

  // --- File operations ---
  { pattern: /^cat\s+/, replacement: "rtk read " },
  { pattern: /^(rg|grep)\s+/, replacement: "rtk grep " },
  { pattern: /^ls(\s|$)/, replacement: "rtk ls$1" },

  // --- JS/TS tooling ---
  { pattern: /^(pnpm\s+)?vitest(\s|$)/, replacement: "rtk vitest run$2" },
  { pattern: /^pnpm\s+test(\s|$)/, replacement: "rtk vitest run$1" },
  { pattern: /^pnpm\s+tsc(\s|$)/, replacement: "rtk tsc$1" },
  { pattern: /^(npx\s+)?tsc(\s|$)/, replacement: "rtk tsc$2" },
  { pattern: /^pnpm\s+lint(\s|$)/, replacement: "rtk lint$1" },
  { pattern: /^(npx\s+)?eslint(\s|$)/, replacement: "rtk lint$2" },
  { pattern: /^(npx\s+)?prettier(\s|$)/, replacement: "rtk prettier$2" },
  { pattern: /^(npx\s+)?playwright(\s|$)/, replacement: "rtk playwright$2" },
  { pattern: /^pnpm\s+playwright(\s|$)/, replacement: "rtk playwright$1" },
  { pattern: /^(npx\s+)?prisma(\s|$)/, replacement: "rtk prisma$2" },

  // --- Containers ---
  {
    pattern: /^docker\s+(ps|images|logs)(\s|$)/,
    replacement: "rtk docker $1$2",
  },
  { pattern: /^kubectl\s+(get|logs)(\s|$)/, replacement: "rtk kubectl $1$2" },

  // --- Network ---
  { pattern: /^curl\s+/, replacement: "rtk curl " },

  // --- pnpm package management ---
  {
    pattern: /^pnpm\s+(list|ls|outdated)(\s|$)/,
    replacement: "rtk pnpm $1$2",
  },

  // --- Python tooling ---
  { pattern: /^pytest(\s|$)/, replacement: "rtk pytest$1" },
  {
    pattern: /^python\s+-m\s+pytest(\s|$)/,
    replacement: "rtk pytest$1",
  },
  { pattern: /^ruff\s+(check|format)(\s|$)/, replacement: "rtk ruff $1$2" },
  {
    pattern: /^pip\s+(list|outdated|install|show)(\s|$)/,
    replacement: "rtk pip $1$2",
  },
  {
    pattern: /^uv\s+pip\s+(list|outdated|install|show)(\s|$)/,
    replacement: "rtk pip $1$2",
  },

  // --- Go tooling ---
  { pattern: /^go\s+test(\s|$)/, replacement: "rtk go test$1" },
  { pattern: /^go\s+build(\s|$)/, replacement: "rtk go build$1" },
  { pattern: /^go\s+vet(\s|$)/, replacement: "rtk go vet$1" },
  { pattern: /^golangci-lint(\s|$)/, replacement: "rtk golangci-lint$1" },
];

// ---------------------------------------------------------------------------
// Guard helpers
// ---------------------------------------------------------------------------

/** Returns true if the command should be skipped (no rewrite). */
function shouldSkip(cmd: string): boolean {
  // Already using rtk
  if (/^rtk\s/.test(cmd) || /\/rtk\s/.test(cmd)) return true;
  // Heredocs
  if (cmd.includes("<<")) return true;
  return false;
}

/**
 * Attempt to rewrite a command string.
 * Returns the rewritten command or null if no rule matched.
 */
function tryRewrite(cmd: string): string | null {
  if (shouldSkip(cmd)) return null;

  for (const rule of REWRITE_RULES) {
    if (rule.pattern.test(cmd)) {
      return cmd.replace(rule.pattern, rule.replacement);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Plugin registration
// ---------------------------------------------------------------------------

export default function register(api: PluginAPI) {
  const pluginConfig = api.config ?? {};
  const enabled = pluginConfig.enabled !== false;
  const verbose = pluginConfig.verbose === true;

  if (!enabled) {
    if (verbose) console.log("[rtk-rewrite] Plugin disabled via config");
    return;
  }

  // Register before_tool_call hook to intercept exec commands
  api.on("before_tool_call", (event: any) => {
    // Only intercept the exec tool
    if (event.toolName !== "exec") return;

    const command: string | undefined = event.params?.command;
    if (!command) return;

    const rewritten = tryRewrite(command);
    if (!rewritten) return;

    if (verbose) {
      console.log(`[rtk-rewrite] ${command} → ${rewritten}`);
    }

    // Mutate the command parameter in place
    event.params.command = rewritten;
  });

  if (verbose) {
    console.log(
      `[rtk-rewrite] Plugin registered (${REWRITE_RULES.length} rewrite rules)`
    );
  }
}

// ---------------------------------------------------------------------------
// Exports for testing
// ---------------------------------------------------------------------------

export { tryRewrite, shouldSkip, REWRITE_RULES };
