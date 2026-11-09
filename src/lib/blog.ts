// Blog posts are plain Markdown files in src/content/blog/<slug>.md with frontmatter:
// title, description, date (YYYY-MM-DD), cover (/blog/<slug>.jpg), coverAlt, keywords[], faqs[[q, a]] (optional).
export interface PostMeta {
  title: string;
  description: string;
  date: string;
  cover?: string;
  coverAlt?: string;
  keywords?: string[];
  faqs?: [string, string][];
}
export interface Post {
  slug: string;
  meta: PostMeta;
  Content: any;
  words: number;
}

const files = import.meta.glob('../content/blog/*.md', { eager: true }) as Record<string, any>;

export function getPosts(): Post[] {
  return Object.entries(files)
    .map(([path, mod]) => ({
      slug: path.split('/').pop()!.replace(/\.md$/, ''),
      meta: mod.frontmatter as PostMeta,
      Content: mod.Content,
      words: (mod.rawContent?.() ?? '').split(/\s+/).filter(Boolean).length,
    }))
    .filter((p) => p.meta?.title && p.meta?.date)
    .sort((a, b) => (a.meta.date < b.meta.date ? 1 : -1));
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// Format from the YYYY-MM-DD string itself, so the build server's timezone can't shift the day.
export const fmtDate = (d: string) => {
  const [y, m, day] = d.split('-').map(Number);
  return `${day} ${MONTHS[m - 1]} ${y}`;
};
