import { NewIntakeForm } from "./new-intake-form";

export const metadata = { title: "Start an intake" };

export default function NewIntakePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Start a new discovery</h1>
        <p className="text-muted-foreground">
          Pick a project type and the rooms you'll cover. We'll build the questionnaire dynamically.
        </p>
      </div>
      <NewIntakeForm />
    </div>
  );
}
