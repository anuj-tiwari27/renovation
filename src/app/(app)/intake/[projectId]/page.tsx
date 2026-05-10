import { IntakeWizard } from "@/components/intake/wizard";
import type { ProjectType } from "@/lib/supabase/database.types";

interface Props {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ type?: string; rooms?: string }>;
}

export const metadata = { title: "Intake" };

export default async function IntakePage({ params, searchParams }: Props) {
  const { projectId } = await params;
  const sp = await searchParams;
  const type = (sp.type as ProjectType) ?? "kitchen";
  const rooms = (sp.rooms ?? "").split(",").filter(Boolean);

  return (
    <div className="mx-auto max-w-5xl">
      <IntakeWizard
        projectId={projectId}
        projectType={type}
        selectedRooms={rooms.length ? rooms : ["kitchen"]}
      />
    </div>
  );
}
