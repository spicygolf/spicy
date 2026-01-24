#!/usr/bin/env bun
/**
 * Skill Activation & Progress Hook
 *
 * Triggered on UserPromptSubmit to:
 * 1. Inject relevant skill context based on keywords
 * 2. Remind about progress tracking and decomposition
 */

import { existsSync, readFileSync } from "fs";
import { join } from "path";

interface SkillRule {
  name: string;
  description: string;
  triggers: {
    keywords?: string[];
    filePatterns?: string[];
    always?: boolean;
  };
  skillPath: string;
  priority: number;
}

interface SkillRulesConfig {
  skills: SkillRule[];
}

interface ProgressState {
  hasActiveTask: boolean;
  currentTask: string | null;
  inProgressStep: string | null;
}

function loadSkillRules(): SkillRulesConfig {
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const skillRulesPath = join(
    projectDir,
    ".claude",
    "skills",
    "skill-rules.json",
  );
  if (!existsSync(skillRulesPath)) {
    return { skills: [] };
  }
  const content = readFileSync(skillRulesPath, "utf-8");
  return JSON.parse(content) as SkillRulesConfig;
}

function loadProgressState(): ProgressState {
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const progressPath = join(
    projectDir,
    ".claude",
    "progress",
    "claude-progress.md",
  );

  if (!existsSync(progressPath)) {
    return { hasActiveTask: false, currentTask: null, inProgressStep: null };
  }

  const content = readFileSync(progressPath, "utf-8");

  // Parse current task
  const taskMatch = content.match(/\*\*Task\*\*:\s*(.+)/);
  const statusMatch = content.match(/\*\*Status\*\*:\s*(\w+)/);
  const currentTask = taskMatch?.[1]?.trim();
  const status = statusMatch?.[1]?.trim();

  // Find in_progress step
  const stepMatch = content.match(/\|\s*\d+\s*\|[^|]+\|\s*in_progress\s*\|/);
  const inProgressStep = stepMatch ? "yes" : null;

  const hasActiveTask =
    status === "in_progress" && currentTask && currentTask !== "[Not started]";

  return {
    hasActiveTask: Boolean(hasActiveTask),
    currentTask: hasActiveTask ? currentTask : null,
    inProgressStep,
  };
}

function matchesKeywords(prompt: string, keywords: string[]): boolean {
  const lowerPrompt = prompt.toLowerCase();
  return keywords.some((keyword) =>
    lowerPrompt.includes(keyword.toLowerCase()),
  );
}

function getActivatedSkills(
  prompt: string,
  config: SkillRulesConfig,
): SkillRule[] {
  const activated: SkillRule[] = [];

  for (const skill of config.skills) {
    if (skill.triggers.always) {
      activated.push(skill);
      continue;
    }

    if (
      skill.triggers.keywords &&
      matchesKeywords(prompt, skill.triggers.keywords)
    ) {
      activated.push(skill);
    }
  }

  return activated.sort((a, b) => b.priority - a.priority);
}

function loadSkillContent(skillPath: string): string | null {
  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const basePath = join(projectDir, ".claude", "skills");
  const fullPath = join(basePath, skillPath, "README.md");

  if (!existsSync(fullPath)) {
    return null;
  }

  return readFileSync(fullPath, "utf-8");
}

interface HookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode: string;
  hook_event_name: string;
  prompt: string;
}

function main(): void {
  // Parse the JSON input from stdin (passed via CLAUDE_PROMPT env var from shell wrapper)
  const rawInput = process.env.CLAUDE_PROMPT || "";
  let input = "";

  try {
    const parsed = JSON.parse(rawInput) as HookInput;
    input = parsed.prompt || "";
  } catch {
    // Fallback to raw input if not JSON
    input = rawInput;
  }

  const config = loadSkillRules();
  const activatedSkills = getActivatedSkills(input, config);
  const progressState = loadProgressState();

  // Always output context, even if prompt is empty (for always-on skills)
  if (activatedSkills.length === 0 && !progressState.hasActiveTask) {
    return;
  }

  // Output progress reminder
  console.log("\n<!-- Session Context -->");

  if (progressState.hasActiveTask) {
    console.log(`\n## Active Task: ${progressState.currentTask}`);
    if (progressState.inProgressStep) {
      console.log(
        "There is a step marked in_progress. Check .claude/progress/claude-progress.md",
      );
    }
    console.log("Read progress file before starting new work.\n");
  } else {
    console.log("\n## New Task");
    console.log(
      "Remember: Decompose into steps, update progress file, commit after each step.\n",
    );
  }

  // Output activated skills
  if (activatedSkills.length > 0) {
    console.log("## Active Skills");
    for (const skill of activatedSkills) {
      console.log(`- ${skill.name} (${skill.description})`);
    }

    // Inject full content for skills that have keywords matching the prompt
    // This works for both always-on skills and keyword-triggered skills
    const skillsToInjectContent = activatedSkills.filter(
      (s) => s.triggers.keywords && matchesKeywords(input, s.triggers.keywords),
    );

    for (const skill of skillsToInjectContent) {
      const content = loadSkillContent(skill.skillPath);
      if (content) {
        console.log(`\n## Skill: ${skill.name}\n`);
        console.log(content);
      }
    }
  }

  console.log("<!-- End Session Context -->\n");
}

main();
