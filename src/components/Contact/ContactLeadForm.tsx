import { useRef, useState } from "react";
import { hasValidUsPhone, submitContactLead } from "../../lib/negocioListoLead";

const inputClass =
  "w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent";
const labelClass = "block text-sm font-medium text-zinc-300 mb-2";
export default function ContactLeadForm() {
  const startedAt = useRef(Date.now());
  const inFlight = useRef(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const data = new FormData(event.currentTarget);
    const get = (key: string) => String(data.get(key) || "").trim();
    if (
      !get("name") ||
      !get("message") ||
      (get("phone") && !hasValidUsPhone(get("phone")))
    ) {
      setError(
        "Enter your name and project details. If you include a phone number, use a valid US number.",
      );
      return;
    }
    inFlight.current = true;
    setStatus("sending");
    setError("");
    try {
      await submitContactLead({
        name: get("name"),
        email: get("email"),
        phone: get("phone"),
        business_name: get("business"),
        service: get("service"),
        message: get("message"),
        company_website: get("company_website"),
        elapsed_ms: Date.now() - startedAt.current,
      });
      setStatus("done");
    } catch {
      setStatus("error");
      setError(
        "We couldn’t confirm your submission. Please try again, or contact us by email or phone above.",
      );
    } finally {
      inFlight.current = false;
    }
  }
  if (status === "done")
    return (
      <div className="bg-zinc-800 rounded-2xl p-6 md:p-8" role="status">
        <h3 className="text-2xl text-orange-500">Thanks for reaching out.</h3>
        <p className="text-zinc-300 mt-4">
          Your project inquiry has been received.
        </p>
      </div>
    );
  return (
    <div className="bg-zinc-800 rounded-2xl p-6 md:p-8">
      <form
        className="space-y-6"
        onSubmit={submit}
        aria-busy={status === "sending"}
      >
        <div className="hidden" aria-hidden="true">
          <label htmlFor="contact-hp">Company website</label>
          <input
            id="contact-hp"
            name="company_website"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>
        <fieldset disabled={status === "sending"} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                id: "name",
                label: "Your name *",
                type: "text",
                auto: "name",
                required: true,
                max: 200,
              },
              {
                id: "email",
                label: "Email address *",
                type: "email",
                auto: "email",
                required: true,
                max: 320,
              },
              {
                id: "business",
                label: "Business name (optional)",
                type: "text",
                auto: "organization",
                required: false,
                max: 200,
              },
              {
                id: "phone",
                label: "Phone number (optional)",
                type: "tel",
                auto: "tel",
                required: false,
                max: 50,
              },
            ].map((f) => (
              <div key={f.id}>
                <label htmlFor={`contact-${f.id}`} className={labelClass}>
                  {f.label}
                </label>
                <input
                  id={`contact-${f.id}`}
                  name={f.id}
                  type={f.type}
                  autoComplete={f.auto}
                  required={f.required}
                  maxLength={f.max}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
          <div>
            <label htmlFor="contact-service" className={labelClass}>
              What can we help with? *
            </label>
            <select
              id="contact-service"
              name="service"
              required
              className={inputClass}
              defaultValue=""
            >
              <option value="">Select an option</option>
              <option value="new">A new website</option>
              <option value="redesign">Improving my existing website</option>
              <option value="audit">A website audit</option>
              <option value="other">Something else / not sure yet</option>
            </select>
          </div>
          <div>
            <label htmlFor="contact-message" className={labelClass}>
              Tell us about your project *
            </label>
            <textarea
              id="contact-message"
              name="message"
              rows={4}
              required
              maxLength={4000}
              className={inputClass}
              placeholder="What would you like your website to help with?"
            />
          </div>
          <p className="text-sm text-zinc-400">
            Use this form to ask about your project.{" "}
            <a href="/policy">Privacy policy</a>
          </p>
          {error && (
            <p role="alert" className="text-orange-300">
              {error}
            </p>
          )}
          <button
            className="custom-btn custom-btn--primary custom-btn--full disabled:opacity-60"
            type="submit"
            disabled={status === "sending"}
          >
            <span className="custom-btn__label">
              {status === "sending"
                ? "Sending…"
                : "Let’s talk about my project"}
            </span>
          </button>
        </fieldset>
      </form>
    </div>
  );
}
