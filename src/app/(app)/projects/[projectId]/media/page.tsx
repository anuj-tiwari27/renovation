import { MediaDropzone } from "@/components/media/dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  params: Promise<{ projectId: string }>;
}

export const metadata = { title: "Media" };

export default async function MediaPage({ params }: Props) {
  const { projectId } = await params;
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Project media</h1>
        <p className="text-muted-foreground">
          Upload existing-condition photos, inspiration, voice notes, and floorplans. Works offline.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Upload</CardTitle>
          <CardDescription>Files are queued and synced automatically when you have a connection.</CardDescription>
        </CardHeader>
        <CardContent>
          <MediaDropzone projectId={projectId} />
        </CardContent>
      </Card>
    </div>
  );
}
