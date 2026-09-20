import type { JournalEmbed as JournalEmbedData } from "@/types/journal";
import styles from "./JournalEmbed.module.scss";

type JournalEmbedProps = {
  embed: JournalEmbedData;
};

/**
 * A map or video from an allow-listed provider. The URL arrives already
 * matched and normalised by the fetcher (contracts/embed-providers.md); this
 * owns the frame's behaviour.
 *
 * - `loading="lazy"`: nothing third-party loads until the reader scrolls near.
 * - The wrapper's aspect ratio reserves the space, so a slow or blocked frame
 *   shifts nothing and the article reads on around an empty box (FR-002d).
 * - No `autoplay` in `allow`, and no `sandbox`: these providers need
 *   `allow-scripts allow-same-origin`, which together isolate nothing. The
 *   allow-list is the control.
 */
export function JournalEmbed({ embed }: JournalEmbedProps) {
  const shape = embed.provider === "google-maps" ? "map" : "video";

  return (
    <figure
      className={[styles["journal-embed"], styles[`journal-embed--${shape}`]]
        .filter(Boolean)
        .join(" ")}
      data-journal-embed={embed.provider}
    >
      <iframe
        allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
        className={styles["journal-embed__frame"]}
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
        src={embed.src}
        title={embed.title}
      />
    </figure>
  );
}
