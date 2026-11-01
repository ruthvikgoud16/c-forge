import Link from "next/link";
import { PreferenceForm } from "@/components/preference-form";

export default function OnboardingPage() {
  return (
    <>
      <p className="brand">
        <Link href="/learn">Dashboard</Link>
      </p>
      <h1>How do you want to start?</h1>
      <p>This is a preference, not a permanent beginner or advanced label.</p>
      <PreferenceForm />
    </>
  );
}
