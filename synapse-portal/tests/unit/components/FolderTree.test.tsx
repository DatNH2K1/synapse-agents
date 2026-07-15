import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  FolderTree,
  TreeNode,
} from "@/app/(dashboard)/dependency-graph/FolderTree";

describe("FolderTree Component", () => {
  const fileTree: TreeNode[] = [
    {
      name: "src",
      path: "src",
      type: "folder",
      children: [
        {
          name: "index.ts",
          path: "src/index.ts",
          type: "file",
          id: "file-1",
        },
        {
          name: "styles.css",
          path: "src/styles.css",
          type: "file",
          id: "file-2",
        },
      ],
    },
  ];

  it("renders folder structure and supports toggle/expand path", () => {
    const togglePathMock = vi.fn();
    const onFileSelectMock = vi.fn();
    const expandedPaths = new Set<string>();

    const { rerender } = render(
      <FolderTree
        fileTree={fileTree}
        selectedFileId={null}
        onFileSelect={onFileSelectMock}
        expandedPaths={expandedPaths}
        togglePath={togglePathMock}
        title="Files"
        subtitle="Hierarchy"
        noFilesText="Empty"
      />,
    );

    expect(screen.getByText("Files")).toBeDefined();
    expect(screen.getByText("src")).toBeDefined();
    // Since it's not expanded, index.ts should not be in the document
    expect(screen.queryByText("index.ts")).toBeNull();

    // Click folder to expand
    fireEvent.click(screen.getByText("src"));
    expect(togglePathMock).toHaveBeenCalledWith("src");

    // Rerender with expanded paths
    expandedPaths.add("src");
    rerender(
      <FolderTree
        fileTree={fileTree}
        selectedFileId="file-1"
        onFileSelect={onFileSelectMock}
        expandedPaths={expandedPaths}
        togglePath={togglePathMock}
        title="Files"
        noFilesText="Empty"
      />,
    );

    expect(screen.getByText("index.ts")).toBeDefined();

    // Click file node
    fireEvent.click(screen.getByText("index.ts"));
    expect(onFileSelectMock).toHaveBeenCalledWith("file-1");
  });

  it("renders empty message when no files", () => {
    render(
      <FolderTree
        fileTree={[]}
        selectedFileId={null}
        onFileSelect={vi.fn()}
        expandedPaths={new Set()}
        togglePath={vi.fn()}
        title="Files"
        noFilesText="No Files Found"
      />,
    );

    expect(screen.getByText("No Files Found")).toBeDefined();
  });
});
