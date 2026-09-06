import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import authApi from "@/api/authApi";
import Button from "@/components/common/Button";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await authApi.forgotPassword(email);
      setStatus("sent");
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-surface-dark">
      <div className="card w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold text-gray-900 dark:text-gray-50">Reset your password</h1>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Enter your account email and we'll send a reset link.
        </p>

        {status === "sent" ? (
          <p className="text-sm text-emerald-600 dark:text-emerald-500">
            If that email is registered, a reset link is on its way.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>

            {status === "error" && <p className="text-sm text-danger">Something went wrong. Try again.</p>}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link to="/login" className="text-primary-600 hover:underline dark:text-primary-500">
            Back to log in
          </Link>
        </p>
      </div>
    </div>
  );
}
