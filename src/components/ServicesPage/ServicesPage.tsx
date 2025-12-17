import { useFadeIn } from '@/Hooks/useFadeIn';
import { useScramble } from '@/Hooks/useScramble';
import MaskedLines from '../MaskedLines/MaskedLines';


export default function ServicesPage() {
  const scrambleRef= useScramble("SERVICES", 0.1);
  const fadeInRef = useFadeIn();
  const fadeInRef2 = useFadeIn();
  const services = [
    {
      id: 1,
      title: "Custom Websites",
      icon: "/images/Palette.png",
      description: "Custom-built websites from scratch or refreshed to look modern, fast, and conversion-focused",
      details: [
        "Custom website from scratch or full refresh",
        "Mobile-first, responsive layout and clean navigation",
        "Performance + SEO-ready structure (fast load, best practices)",
        "Optional animations + interactive sections"
      ],
      technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS", "GSAP"],
      pricing: "Starting from $2,500"
    },
    {
      id: 2,
      title: "Photo & Video Content",
      icon: "/images/video.png",
      description: "Original photo and video content tailored for websites, branding, and local marketing",
      details: [
        "On-location photo/video tailored to your brand",
        "Short-form clips for website + social",
        "Professional edit + color grade",
        "Optimized files for fast web performance"
      ],
      technologies: ["Sony A7 Series", "Final Cut Pro", "Canva", "OBS"],
      pricing: "Starting from $500"
    },
    {
      id: 3,
      title: "Local SEO & Visibility",
      icon: "/images/Arrow.png",
      description: "SEO strategies designed to help local customers find your business online",
      details: [
        "On-page SEO (titles, headings, metadata)",
        "Local SEO targeting for Chicago neighborhoods",
        "Google Business Profile setup/optimization",
        "Analytics setup + performance tracking basics"
      ],
      technologies: ["Google Analytics", "Google Search Console", "Google Business Profile"],
      pricing: "Starting from $500"
    },
    {
      id: 4,
      title: "Website Growth Bundle",
      icon: "/images/Puzzle.png",
      description: "Everything you need to launch strong online — website, visuals, and visibility working together",
      details: [
        "Custom website + modern refresh",
        "Pro photo/video content included",
        "Local SEO + Google Business optimization",
        "Bundled savings + priority delivery"
      ],
      technologies: ["Next.js", "Tailwind CSS", "GSAP", "Google Analytics"],
      pricing: "Bundle pricing from $3,500"
    }
  ]

  return (
    <section className="relative w-full min-h-screen bg-zinc-900/10 py-20 px-4 mt-20">
      <div ref={fadeInRef} className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 ref={scrambleRef} className="text-6xl md:text-8xl font-main font-black text-orange-500 mb-4">
            SERVICES
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            Solutions to help your business <strong>STAND OUT</strong>
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid items-center justify-center gap-8 mb-16">
          {services.map((service) => (
            <div ref={fadeInRef2} key={service.id} className="bg-zinc-800/10 grid grid-cols-1 md:grid-cols-2 gap-8 rounded-2xl p-8 hover:bg-zinc-800/70 transition-all duration-300">
              {/* Service Header */}
              <div className="flex-col mb-6">
                <h2 ref={fadeInRef} className="text-4xl md:text-7xl font-main font-bold text-orange-500 text-center mb-2">
                  {service.title}
                </h2>
                <img ref={fadeInRef} src={service.icon} alt={service.title} className="w-full h-auto mx-auto object-cover mr-4" />
                
              </div>

              {/* Service Details */}
              <div className="mb-6 grid place-items-center">
                <div>
                <h3 className="sm:text-6xl text-4xl mx-auto font-bold tracking-relaxed text-white mb-8">What's Included?</h3>
                <ul className="space-y-2 text-zinc-300 w-full">
                  {service.details.map((detail, index) => (
                    <li key={index} className="flex items-start text-md sm:text-3xl w-full">
                      <MaskedLines
                        as="span"
                        scroll
                        scrollStart="top 85%"
                        className="text-orange-500"
                      >
                        •
                      </MaskedLines>
                      <MaskedLines
                        as="span"
                        scroll
                        scrollStart="top 85%"
                        className="text-zinc-300/80 leading-none tracking-tight"
                      >
                        {detail}
                      </MaskedLines>
                    </li>
                  ))}
                  </ul>
                  </div>
              </div>

              {/* Technologies */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Technologies:</h3>
                <div ref={fadeInRef} className="flex flex-wrap gap-2">
                  {service.technologies.map((tech, index) => (
                    <span ref={fadeInRef}
                      key={index}
                      className="bg-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-sm border border-orange-500/30"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Process Section */}
        <div className="bg-zinc-800/50 rounded-2xl p-8 mb-16">
          <h2 className="text-3xl font-main font-bold text-orange-500 mb-8 text-center">
            Our Development Process
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Discovery</h3>
              <p className="text-zinc-400">Understanding your needs, goals, and requirements through detailed consultation</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Planning</h3>
              <p className="text-zinc-400">Creating detailed project plans, timelines, and technical architecture</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Development</h3>
              <p className="text-zinc-400">Building your solution with regular updates and milestone reviews</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">4</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Launch</h3>
              <p className="text-zinc-400">Deployment, testing, and ongoing support to ensure success</p>
            </div>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="bg-zinc-800/50 rounded-2xl p-8 mb-16">
          <h2 className="text-3xl font-main font-bold text-orange-500 mb-8 text-center">
            Why Choose Cicero Web Studio?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-semibold text-white mb-2">Fast Delivery</h3>
              <p className="text-zinc-400">Quick turnaround times without compromising quality or attention to detail</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💎</div>
              <h3 className="text-xl font-semibold text-white mb-2">Premium Quality</h3>
              <p className="text-zinc-400">High-end solutions built with modern technologies and best practices</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold text-white mb-2">Ongoing Support</h3>
              <p className="text-zinc-400">Continuous support and maintenance to keep your solution running smoothly</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-main font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-orange-100 mb-6 max-w-2xl mx-auto">
            Let's discuss your project and create something amazing together. Get in touch for a free consultation and quote.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:info@cicerowebstudio.xyz" 
              className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors duration-200"
            >
              Start Your Project
            </a>
            <a 
              href="tel:+17863146121" 
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors duration-200"
            >
              Call Us Now
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
