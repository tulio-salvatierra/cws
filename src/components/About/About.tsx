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
              About Cicero Web Studio | Chicago Web Design Studio
            </h1>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Cicero Web Studio is a Chicago web design studio and local digital marketing agency. We craft custom websites that blend creativity with cutting-edge technology to help small businesses succeed online.
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
                  Hi, I'm Tulio Salvatierra, a passionate web developer and web designer based in Chicago, Illinois. 
                  I specialize in creating modern, high-performance custom websites and providing local SEO services 
                  that not only look stunning but also deliver exceptional user experiences and improve search engine rankings.
                </p>
                <p>
                  With over 5 years of experience in web design and search engine optimization, I've worked with small businesses 
                  in Cicero, Chicago, and surrounding Chicagoland areas to bring their visions to life. From local small businesses 
                  to established brands, I believe every project deserves the same level of attention to detail and commitment to 
                  excellence in website design and online visibility.
                </p>
                <p>
                  My approach combines technical expertise in web development with creative problem-solving and local SEO strategies. 
                  I don't just build websites—I create digital solutions that help businesses grow, connect with local customers, 
                  and achieve their goals through improved online presence and search engine visibility. Whether you need a <a href="/services" className="text-orange-500 hover:text-orange-400 underline">custom website</a>, 
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
              <div className="space-y-6">
                {skills.map((skill, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-300 font-medium">{skill.name}</span>
                      <span className="text-orange-500 text-sm font-medium">{skill.level}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${skill.level}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Additional Info */}
              <div className="bg-zinc-800/50 rounded-2xl p-6 mt-8">
                <h4 className="text-xl font-main font-semibold text-white mb-4">
                  What I Bring to Your Project
                </h4>
                <ul className="space-y-3 text-zinc-300">
                  <li className="flex items-center">
                    <span className="text-orange-500 mr-3">✓</span>
                    Mobile-first responsive web design that works on all devices for enhanced user experience
                  </li>
                  <li className="flex items-center">
                    <span className="text-orange-500 mr-3">✓</span>
                    Search engine optimization (SEO) and local SEO services for better search rankings and online visibility — learn more about our <a href="/services" className="text-orange-500 hover:text-orange-400 underline">SEO services</a>
                  </li>
                  <li className="flex items-center">
                    <span className="text-orange-500 mr-3">✓</span>
                    Fast loading times and performance optimization to improve search engine results and user experience
                  </li>
                  <li className="flex items-center">
                    <span className="text-orange-500 mr-3">✓</span>
                    Modern website design with animations and interactive elements to engage visitors
                  </li>
                  <li className="flex items-center">
                    <span className="text-orange-500 mr-3">✓</span>
                    Ongoing website maintenance and support for Chicago and Cicero businesses — <a href="/contact" className="text-orange-500 hover:text-orange-400 underline">contact us</a> to learn more
                  </li>
                  <li className="flex items-center">
                    <span className="text-orange-500 mr-3">✓</span>
                    Custom website development tailored to small business needs with local SEO integration
                  </li>
                </ul>
                <p className="text-zinc-400 text-sm mt-4">
                  Ready to get started? <a href="/contact" className="text-orange-500 hover:text-orange-400 underline">Get in touch</a> or explore our <a href="/services" className="text-orange-500 hover:text-orange-400 underline">service offerings</a>.
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
