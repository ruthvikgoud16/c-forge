import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DemoBadge } from "@/components/common/bits";
import { services } from "@/services";

export function LoginForm({ role }: { role: "student" | "faculty" }) {
  const nav = useNavigate();
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ id?: string; pw?: string; form?: string }>({});
  const idLabel = role === "student" ? "Roll number" : "Faculty ID";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!id.trim()) next.id = `${idLabel} is required.`;
    if (!pw) next.pw = "Password is required.";
    else if (pw.length < 8) next.pw = "Password must be at least 8 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    const res = await services.auth.signIn({ rollNumber: id, password: pw, role });
    setLoading(false);
    if (!res.ok) return setErrors({ form: res.error });
    nav({ to: role === "student" ? "/learn" : "/faculty" });
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      {errors.form && <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">{errors.form}</p>}
      <div className="space-y-1.5">
        <Label htmlFor="id">{idLabel}</Label>
        <Input id="id" autoComplete="username" value={id} onChange={(e) => setId(e.target.value)} aria-invalid={!!errors.id} aria-describedby={errors.id ? "id-err" : undefined} placeholder={role === "student" ? "e.g. DEMO-001" : "e.g. FAC-DEMO"} className="h-11 font-mono" />
        {errors.id && <p id="id-err" className="text-xs text-destructive">{errors.id}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="pw">Password</Label>
        <div className="relative">
          <Input id="pw" type={show ? "text" : "password"} autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} aria-invalid={!!errors.pw} aria-describedby={errors.pw ? "pw-err" : undefined} className="h-11 pr-11" />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.pw && <p id="pw-err" className="text-xs text-destructive">{errors.pw}</p>}
      </div>
      <Button type="submit" variant={role === "student" ? "hero" : "default"} className="h-11 w-full" disabled={loading}>
        {loading && <Loader2 className="animate-spin" />} {loading ? "Signing in…" : "Sign in"}
      </Button>
      <div className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
        <DemoBadge>Demo mode</DemoBadge>
        <p className="mt-2">
          {role === "student"
            ? "Any active demo roll number (DEMO-001 to DEMO-034) with any 8+ character password signs in. This is not real authentication."
            : "Use FAC-DEMO with any 8+ character password. This is not real authentication."}
        </p>
      </div>
    </form>
  );
}
