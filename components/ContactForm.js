"use client";

import { useState } from "react";

export function ContactForm() {
  const [message, setMessage] = useState("");

  function submitContact(event) {
    event.preventDefault();
    setMessage("Inquiry received. The shop can follow up to confirm product availability and order details.");
    event.currentTarget.reset();
  }

  return (
    <form className="panel form-grid" onSubmit={submitContact}>
      <h2>Send an inquiry</h2>
      <input className="field" name="name" required placeholder="Full name" />
      <input className="field" name="phone" required placeholder="Phone number" />
      <input className="field" name="email" placeholder="Email address" />
      <textarea className="textarea" name="message" required placeholder="Products, volume, delivery date, or questions" />
      <button className="btn btn-primary" type="submit">
        Send inquiry
      </button>
      {message ? <div className="notice">{message}</div> : null}
    </form>
  );
}
