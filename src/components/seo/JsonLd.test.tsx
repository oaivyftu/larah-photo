import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { JsonLd } from "./JsonLd";

afterEach(cleanup);

// This component writes editor-supplied copy into the document with
// dangerouslySetInnerHTML, so the escaping is not a nicety -- it is the only
// thing between a project description and script injection. Every value in
// these graphs comes from Sanity, where an editor can type anything.

function scriptContent(container: HTMLElement) {
  return container.querySelector('script[type="application/ld+json"]')
    ?.innerHTML;
}

describe("JsonLd", () => {
  it("emits the graph as an ld+json block", () => {
    const { container } = render(
      <JsonLd data={{ "@type": "Person", name: "Larah" }} />,
    );

    expect(JSON.parse(scriptContent(container) ?? "")).toEqual({
      "@type": "Person",
      name: "Larah",
    });
  });

  it("escapes < so a stray closing tag cannot break out of the script", () => {
    // The attack: a description containing </script> would otherwise close
    // the tag early and drop everything after it into the page as markup.
    const { container } = render(
      <JsonLd
        data={{ description: "</script><img src=x onerror=alert(1)>" }}
      />,
    );
    const html = scriptContent(container) ?? "";

    expect(html).not.toContain("</script>");
    expect(html).toContain("\\u003c");
  });

  it("keeps the escaped payload parseable, so the escape is not lossy", () => {
    const description = "A <b>bold</b> claim";
    const { container } = render(<JsonLd data={{ description }} />);

    // JSON.parse turns < back into "<", so crawlers read the original.
    expect(JSON.parse(scriptContent(container) ?? "")).toEqual({ description });
  });

  it("escapes every occurrence, not just the first", () => {
    const { container } = render(
      <JsonLd data={{ a: "<one>", b: "<two>", c: "<three>" }} />,
    );

    expect(scriptContent(container)).not.toMatch(/<[a-z]/i);
  });

  it("renders nested graphs intact", () => {
    const data = {
      "@graph": [{ "@type": "WebSite" }, { "@type": "Person", name: "Larah" }],
    };
    const { container } = render(<JsonLd data={data} />);

    expect(JSON.parse(scriptContent(container) ?? "")).toEqual(data);
  });

  it("renders an empty graph rather than crashing", () => {
    const { container } = render(<JsonLd data={{}} />);

    expect(scriptContent(container)).toBe("{}");
  });
});
