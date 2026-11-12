import CustomButton from "../CustomButton/CustomButton";
import StudioMap from "./StudioMap";
import ContactLeadForm from "./ContactLeadForm";
import TrustindexReviews from "./TrustindexReviews";
import { EMAIL, PHONE, CALENDLY_URL } from "../../Constants/Constants";
export default function Contact() {
  return (
    <div className="relative max-w-7xl mx-auto px-4 md:px-8 pt-40 pb-10 text-white">
      <section
        id="contact"
        className="bg-zinc-800/80 backdrop-blur-sm rounded-2xl p-6 md:p-12 grid lg:grid-cols-2 gap-10 items-center"
      >
        <div>
          <p className="text-orange-500 uppercase text-sm mb-5">
            Cicero Web Studio / Contact
          </p>
          <h1 className="font-main text-4xl sm:text-5xl lg:text-6xl leading-none mb-6">
            Good websites start with a{" "}
            <span className="text-orange-500">conversation.</span>
          </h1>
          <p className="text-zinc-300 text-lg mb-8">
            Schedule a free 15-minute site audit to discover how a strategic
            website can boost your business.
          </p>
          <div className="flex flex-wrap gap-4">
            <CustomButton
              label="Book a free site audit"
              href={CALENDLY_URL}
              newTab
            />
            <CustomButton
              label="Tell us about your project"
              href="#project-inquiry"
              secondary
            />
          </div>
          <div className="flex flex-col gap-3 mt-8 text-sm">
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
            <a href={`tel:+1${PHONE}`}>786-314-6121</a>
          </div>
        </div>
        <div>
          <img
            src="/images/tulio.png"
            alt="Tulio Salvatierra"
            className="w-full h-[24rem] md:h-[30rem] object-cover object-top rounded-xl"
          />
          <h2 className="font-main text-2xl mt-5">Tulio Salvatierra</h2>
          <p className="text-zinc-300 mt-2">Founder & Developer</p>
        </div>
      </section>
      <section id="project-inquiry" className="py-16 scroll-mt-28">
        <div className="grid lg:grid-cols-2 gap-8 md:gap-12">
          <div>
            <p className="text-orange-500 text-sm uppercase mb-4">
              Tell us about your project
            </p>
            <h2 className="text-4xl md:text-5xl font-main mb-6">
              What are you working on?
            </h2>
            <p className="text-xl text-zinc-300">
              Starting something new or improving an existing website? Share a
              few details so we can understand what you need.
            </p>
          </div>
          <ContactLeadForm />
        </div>
      </section>
      <TrustindexReviews />
      <section className="bg-zinc-800/80 backdrop-blur-sm rounded-2xl p-6 md:p-12 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="text-orange-500 text-sm uppercase mb-4">
            Based in Chicago
          </p>
          <h2 className="text-3xl md:text-4xl mb-6">
            A local studio. A direct connection.
          </h2>
          <p className="text-zinc-300 mb-6">
            Have a website in mind, or one that needs a fresh look? Let’s talk
            about your project.
          </p>
          <CustomButton
            label="Email Tulio"
            href={`mailto:${EMAIL}`}
            secondary
          />
        </div>
        <div className="h-80 overflow-hidden rounded-xl">
          <StudioMap />
        </div>
      </section>
    </div>
  );
}
