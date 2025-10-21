

import { 
  PINTEREST_URL, 
  FACEBOOK_URL, 
  INSTAGRAM_URL, 
  YOUTUBE_URL, 
  LINKEDIN_URL,
  TWITTER_URL
} from '../../Constants/Constants';

export default function Contact() {
  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center p-4 gap-8">
      {/* Google Maps Commute Widget */}
     

      {/* Main content block */}
      <div className="text-white w-full max-w-6xl rounded-2xl p-8 md:p-12 lg:p-16 bg-zinc-800/01 backdrop-blur-sm border border-zinc-700/50">
        
        {/* Header with brand name */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl text-orange-500 font-main font-black mb-4">
            CICERO WEB STUDIO
          </h2>
          <div className="w-24 h-1 bg-orange-500 mx-auto"></div>
        </div>

        {/* Main content area with profile and contact info */}
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-12 lg:gap-16">
          
          {/* Profile Picture Section */}
          <div className="flex-shrink-0 text-center lg:text-left">
            <div className="relative inline-block">
              <div className="w-48 h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 rounded-full overflow-hidden border-4 border-orange-500 shadow-2xl">
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
            <h3 className="text-xl md:text-2xl font-main font-bold text-white mt-6">
              Tulio Salvatierra
            </h3>
            <p className="text-zinc-400 text-sm md:text-base">
              Founder & Developer
            </p>
          </div>

          {/* Contact Information Section */}
          <div className="flex-1 text-center lg:text-left">
            {/* Main heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-orange-500 font-main font-black mb-6 lg:mb-8">
              GET IN TOUCH
            </h1>

            {/* Email address */}
            <a 
              href="mailto:info@cicerowebstudio.xyz" 
              className="text-lg md:text-xl lg:text-2xl xl:text-3xl text-white hover:text-orange-400 transition-colors duration-200 block mb-8 lg:mb-12"
            >
              info@cicerowebstudio.xyz
            </a>

            {/* Social section */}
            <div className="max-w-md mx-auto lg:mx-0">
              <h3 className="text-lg md:text-xl lg:text-2xl text-white font-semibold mb-6">Connect With Us</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-zinc-300">
                <a 
                  href={INSTAGRAM_URL} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg hover:bg-zinc-700/50 transition-colors duration-200 group"
                >
                  <span className="text-orange-500 group-hover:text-orange-400">📷</span>
                  <span className="text-sm md:text-base">Instagram</span>
                </a>
                <a 
                  href={YOUTUBE_URL} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg hover:bg-zinc-700/50 transition-colors duration-200 group"
                >
                  <span className="text-orange-500 group-hover:text-orange-400">🎥</span>
                  <span className="text-sm md:text-base">YouTube</span>
                </a>
                <a 
                  href={FACEBOOK_URL} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg hover:bg-zinc-700/50 transition-colors duration-200 group"
                >
                  <span className="text-orange-500 group-hover:text-orange-400">📘</span>
                  <span className="text-sm md:text-base">Facebook</span>
                </a>
                <a 
                  href={TWITTER_URL} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg hover:bg-zinc-700/50 transition-colors duration-200 group"
                >
                  <span className="text-orange-500 group-hover:text-orange-400">🐦</span>
                  <span className="text-sm md:text-base">Twitter</span>
                </a>
                <a 
                  href={PINTEREST_URL} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg hover:bg-zinc-700/50 transition-colors duration-200 group"
                >
                  <span className="text-orange-500 group-hover:text-orange-400">📌</span>
                  <span className="text-sm md:text-base">Pinterest</span>
                </a>
                <a 
                  href={LINKEDIN_URL} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center lg:justify-start gap-3 p-3 rounded-lg hover:bg-zinc-700/50 transition-colors duration-200 group"
                >
                  <span className="text-orange-500 group-hover:text-orange-400">💼</span>
                  <span className="text-sm md:text-base">LinkedIn</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}