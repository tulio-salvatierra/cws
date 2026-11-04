import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LocationSection from "../LocationSection";

describe("LocationSection", () => {
  it("uses the supplied key-free Google Maps embed and provides directions", () => {
    render(<LocationSection />);

    expect(
      screen.getByRole("heading", {
        name: "Chicago-based. Built for businesses that need to be found.",
      }),
    ).toBeInTheDocument();

    const map = screen.getByTitle("Cicero Web Studio location");
    expect(map).toHaveAttribute("src", expect.stringContaining("https://www.google.com/maps/embed?pb="));
    expect(map.getAttribute("src")).not.toContain("key=");
    expect(map).toHaveAttribute("loading", "lazy");

    expect(screen.getByRole("link", { name: /get directions/i })).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&destination=4922+W+Berenice+Ave,+Chicago,+IL+60641",
    );
  });
});
