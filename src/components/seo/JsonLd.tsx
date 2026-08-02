type JsonLdProps = {
  data: Record<string, unknown>;
};

/**
 * Renders a schema.org graph as a `application/ld+json` block.
 *
 * Every value in these graphs is editor-supplied copy from Sanity, so `<` is
 * escaped before it reaches the DOM: a stray `</script>` inside a project
 * description would otherwise close the tag and drop the rest of the payload
 * into the document as markup.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
