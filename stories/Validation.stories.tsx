import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useMemo, useRef, useState } from "react";
import { expect, userEvent, waitFor } from "storybook/test";
import { ValidationHelper } from "jb-validation";
import type { ValidationResult } from "jb-validation";

type Scenario = "sync" | "async" | "getter" | "manual" | "reset";

function ValidationExample({ scenario }: { scenario: Scenario }) {
  const [value, setValue] = useState(scenario === "manual" ? "server-value" : "ab");
  const valueRef = useRef(value);
  valueRef.current = value;
  const [result, setResult] = useState<ValidationResult<string> | null>(null);
  const [message, setMessage] = useState("");
  const helper = useMemo(() => new ValidationHelper<string>({
      getValue: () => valueRef.current,
      getValueString: currentValue => currentValue,
      showValidationError: ({ message: errorMessage }) => setMessage(errorMessage),
      clearValidationError: () => setMessage(""),
      setValidationResult: nextResult => setResult(nextResult),
    }), []);

  useEffect(() => {
    if (scenario === "sync") {
      helper.list = [{ validator: /.{3}/, message: "Use at least 3 characters." }];
    }
    if (scenario === "async") {
      helper.list = [
        {
          validator: async currentValue => currentValue === "available" || "That value is already taken.",
          message: "That value is already taken.",
          defer: true,
        },
      ];
    }
    if (scenario === "getter") {
      helper.addValidationListGetter(() => [
        { validator: currentValue => currentValue.startsWith("JB"), message: "Value must start with JB." },
      ]);
    }
    if (scenario === "manual" || scenario === "reset") {
      helper.list = [{ message: "The server rejected this value." }];
    }
  }, [helper, scenario]);

  const runValidation = async () => {
    if (scenario === "sync") {
      helper.checkValiditySync({ showError: true });
    } else {
      await helper.checkValidity({ showError: true });
    }
  };

  return (
    <div style={{ display: "grid", gap: "0.75rem", maxWidth: "28rem" }}>
      <label>
        Value
        <input aria-label="Value" value={value} onChange={event => setValue(event.target.value)} />
      </label>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button type="button" onClick={runValidation}>Check validation</button>
        {scenario === "reset" && (
          <button type="button" onClick={() => { helper.reset(); setResult(null); }}>Reset</button>
        )}
      </div>
      <output aria-live="polite">
        {result === null ? "Not checked" : result.isAllValid ? "Valid" : "Invalid"}
      </output>
      {message && <div role="alert">{message}</div>}
    </div>
  );
}

const meta = {
  title: "Components/JBValidation",
  component: ValidationExample,
  parameters: { layout: "centered" },
  argTypes: {
    scenario: {
      control: "select",
      options: ["sync", "async", "getter", "manual", "reset"],
    },
  },
} satisfies Meta<typeof ValidationExample>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SyncValidation: Story = {
  args: { scenario: "sync" },
  play: async ({ canvasElement }) => {
    await userEvent.click(canvasElement.querySelector("button")!);
    await waitFor(() => expect(canvasElement.querySelector("output")).toHaveTextContent("Invalid"));
  },
};

export const AsyncValidation: Story = {
  args: { scenario: "async" },
  play: async ({ canvasElement }) => {
    const input = canvasElement.querySelector<HTMLInputElement>("input")!;
    await userEvent.clear(input);
    await userEvent.type(input, "available");
    await userEvent.click(canvasElement.querySelector("button")!);
    await waitFor(() => expect(canvasElement.querySelector("output")).toHaveTextContent("Valid"));
  },
};

export const DynamicValidationGetter: Story = {
  args: { scenario: "getter" },
  play: async ({ canvasElement }) => {
    await userEvent.click(canvasElement.querySelector("button")!);
    await waitFor(() => expect(canvasElement.querySelector("output")).toHaveTextContent("Invalid"));
  },
};

export const ManualError: Story = {
  args: { scenario: "manual" },
  play: async ({ canvasElement }) => {
    await userEvent.click(canvasElement.querySelector("button")!);
    await waitFor(() => expect(canvasElement.querySelector("[role='alert']")).toHaveTextContent("server rejected"));
  },
};

export const Reset: Story = {
  args: { scenario: "reset" },
  play: async ({ canvasElement }) => {
    const buttons = canvasElement.querySelectorAll("button");
    await userEvent.click(buttons[0]);
    await waitFor(() => expect(canvasElement.querySelector("output")).toHaveTextContent("Invalid"));
    await userEvent.click(buttons[1]);
    await waitFor(() => expect(canvasElement.querySelector("output")).toHaveTextContent("Not checked"));
  },
};
