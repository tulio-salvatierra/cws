import React from 'react';
import Contact from '../Contact/Contact';

export default function Policy() {
  return (
    <section className="relative w-full min-h-screen bg-zinc-900/50 py-20 px-4 mt-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-main font-black text-orange-500 mb-4">
            POLICIES
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            Cicero Web Studio operates with a comprehensive set of policies designed to ensure a productive, secure, and respectful work environment for our fully remote team and to protect our business and clients.
          </p>
        </div>

        {/* Policy Sections */}
        <div className="space-y-16">
          {/* Remote-First Work Policy */}
          <div className="bg-zinc-800/50 rounded-2xl p-8">
            <h2 className="text-3xl font-main font-bold text-orange-500 mb-6 flex items-center">
              <span className="text-4xl mr-3">💻</span>
              Remote-First Work Policy
            </h2>
            <div className="text-zinc-300 leading-relaxed space-y-4">
              <p>
                Our company is <strong className="text-white">remote-first</strong>, meaning we operate with a globally distributed team and have no central office. We believe in providing our employees with the flexibility to work from where they are most productive.
              </p>
              <p>
                We support this with asynchronous communication methods, full technology provision (including a laptop and a home office stipend), and a focus on outcomes rather than hours logged. We foster a strong team culture through intentional virtual and in-person events.
              </p>
            </div>
          </div>

          {/* Intellectual Property & Data Security Policy */}
          <div className="bg-zinc-800/50 rounded-2xl p-8">
            <h2 className="text-3xl font-main font-bold text-orange-500 mb-6 flex items-center">
              <span className="text-4xl mr-3">🔒</span>
              Intellectual Property & Data Security Policy
            </h2>
            <div className="text-zinc-300 leading-relaxed space-y-4">
              <p>
                We take the protection of our intellectual property (IP) and client data seriously. All code, designs, and other creative works developed by employees on the job are the <strong className="text-white">property of Cicero Web Studio</strong>.
              </p>
              <p>
                We require employees to sign a Non-Disclosure Agreement (NDA) to protect confidential information. Our <strong className="text-white">Data Security Policy</strong> outlines strict guidelines for handling sensitive data, including encryption, access controls, and data disposal procedures to ensure compliance with privacy laws.
              </p>
            </div>
          </div>

          {/* Code of Conduct & HR Policy */}
          <div className="bg-zinc-800/50 rounded-2xl p-8">
            <h2 className="text-3xl font-main font-bold text-orange-500 mb-6 flex items-center">
              <span className="text-4xl mr-3">🤝</span>
              Code of Conduct & HR Policy
            </h2>
            <div className="text-zinc-300 leading-relaxed space-y-4">
              <p>
                Our <strong className="text-white">Code of Conduct</strong> sets the standard for professional behavior. It emphasizes respect, collaboration, and ethical conduct in all interactions with colleagues, clients, and the public. We have a zero-tolerance policy for harassment and discrimination.
              </p>
              <p>
                Our <strong className="text-white">Acceptable Use Policy</strong> governs the use of company-provided equipment and networks, ensuring they are used productively and securely.
              </p>
            </div>
          </div>

          {/* Software Development & Quality Assurance Policy */}
          <div className="bg-zinc-800/50 rounded-2xl p-8">
            <h2 className="text-3xl font-main font-bold text-orange-500 mb-6 flex items-center">
              <span className="text-4xl mr-3">⚙️</span>
              Software Development & Quality Assurance Policy
            </h2>
            <div className="text-zinc-300 leading-relaxed space-y-4">
              <p>
                We maintain high standards for our work through our <strong className="text-white">Development Standards Policy</strong>. This policy specifies coding conventions, version control practices, and required code review processes to ensure our codebase is consistent, maintainable, and scalable.
              </p>
              <p>
                Our <strong className="text-white">Quality Assurance Policy</strong> dictates our rigorous testing procedures, including unit and integration testing, to ensure all software meets our quality and security standards before it is released.
              </p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-zinc-800/50 rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-main font-bold text-orange-500 mb-4">
              Questions About Our Policies?
            </h2>
            <p className="text-zinc-300 mb-6">
              We're committed to transparency and open communication. If you have any questions about our policies or need clarification on any points, please don't hesitate to reach out.
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
