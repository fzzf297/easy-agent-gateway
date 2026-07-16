// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { renderMarkdown } from "../src/markdown";

describe("renderMarkdown", () => {
  it("renders headings, lists, tables, and fenced code", () => {
    const html = renderMarkdown(
      [
        "## 查询结果",
        "",
        "- 第一项",
        "- 第二项",
        "",
        "| 字段 | 值 |",
        "| --- | --- |",
        "| status | ok |",
        "",
        "```ts",
        "const ready = true;",
        "```"
      ].join("\n")
    );

    expect(html).toContain("<h2>查询结果</h2>");
    expect(html).toContain("<li>第一项</li>");
    expect(html).toContain("<table>");
    expect(html).toContain('<code class="language-ts">');
    expect(html).toContain("const ready = true;");
  });

  it("opens links safely in a new tab", () => {
    const html = renderMarkdown("[文档](https://example.com/docs)");

    expect(html).toContain('href="https://example.com/docs"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noopener noreferrer"');
  });

  it("blocks raw HTML, executable links, and remote images", () => {
    const html = renderMarkdown(
      [
        "<script>alert('xss')</script>",
        "",
        "[危险链接](javascript:alert('xss'))",
        "",
        "![追踪图片](https://example.com/pixel.png)",
        "",
        '<img src="x" onerror="alert(1)">'
      ].join("\n")
    );

    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("追踪图片");
  });
});
