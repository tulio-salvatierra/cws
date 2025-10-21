import React from 'react';

export default function ServicesPage() {
  const services = [
    {
      id: 1,
      title: "Web Design & Development",
      icon: "🎨",
      description: "Custom websites that combine stunning design with powerful functionality",
      details: [
        "Responsive design for all devices and screen sizes",
        "Modern UI/UX with intuitive navigation",
        "Custom animations and interactive elements",
        "SEO-optimized structure and content",
        "Fast loading times and performance optimization",
        "Content Management System (CMS) integration",
        "E-commerce functionality and payment processing",
        "Multi-language support and internationalization"
      ],
      technologies: ["React", "Next.js", "TypeScript", "Tailwind CSS", "GSAP", "Framer Motion"],
      pricing: "Starting from $2,500"
    },
    {
      id: 2,
      title: "E-commerce Solutions",
      icon: "🛒",
      description: "Complete online store solutions to grow your business",
      details: [
        "Custom e-commerce platform development",
        "Product catalog and inventory management",
        "Secure payment gateway integration",
        "Order processing and fulfillment systems",
        "Customer account and loyalty programs",
        "Analytics and reporting dashboards",
        "Mobile-optimized shopping experience",
        "Multi-vendor marketplace capabilities"
      ],
      technologies: ["Shopify", "WooCommerce", "Stripe", "PayPal", "Node.js", "MongoDB"],
      pricing: "Starting from $4,000"
    },
    {
      id: 3,
      title: "Mobile App Development",
      icon: "📱",
      description: "Native and cross-platform mobile applications",
      details: [
        "iOS and Android app development",
        "Cross-platform solutions with React Native",
        "Progressive Web Apps (PWA)",
        "Push notifications and real-time updates",
        "Offline functionality and data synchronization",
        "App store optimization and deployment",
        "User authentication and security",
        "Performance monitoring and analytics"
      ],
      technologies: ["React Native", "Flutter", "Swift", "Kotlin", "Firebase", "AWS"],
      pricing: "Starting from $8,000"
    },
    {
      id: 4,
      title: "Business Automation",
      icon: "⚙️",
      description: "Streamline operations with intelligent automation solutions",
      details: [
        "Custom workflow automation systems",
        "API integration and data synchronization",
        "Customer relationship management (CRM)",
        "Inventory and supply chain management",
        "Automated reporting and analytics",
        "Email marketing automation",
        "Lead generation and nurturing systems",
        "Process optimization and efficiency tools"
      ],
      technologies: ["Python", "Node.js", "Zapier", "Airtable", "Salesforce", "HubSpot"],
      pricing: "Starting from $3,500"
    },
    {
      id: 5,
      title: "IT Support & Consulting",
      icon: "🛠️",
      description: "Expert guidance and ongoing technical support",
      details: [
        "Technology strategy and planning",
        "Infrastructure optimization and migration",
        "Security audits and implementation",
        "Performance monitoring and maintenance",
        "24/7 technical support and troubleshooting",
        "Staff training and documentation",
        "Disaster recovery and backup solutions",
        "Compliance and regulatory guidance"
      ],
      technologies: ["AWS", "Azure", "Docker", "Kubernetes", "Linux", "Windows Server"],
      pricing: "Starting from $150/hour"
    },
    {
      id: 6,
      title: "Digital Marketing & SEO",
      icon: "📈",
      description: "Drive traffic and grow your online presence",
      details: [
        "Search Engine Optimization (SEO)",
        "Pay-per-click (PPC) advertising campaigns",
        "Social media marketing and management",
        "Content marketing and strategy",
        "Email marketing and automation",
        "Analytics and performance tracking",
        "Conversion rate optimization",
        "Brand development and positioning"
      ],
      technologies: ["Google Analytics", "Google Ads", "Facebook Ads", "Mailchimp", "SEMrush", "Ahrefs"],
      pricing: "Starting from $1,500/month"
    }
  ];

  return (
    <section className="relative w-full min-h-screen bg-zinc-900/10 py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-main font-black text-orange-500 mb-4">
            SERVICES
          </h1>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto">
            Comprehensive digital solutions to help your business thrive in the modern world
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {services.map((service) => (
            <div key={service.id} className="bg-zinc-800/01 rounded-2xl p-8 hover:bg-zinc-800/70 transition-all duration-300">
              {/* Service Header */}
              <div className="flex items-start mb-6">
                <span className="text-4xl mr-4">{service.icon}</span>
                <div>
                  <h2 className="text-2xl font-main font-bold text-white mb-2">
                    {service.title}
                  </h2>
                  <p className="text-zinc-400 mb-4">
                    {service.description}
                  </p>
                  <div className="text-orange-500 font-semibold">
                    {service.pricing}
                  </div>
                </div>
              </div>

              {/* Service Details */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">What's Included:</h3>
                <ul className="space-y-2 text-zinc-300">
                  {service.details.map((detail, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-orange-500 mr-2 mt-1">•</span>
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Technologies */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Technologies:</h3>
                <div className="flex flex-wrap gap-2">
                  {service.technologies.map((tech, index) => (
                    <span 
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
