"use client";

import React, { useState, useEffect, useRef } from "react";

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccountAdded: () => void;
}

type Tab = "manual" | "cookies";
type Step = "form" | "waiting" | "capturing" | "success" | "error";

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onAccountAdded,
}) => {
  const [tab, setTab] = useState<Tab | "token">("manual");
  const [step, setStep] = useState<Step>("form");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Manual login fields
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [proxyIp, setProxyIp] = useState("");
  const [region, setRegion] = useState("");

  // Cookie import fields
  const [cookieName, setCookieName] = useState("");
  const [cookieHandle, setCookieHandle] = useState("");
  const [cookieJson, setCookieJson] = useState("");
  const [cookieProxy, setCookieProxy] = useState("");
  const [cookieRegion, setCookieRegion] = useState("");

  // Token import fields
  const [tokenName, setTokenName] = useState("");
  const [tokenHandle, setTokenHandle] = useState("");
  const [tokenVal, setTokenVal] = useState("");
  const [tokenProxy, setTokenProxy] = useState("");
  const [tokenRegion, setTokenRegion] = useState("");

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      stopPolling();
      setStep("form");
      setErrorMsg("");
      setStatusMessage("");
      setAccountId(null);
      setTab("token"); // Set token as default recommending choice
      setName(""); setHandle(""); setProxyIp(""); setRegion("");
      setCookieName(""); setCookieHandle(""); setCookieJson(""); setCookieProxy(""); setCookieRegion("");
      setTokenName(""); setTokenHandle(""); setTokenVal(""); setTokenProxy(""); setTokenRegion("");
    } else {
      stopPolling();
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), []);

  if (!isOpen) return null;

  const startPolling = (id: string) => {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/accounts/${id}/manual-login`);
        const data = await res.json();
        setStatusMessage(data.message || "");

        if (data.status === "capturing") {
          setStep("capturing");
        } else if (data.status === "success") {
          stopPolling();
          setStep("success");
          setTimeout(() => {
            onAccountAdded();
            onClose();
          }, 2000);
        } else if (data.status === "error") {
          stopPolling();
          setErrorMsg(data.message || "Login failed.");
          setStep("error");
        }
      } catch {
        // Network hiccup — keep polling
      }
    }, 1500);
  };

  // ── Token Import ──────────────────────────────────────────────
  const handleTokenImport = async () => {
    if (!tokenName || !tokenHandle || !tokenVal.trim()) {
      setErrorMsg("Display name, handle, and Auth Token are required.");
      return;
    }
    setErrorMsg("");
    setStep("capturing");
    setStatusMessage("Saving auth token session...");

    try {
      // 1. Create account
      const createRes = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tokenName,
          handle: tokenHandle.startsWith("@") ? tokenHandle : `@${tokenHandle}`,
          proxyIp: tokenProxy,
          region: tokenRegion,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || "Failed to create account");

      // 2. Import token
      const cookieRes = await fetch(`/api/accounts/${createData.id}/cookies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenVal.trim() }),
      });
      const cookieData = await cookieRes.json();
      if (!cookieRes.ok) throw new Error(cookieData.error || "Failed to save auth token");

      setStatusMessage("Auth token saved successfully!");
      setStep("success");
      setTimeout(() => {
        onAccountAdded();
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message);
      setStep("error");
    }
  };

  // ── Manual Login ──────────────────────────────────────────────
  const handleManualLogin = async () => {
    if (!name || !handle) {
      setErrorMsg("Display name and handle are required.");
      return;
    }
    setErrorMsg("");

    // 1. Create account record
    const createRes = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, handle: handle.startsWith("@") ? handle : `@${handle}`, proxyIp, region }),
    });
    const createData = await createRes.json();
    if (!createRes.ok) {
      setErrorMsg(createData.error || "Failed to create account.");
      return;
    }

    const id = createData.id;
    setAccountId(id);
    setStep("waiting");
    setStatusMessage("Opening Chrome window...");

    // 2. Start the manual login session (opens browser)
    const startRes = await fetch(`/api/accounts/${id}/manual-login`, {
      method: "POST",
    });
    const startData = await startRes.json();
    if (!startRes.ok) {
      setErrorMsg(startData.error || "Failed to open browser.");
      setStep("error");
      return;
    }

    setStatusMessage(startData.message || "Log in to X in the Chrome window.");

    // 3. Start polling for status
    startPolling(id);
  };

  // ── Cookie Import ─────────────────────────────────────────────
  const handleCookieImport = async () => {
    if (!cookieName || !cookieHandle || !cookieJson.trim()) {
      setErrorMsg("Name, handle, and cookie JSON are required.");
      return;
    }

    let parsedCookies;
    try {
      parsedCookies = JSON.parse(cookieJson);
      if (!Array.isArray(parsedCookies)) throw new Error("Must be a JSON array");
    } catch {
      setErrorMsg("Invalid JSON. Paste a valid cookie array from EditThisCookie.");
      return;
    }

    setErrorMsg("");
    setStep("capturing");
    setStatusMessage("Saving cookies to database...");

    try {
      // 1. Create account
      const createRes = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cookieName,
          handle: cookieHandle.startsWith("@") ? cookieHandle : `@${cookieHandle}`,
          proxyIp: cookieProxy,
          region: cookieRegion,
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || "Failed to create account");

      // 2. Import cookies
      const cookieRes = await fetch(`/api/accounts/${createData.id}/cookies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookies: parsedCookies }),
      });
      const cookieData = await cookieRes.json();
      if (!cookieRes.ok) throw new Error(cookieData.error || "Failed to import cookies");

      setStatusMessage(cookieData.message || "Cookies saved.");
      setStep("success");
      setTimeout(() => {
        onAccountAdded();
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err.message);
      setStep("error");
    }
  };

  const inputClass =
    "w-full bg-white border border-[#bfc7d3]/50 rounded-xl px-4 py-2.5 text-[14px] text-[#0b1c30] placeholder:text-[#6f7883] focus:outline-none focus:ring-2 focus:ring-[#00629d]/30 focus:border-[#00629d] transition-all";
  const labelClass =
    "block text-[11px] font-semibold text-[#3f4851] uppercase tracking-wider mb-1.5";

  const isFormStep = step === "form" || step === "error";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0b1c30]/20 backdrop-blur-sm z-[60]"
        onClick={isFormStep ? onClose : undefined}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-[70] p-4">
        <div className="bg-white rounded-2xl shadow-[0_32px_80px_-12px_rgba(0,0,0,0.15)] w-full max-w-md overflow-hidden"
          style={{ animation: "modalIn 0.2s ease-out" }}>

          {/* ── Header ───────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#F1F5F9]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00629d] flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[18px]">person_add</span>
              </div>
              <div>
                <h2 className="font-semibold text-[16px] text-[#0b1c30]">Add X Account</h2>
                <p className="text-[11px] text-[#6f7883]">Connect and manage an X profile</p>
              </div>
            </div>
            {isFormStep && (
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F1F5F9] text-[#6f7883] transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>

          {/* ── Form State ───────────────────────────────────────── */}
          {isFormStep && (
            <>
              {/* Tabs */}
              <div className="flex gap-1 p-2 mx-6 mt-4 bg-[#F9FAFB] rounded-xl">
                <button
                  onClick={() => { setTab("token"); setErrorMsg(""); }}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                    tab === "token"
                      ? "bg-white text-[#00629d] shadow-sm"
                      : "text-[#6f7883] hover:text-[#3f4851]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px] mr-1 align-text-bottom">key</span>
                  Auth Token
                  <span className="ml-1 text-[9px] bg-[#10B981]/10 text-[#10B981] px-1 py-0.5 rounded font-bold">PDF</span>
                </button>
                <button
                  onClick={() => { setTab("manual"); setErrorMsg(""); }}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                    tab === "manual"
                      ? "bg-white text-[#00629d] shadow-sm"
                      : "text-[#6f7883] hover:text-[#3f4851]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px] mr-1 align-text-bottom">open_in_browser</span>
                  Manual Login
                </button>
                <button
                  onClick={() => { setTab("cookies"); setErrorMsg(""); }}
                  className={`flex-1 py-2 rounded-lg text-[12px] font-semibold transition-all ${
                    tab === "cookies"
                      ? "bg-white text-[#00629d] shadow-sm"
                      : "text-[#6f7883] hover:text-[#3f4851]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px] mr-1 align-text-bottom">cookie</span>
                  Cookies
                </button>
              </div>

              <div className="px-6 py-4 space-y-4">

                {/* ── Auth Token Tab ── */}
                {tab === "token" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Display Name</label>
                        <input
                          className={inputClass}
                          placeholder="Tech Insider"
                          value={tokenName}
                          onChange={e => setTokenName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>@Handle</label>
                        <input
                          className={inputClass}
                          placeholder="@handle"
                          value={tokenHandle}
                          onChange={e => setTokenHandle(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>auth_token value</label>
                      <input
                        className={inputClass + " font-mono text-[12px]"}
                        placeholder="e.g. 929c3778de9f6c056385fa8b18adc9a52bdf3320"
                        value={tokenVal}
                        onChange={e => setTokenVal(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Proxy IP (optional)</label>
                        <input
                          className={inputClass}
                          placeholder="192.168.1.1:8080"
                          value={tokenProxy}
                          onChange={e => setTokenProxy(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Region (optional)</label>
                        <input
                          className={inputClass}
                          placeholder="US-East"
                          value={tokenRegion}
                          onChange={e => setTokenRegion(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="bg-[#effefb] border border-[#a7f3d0] rounded-xl p-3 text-[11px] text-[#065f46]">
                      <p className="font-semibold mb-1">How to import from PDF:</p>
                      <p>1. Copy the <strong>auth_token=...</strong> hex string from the PDF</p>
                      <p>2. Paste only the hex characters into the field above</p>
                      <p>3. Add Handle & Name, then click Save</p>
                    </div>
                  </>
                )}

                {/* ── Manual Login Tab ── */}
                {tab === "manual" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Display Name</label>
                        <input
                          className={inputClass}
                          placeholder="Tech Insider"
                          value={name}
                          onChange={e => setName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>@Handle</label>
                        <input
                          className={inputClass}
                          placeholder="@handle"
                          value={handle}
                          onChange={e => setHandle(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Proxy IP (optional)</label>
                        <input
                          className={inputClass}
                          placeholder="192.168.1.1:8080"
                          value={proxyIp}
                          onChange={e => setProxyIp(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Region (optional)</label>
                        <input
                          className={inputClass}
                          placeholder="US-East"
                          value={region}
                          onChange={e => setRegion(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* How it works */}
                    <div className="bg-[#eff4ff] border border-[#d3e4fe] rounded-xl p-4 space-y-2">
                      <p className="text-[11px] font-semibold text-[#0b1c30] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[#00629d] text-[14px]">info</span>
                        How it works
                      </p>
                      <div className="space-y-1.5 text-[11px] text-[#3f4851]">
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#00629d] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                          <span>Click <strong>Open Login Window</strong> — Chrome opens</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#00629d] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                          <span>Log in to X normally (password, 2FA, anything — it's a real browser)</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#00629d] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                          <span>XRaid detects you're logged in, captures the session, and closes the window</span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#10B981] text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                          <span className="text-[#10B981] font-medium">Account appears on dashboard, ready to launch anytime</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* ── Cookie Import Tab ── */}
                {tab === "cookies" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Display Name</label>
                        <input
                          className={inputClass}
                          placeholder="Tech Insider"
                          value={cookieName}
                          onChange={e => setCookieName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>@Handle</label>
                        <input
                          className={inputClass}
                          placeholder="@handle"
                          value={cookieHandle}
                          onChange={e => setCookieHandle(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>Cookie JSON</label>
                      <textarea
                        className={inputClass + " h-28 resize-none font-mono text-[11px]"}
                        placeholder={'[\n  { "name": "auth_token", "value": "...", "domain": ".x.com" },\n  ...\n]'}
                        value={cookieJson}
                        onChange={e => setCookieJson(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>Proxy (optional)</label>
                        <input
                          className={inputClass}
                          placeholder="192.168.1.1:8080"
                          value={cookieProxy}
                          onChange={e => setCookieProxy(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>Region (optional)</label>
                        <input
                          className={inputClass}
                          placeholder="US-East"
                          value={cookieRegion}
                          onChange={e => setCookieRegion(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="bg-[#F9FAFB] border border-[#F1F5F9] rounded-xl p-3 text-[11px] text-[#3f4851]">
                      <p className="font-semibold text-[#0b1c30] mb-1">Get cookies with EditThisCookie:</p>
                      <p>1. Log in to X in Chrome normally</p>
                      <p>2. Install <strong>EditThisCookie</strong> extension</p>
                      <p>3. On x.com → click extension → Export icon (JSON)</p>
                      <p>4. Paste the JSON array here</p>
                    </div>
                  </>
                )}

                {/* Error */}
                {step === "error" && errorMsg && (
                  <div className="bg-[#ffdad6]/50 border border-[#ba1a1a]/20 rounded-xl p-3 text-[12px] text-[#ba1a1a] flex gap-2">
                    <span className="material-symbols-outlined text-[16px] flex-shrink-0 mt-0.5">error</span>
                    {errorMsg}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 pb-6 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-[#bfc7d3]/50 text-[#3f4851] text-[13px] font-semibold hover:bg-[#F9FAFB] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={
                    tab === "token"
                      ? handleTokenImport
                      : tab === "manual"
                      ? handleManualLogin
                      : handleCookieImport
                  }
                  className="flex-1 py-2.5 rounded-xl bg-[#00629d] text-white text-[13px] font-semibold hover:bg-[#00629d]/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {tab === "token" ? "key" : tab === "manual" ? "open_in_browser" : "cookie"}
                  </span>
                  {tab === "token" ? "Save Token" : tab === "manual" ? "Open Login Window" : "Import & Save"}
                </button>
              </div>
            </>
          )}

          {/* ── Waiting for login ────────────────────────────────── */}
          {(step === "waiting" || step === "capturing") && (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="relative w-20 h-20 mb-6">
                {step === "waiting" ? (
                  <>
                    <div className="w-20 h-20 rounded-full border-4 border-[#e5eeff] border-t-[#00629d] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#00629d] text-[28px]">language</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 rounded-full border-4 border-[#10B981]/20 border-t-[#10B981] animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#10B981] text-[28px]">key</span>
                    </div>
                  </>
                )}
              </div>

              <h3 className="font-semibold text-[17px] text-[#0b1c30] mb-2">
                {step === "capturing" ? "Capturing session..." : "Waiting for login..."}
              </h3>

              <p className="text-[12px] text-[#6f7883] max-w-[280px] leading-relaxed">
                {statusMessage || (
                  step === "waiting"
                    ? "Log in to X in the Chrome window that just opened. We'll detect it automatically."
                    : "Almost done — saving your session."
                )}
              </p>

              {step === "waiting" && (
                <div className="mt-6 bg-[#F9FAFB] border border-[#F1F5F9] rounded-xl px-4 py-3 text-[11px] text-[#3f4851] text-left w-full">
                  <p className="font-semibold mb-1 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-[#00629d]">tips_and_updates</span>
                    In the Chrome window:
                  </p>
                  <p>• Enter your username, password, and 2FA if asked</p>
                  <p>• Complete any verification X requires</p>
                  <p>• Once you see your home feed, we'll take it from there</p>
                </div>
              )}
            </div>
          )}

          {/* ── Success ──────────────────────────────────────────── */}
          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-20 h-20 rounded-full bg-[#10B981]/10 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[#10B981] text-[40px]">check_circle</span>
              </div>
              <h3 className="font-semibold text-[17px] text-[#0b1c30] mb-2">Account Added!</h3>
              <p className="text-[12px] text-[#6f7883] max-w-[260px] leading-relaxed">
                Session captured and saved. Click <strong>Launch</strong> anytime to open this account — no login needed.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
};
