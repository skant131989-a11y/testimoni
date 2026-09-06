// Reuse the OpenGraph image as the Twitter card so shares on X look
// identical to shares on LinkedIn / Slack / iMessage. Next.js requires
// a separate file to register the twitter-image route.
export { default, size, contentType } from "./opengraph-image";
