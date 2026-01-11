import React from 'react';
import Contact from '../Contact/Contact';

export default function Policy() {
  return (
    <section className="relative w-full min-h-screen bg-zinc-900/50 py-20 px-4 mt-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-main font-black text-orange-500 mb-4">
            OUR PROCESS &amp; POLICIES
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            We believe that clear policies and a transparent process make for successful partnerships. On this page
            you’ll learn how Cicero Web Studio handles discovery, retainers, payments, collaboration and quality
            assurance to ensure your custom website project runs smoothly.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-16">
          {/* Discovery & Intake Process */}
          <div className="bg-zinc-800/50 rounded-2xl p-8">
            <h2 className="text-3xl font-main font-bold text-orange-500 mb-6 flex items-center">
              <span className="text-4xl mr-3">💬</span>
              Discovery &amp; Intake Process
            </h2>
            <div className="text-zinc-300 leading-relaxed space-y-4">
              <p>
                Every project begins with a conversation. Our discovery call is a chance to listen to your goals,
                learn about your business and identify opportunities to help your Chicago or Cicero small business
                grow online.
              </p>
              <p>
                We treat this intake as a collaborative exercise—not a sales pitch. You’ll get a feel for our
                approach and decide if we’re the right fit. We’ll share ideas, answer your questions and outline the
                next steps. This clarity saves time and ensures each project is a good match.
              </p>
            </div>
          </div>

          {/* Retainers & Ongoing Support */}
          <div className="bg-zinc-800/50 rounded-2xl p-8">
            <h2 className="text-3xl font-main font-bold text-orange-500 mb-6 flex items-center">
              <span className="text-4xl mr-3">🔁</span>
              Retainers &amp; Ongoing Support
            </h2>
            <div className="text-zinc-300 leading-relaxed space-y-4">
              <p>
                After we agree on scope and timeline, we ask for a small deposit to reserve your spot on our
                schedule. This retainer allows us to commit resources and begin planning your custom website or
                digital marketing project.
              </p>
              <p>
                For clients who want continuous improvements, we offer flexible retainer packages. These include
                website updates, local SEO refinements, performance tuning and content additions. Investing in ongoing
                support keeps your site fast, secure and visible, ensuring that your online presence grows with your
                business.
              </p>
            </div>
          </div>

          {/* Payment & Scheduling */}
          <div className="bg-zinc-800/50 rounded-2xl p-8">
            <h2 className="text-3xl font-main font-bold text-orange-500 mb-6 flex items-center">
              <span className="text-4xl mr-3">💳</span>
              Payment &amp; Scheduling
            </h2>
            <div className="text-zinc-300 leading-relaxed space-y-4">
              <p>
                Transparency is at the heart of our payment policy. We provide a detailed proposal and tie payments
                to clear milestones. An initial deposit launches your project, with subsequent invoices due when major
                deliverables—such as design approval and final launch—are completed.
              </p>
              <p>
                Invoices are payable within 14 days, and we accept multiple payment methods for your convenience.
                This straightforward structure keeps your project on track and ensures there are no surprises along
                the way.
              </p>
            </div>
          </div>

          {/* Collaboration & Respect */}
          <div className="bg-zinc-800/50 rounded-2xl p-8">
            <h2 className="text-3xl font-main font-bold text-orange-500 mb-6 flex items-center">
              <span className="text-4xl mr-3">🤝</span>
              Collaboration &amp; Respect
            </h2>
            <div className="text-zinc-300 leading-relaxed space-y-4">
              <p>
                Cicero Web Studio is a remote‑first studio. We work with a distributed team and serve clients
                throughout Chicago and beyond. Our flexible, asynchronous communication lets us stay productive
                without a central office and allows us to focus on the outcomes that matter to you.
              </p>
              <p>
                We value professionalism, respect and transparency. We use NDAs and secure practices to protect your
                confidential information, and we expect clients to provide timely feedback and content. Clear
                communication and mutual respect are the foundation of every successful partnership.
              </p>
            </div>
          </div>

          {/* Development & Quality Assurance */}
          <div className="bg-zinc-800/50 rounded-2xl p-8">
            <h2 className="text-3xl font-main font-bold text-orange-500 mb-6 flex items-center">
              <span className="text-4xl mr-3">⚙️</span>
              Development &amp; Quality Assurance
            </h2>
            <div className="text-zinc-300 leading-relaxed space-y-4">
              <p>
                We build your website using modern technologies like React, Next.js and Tailwind CSS. Our development
                standards specify coding conventions, version control practices and code reviews to ensure your
                codebase is clean and maintainable.
              </p>
              <p>
                Before launch, we put your site through rigorous testing—checking functionality, performance,
                accessibility and SEO readiness. This ensures your custom website not only looks beautiful but also
                performs well and ranks higher in search results.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-zinc-800/50 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-main font-bold text-orange-500 mb-4">
              Questions About Our Process?
            </h2>
            <p className="text-zinc-300 mb-6">
              We're committed to transparency and open communication. If you have any questions about how we work or
              need clarification on any points, please don't hesitate to reach out.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:info@cicerowebstudio.xyz"
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Email Us
              </a>
              <a
                href="tel:+17863146121"
                className="border border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Call Us
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <Contact />
    </section>
  );
}