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
      <section id="about" className="relative w-full min-h-screen bg-zinc-900 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-6xl md:text-8xl font-main font-black text-orange-500 mb-4">
              ABOUT
            </h2>
            <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
              Crafting digital experiences that blend creativity with cutting-edge technology
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
                      src="/images/hero.mp4"
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
                  Hi, I'm Tulio Salvatierra, a passionate web developer and designer based in Chicago. 
                  I specialize in creating modern, high-performance websites that not only look stunning 
                  but also deliver exceptional user experiences.
                </p>
                <p>
                  With over 5 years of experience in the digital space, I've worked with businesses 
                  of all sizes to bring their visions to life. From small local businesses to 
                  international brands, I believe every project deserves the same level of attention 
                  to detail and commitment to excellence.
                </p>
                <p>
                  My approach combines technical expertise with creative problem-solving. I don't 
                  just build websites—I create digital solutions that help businesses grow, connect 
                  with their audience, and achieve their goals.
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
                    Responsive design that works on all devices
                  </li>
                  <li className="flex items-center">
                    <span className="text-orange-500 mr-3">✓</span>
                    SEO-optimized for better search rankings
                  </li>
                  <li className="flex items-center">
                    <span className="text-orange-500 mr-3">✓</span>
                    Fast loading times and performance optimization
                  </li>
                  <li className="flex items-center">
                    <span className="text-orange-500 mr-3">✓</span>
                    Modern animations and interactive elements
                  </li>
                  <li className="flex items-center">
                    <span className="text-orange-500 mr-3">✓</span>
                    Ongoing support and maintenance
                  </li>
                </ul>
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
