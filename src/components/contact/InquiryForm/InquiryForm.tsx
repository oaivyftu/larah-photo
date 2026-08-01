"use client";

import { FormEvent, useId, useState } from "react";
import { Button } from "@/components/ui/Button/Button";
import { Input, Select, Textarea } from "@/components/ui/Input/Input";
import styles from "./InquiryForm.module.scss";

type FormValues = {
  name: string;
  email: string;
  sessionType: string;
  preferredDate: string;
  preferredLocation: string;
  message: string;
  website: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  name: "",
  email: "",
  sessionType: "",
  preferredDate: "",
  preferredLocation: "",
  message: "",
  website: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Source order, so the field that gets focus after a failed submit is the first
// one the user would reach by tabbing rather than whichever key `validateForm`
// happened to write first.
const VALIDATED_FIELDS = ["name", "email", "sessionType"] as const;

function validateForm(values: FormValues) {
  const errors: FormErrors = {};

  if (!values.name.trim()) {
    errors.name = "Please enter your name.";
  }

  if (!values.email.trim()) {
    errors.email = "Please enter your email.";
  } else if (!emailPattern.test(values.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  if (!values.sessionType) {
    errors.sessionType = "Please choose a session type.";
  }

  return errors;
}

type InquiryFormProps = {
  sessionTypes: string[];
};

export function InquiryForm({ sessionTypes }: InquiryFormProps) {
  const formId = useId();
  const fieldIds = {
    email: `${formId}-email`,
    name: `${formId}-name`,
    sessionType: `${formId}-session-type`,
  } as const;
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );

  function updateValue(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => {
      if (!current[field]) {
        return current;
      }

      const nextErrors = { ...current };
      delete nextErrors[field];
      return nextErrors;
    });

    if (status !== "idle") {
      setStatus("idle");
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validateForm(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      setStatus("error");

      // Inline messages alone leave a screen reader user with no idea the
      // submit failed: nothing is announced and focus stays put. Moving to the
      // first failing field reads its label and its error together.
      const firstInvalidField = VALIDATED_FIELDS.find(
        (field) => nextErrors[field],
      );

      if (firstInvalidField) {
        document.getElementById(fieldIds[firstInvalidField])?.focus();
      }

      return;
    }

    setStatus("loading");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Unable to send inquiry.");
      }

      setValues(initialValues);
      setErrors({});
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  const messageId = `${formId}-form-message`;
  const errorCount = Object.keys(errors).length;

  return (
    <form
      className={styles["inquiry-form"]}
      noValidate
      onSubmit={handleSubmit}
      aria-describedby={messageId}
    >
      <div className={styles["inquiry-form__honeypot"]} aria-hidden="true">
        <label htmlFor={`${formId}-website`}>Website</label>
        <input
          id={`${formId}-website`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(event) => updateValue("website", event.target.value)}
        />
      </div>

      <div className={styles["inquiry-form__fields"]}>
        <div className={styles["inquiry-form__row"]}>
          <Input
            autoComplete="name"
            error={errors.name}
            id={fieldIds.name}
            label="Name"
            name="name"
            onChange={(event) => updateValue("name", event.target.value)}
            required
            type="text"
            value={values.name}
          />
          <Input
            autoComplete="email"
            error={errors.email}
            id={fieldIds.email}
            label="Email"
            name="email"
            onChange={(event) => updateValue("email", event.target.value)}
            required
            type="email"
            value={values.email}
          />
        </div>

        <Select
          error={errors.sessionType}
          id={fieldIds.sessionType}
          label="Session type"
          name="sessionType"
          onChange={(event) => updateValue("sessionType", event.target.value)}
          options={sessionTypes}
          placeholder="Select a session"
          required
          value={values.sessionType}
        />

        <div className={styles["inquiry-form__row"]}>
          <Input
            id={`${formId}-preferred-date`}
            label="Preferred date"
            name="preferredDate"
            onChange={(event) => updateValue("preferredDate", event.target.value)}
            type="date"
            value={values.preferredDate}
          />
          <Input
            id={`${formId}-preferred-location`}
            label="Preferred location"
            name="preferredLocation"
            onChange={(event) =>
              updateValue("preferredLocation", event.target.value)
            }
            type="text"
            value={values.preferredLocation}
          />
        </div>
      </div>

      <Textarea
        id={`${formId}-message`}
        label="Message / tell me about your vision"
        name="message"
        onChange={(event) => updateValue("message", event.target.value)}
        value={values.message}
      />

      <div className={styles["inquiry-form__actions"]}>
        <Button
          className={styles["inquiry-form__submit"]}
          disabled={status === "loading"}
          size="medium"
          type="submit"
          variant="primary"
        >
          {status === "loading" ? "Sending…" : "Send Inquiry"}
        </Button>

        <p
          className={styles["inquiry-form__message"]}
          id={messageId}
          role="status"
          aria-live="polite"
        >
          {status === "success"
            ? "Thank you — your inquiry has been sent. I’ll get back to you within 24–48 hours."
            : null}
          {status === "error" && errorCount > 0
            ? `Your inquiry was not sent. ${errorCount} ${
                errorCount === 1 ? "field needs" : "fields need"
              } your attention.`
            : null}
          {status === "error" && errorCount === 0
            ? "Something went wrong while sending your inquiry. Please try again."
            : null}
        </p>
      </div>
    </form>
  );
}
