
import { describe, it, expect, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import React from "react";
import { RequestScreen } from "./RequestScreen";
import { OVER_LIMIT_SAMPLE, TYPING_SAMPLE } from "@/lib/request-states";

function expandStateSwitcher() {
  fireEvent.click(screen.getByRole("button", { name: /State [A-J]/i }));
}

describe("RequestScreen (Task 2 states A–J)", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("state A: idle composer, example chips, and how it works", () => {
    render(<RequestScreen />);
    expect(screen.getByLabelText(/What are you shopping for/i)).toHaveValue("");
    expect(
      screen.getByRole("button", { name: /gaming laptop under 80k/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /How ShopSense works/i }),
    ).toBeInTheDocument();
  });

  it("state B: typing fills the composer and keeps search enabled", () => {
    render(<RequestScreen />);
    const textarea = screen.getByLabelText(/What are you shopping for/i);

    fireEvent.change(textarea, { target: { value: TYPING_SAMPLE } });

    expect(textarea).toHaveValue(TYPING_SAMPLE);
    expect(screen.getByRole("button", { name: /^search$/i })).not.toBeDisabled();
  });

  it("submits a laptop request and shows understood chips (G)", async () => {
    render(<RequestScreen />);

    fireEvent.change(screen.getByLabelText(/What are you shopping for/i), {
      target: { value: "laptop for coding under 70k" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    expect(screen.getByRole("button", { name: /checking/i })).toBeDisabled();

    await waitFor(
      () => {
        expect(
          screen.getByRole("heading", { name: /^Understood$/ }),
        ).toBeInTheDocument();

        // Use exact text to avoid matching the textarea and example chips.
        expect(
          screen.getByText("Laptop", { exact: true }),
        ).toBeInTheDocument();

        expect(screen.getByText(/₹70,000/)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("state D: no product type shows a follow-up with category buttons", async () => {
    render(<RequestScreen />);

    fireEvent.change(screen.getByLabelText(/What are you shopping for/i), {
      target: { value: "something for my mom" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(
      () => {
        expect(
          screen.getByText(/What kind of product are you looking for/i),
        ).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /^Phone$/i })).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("state E: ambiguous watch asks which kind", async () => {
    render(<RequestScreen />);

    fireEvent.change(screen.getByLabelText(/What are you shopping for/i), {
      target: { value: "a watch under 10k" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(
      () => {
        expect(
          screen.getByText(/wristwatch, a smartwatch, or a fitness tracker/i),
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Fitness tracker/i }),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("state F: a second unclear turn shows example requests and never guesses", async () => {
    render(<RequestScreen />);

    fireEvent.change(screen.getByLabelText(/What are you shopping for/i), {
      target: { value: "something for my mom" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^search$/i }));

    await waitFor(
      () => {
        expect(
          screen.getByRole("button", { name: /Something else/i }),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    fireEvent.click(screen.getByRole("button", { name: /Something else/i }));

    await waitFor(
      () => {
        expect(screen.getByText(/Example requests/i)).toBeInTheDocument();
        expect(
          screen.queryByRole("heading", { name: /^Understood$/ }),
        ).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("state H: budget popover validates and applies a new amount", async () => {
    render(<RequestScreen />);

    expandStateSwitcher();
    fireEvent.click(
      screen.getByRole("button", { name: /Show state H: Edit budget/i }),
    );

    const dialog = await screen.findByRole("dialog", { name: /Edit budget/i });
    const input = within(dialog).getByRole("textbox");

    fireEvent.change(input, { target: { value: "0" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /^Apply$/i }));

    expect(within(dialog).getByRole("alert")).toHaveTextContent(/greater than 0/i);

    fireEvent.change(input, { target: { value: "1.5 lakh" } });
    fireEvent.click(within(dialog).getByRole("button", { name: /^Apply$/i }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByText(/₹1,50,000/)).toBeInTheDocument();
    });
  });

  it("state I: inline error can be retried", async () => {
    render(<RequestScreen />);

    expandStateSwitcher();
    fireEvent.click(
      screen.getByRole("button", { name: /Show state I: Inline error/i }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/could not check this request/i);

    fireEvent.click(screen.getByRole("button", { name: /Try again/i }));

    await waitFor(
      () => {
        expect(
          screen.getByRole("heading", { name: /^Understood$/ }),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("state J: over-limit text disables search", () => {
    render(<RequestScreen />);

    const textarea = screen.getByLabelText(/What are you shopping for/i);
    fireEvent.change(textarea, { target: { value: OVER_LIMIT_SAMPLE } });

    expect(screen.getByRole("button", { name: /^search$/i })).toBeDisabled();
    expect(screen.getByText(/Shorten this to 1,000 characters/i)).toBeInTheDocument();
  });

  it("example chips fill the composer", () => {
    render(<RequestScreen />);

    fireEvent.click(screen.getByRole("button", { name: /Headphones under 15k/i }));

    expect(screen.getByLabelText(/What are you shopping for/i)).toHaveValue(
      "wireless noise cancelling headphones for daily office commute under 15k",
    );
  });

  it("state switcher can jump to submitting and understood", () => {
    render(<RequestScreen />);

    expandStateSwitcher();
    fireEvent.click(
      screen.getByRole("button", { name: /Show state C: Submitting/i }),
    );

    expect(screen.getByRole("button", { name: /checking/i })).toBeDisabled();

    fireEvent.click(
      screen.getByRole("button", { name: /Show state G: Understood/i }),
    );

    expect(
      screen.getByRole("heading", { name: /^Understood$/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Start research/i }),
    ).not.toBeDisabled();
  });
});
