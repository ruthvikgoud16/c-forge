import { createFileRoute } from "@tanstack/react-router";
import { AppearanceControls } from "@/components/common/AppearanceControls";
import { PageHeader, Panel } from "@/components/common/bits";

export const Route = createFileRoute("/faculty/settings")({
  component: FacultySettingsPage,
});

function FacultySettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Settings"
        title="Appearance"
        lede="Faculty appearance is stored in this browser. It does not change student records."
      />
      <Panel>
        <AppearanceControls />
      </Panel>
    </div>
  );
}
