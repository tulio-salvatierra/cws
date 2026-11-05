import { describe, expect, it } from 'vitest';
import { articles, getArticleBySlug } from './articles';

const expectedSlugs = [
  'website-design-services-chicago-small-business',
  'custom-website-vs-template-small-business',
  'small-business-website-checklist-chicago',
  'choose-website-designer-chicago',
  'website-refresh-vs-redesign-small-business',
];

describe('Chicago small-business guide cluster', () => {
  it('contains the five planned evergreen guides with unique public slugs', () => {
    expect(articles).toHaveLength(5);
    expect(articles.map((article) => article.slug)).toEqual(expectedSlugs);
    expect(new Set(articles.map((article) => article.slug)).size).toBe(5);
  });

  it('keeps each guide available to the runtime article route', () => {
    for (const slug of expectedSlugs) {
      expect(getArticleBySlug(slug)).toMatchObject({ slug });
    }
    expect(getArticleBySlug('future-of-web-development-ai-tools')).toBeUndefined();
  });
});
