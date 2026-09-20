import Link from "next/link";
import {
  PortableText,
  type PortableTextComponents,
  type PortableTextTypeComponentProps,
} from "next-sanity";
import { LarahImage } from "@/components/media/LarahImage/LarahImage";
import type {
  JournalBodyBlock,
  JournalBodyImage,
  JournalEmbed as JournalEmbedData,
} from "@/types/journal";
import { JournalEmbed } from "../JournalEmbed/JournalEmbed";
import styles from "./JournalBody.module.scss";

type JournalBodyProps = {
  body: JournalBodyBlock[];
};

/** Site-relative paths navigate in-app, with the page transition; anything
 *  else is an ordinary external link. */
function isInternalHref(href: string) {
  return href.startsWith("/") && !href.startsWith("//");
}

/**
 * The column the images and embeds are rendered at, so `next/image` fetches a
 * width that fits it rather than the viewport. Matches
 * `--journal-figure-measure` (64rem) at the root font size.
 */
const FIGURE_SIZES = "(max-width: 1024px) 100vw, 1024px";

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p>{children}</p>,
    // The Studio offers no h1 — the post title is the page's only top-level
    // heading. Mapped down anyway, so that rule does not rest on the schema
    // alone.
    h1: ({ children }) => <h2>{children}</h2>,
    h2: ({ children }) => <h2>{children}</h2>,
    h3: ({ children }) => <h3>{children}</h3>,
    h4: ({ children }) => <h4>{children}</h4>,
    blockquote: ({ children }) => (
      <blockquote className={styles["journal-body__quote"]}>
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul>{children}</ul>,
    number: ({ children }) => <ol>{children}</ol>,
  },
  listItem: ({ children }) => <li>{children}</li>,
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    link: ({ children, value }) => {
      const href = typeof value?.href === "string" ? value.href : "";

      return isInternalHref(href) ? (
        <Link href={href}>{children}</Link>
      ) : (
        <a href={href} rel="noopener noreferrer">
          {children}
        </a>
      );
    },
  },
  types: {
    bodyImage: ({
      value,
    }: PortableTextTypeComponentProps<JournalBodyImage>) => (
      <figure className={styles["journal-body__figure"]}>
        <LarahImage
          alt={value.image.alt}
          blurDataURL={value.image.blurDataURL}
          className={styles["journal-body__image"]}
          height={value.image.height}
          sizes={FIGURE_SIZES}
          src={value.image.src}
          width={value.image.width}
        />
        {value.caption ? (
          <figcaption className={styles["journal-body__caption"]}>
            {value.caption}
          </figcaption>
        ) : null}
      </figure>
    ),
    embed: ({ value }: PortableTextTypeComponentProps<JournalEmbedData>) => (
      <div className={styles["journal-body__embed"]}>
        <JournalEmbed embed={value} />
      </div>
    ),
  },
};

/**
 * A post's body, rendered from Portable Text (research.md §1). Rendered on the
 * server: the renderer and its component map never reach the client bundle.
 */
export function JournalBody({ body }: JournalBodyProps) {
  return (
    <div className={styles["journal-body"]} data-journal-article>
      <PortableText components={components} value={body} />
    </div>
  );
}
