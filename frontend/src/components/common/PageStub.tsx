import { LucideIcon } from "lucide-react";
import Card from "./Card";

interface PageStubProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

/**
 * Placeholder used by pages not yet wired to real data/CRUD flows.
 * Swapped out page-by-page as each slice gets built.
 */
export default function PageStub({ title, description, icon: Icon }: PageStubProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-50">{title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <Card className="flex flex-col items-center justify-center gap-3 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-500">
          <Icon size={22} />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">This section is coming soon.</p>
      </Card>
    </div>
  );
}
