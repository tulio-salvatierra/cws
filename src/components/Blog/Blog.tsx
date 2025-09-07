import React from 'react';

export default function Blog() {
  const featuredArticle = {
    id: 1,
    title: "The Future of Web Development: AI-Powered Tools and What They Mean for Your Business",
    excerpt: "Discover how artificial intelligence is revolutionizing web development and creating new opportunities for businesses to build better, faster, and more intelligent digital experiences.",
    content: "As we move into 2024, the landscape of web development is undergoing a dramatic transformation. Artificial intelligence is no longer just a buzzword—it's becoming an integral part of how we build and maintain websites. From automated code generation to intelligent design systems, AI-powered tools are changing the game for developers and businesses alike...",
    author: "Tulio Salvatierra",
    date: "March 15, 2024",
    readTime: "8 min read",
    category: "Technology",
    image: "/images/website.jpg",
    tags: ["AI", "Web Development", "Technology", "Future"]
  };

  const relatedArticles = [
    {
      id: 2,
      title: "Why Your Business Needs a Mobile-First Website Design",
      excerpt: "With over 60% of web traffic coming from mobile devices, having a mobile-first approach isn't just recommended—it's essential for business success.",
      author: "Tulio Salvatierra",
      date: "March 10, 2024",
      readTime: "5 min read",
      category: "Design",
      image: "/images/auto.jpg",
      tags: ["Mobile", "Design", "UX"]
    },
    {
      id: 3,
      title: "SEO Strategies That Actually Work in 2024",
      excerpt: "Google's algorithm updates have changed the SEO landscape. Learn the strategies that are driving real results this year.",
      author: "Tulio Salvatierra",
      date: "March 5, 2024",
      readTime: "6 min read",
      category: "Marketing",
      image: "/images/support.png",
      tags: ["SEO", "Marketing", "Google"]
    },
    {
      id: 4,
      title: "Building Scalable E-commerce Solutions: Lessons from Successful Online Stores",
      excerpt: "What separates successful e-commerce businesses from the rest? Discover the technical and strategic foundations that drive growth.",
      author: "Tulio Salvatierra",
      date: "February 28, 2024",
      readTime: "7 min read",
      category: "E-commerce",
      image: "/images/cleaning.jpg",
      tags: ["E-commerce", "Business", "Technology"]
    }
  ];

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

                <a
                  href="#"
                  className="inline-flex items-center text-orange-500 hover:text-orange-400 font-semibold transition-colors duration-200"
                >
                  Read Full Article
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
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
              <article key={article.id} className="bg-zinc-800/50 rounded-2xl overflow-hidden hover:bg-zinc-800/70 transition-all duration-300 group">
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
                    <a
                      href="#"
                      className="text-orange-500 hover:text-orange-400 font-semibold text-sm transition-colors duration-200"
                    >
                      Read More →
                    </a>
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
