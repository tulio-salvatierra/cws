import React from 'react';
import Contact from '../Contact/Contact';

export default function About() {
  const skills = [
    { name: "React", level: 90 },
    { name: "TypeScript", level: 85 },
    { name: "JavaScript", level: 95 },
    { name: "Node.js", level: 80 },
    { name: "Next.js", level: 85 },
    { name: "Tailwind CSS", level: 90 },
    { name: "GSAP", level: 75 },
    { name: "Three.js", level: 70 },
    { name: "Figma", level: 80 },
    { name: "Git", level: 85 },
  ];

  return (
    <>
      <section id="about" className="relative w-full min-h-screen bg-zinc-900/50 py-20 px-4 mt-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-6xl md:text-8xl font-main font-black text-orange-500 mb-4">
              About Cicero Web Studio...
            </h1>
            <h2 className="text-3xl font-main font-bold text-white mb-6"> 
              Chicago Web Design Studio and Local Digital Marketing Partner
            </h2>
            <p className="text-2xl text-zinc-400 max-w-3xl mx-auto">
              Cicero Web Studio is a Chicago web design studio and local digital marketing partner. We craft custom websites that blend creativity with cutting-edge technology to help small businesses succeed online. I started this studio to serve small businesses in Chicago and surrounding areas who need more leads, more bookings, and a stronger online presence—without the corporate agency price tag.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Bio Section */}
            <div className="space-y-8">
                            {/* Avatar */}
              <div className="flex justify-center lg:justify-start mb-8">
                <div className="relative">
                  <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-orange-500 shadow-2xl">
                    <video
                      src="/images/Visualizing_Creativity_Trust_and_Power.mp4"
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-2xl">®</span>
                  </div>
                </div>
              </div>

              <h3 className="text-3xl font-main font-bold text-white mb-6">
                The Story
              </h3>
              <div className="space-y-6 text-zinc-300 leading-relaxed">
                <p>
                  Hi, I'm Tulio Salvatierra. After years in operations and logistics, I discovered my passion for web design and development. 
                  I saw how many small businesses in Chicago and Cicero struggled with outdated websites or couldn't afford the big agencies. 
                  That's when I decided to combine my problem-solving background with my love for creating beautiful, effective websites.
                </p>
                <p>
                  Today, I specialize in creating modern, high-performance custom websites and providing local SEO services for small businesses. 
                  What drives me is seeing local businesses grow—like the spa that doubled their online bookings after our redesign, or the 
                  community center that saw a 50% increase in search traffic. These aren't just websites; they're tools that help real 
                  businesses connect with their communities and thrive.
                </p>
                <p>
                  My approach blends technical expertise with creative problem-solving and local SEO strategies. I work shoulder-to-shoulder 
                  with business owners who value quality, transparency, and results. Whether you need a <a href="/services" className="text-orange-500 hover:text-orange-400 underline">custom website</a>, 
                  <a href="/services" className="text-orange-500 hover:text-orange-400 underline"> local SEO services</a>, or a complete <a href="/services" className="text-orange-500 hover:text-orange-400 underline">digital marketing solution</a>, 
                  I'm here to help your business succeed online and reach more customers in Chicago and Cicero.
                </p>
                <p>
                  When I'm not coding, you can find me exploring Chicago's vibrant neighborhoods, 
                  working with local businesses in Cicero, Portage Park, Garfield Ridge, and surrounding areas, 
                  or sharing insights on our <a href="/blog" className="text-orange-500 hover:text-orange-400 underline">blog</a> about web development, SEO strategies, local SEO, and digital marketing trends 
                  for small businesses.
                </p>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">50+</div>
                  <div className="text-sm text-zinc-400">Projects Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">5+</div>
                  <div className="text-sm text-zinc-400">Years Experience</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-500">100%</div>
                  <div className="text-sm text-zinc-400">Client Satisfaction</div>
                </div>
              </div>
            </div>

            {/* Skills Section */}
            <div className="space-y-8">
              <h3 className="text-3xl font-main font-bold text-white mb-6">
                Skills & Technologies
              </h3>
              <p className="text-zinc-300 mb-6 leading-relaxed">
                I work with a modern tech stack that ensures your website is fast, scalable, and future-proof. React and Next.js power 
                lightning-fast, SEO-friendly sites that rank well and convert visitors. TypeScript and Tailwind CSS keep code clean and 
                maintainable, while GSAP brings your brand to life with smooth animations that engage users.
              </p>
              <div className="bg-zinc-800/50 rounded-2xl p-6">
                <h4 className="text-xl font-main font-semibold text-white mb-4">
                  Core Technologies
                </h4>
                <div className="flex flex-wrap gap-3">
                  {skills.slice(0, 6).map((skill, index) => (
                    <span key={index} className="bg-orange-500/20 text-orange-400 px-4 py-2 rounded-full text-sm border border-orange-500/30">
                      {skill.name}
                    </span>
                  ))}
                </div>
                <p className="text-zinc-400 text-sm mt-4">
                  Plus: GSAP, Three.js, Figma, Git, and more
                </p>
              </div>

              {/* Additional Info */}
              <div className="bg-zinc-800/50 rounded-2xl p-6 mt-8">
                <h4 className="text-xl font-main font-semibold text-white mb-4">
                  What I Bring to Your Project
                </h4>
                <ul className="space-y-3 text-zinc-300">
                  <li className="flex items-center">
                    <span className="text-orange-500 mr-3">✓</span>
                    Mobile-first responsive design = better user experience and higher SEO rankings
                  </li>
                  <li className="flex items-center">
                    <span className="text-orange-500 mr-3">✓</span>
                    Fast loading sites = better search rankings and lower bounce rates — learn more about our <a href="/services" className="text-orange-500 hover:text-orange-400 underline">SEO services</a>
                  </li>
                  <li className="flex items-center">
                    <span className="text-orange-500 mr-3">✓</span>
                    Local SEO optimization = more foot traffic, phone calls, and online enquiries from your neighborhood
                  </li>
                  <li className="flex items-center">
                    <span className="text-orange-500 mr-3">✓</span>
                    Modern design with animations = engaged visitors who stay longer and convert more
                  </li>
                  <li className="flex items-center">
                    <span className="text-orange-500 mr-3">✓</span>
                    Ongoing support = peace of mind for busy business owners — <a href="/contact" className="text-orange-500 hover:text-orange-400 underline">contact us</a> to learn more
                  </li>
                  <li className="flex items-center">
                    <span className="text-orange-500 mr-3">✓</span>
                    Custom development = a website that truly reflects your brand and grows with your business
                  </li>
                </ul>
                <p className="text-zinc-400 text-sm mt-6">
                  Let's talk about your goals and how a strategic website can help you reach them. Book a free 30-minute session with me, Tulio. 
                  <a href="/contact" className="text-orange-500 hover:text-orange-400 underline ml-1">Get in touch</a> or explore our <a href="/services" className="text-orange-500 hover:text-orange-400 underline">service offerings</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <Contact />
    </>
  );
}
