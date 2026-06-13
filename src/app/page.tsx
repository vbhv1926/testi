"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AccountCard } from "@/components/AccountCard";
import { AddAccountModal } from "@/components/AddAccountModal";

interface Account {
  id: string;
  name: string;
  handle: string;
  proxyIp: string;
  region: string;
  status: string;
  followers: number;
  following: number;
  avatarUrl?: string | null;
  cookies?: string | null;
}

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tweetText, setTweetText] = useState("");
  const [massReplies, setMassReplies] = useState("");
  const [targetCount, setTargetCount] = useState("");
  const [massActionLoading, setMassActionLoading] = useState<string | null>(null);
  const [massActionProgress, setMassActionProgress] = useState<{current: number, total: number, activeId: string | null} | null>(null);
  
  const [scanStatusMap, setScanStatusMap] = useState<Record<string, Record<string, {liked: boolean, retweeted: boolean, bookmarked: boolean}>>>({});
  const [scanningAccountId, setScanningAccountId] = useState<string | null>(null);
  const scanStatusRef = useRef(scanStatusMap);
  
  useEffect(() => { scanStatusRef.current = scanStatusMap; }, [scanStatusMap]);

  useEffect(() => {
    const url = tweetText.trim();
    const isUrl = /^(https?:\/\/)?(www\.)?(x|twitter)\.com\/\w+\/status\/\d+/i.test(url);
    if (!isUrl) return;

    let isCancelled = false;
    const runScan = async () => {
      await new Promise(r => setTimeout(r, 1000));
      if (isCancelled) return;

      const targetAccounts = accounts.filter(a => a.status === "Active" && a.cookies);
      
      const concurrency = 5;
      for (let i = 0; i < targetAccounts.length; i += concurrency) {
        if (isCancelled) break;
        const chunk = targetAccounts.slice(i, i + concurrency);
        
        await Promise.all(chunk.map(async (acc) => {
          if (scanStatusRef.current[url]?.[acc.id]) return;
          
          setScanningAccountId(acc.id);
          try {
            const res = await fetch("/api/action", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accountId: acc.id, tweetUrl: url, action: 'status' }),
            });
            if (res.ok && !isCancelled) {
              const data = await res.json();
              setScanStatusMap(prev => ({
                ...prev,
                [url]: {
                  ...(prev[url] || {}),
                  [acc.id]: data
                }
              }));
            }
          } catch (e) { }
        }));
      }
      if (!isCancelled) setScanningAccountId(null);
    };

    runScan();
    return () => {
      isCancelled = true;
      setScanningAccountId(null);
    };
  }, [tweetText, accounts]);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        const data = await res.json();
        setAccounts(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Delete this account and its saved session?")) return;
    await fetch(`/api/accounts/${id}`, { method: "DELETE" });
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const handleMassAction = async (actionType: string) => {
    let targetAccounts = accounts.filter(a => a.status === "Active" && a.cookies);
    if (targetAccounts.length === 0) return;
    
    const limit = parseInt(targetCount);
    if (!isNaN(limit) && limit > 0 && limit < targetAccounts.length) {
      targetAccounts = [...targetAccounts].sort(() => 0.5 - Math.random()).slice(0, limit);
    }
    
    let repliesList: string[] = [];
    if (actionType === 'reply') {
      repliesList = massReplies.split('\n').map(s => s.trim()).filter(Boolean);
      if (repliesList.length === 0) {
        alert("Please enter at least one reply in the Mass Replies box.");
        return;
      }
    }
    
    if (!confirm(`Are you sure you want to mass ${actionType} using ${targetAccounts.length} accounts? This will process 5 at a time.`)) return;
    
    setMassActionLoading(actionType);
    setMassActionProgress({ current: 0, total: targetAccounts.length, activeId: null });
    
    let completed = 0;
    const concurrency = 5;
    
    for (let i = 0; i < targetAccounts.length; i += concurrency) {
      const chunk = targetAccounts.slice(i, i + concurrency);
      
      await Promise.all(chunk.map(async (acc, indexInChunk) => {
        const globalIndex = i + indexInChunk;
        let replyText = "";
        if (actionType === 'reply') {
          replyText = repliesList[globalIndex % repliesList.length];
        }
        
        try {
          const res = await fetch("/api/action", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accountId: acc.id, tweetUrl: tweetText.trim(), action: actionType, replyText }),
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => null);
            console.error(`Failed ${actionType} for ${acc.handle}:`, errData);
          }
        } catch (e) {
          console.error(`Network error for ${acc.handle}:`, e);
        } finally {
          completed++;
          setMassActionProgress(prev => prev ? { ...prev, current: completed, activeId: acc.id } : null);
        }
      }));
    }
    
    setMassActionProgress(null);
    setMassActionLoading(null);
    alert(`Mass ${actionType} completed for ${completed} accounts!`);
  };

  const totalAccounts = accounts.length;
  const activeSessions = accounts.filter(a => a.status === "Active").length;

  return (
    <>
      <AddAccountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAccountAdded={fetchAccounts}
      />

      {/* TopNavBar */}
      <nav className="bg-surface/80 backdrop-blur-xl font-body-md text-body-md fixed top-0 w-full z-40 bg-white/80 backdrop-blur-md shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] hidden md:block">
        <div className="flex justify-between items-center px-lg py-sm max-w-[1440px] mx-auto pl-72">
          <div className="flex items-center gap-md">
            <span className="text-title-lg font-semibold text-on-surface tracking-tight font-bold">X Control</span>
            <div className="relative hidden lg:block ml-xl">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant">search</span>
              <input
                className="bg-surface border border-outline-variant/30 rounded-full py-1.5 pl-10 pr-4 text-body-md w-64 focus:outline-none focus:ring-1 focus:ring-primary focus:bg-white transition-colors placeholder:text-outline-variant text-on-surface"
                placeholder="Search accounts, proxies..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-sm">
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low transition-colors duration-200 rounded-full active:scale-95">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="p-2 text-on-surface-variant hover:bg-surface-container-low transition-colors duration-200 rounded-full active:scale-95">
              <span className="material-symbols-outlined">person</span>
            </button>
            <div className="h-8 w-8 rounded-full bg-surface-container-high overflow-hidden ml-sm border border-outline-variant/20 cursor-pointer">
              <img
                alt="User Profile"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjzyNkvfxDtV3jFNlZOpj6uQRsXiQczMOYu520FixGQgHlvjPdnTJ2HmNZt1hKXH5D56jgZJNasdFH4VJH34daxYvhjekURT56uweirjod_YJ5uLKRiHnf0IN7NbUqZruzAB9Bpy5NUqjNQDg1VQSPAt1mWbadB-qB2rDHu4rlbmfHcOipNTJaFDGv2eQaiE6SKZTw2IxRgJ3HmLai0WMNh1xImDI3MkCMF-T3jLpPGUp9nWM8NdzOVczRMnSaOdBwgOa2aNvbqZs"
              />
            </div>
          </div>
        </div>
      </nav>

      {/* SideNavBar */}
      <aside className="bg-surface font-label-md text-label-md h-screen w-64 fixed left-0 top-0 z-50 border-r border-outline-variant/30 flex flex-col p-md space-y-sm hidden md:flex">
        <div className="mb-xl px-sm mt-sm">
          <div className="flex items-center gap-sm mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-lg">X</div>
            <h1 className="text-headline-md font-black text-on-surface">Enterprise X</h1>
          </div>
          <p className="text-on-surface-variant text-label-sm pl-10">Management Suite</p>
        </div>
        <nav className="flex-1 space-y-1">
          <a className="flex items-center gap-md px-sm py-2.5 rounded-lg text-on-surface font-semibold bg-surface-container-highest active:scale-[0.98] transition-all" href="#">
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span>Dashboard</span>
          </a>
          <a className="flex items-center gap-md px-sm py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-all active:scale-[0.98]" href="#">
            <span className="material-symbols-outlined text-[20px] icon-fill">person_add</span>
            <span>Accounts</span>
          </a>
          <a className="flex items-center gap-md px-sm py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-all active:scale-[0.98]" href="#">
            <span className="material-symbols-outlined text-[20px]">vpn_lock</span>
            <span>Proxies</span>
          </a>
          <a className="flex items-center gap-md px-sm py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-all active:scale-[0.98]" href="#">
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span>Settings</span>
          </a>
          <a className="flex items-center gap-md px-sm py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-all active:scale-[0.98]" href="#">
            <span className="material-symbols-outlined text-[20px]">group</span>
            <span>Team</span>
          </a>
        </nav>
        <div className="mt-auto pt-md border-t border-outline-variant/30">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full bg-primary text-white font-label-md text-label-md py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Account
          </button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="md:ml-64 pt-20 p-md md:p-lg lg:p-[40px] max-w-[1440px] mx-auto min-h-screen">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-md mb-xl">
          <div>
            <h2 className="text-headline-lg font-semibold text-on-surface mb-1">Dashboard</h2>
            <p className="text-on-surface-variant text-body-md">Configure tweets and launch connected profiles.</p>
          </div>
          <div className="flex items-center gap-sm">
            <button className="px-4 py-2 rounded-xl border border-outline-variant/50 text-on-surface font-label-md text-label-md hover:bg-surface transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">settings_ethernet</span>
              Configure Proxies
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-primary text-white font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Add New Account
            </button>
          </div>
        </header>

        {/* Global Tweet/Target URL Card */}
        <section className="bg-white border border-[#bfc7d3]/30 rounded-2xl p-lg shadow-[0_10px_35px_-12px_rgba(0,0,0,0.05)] mb-xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[#00629d]/10 flex items-center justify-center text-[#00629d]">
              <span className="material-symbols-outlined text-[18px]">rate_review</span>
            </div>
            <h3 className="font-bold text-[15px] text-[#0b1c30]">Configure Target Tweet / Text</h3>
          </div>
          <p className="text-[12px] text-[#6f7883] mb-4">
            Enter a text message (which opens the compose box) **OR** paste a direct Tweet URL (e.g., `https://x.com/username/status/1234`). When you click <strong>Launch</strong>, the accounts will navigate directly there.
          </p>
          <textarea
            className="w-full bg-white border border-[#bfc7d3]/50 rounded-xl px-4 py-3 text-[14px] text-[#0b1c30] placeholder:text-[#6f7883] focus:outline-none focus:ring-2 focus:ring-[#00629d]/30 focus:border-[#00629d] transition-all h-24 resize-none"
            placeholder="Type your tweet text, OR paste a tweet URL here (e.g., https://x.com/Twitter/status/1234)..."
            value={tweetText}
            onChange={e => setTweetText(e.target.value)}
          />

          {/^(https?:\/\/)?(www\.)?(x|twitter)\.com\/\w+\/status\/\d+/i.test(tweetText.trim()) && (
            <div className="mt-4 pt-4 border-t border-[#F1F5F9] flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="text-[13px] text-[#3f4851] font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#00629d]">bolt</span>
                    Mass Actions
                    {massActionProgress && (
                      <span className="ml-2 text-[#6f7883] text-[12px]">
                        ({massActionProgress.current}/{massActionProgress.total} completed)
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 mr-4">
                      <label className="text-[12px] font-semibold text-[#3f4851]">Target Count:</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="All"
                        className="w-20 bg-white border border-[#bfc7d3]/50 rounded-lg px-2 py-1.5 text-[12px] text-[#0b1c30] placeholder:text-[#6f7883] focus:outline-none focus:ring-1 focus:ring-[#00629d]"
                        value={targetCount}
                        onChange={e => setTargetCount(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleMassAction('raid')}
                      disabled={!!massActionLoading}
                      className="px-4 py-2 bg-gradient-to-r from-[#00629d] to-[#0b1c30] text-white rounded-lg text-[13px] font-bold flex items-center gap-1.5 transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {massActionLoading === 'raid' ? (
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-[16px]">local_fire_department</span>
                      )}
                      Raid All (Like + RT + Save)
                    </button>
                    <button
                      onClick={() => handleMassAction('like')}
                      disabled={!!massActionLoading}
                      className="px-4 py-2 bg-[#ffebee] text-[#ba1a1a] hover:bg-[#ffcdd2] rounded-lg text-[13px] font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {massActionLoading === 'like' ? (
                        <span className="w-3.5 h-3.5 border-2 border-[#ba1a1a] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-[16px]">favorite</span>
                      )}
                      Like
                    </button>
                    <button
                      onClick={() => handleMassAction('retweet')}
                      disabled={!!massActionLoading}
                      className="px-4 py-2 bg-[#e8f5e9] text-[#10B981] hover:bg-[#c8e6c9] rounded-lg text-[13px] font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {massActionLoading === 'retweet' ? (
                        <span className="w-3.5 h-3.5 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-[16px]">repeat</span>
                      )}
                      Retweet
                    </button>
                    <button
                      onClick={() => handleMassAction('bookmark')}
                      disabled={!!massActionLoading}
                      className="px-4 py-2 bg-[#e3f2fd] text-[#00629d] hover:bg-[#bbdefb] rounded-lg text-[13px] font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {massActionLoading === 'bookmark' ? (
                        <span className="w-3.5 h-3.5 border-2 border-[#00629d] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-[16px]">bookmark</span>
                      )}
                      Bookmark
                    </button>
                  </div>
                </div>

                {/* Mass Replies Section */}
                <div className="flex-1 bg-[#F9FAFB] border border-[#F1F5F9] rounded-xl p-3 flex flex-col gap-2">
                  <div className="text-[12px] font-semibold text-[#0b1c30] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">forum</span>
                    Mass Replies
                  </div>
                  <textarea
                    className="w-full bg-white border border-[#bfc7d3]/50 rounded-lg px-3 py-2 text-[12px] text-[#0b1c30] placeholder:text-[#6f7883] focus:outline-none focus:ring-1 focus:ring-[#00629d] resize-none h-20"
                    placeholder="Enter replies here (one per line)..."
                    value={massReplies}
                    onChange={e => setMassReplies(e.target.value)}
                  />
                  <button
                    onClick={() => handleMassAction('reply')}
                    disabled={!!massActionLoading || !massReplies.trim()}
                    className="w-full py-2 bg-[#00629d] text-white rounded-lg text-[12px] font-bold flex justify-center items-center gap-1.5 transition-colors hover:bg-[#005182] disabled:opacity-50"
                  >
                    {massActionLoading === 'reply' ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    )}
                    Send Replies
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Metrics Row */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-md mb-xl">
          <div className="bg-[#F9FAFB] rounded-xl p-lg relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">Total Accounts</span>
              <span className="material-symbols-outlined text-outline-variant">group</span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-display font-bold text-on-surface">{totalAccounts}</span>
            </div>
            <div className="absolute -bottom-2 -right-2 w-24 h-24 bg-primary/5 rounded-full blur-xl group-hover:bg-primary/10 transition-colors" />
          </div>

          <div className="bg-[#F9FAFB] rounded-xl p-lg relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">Active Sessions</span>
              <span className="material-symbols-outlined text-outline-variant">wifi</span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-display font-bold text-on-surface">{activeSessions}</span>
              <span className="text-outline font-label-md text-label-md mb-1">/ {totalAccounts} total</span>
            </div>
            <div className="w-full bg-surface-container h-1.5 rounded-full mt-4 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-500"
                style={{ width: totalAccounts > 0 ? `${Math.round((activeSessions / totalAccounts) * 100)}%` : "0%" }}
              />
            </div>
          </div>

          <div className="bg-[#F9FAFB] rounded-xl p-lg relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <span className="text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">Sessions Ready</span>
              <span className="material-symbols-outlined text-outline-variant">key</span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-display font-bold text-on-surface">
                {accounts.filter(a => a.cookies).length}
              </span>
              <span className="text-outline font-label-md text-label-md mb-1">with saved cookies</span>
            </div>
            <div className="mt-4 h-8 w-full flex items-end gap-1 opacity-60">
              {[30, 50, 40, 70, 60, 100].map((h, i) => (
                <div key={i} className="w-1/6 bg-primary rounded-t-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </section>

        {/* Account Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-on-surface-variant">
            <div className="w-8 h-8 rounded-full border-2 border-surface-container border-t-primary animate-spin mr-3" />
            Loading accounts...
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[32px] text-outline-variant">person_add</span>
            </div>
            <h3 className="font-semibold text-[16px] text-on-surface mb-1">No accounts yet</h3>
            <p className="text-on-surface-variant text-body-md mb-6">Add your first X account to get started.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-primary text-white font-label-md text-label-md hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add First Account
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
            {accounts.map(acc => (
              <AccountCard
                key={acc.id}
                id={acc.id}
                name={acc.name}
                handle={acc.handle}
                status={acc.status}
                proxyIp={acc.proxyIp}
                region={acc.region}
                followers={acc.followers}
                following={acc.following}
                avatarUrl={acc.avatarUrl ?? undefined}
                hasCookies={!!acc.cookies}
                onDelete={handleDeleteAccount}
                prefilledTweetText={tweetText}
                externalActionLoading={massActionProgress?.activeId === acc.id ? massActionLoading : null}
                scannedStatus={scanStatusMap[tweetText.trim()]?.[acc.id]}
                isScanning={scanningAccountId === acc.id}
              />
            ))}
          </section>
        )}
      </main>
    </>
  );
}
