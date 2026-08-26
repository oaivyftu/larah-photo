import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Input, Select, Textarea } from "./Input";

afterEach(cleanup);

// All three exports share one shell, so the shell's behaviour is asserted once
// per export rather than once overall: a regression that only reaches Textarea
// is still a broken form. The error wiring is the part that matters most --
// a field that looks wrong but is not announced as wrong fails Principle II
// while looking fine in a screenshot.

describe.each([
  [
    "Input",
    (props: Record<string, unknown>) => (
      <Input id="f" label="Name" {...props} />
    ),
  ],
  [
    "Textarea",
    (props: Record<string, unknown>) => (
      <Textarea id="f" label="Name" {...props} />
    ),
  ],
  [
    "Select",
    (props: Record<string, unknown>) => (
      <Select
        id="f"
        label="Name"
        options={["A", "B"]}
        placeholder="Pick one"
        {...props}
      />
    ),
  ],
] as const)("%s", (_name, renderField) => {
  it("associates its label with its control", () => {
    render(renderField({}));

    expect(screen.getByLabelText(/Name/)).toBeInTheDocument();
  });

  it("points at its message row whether or not there is a message", () => {
    render(renderField({}));

    expect(screen.getByLabelText(/Name/)).toHaveAttribute(
      "aria-describedby",
      "f-error",
    );
  });

  it("is not marked invalid while it has no error", () => {
    render(renderField({}));

    expect(screen.getByLabelText(/Name/)).not.toHaveAttribute("aria-invalid");
  });

  it("announces an error through the described-by row", () => {
    const { container } = render(renderField({ error: "Required" }));

    expect(screen.getByLabelText(/Name/)).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    expect(container.querySelector("#f-error")).toHaveTextContent("Required");
  });

  it("keeps the message row mounted when empty so the layout cannot shift", () => {
    const { container } = render(renderField({}));
    const row = container.querySelector("#f-error");

    expect(row).toBeInTheDocument();
    expect(row).toBeEmptyDOMElement();
  });

  it("marks the field required on the control and in the label", () => {
    const { container } = render(renderField({ required: true }));

    expect(screen.getByLabelText(/Name/)).toBeRequired();
    expect(container.textContent).toContain("*");
  });

  it("flags a filled field for styling", () => {
    const { container } = render(
      renderField({ value: "x", onChange: vi.fn() }),
    );

    expect(container.firstElementChild).toHaveAttribute("data-filled");
  });

  it("does not flag an empty field as filled", () => {
    const { container } = render(renderField({ value: "", onChange: vi.fn() }));

    expect(container.firstElementChild).not.toHaveAttribute("data-filled");
  });

  it("flags an invalid field for styling", () => {
    const { container } = render(renderField({ error: "Required" }));

    expect(container.firstElementChild).toHaveAttribute("data-invalid");
  });
});

describe("Input specifics", () => {
  it("forwards typing to the caller", () => {
    const onChange = vi.fn();
    render(<Input id="f" label="Name" onChange={onChange} value="" />);

    fireEvent.change(screen.getByLabelText(/Name/), { target: { value: "L" } });

    expect(onChange).toHaveBeenCalledOnce();
  });

  it("forwards native attributes such as type and placeholder", () => {
    render(
      <Input id="f" label="Email" placeholder="you@example.com" type="email" />,
    );
    const field = screen.getByLabelText(/Email/);

    expect(field).toHaveAttribute("type", "email");
    expect(field).toHaveAttribute("placeholder", "you@example.com");
  });
});

describe("Select specifics", () => {
  it("renders the placeholder as the empty option, before the real ones", () => {
    render(
      <Select
        id="f"
        label="Service"
        options={["Wedding", "Portrait"]}
        placeholder="Choose a service"
      />,
    );
    const options = screen.getAllByRole("option");

    expect(options[0]).toHaveTextContent("Choose a service");
    expect(options[0]).toHaveValue("");
    expect(options).toHaveLength(3);
  });

  it("hides its chevron from assistive tech", () => {
    const { container } = render(
      <Select id="f" label="Service" options={[]} placeholder="Pick" />,
    );

    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("renders only the placeholder when given no options", () => {
    render(<Select id="f" label="Service" options={[]} placeholder="Pick" />);

    expect(screen.getAllByRole("option")).toHaveLength(1);
  });
});

describe("Textarea specifics", () => {
  it("defaults to five rows", () => {
    render(<Textarea id="f" label="Message" />);

    expect(screen.getByLabelText(/Message/)).toHaveAttribute("rows", "5");
  });

  it("takes a caller's row count", () => {
    render(<Textarea id="f" label="Message" rows={12} />);

    expect(screen.getByLabelText(/Message/)).toHaveAttribute("rows", "12");
  });
});
