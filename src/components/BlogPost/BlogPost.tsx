import { useParams, Link } from 'react-router-dom';
import { getArticleBySlug } from '../../data/articles';

export default function BlogPost() {
  const { slug } = useParams();
  const article = slug ? getArticleBySlug(slug) : undefined;

  if (!article) {
    return (
      <section className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-4xl font-main font-black text-orange-500 mb-4">Article Not Found</h1>
          <p className="text-zinc-300 mb-6">We couldn't find the article you're looking for.</p>
          <Link to="/blog" className="btn-bounce">
            <div className="btn-bounce-bg"></div>
            <div className="btn-bounce-text__wrap">
              <span className="btn-bounce-text">Back to Blog</span>
            </div>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full min-h-screen bg-zinc-900/50 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 text-sm text-zinc-400 mb-2">
            <span>{article.date}</span>
            <span>•</span>
            <span>{article.readTime}</span>
            <span>•</span>
            <span>{article.category}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-main font-black text-white mb-4">{article.title}</h1>
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag, i) => (
              <span key={i} className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm border border-orange-500/30">#{tag}</span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden mb-8">
          <img src={article.image} alt={article.title} className="w-full h-72 object-cover" />
        </div>

        <article className="prose prose-invert max-w-none">
          <p className="text-zinc-200 leading-8">{article.content}</p>
        </article>
      </div>
    </section>
  );
}


