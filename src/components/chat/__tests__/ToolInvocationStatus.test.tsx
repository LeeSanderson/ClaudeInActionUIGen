import { test, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolInvocationStatus, getToolLabel } from "../ToolInvocationStatus";
import type { ToolInvocation } from "ai";

vi.mock("lucide-react", () => ({
  Loader2: ({ className }: { className?: string }) => (
    <div data-testid="loader" className={className}>
      Loader2
    </div>
  ),
}));

afterEach(() => {
  cleanup();
});

function makeToolInvocation(
  overrides: Partial<ToolInvocation> & { toolName: string; args: any }
): ToolInvocation {
  return {
    toolCallId: "test-id",
    state: "result",
    result: "Success",
    ...overrides,
  } as ToolInvocation;
}

// getToolLabel tests

test("getToolLabel returns Creating for str_replace_editor create", () => {
  expect(
    getToolLabel("str_replace_editor", { command: "create", path: "/App.jsx" })
  ).toBe("Creating /App.jsx");
});

test("getToolLabel returns Editing for str_replace_editor str_replace", () => {
  expect(
    getToolLabel("str_replace_editor", {
      command: "str_replace",
      path: "/App.jsx",
    })
  ).toBe("Editing /App.jsx");
});

test("getToolLabel returns Inserting into for str_replace_editor insert", () => {
  expect(
    getToolLabel("str_replace_editor", { command: "insert", path: "/App.jsx" })
  ).toBe("Inserting into /App.jsx");
});

test("getToolLabel returns Viewing for str_replace_editor view", () => {
  expect(
    getToolLabel("str_replace_editor", { command: "view", path: "/App.jsx" })
  ).toBe("Viewing /App.jsx");
});

test("getToolLabel returns Undoing edit to for str_replace_editor undo_edit", () => {
  expect(
    getToolLabel("str_replace_editor", {
      command: "undo_edit",
      path: "/App.jsx",
    })
  ).toBe("Undoing edit to /App.jsx");
});

test("getToolLabel returns Editing for unknown str_replace_editor command", () => {
  expect(
    getToolLabel("str_replace_editor", {
      command: "unknown_cmd",
      path: "/App.jsx",
    })
  ).toBe("Editing /App.jsx");
});

test("getToolLabel returns Renaming with new_path for file_manager rename", () => {
  expect(
    getToolLabel("file_manager", {
      command: "rename",
      path: "/old.jsx",
      new_path: "/new.jsx",
    })
  ).toBe("Renaming /old.jsx to /new.jsx");
});

test("getToolLabel returns Renaming without new_path for file_manager rename", () => {
  expect(
    getToolLabel("file_manager", { command: "rename", path: "/old.jsx" })
  ).toBe("Renaming /old.jsx");
});

test("getToolLabel returns Deleting for file_manager delete", () => {
  expect(
    getToolLabel("file_manager", { command: "delete", path: "/App.jsx" })
  ).toBe("Deleting /App.jsx");
});

test("getToolLabel returns Managing for unknown file_manager command", () => {
  expect(
    getToolLabel("file_manager", { command: "unknown_cmd", path: "/App.jsx" })
  ).toBe("Managing /App.jsx");
});

test("getToolLabel returns raw tool name for unknown tools", () => {
  expect(
    getToolLabel("some_other_tool", { command: "do", path: "/file.txt" })
  ).toBe("some_other_tool");
});

test("getToolLabel returns fallback when args is undefined", () => {
  expect(getToolLabel("str_replace_editor", undefined)).toBe(
    "Using str_replace_editor..."
  );
});

test("getToolLabel returns fallback when command is missing", () => {
  expect(getToolLabel("str_replace_editor", { path: "/App.jsx" })).toBe(
    "Using str_replace_editor..."
  );
});

test("getToolLabel returns fallback when path is missing", () => {
  expect(getToolLabel("str_replace_editor", { command: "create" })).toBe(
    "Using str_replace_editor..."
  );
});

// Component rendering tests

test("renders green dot when tool invocation is complete", () => {
  const invocation = makeToolInvocation({
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "result",
    result: "Success",
  });

  const { container } = render(
    <ToolInvocationStatus toolInvocation={invocation} />
  );

  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
  expect(screen.queryByTestId("loader")).toBeNull();
  expect(container.querySelector(".bg-emerald-500")).toBeDefined();
});

test("renders spinner when tool invocation is in call state", () => {
  const invocation = makeToolInvocation({
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "call",
  });

  const { container } = render(
    <ToolInvocationStatus toolInvocation={invocation} />
  );

  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
  expect(screen.getByTestId("loader")).toBeDefined();
  expect(container.querySelector(".bg-emerald-500")).toBeNull();
});

test("renders spinner when tool invocation is in partial-call state", () => {
  const invocation = makeToolInvocation({
    toolName: "str_replace_editor",
    args: { command: "create", path: "/App.jsx" },
    state: "partial-call",
  });

  render(<ToolInvocationStatus toolInvocation={invocation} />);

  expect(screen.getByTestId("loader")).toBeDefined();
});

test("renders correct label for file_manager delete", () => {
  const invocation = makeToolInvocation({
    toolName: "file_manager",
    args: { command: "delete", path: "/old.jsx" },
  });

  render(<ToolInvocationStatus toolInvocation={invocation} />);

  expect(screen.getByText("Deleting /old.jsx")).toBeDefined();
});

test("renders correct label for file_manager rename with new_path", () => {
  const invocation = makeToolInvocation({
    toolName: "file_manager",
    args: { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
  });

  render(<ToolInvocationStatus toolInvocation={invocation} />);

  expect(screen.getByText("Renaming /old.jsx to /new.jsx")).toBeDefined();
});
