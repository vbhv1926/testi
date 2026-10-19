/**
 * XRAID Telegram Bot — v5 (Full Feature Parity & High-Reliability Comments)
 * =========================================================================
 * Interactive button-driven raid & mass comment launcher.
 * Features:
 *  - Full WebApp Feature Parity:
 *      • All-in-one Raid (Like + Repost + Bookmark + Mass Comment)
 *      • Dedicated Mass Comments / Replies mode
 *      • Likes only, Reposts only, Bookmarks only
 *  - 4 Built-in Preset Comment Packs (Hype, Crypto/Web3, Support, GM/Community)
 *  - Custom Multi-line Comment input via chat or single-command arguments
 *  - Real-time live status updates during execution
 *  - Concurrency selector (1, 3, 5, 10 at once)
 *  - Account limit selector (5, 10, 15, All)
 *  - Robust error recovery & instant /stop cancellation
 */

import { Bot, InlineKeyboard } from 'grammy';

// ── Config ────────────────────────────────────────────────────────────────────
const BOT_TOKEN = '8902893365:AAFAilhOLadSN1vR-3S00SF5RK3caUGDhYI';
const API_BASE  = 'http://localhost:3000';
const BATCH_PAUSE_MS = 2_000;
// ─────────────────────────────────────────────────────────────────────────────

type ActionType = 'raid' | 'reply' | 'like' | 'retweet' | 'bookmark';

interface Account {
  id: string;
  name: string;
  handle: string;
  status: string;
  cookies?: string | null;
}

interface RaidConfig {
  url: string;
  action: ActionType | null;
  accountCountStr: string;       // '5' | '10' | '15' | 'all'
  accountCount:    number | null; // null = all
  concurrency:     number;
  replies:         string[];     // List of custom replies/comments
  waitingForComments?: boolean;  // Awaiting user comment text input
}

const pending     = new Map<number, RaidConfig>();
const cancelFlags = new Map<number, boolean>();
const raidActive  = new Map<number, boolean>();

const DEFAULT_AC  = 'all';
const DEFAULT_C   = 3;

// Preset comment packs matching WebApp themes
const PRESETS: Record<string, { name: string; icon: string; list: string[] }> = {
  hype: {
    name: 'Hype Pack',
    icon: '🔥',
    list: [
      'LFG! 🚀',
      'Bullish on this! 🔥',
      'Huge milestone! 💎',
      'To the moon! 🌕',
      'Great project and solid team! ✨',
      'Excited for what is coming next! 👀',
      'Massive potential here! 📈',
    ],
  },
  crypto: {
    name: 'Crypto / Web3',
    icon: '💎',
    list: [
      'Amazing development! 🚀',
      'Solid fundamentals and great vision! 💎',
      'Keep building! 🛠️',
      'Next 100x gem! 🌕',
      'High conviction play! ⚡',
      'Strongest community in the space! 🤝',
      'Massive things ahead! 📈',
    ],
  },
  support: {
    name: 'Support Pack',
    icon: '👏',
    list: [
      'Great post! 👏',
      'Totally agree with this! 💯',
      'Love this insight! 🙌',
      'Very well said! 🎯',
      'Amazing work by the team! 🌟',
      'Thanks for sharing! 💡',
    ],
  },
  gm: {
    name: 'GM / Vibes',
    icon: '☀️',
    list: [
      'GM! Let’s get it today! ☀️',
      'Great momentum! 🚀',
      'Vibes are immaculate! ✨',
      'WAGMI! 🤝',
      'Always bullish on this team! 💎',
    ],
  },
};

const bot = new Bot(BOT_TOKEN);

bot.use(async (ctx, next) => {
  const text = ctx.message?.text || ctx.callbackQuery?.data || '';
  const from = ctx.from?.username ? `@${ctx.from.username}` : `${ctx.from?.id || 'unknown'}`;
  console.log(`[Telegram Update] type: ${Object.keys(ctx.update).filter(k => k !== 'update_id').join(', ')} | from: ${from} | text: "${text}"`);
  await next();
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms: number) { return new Promise<void>(r => setTimeout(r, ms)); }

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${s % 60}s` : `${s}s`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function getAccounts(): Promise<Account[]> {
  const res = await fetch(`${API_BASE}/api/accounts`);
  if (!res.ok) throw new Error(`Failed to fetch accounts: ${res.status}`);
  return res.json();
}

async function performAction(
  accountId: string,
  tweetUrl: string,
  action: ActionType,
  replyText?: string
): Promise<{ ok: boolean; message: string }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5 * 60 * 1000); // 5 min max
    const res = await fetch(`${API_BASE}/api/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId,
        tweetUrl,
        action,
        replyText: replyText || undefined,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, message: data.details ?? data.error ?? 'Action failed' };
    return { ok: true, message: data.message ?? 'Success' };
  } catch (e: any) {
    return { ok: false, message: e.name === 'AbortError' ? 'Timed out (5min limit)' : e.message };
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Keyboards ─────────────────────────────────────────────────────────────────

function actionKeyboard(chatId: number) {
  return new InlineKeyboard()
    .text('🚀  All (Like + Repost + Save + Comment)', `a|${chatId}|raid`).row()
    .text('💬  Comments / Replies only',            `a|${chatId}|reply`).row()
    .text('👍  Likes only',                         `a|${chatId}|like`).row()
    .text('🔁  Reposts only',                       `a|${chatId}|retweet`).row()
    .text('🔖  Saves only',                         `a|${chatId}|bookmark`);
}

function presetsKeyboard(chatId: number) {
  return new InlineKeyboard()
    .text('🔥 Hype Pack',    `cfg_preset|${chatId}|hype`)
    .text('💎 Crypto/Web3',  `cfg_preset|${chatId}|crypto`).row()
    .text('👏 Support Pack', `cfg_preset|${chatId}|support`)
    .text('☀️ GM / Vibes',   `cfg_preset|${chatId}|gm`).row()
    .text('⬅️ Back to Config', `cfg_back|${chatId}`);
}

/**
 * Combined config keyboard — account count, concurrency, and comment controls.
 */
function configKeyboard(
  chatId: number,
  totalEligible: number,
  cfg: RaidConfig
) {
  const kb = new InlineKeyboard();

  // Row 1: Account count options
  const acOpts = ['5', '10', '15', 'all'];
  for (const opt of acOpts) {
    const label    = opt === 'all' ? `All (${totalEligible})` : `${opt} Accs`;
    const selected = cfg.accountCountStr === opt;
    kb.text(selected ? `✅ ${label}` : label, `cfg_ac|${chatId}|${opt}`);
  }
  kb.row();

  // Row 2: Concurrency options
  const cOpts = [1, 3, 5, 10];
  for (const opt of cOpts) {
    const selected = cfg.concurrency === opt;
    kb.text(selected ? `✅ ${opt} at once` : `${opt} at once`, `cfg_c|${chatId}|${opt}`);
  }
  kb.row();

  // Row 3: Comments & Presets buttons (if action is raid or reply)
  if (cfg.action === 'reply' || cfg.action === 'raid') {
    if (cfg.replies.length === 0) {
      kb.text('💬 ➕ Custom Comments', `cfg_add_reply|${chatId}`)
        .text('📦 Comment Presets',    `cfg_show_presets|${chatId}`)
        .row();
    } else {
      kb.text(`✏️ Edit (${cfg.replies.length} msgs)`, `cfg_add_reply|${chatId}`)
        .text('📦 Presets',                        `cfg_show_presets|${chatId}`)
        .text('🗑️ Clear',                          `cfg_clr_reply|${chatId}`)
        .row();
    }
  }

  // Row 4: Action & Start
  const startLabel = cfg.action === 'reply' ? '▶️  Send Mass Replies' : '▶️  Start Raid';
  kb.text(startLabel, `cfg_start|${chatId}`)
    .text('🔄 Change Action', `cfg_change_act|${chatId}`);

  return kb;
}

function configMessageText(cfg: RaidConfig, totalEligible: number): string {
  const actionLabel: Record<ActionType, string> = {
    raid:     '🚀 All (Like + Repost + Save + Comment)',
    reply:    '💬 Comments / Replies only',
    like:     '👍 Likes only',
    retweet:  '🔁 Reposts only',
    bookmark: '🔖 Saves only',
  };

  const acLabel = cfg.accountCountStr === 'all'
    ? `All (${totalEligible})`
    : `${cfg.accountCountStr} accounts`;

  let commentsSection = '';
  if (cfg.action === 'reply' || cfg.action === 'raid') {
    if (cfg.replies.length > 0) {
      const preview = cfg.replies
        .slice(0, 3)
        .map((r, i) => `   ${i + 1}. <i>"${escapeHtml(r.length > 40 ? r.slice(0, 37) + '…' : r)}"</i>`)
        .join('\n');
      const more = cfg.replies.length > 3 ? `\n   <i>…and ${cfg.replies.length - 3} more</i>` : '';
      commentsSection =
        `💬 <b>Comments Loaded (${cfg.replies.length} replies in pool)</b>:\n` +
        `${preview}${more}\n\n`;
    } else if (cfg.action === 'reply') {
      commentsSection =
        `💬 <b>Comments</b>: ⚠️ <i>Required (Tap '➕ Custom Comments' or 'Comment Presets')</i>\n\n`;
    } else {
      commentsSection =
        `💬 <b>Comments</b>: <i>Optional (None set — will like, repost, and bookmark)</i>\n\n`;
    }
  }

  return (
    `🎯 <b>Raid Configuration</b>\n\n` +
    `🔗 <code>${escapeHtml(cfg.url)}</code>\n` +
    `⚡ <b>Action</b>      : <b>${actionLabel[cfg.action!]}</b>\n\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `👥 <b>Target Accounts</b>: <b>${acLabel}</b>\n` +
    `🔀 <b>Concurrency</b>    : <b>${cfg.concurrency} at once</b>\n\n` +
    commentsSection +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `Tap ▶️ <b>${cfg.action === 'reply' ? 'Send Mass Replies' : 'Start Raid'}</b> to launch!`
  );
}

// ── Step 1: Action Selection ──────────────────────────────────────────────────
async function showActionMenu(
  ctx: any,
  url: string,
  defaultAction?: ActionType,
  initialReplies?: string[]
) {
  const chatId: number = ctx.chat?.id ?? ctx.from?.id;

  if (!url.startsWith('http')) {
    return ctx.reply('❌ Please paste the full tweet URL (starting with https://).');
  }

  let eligible = 0;
  try {
    const all = await getAccounts();
    eligible = all.filter(a => a.cookies).length;
  } catch { /* non-fatal */ }

  const cfg: RaidConfig = {
    url,
    action:          defaultAction || null,
    accountCountStr: DEFAULT_AC,
    accountCount:    null,
    concurrency:     DEFAULT_C,
    replies:         initialReplies && initialReplies.length > 0 ? initialReplies : [],
    waitingForComments: false,
  };

  pending.set(chatId, cfg);

  if (defaultAction) {
    return ctx.reply(
      configMessageText(cfg, eligible),
      {
        parse_mode:   'HTML',
        reply_markup: configKeyboard(chatId, eligible, cfg),
      }
    );
  }

  return ctx.reply(
    `🎯 <b>New Raid Setup</b>\n\n🔗 <code>${escapeHtml(url)}</code>\nReady Accounts: <b>${eligible}</b>\n\nStep 1 — Choose action:`,
    { parse_mode: 'HTML', reply_markup: actionKeyboard(chatId) }
  );
}

// ── Core Raid Runner ──────────────────────────────────────────────────────────
async function runRaid(chatId: number, sendFn: (t: string) => Promise<void>, cfg: RaidConfig) {
  raidActive.set(chatId, true);
  cancelFlags.set(chatId, false);
  const startTime = Date.now();

  let accounts: Account[];
  try {
    accounts = await getAccounts();
  } catch (e: any) {
    await sendFn(`❌ Could not fetch accounts: ${escapeHtml(e.message)}`);
    raidActive.set(chatId, false);
    return;
  }

  let pool = shuffle(accounts.filter(a => a.cookies));
  if (pool.length === 0) {
    await sendFn('❌ No accounts with saved cookies found. Please import cookies in the Web Dashboard first.');
    raidActive.set(chatId, false);
    return;
  }

  if (cfg.accountCount !== null && cfg.accountCount < pool.length) {
    pool = pool.slice(0, cfg.accountCount);
  }

  const action      = cfg.action!;
  const concurrency = cfg.concurrency;
  const repliesList = cfg.replies;

  // Validation for reply-only action
  if (action === 'reply' && repliesList.length === 0) {
    await sendFn('❌ No comments provided. Please add comments before sending.');
    raidActive.set(chatId, false);
    return;
  }

  // Assign replies: if replies provided, cycle through them for all accounts
  const replyAssignment = new Map<string, string>();
  if (repliesList.length > 0) {
    pool.forEach((acc, i) => {
      replyAssignment.set(acc.id, repliesList[i % repliesList.length]);
    });
  }

  const actionLabel: Record<ActionType, string> = {
    raid:     repliesList.length > 0 ? 'Like + Repost + Save + Comment' : 'Like + Repost + Save',
    reply:    'Send Mass Replies / Comments',
    like:     'Like',
    retweet:  'Repost',
    bookmark: 'Save',
  };

  await sendFn(
    `🚀 <b>${action === 'reply' ? 'Reply Raid Started' : 'Raid Started!'}</b>\n\n` +
    `🔗 <code>${escapeHtml(cfg.url)}</code>\n` +
    `⚡ Action       : <b>${actionLabel[action]}</b>\n` +
    `👥 Accounts     : <b>${pool.length}</b>\n` +
    `🔀 Concurrency  : <b>${concurrency} at once</b>\n` +
    (repliesList.length > 0 ? `💬 Comments Pool: <b>${repliesList.length} unique replies</b>\n\n` : '\n') +
    `Use /stop to cancel immediately.`
  );

  let succeeded = 0;
  let failed    = 0;
  let processed = 0;
  const total   = pool.length;

  for (let i = 0; i < total; i += concurrency) {
    if (cancelFlags.get(chatId)) break;

    const batch = pool.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(acc => {
        const assignedReply = replyAssignment.get(acc.id);
        return performAction(acc.id, cfg.url, action, assignedReply);
      })
    );

    for (let j = 0; j < batch.length; j++) {
      processed++;
      const acc = batch[j];
      const res = results[j];
      const replyUsed = replyAssignment.get(acc.id);

      if (res.ok) {
        succeeded++;
        console.log(`[✓] ${acc.handle} — ${action}${replyUsed ? ` (Reply: "${replyUsed}")` : ''}`);
      } else {
        failed++;
        console.log(`[✗] ${acc.handle} — ${res.message}`);
      }
    }

    await sendFn(
      `⏳ <b>Progress:</b> ${processed}/${total} accounts\n` +
      `✓ Succeeded: <b>${succeeded}</b>   ✗ Failed: <b>${failed}</b>`
    );

    if (i + concurrency < total && !cancelFlags.get(chatId)) {
      await sleep(BATCH_PAUSE_MS);
    }
  }

  const elapsed      = Date.now() - startTime;
  const wasCancelled = cancelFlags.get(chatId);

  await sendFn(
    `${wasCancelled ? '🛑 <b>Raid cancelled</b>' : '✅ <b>Raid completed!</b>'}\n\n` +
    `✓ Succeeded : <b>${succeeded} / ${total}</b>\n` +
    `✗ Failed    : <b>${failed}</b>\n` +
    `⏱ Time taken: <b>${fmt(elapsed)}</b>`
  );

  raidActive.set(chatId, false);
  pending.delete(chatId);
}

// ── Bot Commands ──────────────────────────────────────────────────────────────

bot.command(['start', 'help'], (ctx) =>
  ctx.reply(
    '🚀 <b>XRAID Telegram Bot v5</b>\n\n' +
    'Multi-account automated Twitter/X raid & comment launcher.\n\n' +
    '<b>Quick Usage:</b>\n' +
    '• Paste any tweet URL directly into chat\n' +
    '• <code>/raid &lt;url&gt;</code> — Full raid setup\n' +
    '• <code>/comment &lt;url&gt;</code> — Mass replies setup\n' +
    '• <code>/comment &lt;url&gt; [comments]</code> — Mass replies with direct text\n\n' +
    '<b>Management:</b>\n' +
    '<code>/status</code> — Account health & metrics\n' +
    '<code>/stop</code>   — Stop running raid immediately\n' +
    '<code>/cancel</code> — Stop after current batch\n' +
    '<code>/help</code>   — Show this guide',
    { parse_mode: 'HTML' }
  )
);

bot.command('status', async (ctx) => {
  try {
    const accounts = await getAccounts();
    const withCookies = accounts.filter(a => a.cookies);
    const counts: Record<string, number> = {};
    for (const a of accounts) counts[a.status] = (counts[a.status] ?? 0) + 1;
    const lines = Object.entries(counts).map(([k, v]) => `  • ${escapeHtml(k)}: <b>${v}</b>`).join('\n');
    return ctx.reply(
      `📊 <b>Account Metrics</b>\n\n` +
      `Total Accounts: <b>${accounts.length}</b>\n` +
      `Ready (Active + Cookies): <b>${withCookies.length} / ${accounts.length}</b>\n\n` +
      `<b>Status Breakdown:</b>\n${lines || '  • No accounts'}`,
      { parse_mode: 'HTML' }
    );
  } catch (e: any) {
    return ctx.reply(`❌ Error fetching accounts: ${escapeHtml(e.message)}`);
  }
});

bot.command('cancel', (ctx) => {
  const chatId = ctx.chat.id;
  if (!raidActive.get(chatId)) return ctx.reply('ℹ️ No raid is currently running.');
  cancelFlags.set(chatId, true);
  return ctx.reply('🛑 Stopping after current batch finishes…');
});

bot.command('stop', (ctx) => {
  const chatId     = ctx.chat.id;
  const wasRaiding = raidActive.get(chatId);
  cancelFlags.set(chatId, true);
  raidActive.set(chatId, false);
  pending.delete(chatId);
  return ctx.reply(
    wasRaiding
      ? '🛑 <b>Raid stopped immediately.</b> State cleared.\n\nPaste a URL to start a new raid!'
      : '🧹 <b>Cleared.</b> No active raid running.',
    { parse_mode: 'HTML' }
  );
});

bot.command(['raid', 'comment', 'reply'], async (ctx) => {
  const fullText = ctx.message?.text || '';
  const parts = fullText.split(/\s+/);
  const commandName = parts[0].replace('/', '').toLowerCase();

  const urlMatch = fullText.match(/https?:\/\/(www\.)?(x|twitter)\.com\/[^\s]+/i);
  if (!urlMatch) {
    return ctx.reply(
      `Usage: <code>/${commandName} &lt;tweet_url&gt;</code>\nOr simply paste the tweet URL in chat!`,
      { parse_mode: 'HTML' }
    );
  }

  const url = urlMatch[0];
  const remainingText = fullText.replace(parts[0], '').replace(url, '').trim();
  const directReplies = remainingText
    ? remainingText.split('\n').map(s => s.trim()).filter(Boolean)
    : [];

  const defaultAction: ActionType | undefined = (commandName.startsWith('comment') || commandName.startsWith('reply'))
    ? 'reply'
    : 'raid';

  return showActionMenu(ctx, url, defaultAction, directReplies);
});

// ── Text Handler (URLs or Custom Comments) ────────────────────────────────────

bot.on('message:text', async (ctx) => {
  const text = ctx.message.text.trim();
  const chatId = ctx.chat.id;

  if (text.startsWith('/')) return;

  const cfg = pending.get(chatId);

  // 1. Check if user is in "waiting for comments" mode
  if (cfg && cfg.waitingForComments) {
    const lines = text
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      return ctx.reply('❌ No valid text received. Please send at least one comment line.');
    }

    cfg.replies = lines;
    cfg.waitingForComments = false;
    pending.set(chatId, cfg);

    let eligible = 0;
    try {
      const all = await getAccounts();
      eligible = all.filter(a => a.cookies).length;
    } catch { /* non-fatal */ }

    await ctx.reply(
      `✅ <b>Saved ${lines.length} comment(s)!</b>`,
      { parse_mode: 'HTML' }
    );

    return ctx.reply(
      configMessageText(cfg, eligible),
      {
        parse_mode:   'HTML',
        reply_markup: configKeyboard(chatId, eligible, cfg),
      }
    );
  }

  // 2. Check if user pasted a Tweet URL
  const urlMatch = text.match(/https?:\/\/(www\.)?(x|twitter)\.com\/[^\s]+/i);
  if (urlMatch) {
    const url = urlMatch[0];
    const remainingText = text.replace(url, '').trim();
    const directReplies = remainingText
      ? remainingText.split('\n').map(s => s.trim()).filter(Boolean)
      : [];

    return showActionMenu(ctx, url, undefined, directReplies);
  }
});

// ── Callbacks: Step 1 Action Pick ─────────────────────────────────────────────

bot.callbackQuery(/^a\|(\d+)\|(\w+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = parseInt(ctx.match[1]);
  const action = ctx.match[2] as ActionType;

  const cfg = pending.get(chatId);
  if (!cfg) return ctx.reply('⚠️ Session expired. Please paste the tweet URL again.');

  cfg.action = action;
  pending.set(chatId, cfg);

  let eligible = 0;
  try {
    const all = await getAccounts();
    eligible = all.filter(a => a.cookies).length;
  } catch { /* non-fatal */ }

  await ctx.editMessageText(
    configMessageText(cfg, eligible),
    {
      parse_mode:   'HTML',
      reply_markup: configKeyboard(chatId, eligible, cfg),
    }
  );
});

// ── Callbacks: Config Changes ─────────────────────────────────────────────────

bot.callbackQuery(/^cfg_ac\|(\d+)\|(\w+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = parseInt(ctx.match[1]);
  const raw    = ctx.match[2];

  const cfg = pending.get(chatId);
  if (!cfg) return ctx.reply('⚠️ Session expired. Please paste the URL again.');

  cfg.accountCountStr = raw;
  cfg.accountCount    = raw === 'all' ? null : parseInt(raw);
  pending.set(chatId, cfg);

  let eligible = 0;
  try {
    const all = await getAccounts();
    eligible = all.filter(a => a.cookies).length;
  } catch { /* non-fatal */ }

  await ctx.editMessageText(
    configMessageText(cfg, eligible),
    {
      parse_mode:   'HTML',
      reply_markup: configKeyboard(chatId, eligible, cfg),
    }
  );
});

bot.callbackQuery(/^cfg_c\|(\d+)\|(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId      = parseInt(ctx.match[1]);
  const concurrency = parseInt(ctx.match[2]);

  const cfg = pending.get(chatId);
  if (!cfg) return ctx.reply('⚠️ Session expired. Please paste the URL again.');

  cfg.concurrency = concurrency;
  pending.set(chatId, cfg);

  let eligible = 0;
  try {
    const all = await getAccounts();
    eligible = all.filter(a => a.cookies).length;
  } catch { /* non-fatal */ }

  await ctx.editMessageText(
    configMessageText(cfg, eligible),
    {
      parse_mode:   'HTML',
      reply_markup: configKeyboard(chatId, eligible, cfg),
    }
  );
});

bot.callbackQuery(/^cfg_add_reply\|(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = parseInt(ctx.match[1]);

  const cfg = pending.get(chatId);
  if (!cfg) return ctx.reply('⚠️ Session expired. Please paste the URL again.');

  cfg.waitingForComments = true;
  pending.set(chatId, cfg);

  return ctx.reply(
    `💬 <b>Enter Custom Comments / Replies</b>\n\n` +
    `Send your comments as a reply in this chat (one comment per line):\n\n` +
    `<code>LFG! 🚀\nBullish update 🔥\nGreat team and roadmap! 💎\nNext big thing ✨</code>\n\n` +
    `<i>Each participating account will post one comment automatically.</i>`,
    { parse_mode: 'HTML' }
  );
});

bot.callbackQuery(/^cfg_show_presets\|(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = parseInt(ctx.match[1]);

  const cfg = pending.get(chatId);
  if (!cfg) return ctx.reply('⚠️ Session expired. Please paste the URL again.');

  await ctx.editMessageText(
    `📦 <b>Choose a Preset Comment Pack</b>\n\n` +
    `• 🔥 <b>Hype Pack</b>: 7 high-energy comments (LFG, Bullish, Moon...)\n` +
    `• 💎 <b>Crypto/Web3</b>: 7 project & fundamentals comments\n` +
    `• 👏 <b>Support Pack</b>: 6 positive engagement comments\n` +
    `• ☀️ <b>GM / Vibes</b>: 5 daily community vibe comments\n\n` +
    `Tap a pack below to apply it instantly:`,
    { parse_mode: 'HTML', reply_markup: presetsKeyboard(chatId) }
  );
});

bot.callbackQuery(/^cfg_preset\|(\d+)\|(\w+)$/, async (ctx) => {
  const chatId = parseInt(ctx.match[1]);
  const presetKey = ctx.match[2];
  const pack = PRESETS[presetKey] || PRESETS.hype;

  await ctx.answerCallbackQuery(`${pack.name} loaded! ${pack.icon}`);

  const cfg = pending.get(chatId);
  if (!cfg) return ctx.reply('⚠️ Session expired. Please paste the URL again.');

  cfg.replies = [...pack.list];
  cfg.waitingForComments = false;
  pending.set(chatId, cfg);

  let eligible = 0;
  try {
    const all = await getAccounts();
    eligible = all.filter(a => a.cookies).length;
  } catch { /* non-fatal */ }

  await ctx.editMessageText(
    configMessageText(cfg, eligible),
    {
      parse_mode:   'HTML',
      reply_markup: configKeyboard(chatId, eligible, cfg),
    }
  );
});

bot.callbackQuery(/^cfg_back\|(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = parseInt(ctx.match[1]);

  const cfg = pending.get(chatId);
  if (!cfg) return ctx.reply('⚠️ Session expired. Please paste the URL again.');

  let eligible = 0;
  try {
    const all = await getAccounts();
    eligible = all.filter(a => a.cookies).length;
  } catch { /* non-fatal */ }

  await ctx.editMessageText(
    configMessageText(cfg, eligible),
    {
      parse_mode:   'HTML',
      reply_markup: configKeyboard(chatId, eligible, cfg),
    }
  );
});

bot.callbackQuery(/^cfg_clr_reply\|(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery('Comments cleared.');
  const chatId = parseInt(ctx.match[1]);

  const cfg = pending.get(chatId);
  if (!cfg) return ctx.reply('⚠️ Session expired. Please paste the URL again.');

  cfg.replies = [];
  cfg.waitingForComments = false;
  pending.set(chatId, cfg);

  let eligible = 0;
  try {
    const all = await getAccounts();
    eligible = all.filter(a => a.cookies).length;
  } catch { /* non-fatal */ }

  await ctx.editMessageText(
    configMessageText(cfg, eligible),
    {
      parse_mode:   'HTML',
      reply_markup: configKeyboard(chatId, eligible, cfg),
    }
  );
});

bot.callbackQuery(/^cfg_change_act\|(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const chatId = parseInt(ctx.match[1]);

  const cfg = pending.get(chatId);
  if (!cfg) return ctx.reply('⚠️ Session expired. Please paste the URL again.');

  let eligible = 0;
  try {
    const all = await getAccounts();
    eligible = all.filter(a => a.cookies).length;
  } catch { /* non-fatal */ }

  await ctx.editMessageText(
    `🎯 <b>Select Action</b>\n\n🔗 <code>${escapeHtml(cfg.url)}</code>\nReady Accounts: <b>${eligible}</b>`,
    { parse_mode: 'HTML', reply_markup: actionKeyboard(chatId) }
  );
});

bot.callbackQuery(/^cfg_start\|(\d+)$/, async (ctx) => {
  const chatId = parseInt(ctx.match[1]);

  const cfg = pending.get(chatId);
  if (!cfg || !cfg.action) {
    await ctx.answerCallbackQuery('Session expired');
    return ctx.reply('⚠️ Session expired. Please paste the URL again.');
  }

  if (raidActive.get(chatId)) {
    await ctx.answerCallbackQuery('Raid active');
    return ctx.reply('⚠️ A raid is already running in this chat. Use /stop first.');
  }

  if (cfg.action === 'reply' && cfg.replies.length === 0) {
    await ctx.answerCallbackQuery('No comments set');
    cfg.waitingForComments = true;
    pending.set(chatId, cfg);
    return ctx.reply(
      '⚠️ <b>No comments provided!</b>\n\nPlease send your comments in chat (one per line) or select a Comment Preset.',
      { parse_mode: 'HTML' }
    );
  }

  await ctx.answerCallbackQuery('Launching! 🚀').catch(() => {});

  let eligible = 0;
  try {
    const all = await getAccounts();
    eligible = all.filter(a => a.cookies).length;
  } catch { /* non-fatal */ }

  const acLabel = cfg.accountCountStr === 'all' ? `All (${eligible})` : `${cfg.accountCountStr} accounts`;

  // Non-blocking edit — don't let this crash prevent raid from running
  try {
    await ctx.editMessageText(
      `✅ <b>Configuration Locked In!</b>\n\n` +
      `🔗 <code>${escapeHtml(cfg.url)}</code>\n` +
      `👥 Accounts : <b>${acLabel}</b>\n` +
      `🔀 Concurrency : <b>${cfg.concurrency} at once</b>\n` +
      (cfg.replies.length > 0 ? `💬 Comments : <b>${cfg.replies.length} replies queued</b>\n\n` : '\n') +
      `Starting browser automation…`,
      { parse_mode: 'HTML' }
    );
  } catch (editErr: any) {
    console.error('[cfg_start] editMessageText failed:', editErr.message);
    // Still proceed — send a new message instead
    await ctx.reply('🚀 Starting browser automation…').catch(() => {});
  }

  console.log(`[cfg_start] Launching runRaid for chatId=${chatId}, action=${cfg.action}, replies=${cfg.replies.length}`);
  // Use bot.api.sendMessage directly — ctx.reply() can hang when the callback context expires
  const sendFn = async (text: string) => {
    try {
      await bot.api.sendMessage(chatId, text, { parse_mode: 'HTML' });
    } catch (err: any) {
      console.error(`[sendFn] Failed to send message to ${chatId}:`, err.message);
    }
  };
  runRaid(chatId, sendFn, cfg);
});

// ── Startup ───────────────────────────────────────────────────────────────────
console.log('🤖 XRAID Telegram bot v5 starting…');
console.log(`   API base : ${API_BASE}`);
console.log('   Press Ctrl+C to stop.\n');

bot.catch((err) => {
  const e = err.error as any;
  if (e?.description?.includes('message is not modified')) {
    return;
  }
  console.error(`Error while handling update ${err.ctx?.update?.update_id}:`, err.error);
});

bot.start().catch((err) => {
  console.error('Bot crashed:', err);
  process.exit(1);
});
