import { Banner } from "../Banner";
import CustomButton from "../CustomButton";

export default function Problem() {
  return (
    <>
      <section className="p-5 md:grid md:grid-cols-2 md:grid-rows-2 md:gap-y-40 gap-y-16 flex flex-col w-screen h-50 justify-evenly mt-80">
        <div className="flex flex-col justify-center items-start text-white w-full">
          <Banner />
          <p className="font-secondary text-white text-xl text-start">
            We're your digital growth partners. Based in Chicago, we combine
            beautiful design with heavy metal determination to deliver solutions
            that actually move the needle for your business
          </p>
        </div>
        <div></div>
        <div>
          <img
            src="https://i.pinimg.com/1200x/01/8f/3f/018f3fc28584f4331619094acd83fd3b.jpg"
            alt="Illustration"
            className="h-25 p-10 mx-auto rounded-lg shadow-lg w-full object-cover md:object-contain md:h-full md:w-auto"
          />
        </div>
        <div className="flex flex-col text-start w-full text-white">
          <h2 className="font-main font-black sm:text-4xl text-8xl text-orange-900 w-full leading-tight mb-4">
            What makes us different?
          </h2>
          <p className="font-secondary text-lg sm:text-xl text-white flex-1">
            Partnership approach: Your wins are our wins. Problem-solving
            mindset with a can-do attitude. Elegant design meets relentless
            execution. We go the extra mile, every single time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <CustomButton href="/contact" label="Let's talk" />
            <CustomButton href="/works" label="See our works" />
          </div>
        </div>
      </section>
    </>
  );
}
