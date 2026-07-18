"use client";

import { FormEvent, useId, useState } from "react";
import { Icon } from "@/components/ui/Icon/Icon";
import { icons } from "@/constants/icons";
import styles from "./InquiryForm.module.scss";

const sessionTypes = [
  "Graduation",
  "Portrait",
  "Couple",
  "Family",
  "Branding",
  "Other",
];

type FormValues = {
  name: string;
  email: string;
  phone: string;
  sessionType: string;
  message: string;
  website: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  name: "",
  email: "",
  phone: "",
  sessionType: "",
  message: "",
  website: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  if (!values.message.trim()) {
    errors.message = "Please tell me a little about your vision.";
  }

  return errors;
}

export function InquiryForm() {
  const formId = useId();
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

      <div className={styles["inquiry-form__row"]}>
        <label className={styles["inquiry-form__field"]} htmlFor={`${formId}-name`}>
          <span className={styles["inquiry-form__label"]}>NAME*</span>
          <input
            className={styles["inquiry-form__input"]}
            id={`${formId}-name`}
            name="name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={(event) => updateValue("name", event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? `${formId}-name-error` : undefined}
            required
          />
          {errors.name ? (
            <span className={styles["inquiry-form__error"]} id={`${formId}-name-error`}>
              {errors.name}
            </span>
          ) : null}
        </label>

        <label className={styles["inquiry-form__field"]} htmlFor={`${formId}-email`}>
          <span className={styles["inquiry-form__label"]}>EMAIL*</span>
          <input
            className={styles["inquiry-form__input"]}
            id={`${formId}-email`}
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => updateValue("email", event.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? `${formId}-email-error` : undefined}
            required
          />
          {errors.email ? (
            <span
              className={styles["inquiry-form__error"]}
              id={`${formId}-email-error`}
            >
              {errors.email}
            </span>
          ) : null}
        </label>
      </div>

      <div className={styles["inquiry-form__row"]}>
        <label
          className={styles["inquiry-form__field"]}
          htmlFor={`${formId}-session-type`}
        >
          <span className={styles["inquiry-form__label"]}>SERVICE</span>
          <select
            className={styles["inquiry-form__select"]}
            id={`${formId}-session-type`}
            name="sessionType"
            value={values.sessionType}
            onChange={(event) => updateValue("sessionType", event.target.value)}
            aria-invalid={Boolean(errors.sessionType)}
            aria-describedby={
              errors.sessionType ? `${formId}-session-type-error` : undefined
            }
            required
          >
            <option value="">Select a session</option>
            {sessionTypes.map((sessionType) => (
              <option key={sessionType} value={sessionType}>
                {sessionType}
              </option>
            ))}
          </select>
          <Icon
            className={styles["inquiry-form__select-icon"]}
            decorative
            icon={icons.chevronDown}
          />
          {errors.sessionType ? (
            <span
              className={styles["inquiry-form__error"]}
              id={`${formId}-session-type-error`}
            >
              {errors.sessionType}
            </span>
          ) : null}
        </label>

        <label
          className={styles["inquiry-form__field"]}
          htmlFor={`${formId}-phone`}
        >
          <span className={styles["inquiry-form__label"]}>🇨🇦 PHONE NUMBER</span>
          <input
            className={styles["inquiry-form__input"]}
            id={`${formId}-phone`}
            name="phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(event) => updateValue("phone", event.target.value)}
          />
        </label>
      </div>

      <label
        className={`${styles["inquiry-form__field"]} ${styles["inquiry-form__field--message"]}`}
        htmlFor={`${formId}-message`}
      >
        <span className={styles["inquiry-form__label"]}>MESSAGE*</span>
        <textarea
          className={styles["inquiry-form__textarea"]}
          id={`${formId}-message`}
          name="message"
          value={values.message}
          onChange={(event) => updateValue("message", event.target.value)}
          aria-invalid={Boolean(errors.message)}
          aria-describedby={errors.message ? `${formId}-message-error` : undefined}
          required
        />
        {errors.message ? (
          <span
            className={styles["inquiry-form__error"]}
            id={`${formId}-message-error`}
          >
            {errors.message}
          </span>
        ) : null}
      </label>

      <div
        className={styles["inquiry-form__message"]}
        id={messageId}
        role="status"
        aria-live="polite"
      >
        {status === "success"
          ? "Thank you — your inquiry has been sent. I’ll get back to you within 24–48 hours."
          : null}
        {status === "error" && Object.keys(errors).length === 0
          ? "Something went wrong while sending your inquiry. Please try again."
          : null}
      </div>

      <button
        className={styles["inquiry-form__submit"]}
        type="submit"
        disabled={status === "loading"}
      >
        {status === "loading" ? "SENDING..." : "SUBMIT"}
      </button>
    </form>
  );
}
