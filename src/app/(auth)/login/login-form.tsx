"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export const LoginForm = () => {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    const email = String(formData.get("email") ?? "").toLowerCase();
    const password = String(formData.get("password") ?? "");

    const response = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/",
    });

    if (!response || response.error) {
      setError("Invalid email or password.");
      return;
    }

    window.location.href = "/";
  };

  return (
    <form
      action={async (formData) => {
        await handleSubmit(formData);
      }}
      className="space-y-4"
    >
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <label className="block space-y-1">
        <span className="text-sm font-medium">Email</span>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          minLength={8}
          required
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </label>

      <button
        type="submit"
        className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
      >
        Login
      </button>
    </form>
  );
};
