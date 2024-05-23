import { Document } from "@langchain/core/documents";
import { BaseDocumentLoader } from "langchain/document_loaders/base";

export class LogseqLoader extends BaseDocumentLoader {
  constructor(private path: string) {
    super();
  }

  protected async parse(raw: string): Promise<string[]> {
    const lines = raw.split("\n");
    const blocks: string[] = [];
    lines.forEach((line) => {
      if (line.startsWith("- ")) {
        blocks.push(line);
      } else {
        blocks[blocks.length - 1] += "\n" + line;
      }
    });
    return blocks;
  }

  async load() {
    const text = await this.readFile(this.path);
    const metadata = { source: this.path, pageTitle: this.getTitle(this.path) };
    const parsed = await this.parse(text);
    parsed.forEach((pageContent, i) => {
      if (typeof pageContent !== "string") {
        throw new Error(
          `Expected string, at position ${i} got ${typeof pageContent}`
        );
      }
    });
    return parsed.map(
      (pageContent, i) =>
        new Document({
          pageContent,
          metadata:
            parsed.length === 1
              ? metadata
              : {
                  ...metadata,
                  line: i + 1,
                },
        })
    );
  }

  private async readFile(path: string) {
    const fs = await import("fs/promises");
    return fs.readFile(path, "utf-8");
  }

  private getTitle(path: string) {
    return (
      "Date: " +
      (path.split("/").pop()?.replace(".md", "")?.replace(/_/g, "-") ??
        "Unknown")
    );
  }
}
