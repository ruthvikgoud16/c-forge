import { createFileRoute } from "@tanstack/react-router";
import { AppearanceControls } from "@/components/common/AppearanceControls";
import { PageHeader, Panel } from "@/components/common/bits";

export const Route = createFileRoute("/learn/settings")({
  component: StudentSettingsPage,
});

function StudentSettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Appearance"
        lede="Switch between light and dark immediately. The choice stays in this browser and, when you are signed in, on your student profile."
      />
      <Panel>
        <AppearanceControls />
      </Panel>
    </div>
  );
}
