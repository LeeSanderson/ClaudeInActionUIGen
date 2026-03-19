"use client";

import type { ToolInvocation } from "ai";
import { Loader2 } from "lucide-react";

export function getToolLabel(
  toolName: string,
  args: Record<string, any> | undefined
): string {
  if (!args || !args.command) {
    return `Using ${toolName}...`;
  }

  const { command, path } = args;

  if (toolName === "str_replace_editor") {
    if (!path) return `Using ${toolName}...`;
    switch (command) {
      case "create":
        return `Creating ${path}`;
      case "str_replace":
        return `Editing ${path}`;
      case "insert":
        return `Inserting into ${path}`;
      case "view":
        return `Viewing ${path}`;
      case "undo_edit":
        return `Undoing edit to ${path}`;
      default:
        return `Editing ${path}`;
    }
  }

  if (toolName === "file_manager") {
    if (!path) return `Using ${toolName}...`;
    switch (command) {
      case "rename":
        return args.new_path
          ? `Renaming ${path} to ${args.new_path}`
          : `Renaming ${path}`;
      case "delete":
        return `Deleting ${path}`;
      default:
        return `Managing ${path}`;
    }
  }

  return toolName;
}

interface ToolInvocationStatusProps {
  toolInvocation: ToolInvocation;
}

export function ToolInvocationStatus({
  toolInvocation,
}: ToolInvocationStatusProps) {
  const isCompleted =
    toolInvocation.state === "result" && toolInvocation.result;
  const label = getToolLabel(toolInvocation.toolName, toolInvocation.args);

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isCompleted ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
