import contactBg from '../../assets/images/contact.svg';

export default function Contact() {
  return (
    <section className="relative w-full min-h-screen bg-black flex items-center justify-center p-4">
      {/* Main white content block */}
      <div 
        className="text-black w-full rounded-2xl h-[80vh] p-8 md:p-12 flex flex-col bg-image-contact"
        style={{ backgroundImage: `url(${contactBg})` }}
      >
        {/* Header with brand name and navigation */}
        <div className="flex justify-between items-start mb-16">
          <h2 className="text-2xl text-orange-500 font-main font-black">CICERO WEB STUDIO</h2>
          <nav className="flex space-x-6 text-sm">
            <a href="#work" className="hover:underline">Work</a>
            <a href="#about" className="hover:underline">About</a>
            <a href="#contact" className="hover:underline">Contact</a>
          </nav>
        </div>

        {/* Main content area */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Main heading */}
          <h1 className="text-8xl text-orange-500 font-main font-black mb-8">
            GET IN TOUCH
          </h1>

          {/* Email address */}
          <a 
            href="mailto:info@cicerowebstudio.xyz" 
            className="text-xl md:text-2xl underline mb-12 hover:opacity-70 transition-opacity"
          >
            info@cicerowebstudio.xyz
          </a>

          {/* Social section */}
          <div>
            <h3 className="text-xl mb-4">Social:</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 font-secondary text-zinc-700">
              <div className="space-y-2">
                <a href="" className="block hover:underline">Instagram</a>
                <a href="#" className="block hover:underline">YouTube</a>
              </div>
              <div className="space-y-2">
                <a href="#" className="block hover:underline">Facebook</a>
                <a href="#" className="block hover:underline">Twitter</a>
                <a href="#" className="block hover:underline">Pinterest</a>
                <a href="#" className="block hover:underline">LinkedIn</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}