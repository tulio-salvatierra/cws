import { Link } from 'react-router-dom';
import { articles } from '../../data/articles';

const guideSlugs = [
  'website-design-services-chicago-small-business',
  'small-business-website-checklist-chicago',
  'choose-website-designer-chicago',
];

export default function ChicagoWebDesignPage() {
  const guides = guideSlugs
    .map((slug) => articles.find((article) => article.slug === slug))
    .filter(Boolean);

  return (
    <main className="min-h-screen px-4 pb-24 pt-36 text-white">
      <div className="mx-auto max-w-6xl">
        <section className="max-w-4xl">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-orange-400">
            Cicero Web Studio · Chicago
          </p>
          <h1 className="font-main text-5xl font-black leading-tight text-orange-500 md:text-7xl">
            Chicago Web Design for Small Businesses
          </h1>
          <p className="mt-7 max-w-3xl text-xl leading-relaxed text-zinc-300">
            Clear, mobile-friendly websites for Chicago business owners who need their services,
            contact path, and online presence to make sense to customers.
          </p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link
              to="/contact"
              className="rounded-full bg-orange-500 px-6 py-3 font-semibold text-zinc-950 transition-colors hover:bg-orange-400"
            >
              Start a conversation
            </Link>
            <Link
              to="/blog/small-business-website-checklist-chicago"
              className="rounded-full border border-zinc-600 px-6 py-3 font-semibold text-white transition-colors hover:border-orange-400 hover:text-orange-300"
            >
              Use the website checklist
            </Link>
          </div>
        </section>

        <section className="mt-20 grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8">
            <h2 className="font-main text-3xl font-bold text-white">Start with the next customer action</h2>
            <p className="mt-4 leading-relaxed text-zinc-300">
              A useful website makes it easy to do the next thing: call, request a quote, book an
              appointment, find the business, or understand a service before getting in touch.
            </p>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8">
            <h2 className="font-main text-3xl font-bold text-white">Plan around real business information</h2>
            <p className="mt-4 leading-relaxed text-zinc-300">
              The best starting material is usually simple: current services, accurate contact
              details, usable photos, and a person who can review the final information.
            </p>
          </div>
        </section>

        <section className="mt-20 max-w-4xl">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-400">What can be in scope</p>
          <h2 className="mt-3 font-main text-4xl font-bold text-white">Build only what helps the business communicate clearly</h2>
          <ul className="mt-7 grid gap-4 text-lg text-zinc-300 md:grid-cols-2">
            <li className="rounded-2xl bg-zinc-900/60 p-5">New websites and focused refreshes</li>
            <li className="rounded-2xl bg-zinc-900/60 p-5">Clear service and contact pages</li>
            <li className="rounded-2xl bg-zinc-900/60 p-5">English and Spanish content, reviewed independently</li>
            <li className="rounded-2xl bg-zinc-900/60 p-5">Local online-presence work when it belongs in the project</li>
            <li className="rounded-2xl bg-zinc-900/60 p-5">Ongoing site updates when information changes</li>
          </ul>
        </section>

        <section className="mt-20 rounded-3xl border border-orange-500/30 bg-orange-500/10 p-8 md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-300">Before building</p>
          <h2 className="mt-3 font-main text-4xl font-bold text-white">A short planning conversation saves unnecessary work</h2>
          <p className="mt-5 max-w-3xl text-lg leading-relaxed text-zinc-200">
            We can start with what customers should understand, what they should do next, and what
            information still needs an owner decision. That is enough to choose a useful first
            scope without guessing at features.
          </p>
          <Link to="/en/negocio-listo" className="mt-7 inline-block font-semibold text-orange-300 hover:text-orange-200">
            See Negocio Listo →
          </Link>
        </section>

        <section className="mt-20">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-orange-400">Related guides</p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {guides.map((guide) => guide && (
              <article key={guide.slug} className="rounded-3xl border border-zinc-800 bg-zinc-900/60 p-6">
                <p className="text-sm text-orange-300">{guide.category}</p>
                <h2 className="mt-3 font-main text-2xl font-bold text-white">{guide.title}</h2>
                <p className="mt-4 leading-relaxed text-zinc-300">{guide.excerpt}</p>
                <Link to={`/blog/${guide.slug}`} className="mt-5 inline-block font-semibold text-orange-400 hover:text-orange-300">
                  Read the guide →
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-20 text-center">
          <h2 className="font-main text-4xl font-bold text-white">Want to talk through the right first step?</h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-300">
            Bring the current website, service list, or project question. We can start with the
            information that is already known.
          </p>
          <Link
            to="/contact"
            className="mt-7 inline-block rounded-full bg-orange-500 px-7 py-3 font-semibold text-zinc-950 transition-colors hover:bg-orange-400"
          >
            Contact Cicero Web Studio
          </Link>
        </section>
      </div>
    </main>
  );
}
