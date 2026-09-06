import { Link } from "react-router-dom";
import Button from "@/components/common/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4 text-center dark:bg-surface-dark">
      <h1 className="text-4xl font-semibold text-gray-900 dark:text-gray-50">404</h1>
      <p className="text-sm text-gray-500 dark:text-gray-400">This page doesn't exist.</p>
      <Link to="/dashboard">
        <Button>Back to dashboard</Button>
      </Link>
    </div>
  );
}
