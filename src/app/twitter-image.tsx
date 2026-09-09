/**
 * Twitter card image for testimoni.io.
 *
 * We reuse the OpenGraph image verbatim — same 1200×630, same
 * design. Twitter's `summary_large_image` uses the same aspect
 * ratio as OG so there's no need to author a second layout.
 * Keeping this file thin means every future OG update lands on
 * Twitter cards for free without a copy-paste chore.
 */

export {
  size,
  contentType,
  default,
} from "./opengraph-image";
