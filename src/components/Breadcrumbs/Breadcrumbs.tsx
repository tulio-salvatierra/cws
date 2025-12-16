import { Link, useLocation, matchPath } from 'react-router-dom';
import { useEffect } from 'react';
import { getArticleBySlug } from '../../data/articles';
import { getLandingPageData } from '../../data/landingPagesData';
import { generateBreadcrumbSchema, addJsonLd } from '../../lib/seo';

export default function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  const parts = segments.map((seg, idx) => {
    const href = '/' + segments.slice(0, idx + 1).join('/');

    // Dynamic blog post
    const blogMatch = matchPath({ path: '/blog/:slug' }, href);
    if (blogMatch && blogMatch.params.slug) {
      const article = getArticleBySlug(blogMatch.params.slug);
      return { href, label: article?.title || blogMatch.params.slug };
    }

    // Dynamic landing page
    if (idx === 0) {
      const lp = getLandingPageData(seg);
      if (lp) return { href, label: lp.meta.title };
    }

    // Static labels
    const staticLabels: Record<string, string> = {
      blog: 'Blog',
      services: 'Services',
      about: 'About',
      policy: 'Policy',
      contact: 'Contact'
    };
    return { href, label: staticLabels[seg] || seg.replace(/-/g, ' ') };
  });

  // Add breadcrumb structured data
  useEffect(() => {
    const breadcrumbItems = [
      { name: 'Home', url: '/' },
      ...parts.map(part => ({ name: part.label, url: part.href }))
    ];
    
    if (breadcrumbItems.length > 1) {
      const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbItems);
      addJsonLd(breadcrumbSchema, 'breadcrumbs');
    }

    return () => {
      const existing = document.querySelector('script[data-jsonld-id="breadcrumbs"]');
      if (existing) {
        existing.remove();
      }
    };
  }, [location.pathname, parts]);

  return (
    <nav aria-label="Breadcrumb" className="w-full px-6 py-3 text-sm">
      <ol className="flex items-center gap-2 text-zinc-300">
        <li>
          <Link to="/" className="hover:text-orange-400">Home</Link>
        </li>
        {parts.map((part, i) => (
          <li key={part.href} className="flex items-center gap-2">
            <span className="text-zinc-500">/</span>
            {i === parts.length - 1 ? (
              <span className="text-orange-500 font-medium truncate max-w-[40vw] md:max-w-none">{part.label}</span>
            ) : (
              <Link to={part.href} className="hover:text-orange-400 truncate max-w-[40vw] md:max-w-none">{part.label}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}


