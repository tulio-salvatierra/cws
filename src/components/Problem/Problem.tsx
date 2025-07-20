export default function Problem() {
  return (
    <>
      <section className="p-5  flex flex-col w-screen h-screen justify-evenly">
        <div className="flex flex-col">
          <h2 className="font-main font-black sm:text-[6rem] text-[3rem] text-zinc-500 w-100 leading-tight">
            We're not just another web design agency
          </h2>
          <p className="font-secondary text-white text-xl sm:text-4xl text-start sm:w-3/4">
            We're your digital groth partners. Based in Chicago, we combine
            beautiful design with heavy metal determination to deliver solutions
            that actually move the needle for your business
          </p>
        </div>
        <ul className="p-4 flex flex-col text-start w-100 text-white">
          <h2 className="font-main font-black sm:text-4xl text-2xl text-orange-700 w-100 leading-tight">
            What make us different?
          </h2>
          <li className="font-secondary text-xl sm:text-2xl p-4">
            Partnership approach: Your wins are our wins{" "}
          </li>
          <li className="font-secondary text-xl sm:text-2xl p-4">
            Problem-solving mindset with a can-do attitude
          </li>
          <li className="font-secondary text-xl sm:text-2xl p-4">
            Elegant design meets relentless execution
          </li>
          <li className="font-secondary text-xl sm:text-2xl p-4">
            We go the extra mile, every single time
          </li>
        </ul>
      </section>
    </>
  );
}
