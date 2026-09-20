/*
 * One place that writes structured data into the page.
 *
 * The "<" is escaped so a value can never close the script tag early, which
 * is the one way a JSON-LD block turns into a hole in the page.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
