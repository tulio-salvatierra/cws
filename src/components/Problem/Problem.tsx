export default function Problem() {
  return (
    <>
      <section className="p-5  flex flex-col w-screen h-screen justify-evenly">
        <div className="flex flex-col">
          <strong className="text-white">[SERVICES]</strong>
          <h2 className="font-main font-black sm:text-[6rem] text-[3rem] text-zinc-700 w-100 leading-tight">
            [Problem we aim to solve:]
          </h2>
          <p className="font-secondary text-xl sm:text-4xl text-start sm:w-3/4">
            Small businesses struggle to establish a credible online presence,
            losing potential customers to competitors with modern, optimized
            websites. <strong className="text-zinc-900">DIY can feel like:</strong>
          </p>
        </div>
        <ul className="p-4 flex flex-col text-start  w-100">
          <li className="font-secondary text-xl sm:text-2xl p-4">
            [01] Competitors have modern, optimized websites that attract more
            customers.
          </li>
          <li className="font-secondary text-xl sm:text-2xl p-4">
            [02] A weak or nonexistent online presence leads to missed revenue
            opportunities.
          </li>
          <li className="font-secondary text-xl sm:text-2xl p-4">
            [03] The business relies solely on social media, which isn’t enough
            to establish credibility.
          </li>
          <li className="font-secondary text-xl sm:text-2xl p-4">
            [04] DIY website builders provide limited customization, making it
            hard to stand out.
          </li>
        </ul>
      </section>
    </>
  );
}
