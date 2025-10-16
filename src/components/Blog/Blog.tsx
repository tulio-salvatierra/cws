import React from 'react';
import { Link } from 'react-router-dom';
import { articles } from '../../data/articles';

export default function Blog() {
  const [featuredArticle, ...rest] = articles;
  const relatedArticles = rest;

  return (
    <section className="relative w-full min-h-screen bg-zinc-900/50 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-main font-black text-orange-500 mb-4">
            BLOG
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            Insights, tips, and thoughts on web development, design, and digital business
          </p>
        </div>

        {/* Featured Article */}
        <div className="mb-16">
          <div className="bg-zinc-800/50 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* Article Image */}
              <div className="relative h-64 lg:h-full">
                <img
                  src={featuredArticle.image}
                  alt={featuredArticle.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {featuredArticle.category}
                  </span>
                </div>
              </div>

              {/* Article Content */}
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="flex items-center space-x-4 text-sm text-zinc-400 mb-4">
                  <span>{featuredArticle.date}</span>
                  <span>•</span>
                  <span>{featuredArticle.readTime}</span>
                  <span>•</span>
                  <span>By {featuredArticle.author}</span>
                </div>

                <h2 className="text-3xl lg:text-4xl font-main font-bold text-white mb-4 leading-tight">
                  {featuredArticle.title}
                </h2>

                <p className="text-zinc-300 text-lg mb-6 leading-relaxed">
                  {featuredArticle.excerpt}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {featuredArticle.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm border border-orange-500/30"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <Link
                  to={`/blog/${featuredArticle.slug}`}
                  className="inline-flex items-center text-orange-500 hover:text-orange-400 font-semibold transition-colors duration-200"
                >
                  Read Full Article
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Related Articles */}
        <div className="mb-16">
          <h2 className="text-3xl font-main font-bold text-white mb-8 text-center">
            More Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {relatedArticles.map((article) => (
              <article key={article.slug} className="bg-zinc-800/50 rounded-2xl overflow-hidden hover:bg-zinc-800/70 transition-all duration-300 group">
                {/* Article Image */}
                <div className="relative h-48">
                  <img
                    src={article.image}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      {article.category}
                    </span>
                  </div>
                </div>

                {/* Article Content */}
                <div className="p-6">
                  <div className="flex items-center space-x-4 text-sm text-zinc-400 mb-3">
                    <span>{article.date}</span>
                    <span>•</span>
                    <span>{article.readTime}</span>
                  </div>

                  <h3 className="text-xl font-main font-bold text-white mb-3 leading-tight group-hover:text-orange-400 transition-colors duration-200">
                    {article.title}
                  </h3>

                  <p className="text-zinc-300 mb-4 leading-relaxed">
                    {article.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">By {article.author}</span>
                    <Link
                      to={`/blog/${article.slug}`}
                      className="text-orange-500 hover:text-orange-400 font-semibold text-sm transition-colors duration-200"
                    >
                      Read More →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-main font-bold text-white mb-4">
            Stay Updated
          </h2>
          <p className="text-orange-100 mb-6 max-w-2xl mx-auto">
            Get the latest insights on web development, design trends, and business growth delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors duration-200">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
