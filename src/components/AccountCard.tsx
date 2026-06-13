"use client";

import React, { useState } from "react";

export interface AccountCardProps {
  id: string;
  name: string;
  handle: string;
  status: "Active" | "Suspended" | "Offline" | string;
  proxyIp: string;
  region: string;
  followers?: number;
  following?: number;
  avatarUrl?: string;
  hasCookies?: boolean;
  onDelete?: (id: string) => void;
  prefilledTweetText?: string;
  externalActionLoading?: string | null;
  scannedStatus?: { liked: boolean; retweeted: boolean; bookmarked: boolean };
  isScanning?: boolean;
}

export const AccountCard: React.FC<AccountCardProps> = ({
  id, name, handle, status, proxyIp, region,
  followers = 0, following = 0, avatarUrl,
  hasCookies = false, onDelete, prefilledTweetText = "",
  externalActionLoading = null, scannedStatus, isScanning = false,
}) => {
  const [isLaunching, setIsLaunching] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [launchError, setLaunchError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [replyText, setReplyText] = useState("");
  const [completedActionsMap, setCompletedActionsMap] = useState<Record<string, Record<string, boolean>>>({});

  const currentUrl = prefilledTweetText.trim();
  const internalCompleted = completedActionsMap[currentUrl] || {};
  const completedActions = {
    like: internalCompleted.like || scannedStatus?.liked || false,
    retweet: internalCompleted.retweet || scannedStatus?.retweeted || false,
    bookmark: internalCompleted.bookmark || scannedStatus?.bookmarked || false,
  };

  const isSuspended = status === "Suspended";
  const isOffline = status === "Offline";
  const isActive = status === "Active";

  // Combine internal and external loading state
  const currentActionLoading = externalActionLoading || actionLoading;

  // Basic check to see if prefilled text is a Tweet URL
  const isTweetUrl = /^(https?:\/\/)?(www\.)?(x|twitter)\.com\/\w+\/status\/\d+/i.test(prefilledTweetText.trim());

  const formatCount = (n: number) =>
    n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1)}M`
      : n >= 1000
      ? `${(n / 1000).toFixed(1)}k`
      : n.toString();

  const handleLaunch = async () => {
    if (!hasCookies) {
      setLaunchError("No session saved. Use Auto Login to capture this account's session first.");
      return;
    }
    setLaunchError("");
    setIsLaunching(true);
    try {
      const res = await fetch("/api/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: id, tweetText: prefilledTweetText }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLaunchError(data.error || "Failed to launch.");
      }
    } catch {
      setLaunchError("Network error. Is the server running?");
    } finally {
      setIsLaunching(false);
    }
  };

  const handleAction = async (actionType: string) => {
    if (!hasCookies) {
      setLaunchError("No session saved.");
      return;
    }
    if (actionType === 'reply' && !replyText.trim()) {
      setLaunchError("Reply text is required.");
      return;
    }
    
    setLaunchError("");
    setActionSuccess("");
    setActionLoading(actionType);
    try {
      const res = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: id,
          tweetUrl: prefilledTweetText.trim(),
          action: actionType,
          replyText: replyText.trim()
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLaunchError(data.error || `Failed to ${actionType}.`);
      } else {
        setActionSuccess(data.message || `${actionType.charAt(0).toUpperCase() + actionType.slice(1)} successful!`);
        
        setCompletedActionsMap(prev => ({
          ...prev,
          [currentUrl]: {
            ...(prev[currentUrl] || {}),
            [actionType]: true
          }
        }));

        if (actionType === 'reply') setReplyText(''); // Clear on success
        setTimeout(() => setActionSuccess(""), 4000);
      }
    } catch {
      setLaunchError("Network error.");
    } finally {
      setActionLoading(null);
    }
  };

  // Status config
  const statusConfig = isActive
    ? { badge: "bg-[#10B981]/10 text-[#10B981]", dot: "bg-[#10B981]", icon: null }
    : isSuspended
    ? { badge: "bg-[#ba1a1a]/10 text-[#ba1a1a]", dot: null, icon: "warning" }
    : { badge: "bg-[#d3e4fe]/50 text-[#3f4851]", dot: "bg-[#6f7883]", icon: null };

  const proxyIcon = isSuspended ? "public_off" : isActive ? "public" : "vpn_lock";

  return (
    <article
      className={`bg-white border border-[#F1F5F9] rounded-xl p-md shadow-[0_10px_30px_-10px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_40px_-10px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col group relative ${
        isSuspended ? "opacity-80" : ""
      }`}
    >
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={() => onDelete(id)}
          title="Delete account"
          className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white border border-[#F1F5F9] text-[#6f7883] hover:bg-[#ffdad6] hover:text-[#ba1a1a] hover:border-[#ba1a1a]/20 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center z-10 shadow-sm"
        >
          <span className="material-symbols-outlined text-[14px]">close</span>
        </button>
      )}

      {/* Card Header */}
      <div className="flex justify-between items-start mb-md">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full overflow-hidden border border-[#bfc7d3]/20 flex-shrink-0 ${
              isSuspended || isOffline ? "grayscale" : ""
            }`}
          >
            {avatarUrl ? (
              <img alt={name} src={avatarUrl} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#cbdbf5] flex items-center justify-center text-[#00629d] font-bold text-sm">
                {name.substring(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {isScanning && (
              <span className="bg-[#fff3e0] text-[#e65100] border border-[#ffe0b2] rounded px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                <span className="w-2.5 h-2.5 border-[1.5px] border-[#e65100] border-t-transparent rounded-full animate-spin" />
                Scanning...
              </span>
            )}
            <h3 className="font-semibold text-[18px] leading-[28px] text-[#0b1c30] truncate pr-6">
              {name}
            </h3>
            <p className="text-[#3f4851] text-[12px] truncate">{handle}</p>
          </div>
        </div>

        {/* Status badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0 ${statusConfig.badge}`}
        >
          {statusConfig.dot && (
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} ${isActive ? "animate-pulse" : ""}`} />
          )}
          {statusConfig.icon && (
            <span className="material-symbols-outlined text-[12px]">{statusConfig.icon}</span>
          )}
          {status}
        </span>
      </div>

      {/* Proxy Row */}
      <div className="mb-md flex-1">
        <div className="flex items-center gap-2 text-[#3f4851] text-[12px] bg-[#F9FAFB] p-2 rounded-lg border border-[#F1F5F9]">
          <span className="material-symbols-outlined text-[16px]">{proxyIcon}</span>
          <span className={`font-mono text-[11px] flex-1 truncate ${isSuspended ? "line-through opacity-50" : ""}`}>
            {proxyIp || "No proxy"}
          </span>
          <span className={`text-[10px] flex-shrink-0 ${isSuspended ? "text-[#ba1a1a]" : "text-[#6f7883]"}`}>
            {isSuspended ? "Review Required" : region || "—"}
          </span>
        </div>

        {/* Session cookie indicator */}
        <div className={`flex items-center gap-1.5 mt-2 text-[11px] ${hasCookies ? "text-[#10B981]" : "text-[#6f7883]"}`}>
          <span className="material-symbols-outlined text-[14px]">{hasCookies ? "key" : "no_encryption"}</span>
          {hasCookies ? "Session saved — ready to launch" : "No session saved yet"}
        </div>
      </div>

      {/* Launch error / Action success */}
      {launchError && (
        <div className="mb-md text-[11px] text-[#ba1a1a] bg-[#ffdad6]/30 border border-[#ba1a1a]/10 rounded-lg px-3 py-2 flex items-start gap-1.5">
          <span className="material-symbols-outlined text-[14px] flex-shrink-0 mt-0.5">error</span>
          {launchError}
        </div>
      )}
      {actionSuccess && (
        <div className="mb-md text-[11px] text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 rounded-lg px-3 py-2 flex items-start gap-1.5">
          <span className="material-symbols-outlined text-[14px] flex-shrink-0 mt-0.5">check_circle</span>
          {actionSuccess}
        </div>
      )}

      {/* Stats Footer / Basic Actions */}
      <div className="border-t border-[#F1F5F9] pt-md flex items-center justify-between">
        <div className="flex items-center gap-4 text-[#6f7883] text-[11px]">
          {isActive && (
            <>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">favorite</span>
                {formatCount(followers)}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">group</span>
                {formatCount(following)}
              </span>
            </>
          )}
          {isSuspended && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">history</span>
              Suspended
            </span>
          )}
          {isOffline && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">schedule</span>
              Offline
            </span>
          )}
        </div>

        {isActive && (
          <button
            onClick={handleLaunch}
            disabled={isLaunching}
            className="text-[#00629d] font-medium text-[12px] hover:bg-[#eff4ff] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
          >
            {isLaunching ? (
              <>
                <span className="w-3 h-3 border border-[#00629d] border-t-transparent rounded-full animate-spin mr-1" />
                Launching...
              </>
            ) : (
              <>
                Launch
                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        )}

        {isSuspended && (
          <button className="text-[#3f4851] font-medium text-[12px] hover:bg-[#F9FAFB] px-3 py-1.5 rounded-lg transition-colors border border-[#bfc7d3]/30">
            Details
          </button>
        )}

        {isOffline && (
          <button
            onClick={handleLaunch}
            disabled={isLaunching || !hasCookies}
            className="text-[#00629d] font-medium text-[12px] hover:bg-[#eff4ff] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-40"
          >
            Reconnect
            <span className="material-symbols-outlined text-[16px] group-hover:rotate-180 transition-transform duration-500">
              refresh
            </span>
          </button>
        )}
      </div>

      {/* Headless Tweet Actions (Only show if target is a Tweet URL and Account is Active) */}
      {isActive && isTweetUrl && (
        <div className="mt-4 border-t border-[#F1F5F9] pt-3 flex flex-col gap-3">
          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction('like')}
              disabled={!!currentActionLoading}
              className={`flex-1 hover:bg-[#ffebee] text-[#ba1a1a] rounded-lg py-1.5 flex items-center justify-center gap-1 text-[12px] font-medium transition-colors disabled:opacity-50 ${completedActions['like'] ? 'bg-[#ffebee] border border-[#ba1a1a]/30 shadow-inner' : 'bg-[#F9FAFB] border border-[#F1F5F9]'}`}
              title="Like"
            >
              {currentActionLoading === 'like' ? (
                <span className="w-3 h-3 border border-[#ba1a1a] border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className={`material-symbols-outlined text-[14px] ${completedActions['like'] ? 'icon-fill' : ''}`}>favorite</span>
              )}
            </button>
            <button
              onClick={() => handleAction('retweet')}
              disabled={!!currentActionLoading}
              className={`flex-1 hover:bg-[#e8f5e9] text-[#10B981] rounded-lg py-1.5 flex items-center justify-center gap-1 text-[12px] font-medium transition-colors disabled:opacity-50 ${completedActions['retweet'] ? 'bg-[#e8f5e9] border border-[#10B981]/30 shadow-inner' : 'bg-[#F9FAFB] border border-[#F1F5F9]'}`}
              title="Retweet"
            >
              {currentActionLoading === 'retweet' ? (
                <span className="w-3 h-3 border border-[#10B981] border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className={`material-symbols-outlined text-[14px] ${completedActions['retweet'] ? 'icon-fill' : ''}`}>repeat</span>
              )}
            </button>
            <button
              onClick={() => handleAction('bookmark')}
              disabled={!!currentActionLoading}
              className={`flex-1 hover:bg-[#e3f2fd] text-[#00629d] rounded-lg py-1.5 flex items-center justify-center gap-1 text-[12px] font-medium transition-colors disabled:opacity-50 ${completedActions['bookmark'] ? 'bg-[#e3f2fd] border border-[#00629d]/30 shadow-inner' : 'bg-[#F9FAFB] border border-[#F1F5F9]'}`}
              title="Bookmark"
            >
              {currentActionLoading === 'bookmark' ? (
                <span className="w-3 h-3 border border-[#00629d] border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className={`material-symbols-outlined text-[14px] ${completedActions['bookmark'] ? 'icon-fill' : ''}`}>bookmark</span>
              )}
            </button>
            <button
              onClick={() => {
                const url = prefilledTweetText.trim();
                const fullUrl = url.startsWith('http') ? url : `https://${url}`;
                window.open(fullUrl, '_blank');
              }}
              disabled={!!currentActionLoading}
              className="flex-1 bg-[#F9FAFB] hover:bg-[#f3f4f6] text-[#3f4851] border border-[#F1F5F9] rounded-lg py-1.5 flex items-center justify-center gap-1 text-[12px] font-medium transition-colors disabled:opacity-50"
              title="Open in normal browser"
            >
              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
            </button>
          </div>

          {/* Reply Box */}
          <div className="flex gap-2 items-stretch">
            <textarea
              className="flex-1 bg-[#F9FAFB] border border-[#F1F5F9] rounded-lg px-2 py-1.5 text-[12px] text-[#0b1c30] placeholder:text-[#6f7883] focus:outline-none focus:ring-1 focus:ring-[#00629d] resize-none h-10"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              disabled={!!currentActionLoading}
            />
            <button
              onClick={() => handleAction('reply')}
              disabled={!!currentActionLoading || !replyText.trim()}
              className="bg-[#00629d] text-white rounded-lg px-3 flex items-center justify-center hover:bg-[#005182] transition-colors disabled:opacity-50"
            >
              {currentActionLoading === 'reply' ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="material-symbols-outlined text-[16px]">send</span>
              )}
            </button>
          </div>
        </div>
      )}
    </article>
  );
};
