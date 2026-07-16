import DOMPurify, { type Config, type DOMPurify as DOMPurifyInstance } from "dompurify";
import MarkdownIt from "markdown-it";

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  typographer: false
});

const defaultLinkOpen =
  markdown.renderer.rules.link_open ??
  ((tokens, index, options, _environment, renderer) =>
    renderer.renderToken(tokens, index, options));

markdown.renderer.rules.link_open = (tokens, index, options, environment, renderer) => {
  const token = tokens[index];
  token.attrSet("target", "_blank");
  token.attrSet("rel", "noopener noreferrer");
  return defaultLinkOpen(tokens, index, options, environment, renderer);
};

markdown.renderer.rules.image = (tokens, index) =>
  markdown.utils.escapeHtml(tokens[index].content);

const sanitizeConfig: Config = {
  ALLOWED_TAGS: [
    "a",
    "blockquote",
    "br",
    "code",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "li",
    "ol",
    "p",
    "pre",
    "s",
    "strong",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "ul"
  ],
  ALLOWED_ATTR: ["class", "href", "rel", "start", "target", "title"],
  ALLOW_ARIA_ATTR: false,
  ALLOW_DATA_ATTR: false,
  RETURN_TRUSTED_TYPE: false
};

let purifier: DOMPurifyInstance | undefined;

export function renderMarkdown(source: string): string {
  const rendered = markdown.render(source);
  const currentPurifier = getPurifier();
  return currentPurifier ? currentPurifier.sanitize(rendered, sanitizeConfig) : rendered;
}

function getPurifier(): DOMPurifyInstance | undefined {
  if (typeof window === "undefined") return undefined;
  purifier ??= DOMPurify(window);
  return purifier;
}
