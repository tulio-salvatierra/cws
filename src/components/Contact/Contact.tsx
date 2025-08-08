// src/components/ContactSection.tsx
export default function Contact() {
  return (
    <section className="relative w-full min-h-screen bg-gray-900/50 text-white overflow-hidden">
      {/* Top‑left tagline */}
      <div className="absolute top-4 left-4 text-sm leading-tight">
        <p>Website Design</p>
        <p>Front‑end & Back‑end Development</p>
      </div>

      {/* Top‑right “Selected Work” list */}
      <div className="absolute top-4 right-4 text-xs">
        <p className="font-bold mb-1">Selected Work:</p>
        <ul className="space-y-[2px] text-orange-800">
          <li>TAMM Cleaning services</li>
          <li>Carolina Skin Centre</li>
          <li>Kike Vivaldy</li>
          <li>Intermezzo Sound Studio</li>
        </ul>
      </div>

      {/* Giant “Contact” heading */}
      <h1
        className="absolute top-1/2 left-4 -translate-y-1/2 font-black tracking-tight text-orange-500
                     text-[10vw] sm:text-[12vw] md:text-[10vw] lg:text-[8vw]"
      >
        Contact
      </h1>
      <p className="absolute bottom-1/3 left-4 text-2xl leading-tight">Let's get in touch and work together.</p>

      {/* Location under the heading */}
      <p className="text-orange-800 absolute top-[60%] left-4 text-xs uppercase tracking-wide">
        Chicago, IL, USA
      </p>

      {/* Contact details and socials */}
      <div className="absolute bottom-12 right-4 text-xs sm:text-sm space-y-2">
        <div>
          <p>Phone: (+1) 786‑314‑6121</p>
          <p>Mail: info@cicerowebstudio.xyz</p>
        </div>
        <div className="flex flex-col">
          <a href="#" className="hover:underline">
            Instagram
          </a>
          <a href="#" className="hover:underline">
            Twitter
          </a>
        </div>
      </div>
    </section>
  );
}