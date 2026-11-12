// A separate document keeps the vendor's global loader isolated from React's
// StrictMode effects and client-side route remounts.
const widgetDocument = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;padding:16px;font-family:Arial,sans-serif;color:#27272a;background:#fff}#fallback{text-align:center;font-size:14px;line-height:1.6}a{color:#9a3412}</style></head><body><p id="fallback" role="status">Loading client reviews…</p><script>
const observer = new MutationObserver(() => {
  if (document.querySelector('.ti-widget')) {
    document.getElementById('fallback')?.remove();
    observer.disconnect();
  }
});
observer.observe(document.body, {childList:true,subtree:true});
setTimeout(() => { const fallback=document.getElementById('fallback'); if(fallback) fallback.textContent='Reviews are temporarily unavailable. You can still contact us using the form above.'; },15000);
</script><script defer async src="https://cdn.trustindex.io/loader.js?8d29a15854c6645af156a4367da"></script></body></html>`;

export default function TrustindexReviews() {
  return (
    <section aria-labelledby="contact-reviews-title" className="bg-zinc-800/90 backdrop-blur-sm rounded-2xl p-6 md:p-12 my-10">
      <p className="text-orange-500 text-sm uppercase mb-4">Client reviews</p>
      <h2 id="contact-reviews-title" className="text-3xl md:text-5xl font-main mb-6">Their words. Your next step.</h2>
      <iframe title="Cicero Web Studio client reviews from Trustindex" srcDoc={widgetDocument} className="w-full h-72 rounded-xl border-0 bg-white" loading="lazy" />
    </section>
  );
}
