import { useEffect, useState } from "react";
import { ArrowRight, KeyRound, Loader2, LockKeyhole, PawPrint, ShieldCheck } from "lucide-react";
import { grantAdmin, verifyAdminCode, verifyAdminSecond } from "@/lib/admin/admin-fns";
import { verifyCert } from "@/lib/bunny/crypto";
import { loadIdentity, saveIdentity, tokenToIdentity } from "@/lib/bunny/identity";
import { ls, type AdminSession } from "@/lib/bunny/types";
import { Room } from "./room";

type Step = "checking" | "code" | "second" | "token" | "ready";

export function AdminGate() {
  const [step, setStep] = useState<Step>("checking");
  const [code, setCode] = useState("");
  const [answer, setAnswer] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fails, setFails] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(0);

  useEffect(() => {
    (async () => {
      const me = await loadIdentity();
      const sess = ls.get<AdminSession | null>("bunny_admin_v1", null);
      if (sess && sess.id === me.id) {
        const claim = await verifyCert(sess.cert);
        if (claim && claim.id === me.id && claim.sign.x === me.sign.x) {
          setStep("ready");
          return;
        }
      }
      setStep("code");
    })();
  }, []);

  useEffect(() => {
    if (lockedUntil <= Date.now()) return;
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, [lockedUntil]);
  const locked = lockedUntil > (now || Date.now());

  const fail = (msg: string) => {
    setError(msg);
    const n = fails + 1;
    setFails(n);
    if (n % 5 === 0) setLockedUntil(Date.now() + 30_000);
  };

  if (step === "ready") return <Room mode="admin" />;

  const stepIndex = step === "code" ? 0 : step === "second" ? 1 : 2;

  return (
    <div className="stage" style={{ "--accent": "#ffc35c", "--accent-ink": "#2e1d02" } as React.CSSProperties}>
      <div className="wallpaper" />
      <div className="gate">
        <form
          className="gate-card lg"
          onSubmit={async (e) => {
            e.preventDefault();
            if (busy || locked) return;
            setError("");
            setBusy(true);
            try {
              if (step === "code") {
                const res = await verifyAdminCode({ data: { code } });
                if (res.ok) setStep("second");
                else fail("That access code isn't right.");
              } else if (step === "second") {
                const res = await verifyAdminSecond({ data: { code, answer } });
                if (res.ok) setStep("token");
                else fail("That answer isn't right.");
              } else if (step === "token") {
                const identity = tokenToIdentity(token);
                if (!identity) {
                  setError("That doesn't look like a Bunny RTC token. Copy it from Settings → Account & token.");
                  return;
                }
                const stored = await loadIdentity();
                const name = stored.id === identity.id ? localStorage.getItem("bunny_name") || "" : "";
                const res = await grantAdmin({
                  data: {
                    code,
                    answer,
                    id: identity.id,
                    name,
                    sign: { x: identity.sign.x, y: identity.sign.y },
                    box: { x: identity.box.x, y: identity.box.y },
                  },
                });
                if (!res.ok) {
                  setError(res.error);
                  return;
                }
                if (stored.id !== identity.id) saveIdentity(identity);
                ls.set("bunny_admin_v1", { id: identity.id, cert: res.cert, escrow: res.escrow } satisfies AdminSession);
                setCode("");
                setAnswer("");
                setToken("");
                setStep("ready");
              }
            } catch {
              setError("Couldn't reach the server. Try again.");
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="steps" aria-hidden>
            {[0, 1, 2].map((i) => (
              <i key={i} className={i <= stepIndex && step !== "checking" ? "done" : ""} />
            ))}
          </div>
          <div className="gate-icon">
            {step === "second" ? <PawPrint size={26} /> : step === "token" ? <KeyRound size={26} /> : <LockKeyhole size={26} />}
          </div>
          {step === "checking" ? (
            <>
              <h1>Admin</h1>
              <p>Checking this device…</p>
            </>
          ) : null}
          {step === "code" ? (
            <>
              <h1>Admin access</h1>
              <p>Enter the admin access code to continue.</p>
              <input
                className="input"
                type="password"
                autoComplete="off"
                autoFocus
                value={code}
                maxLength={128}
                placeholder="Access code"
                aria-label="Access code"
                onChange={(e) => setCode(e.target.value)}
              />
            </>
          ) : null}
          {step === "second" ? (
            <>
              <h1>Two-step check</h1>
              <p>Security question: what is your dog's name?</p>
              <input
                className="input"
                type="password"
                autoComplete="off"
                autoFocus
                value={answer}
                maxLength={64}
                placeholder="Answer"
                aria-label="Security answer"
                onChange={(e) => setAnswer(e.target.value)}
              />
            </>
          ) : null}
          {step === "token" ? (
            <>
              <h1>Link your account</h1>
              <p>Paste your token from Settings → Account & token. That account becomes an admin and this device stays signed in.</p>
              <textarea
                className="input"
                autoFocus
                spellCheck={false}
                value={token}
                placeholder="bunny_…"
                aria-label="Account token"
                onChange={(e) => setToken(e.target.value)}
                style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.75rem" }}
              />
            </>
          ) : null}
          {error ? <p className="err">{error}</p> : null}
          {locked ? <p className="err">Too many tries. Wait {Math.ceil((lockedUntil - (now || Date.now())) / 1000)}s.</p> : null}
          {step !== "checking" ? (
            <div className="row" style={{ justifyContent: "space-between", marginTop: "1rem" }}>
              <a className="gbtn" href="/">
                Back to chat
              </a>
              <button
                className="gbtn primary"
                type="submit"
                disabled={busy || locked || (step === "code" ? !code : step === "second" ? !answer : !token.trim())}
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : step === "token" ? <ShieldCheck size={16} /> : <ArrowRight size={16} />}
                {step === "token" ? "Grant admin" : "Continue"}
              </button>
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
