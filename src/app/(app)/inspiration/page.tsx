import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Inspiration" };

export default function InspirationPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Inspiration boards</h1>
        <p className="text-muted-foreground">Per-project mood boards live on each project page (Media → category: Inspiration).</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>How it works</CardTitle>
          <CardDescription>
            Upload Pinterest screenshots or web saves under the "Inspiration" category. The AI summary
            extracts style, palette, and material tags automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Drag screenshots straight from desktop / phone gallery</li>
            <li>Tag by room: kitchen, primary bath, etc.</li>
            <li>Reference inside the AI summary and PDF report</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
