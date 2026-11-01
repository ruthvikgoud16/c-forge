import { notFound } from "next/navigation";
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  EmptyState,
  ErrorState,
  Field,
  GlassPanel,
  Input,
  LoadingState,
  PageContainer,
  SectionHeader,
  Select,
  StatusIndicator,
  Textarea,
  ThemeScope,
} from "@/components/ui";
import { THEMES, THEME_SURFACES, type Theme } from "@/lib/ui/tokens";
import { InteractiveDemo } from "./interactive";
import { IdentityLab } from "./identity-lab";
import "./lab.css";

export const metadata = { title: "CForge design system", robots: { index: false } };

function ThemeSample({ theme }: { theme: Theme }) {
  return (
    <ThemeScope theme={theme} className="ds-sample" as="section">
      <PageContainer as="div" width="sm">
        <SectionHeader
          eyebrow={theme}
          title={THEME_SURFACES[theme]}
          description="Same primitives, different semantic tokens."
          actions={<Badge tone="accent">{theme}</Badge>}
        />
        <GlassPanel>
          <div className="row">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger" size="sm">
              Danger
            </Button>
            <Button loading>Saving</Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="row" style={{ marginTop: "var(--space-5)" }}>
            <Badge>Neutral</Badge>
            <Badge tone="success">Accepted</Badge>
            <Badge tone="warning">Timeout</Badge>
            <Badge tone="danger">Compile error</Badge>
            <Badge tone="info">Queued</Badge>
          </div>
          <div className="row" style={{ marginTop: "var(--space-5)" }}>
            <StatusIndicator tone="success" label="Judge online" />
            <StatusIndicator tone="danger" label="Isolation unverified" />
          </div>
        </GlassPanel>
        <Card>
          <Field id={`${theme}-roll`} label="Roll identifier" hint="Example 26EG104G01">
            <Input id={`${theme}-roll`} aria-describedby={`${theme}-roll-hint`} placeholder="26EG104G01" mono />
          </Field>
          <Field id={`${theme}-unit`} label="Unit">
            <Select id={`${theme}-unit`} defaultValue="u1">
              <option value="u1">Unit 1</option>
              <option value="u2">Unit 2</option>
            </Select>
          </Field>
          <Field id={`${theme}-notes`} label="Notes" error="Required">
            <Textarea id={`${theme}-notes`} invalid aria-describedby={`${theme}-notes-error`} rows={2} />
          </Field>
          <InteractiveDemo theme={theme} />
        </Card>
        <Card variant="sunken" padding="sm">
          <pre>
            <code>{'#include <stdio.h>\nint main(void) { puts("Hello, CForge!"); }'}</code>
          </pre>
        </Card>
        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          <LoadingState label={`Loading ${theme} sample`} />
          <EmptyState title="No attempts yet" action={<ButtonLink href="/" variant="secondary" size="sm">Back home</ButtonLink>}>
            Nothing is invented.
          </EmptyState>
          <ErrorState title="Request failed">The judge returned 503.</ErrorState>
        </div>
      </PageContainer>
    </ThemeScope>
  );
}

export default function DesignSystemPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <>
      <div className="ds-grid">
        {THEMES.map((theme) => (
          <ThemeSample key={theme} theme={theme} />
        ))}
        <style>{`
          .ds-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 26rem), 1fr)); }
          .ds-sample { min-height: 100%; }
        `}</style>
      </div>
      <IdentityLab />
    </>
  );
}
