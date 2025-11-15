

import { 
  PINTEREST_URL, 
  FACEBOOK_URL, 
  INSTAGRAM_URL, 
  YOUTUBE_URL, 
  LINKEDIN_URL,
  TWITTER_URL,
  EMAIL,
  PHONE
} from '../../Constants/Constants';

export default function Contact() {
  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center p-4 gap-8">
      {/* Google Maps Commute Widget */}
     

      {/* Main content block */}
      <div className="text-white w-full rounded-2xl p-8 md:p-12 lg:p-16 bg-zinc-800/01 backdrop-blur-sm border border-zinc-700/50">
        
        {/* Header with brand name */}
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl text-orange-500 font-main font-black mb-4">
          GET IN TOUCH
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
            

            {/* Email address */}
            <a 
              href={`mailto:${EMAIL}`}
              className="text-lg md:text-xl lg:text-2xl xl:text-3xl text-white hover:text-orange-400 transition-colors duration-200 block mb-4 lg:mb-6"
            >
              {EMAIL}
            </a>

            {/* Phone number */}
            <a 
              href={`tel:+1${PHONE}`}
              className="text-lg md:text-xl lg:text-2xl xl:text-3xl text-white hover:text-orange-400 transition-colors duration-200 block mb-8 lg:mb-12"
            >
              +1 {String(PHONE).replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')}
            </a>

            {/* Social section */}
            <div className="max-w-md mx-auto lg:mx-0">
              <h3 className="text-lg md:text-xl lg:text-2xl xl:text-3xl text-white hover:text-orange-400 transition-colors duration-200 block mb-8 lg:mb-12">Connect With Us</h3>
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

        {/* Google Maps Embed */}
        <div className="w-full mt-8 rounded-xl overflow-hidden">
          <iframe 
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d252.5880090363163!2d-87.7509307390869!3d41.95077474768748!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x880fcde85586be3d%3A0x88f84b57cb03f35b!2sCicero%20Web%20Studio!5e1!3m2!1sen!2sus!4v1761046047715!5m2!1sen!2sus" 
            width="100%" 
            height="400" 
            style={{ border: 0 }} 
            allowFullScreen={true}
            loading="lazy" 
            referrerPolicy="no-referrer-when-downgrade"
            title="Cicero Web Studio Location"
          />
        </div>
      </div>
    </section>
  );
}