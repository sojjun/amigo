/* ============================================================
   MERIDIAN — AI Billing Resolution
   Mock data + interaction logic (no backend)
   ============================================================ */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     MOCK DATA — dispute queue for the provider dashboard
     --------------------------------------------------------- */
  const DISPUTES = [
    {
      id: "CASE-4471",
      patient: "Maria Ibarra",
      issue: "Duplicate co-pay charge",
      amount: 90.0,
      status: "Resolved",
      lastActivity: "2m ago",
      trace: [
        { time: "10:02 AM", text: "Pulled invoice INV-77120 and matching claim from payer feed." },
        { time: "10:02 AM", text: "Detected two identical $45 co-pay line items for the same visit." },
        { time: "10:03 AM", text: "Confirmed duplicate against CPT 99213 — single billable encounter." },
        { time: "10:03 AM", text: "Reversed duplicate charge and issued corrected balance." },
      ],
      resolution: "Removed a duplicate $45 co-pay line. Balance corrected from $135.00 to $90.00. No refund owed — patient had not yet paid.",
      transcript: [
        { from: "user", text: "I was charged twice for my co-pay on the same visit." },
        { from: "agent", text: "Let me look into that for you — one moment." },
        { from: "agent", text: "You're right — I found a duplicate $45 co-pay on invoice INV-77120. I've removed the extra charge, so your balance is now $90.00 instead of $135.00." },
        { from: "user", text: "Great, thank you!" },
      ],
    },
    {
      id: "CASE-4472",
      patient: "Devon Michaels",
      issue: "Charge doesn't match quoted estimate",
      amount: 214.5,
      status: "Escalated",
      lastActivity: "8m ago",
      trace: [
        { time: "9:41 AM", text: "Pulled pre-visit estimate #EST-2291 and final invoice INV-77121." },
        { time: "9:42 AM", text: "Compared line items — final invoice includes an added lab panel not on the estimate." },
        { time: "9:42 AM", text: "Checked provider notes — lab was ordered during the visit based on symptoms." },
        { time: "9:43 AM", text: "Adjustment exceeds $150 auto-approval limit — routed to billing specialist.", pending: true },
      ],
      resolution: "Patient disputes a $214.50 lab charge added after their visit. The charge appears clinically justified, but the variance exceeds the AI's auto-approval threshold and needs a human decision on whether to adjust or explain.",
      transcript: [
        { from: "user", text: "This is $200 more than what I was quoted before my visit." },
        { from: "agent", text: "Checking your estimate against the final invoice now." },
        { from: "agent", text: "I see the difference — your provider ordered an additional lab panel during your visit that wasn't in the original estimate. Because this adjustment is larger than I'm able to resolve on my own, I've escalated it to a billing specialist who will follow up within one business day." },
      ],
    },
    {
      id: "CASE-4473",
      patient: "Priya Shah",
      issue: "Payment already made, not reflected",
      amount: 0.0,
      status: "Resolved",
      lastActivity: "14m ago",
      trace: [
        { time: "9:20 AM", text: "Searched payment ledger for account #88213 within the last 30 days." },
        { time: "9:20 AM", text: "Found a $180 payment made June 30 via card ending 4482." },
        { time: "9:21 AM", text: "Matched payment to invoice INV-77098 by amount and date proximity." },
        { time: "9:21 AM", text: "Applied payment and marked invoice as paid in full." },
      ],
      resolution: "Found a $180 payment made June 30 that hadn't posted to the invoice yet. Applied the payment — balance is now $0.00.",
      transcript: [
        { from: "user", text: "I already paid this bill last week, why am I still getting charged?" },
        { from: "agent", text: "Let me check your payment history." },
        { from: "agent", text: "Found it — a $180 payment from June 30 hadn't posted yet. I've applied it to your account. Your balance is now $0.00, sorry for the confusion." },
      ],
    },
    {
      id: "CASE-4474",
      patient: "Tom Okafor",
      issue: "Requesting payment plan",
      amount: 640.0,
      status: "AI Resolving",
      lastActivity: "Just now",
      trace: [
        { time: "11:05 AM", text: "Reviewed account balance and prior payment reliability." },
        { time: "11:05 AM", text: "Patient qualifies for self-serve installment plans up to 6 months." },
        { time: "11:06 AM", text: "Preparing plan options for patient to choose from.", pending: true },
      ],
      resolution: null,
      transcript: [
        { from: "user", text: "This is a lot to pay at once, can I split it up?" },
        { from: "agent", text: "Of course — checking what plans you qualify for." },
        { from: "agent", text: "You're eligible for a 3, 4, or 6-month plan with no added interest. Want me to set up the 4-month option at $160/mo?" },
      ],
    },
    {
      id: "CASE-4475",
      patient: "Grace Lindqvist",
      issue: "Insurance should have covered this",
      amount: 312.0,
      status: "Escalated",
      lastActivity: "22m ago",
      trace: [
        { time: "8:58 AM", text: "Pulled EOB from Anthem PPO for date of service June 24." },
        { time: "8:59 AM", text: "EOB shows service applied to annual deductible, not denied." },
        { time: "8:59 AM", text: "Patient believes deductible was already met this year." },
        { time: "9:00 AM", text: "Deductible discrepancy requires payer callback — routed to billing specialist.", pending: true },
      ],
      resolution: "Patient believes their deductible was already met, but the payer's EOB shows otherwise. This needs a call to the insurer to confirm the deductible balance before any adjustment can be made.",
      transcript: [
        { from: "user", text: "My insurance should've covered this — I already hit my deductible." },
        { from: "agent", text: "Checking your explanation of benefits from Anthem." },
        { from: "agent", text: "Their record shows this applied toward your deductible, which doesn't look met yet on their end. Since this doesn't match what you expected, I've escalated it so a specialist can call the payer directly." },
      ],
    },
    {
      id: "CASE-4476",
      patient: "Ben Castellano",
      issue: "Explanation of charge requested",
      amount: 128.0,
      status: "Resolved",
      lastActivity: "31m ago",
      trace: [
        { time: "8:40 AM", text: "Pulled itemized invoice INV-77085." },
        { time: "8:40 AM", text: "Matched CPT codes to plain-language descriptions." },
        { time: "8:41 AM", text: "Composed itemized explanation for patient." },
      ],
      resolution: "Explained the two line items — an office visit and a strep test — with plain-language descriptions. No adjustment needed; patient confirmed the charge was expected.",
      transcript: [
        { from: "user", text: "Can you break down what this $128 is actually for?" },
        { from: "agent", text: "Sure — this invoice has two parts: a $98 office visit for your sore throat, and a $30 rapid strep test done during that visit. Both were billed under your standard PPO co-insurance." },
        { from: "user", text: "Ah okay, that makes sense. Thanks." },
      ],
    },
    {
      id: "CASE-4477",
      patient: "Sana Kader",
      issue: "Disputes late fee",
      amount: 25.0,
      status: "Resolved",
      lastActivity: "44m ago",
      trace: [
        { time: "8:12 AM", text: "Reviewed account payment history for the last 12 months." },
        { time: "8:12 AM", text: "Patient has zero late payments prior to this instance." },
        { time: "8:13 AM", text: "Applied first-time courtesy waiver per billing policy §4.2." },
      ],
      resolution: "Waived the $25 late fee as a first-time courtesy — patient has a clean 12-month payment history.",
      transcript: [
        { from: "user", text: "Can you waive this late fee? I've never missed a payment before." },
        { from: "agent", text: "Checking your payment history now." },
        { from: "agent", text: "You're right, your record is clean — I've waived the $25 late fee as a first-time courtesy." },
      ],
    },
    {
      id: "CASE-4478",
      patient: "Owen Petrakis",
      issue: "Unrecognized provider charge",
      amount: 460.0,
      status: "AI Resolving",
      lastActivity: "3m ago",
      trace: [
        { time: "11:12 AM", text: "Searched visit history for a matching appointment on file." },
        { time: "11:12 AM", text: "No visit found under this patient's primary account.", pending: true },
        { time: "11:13 AM", text: "Checking dependent and family-linked accounts for a match.", pending: true },
      ],
      resolution: null,
      transcript: [
        { from: "user", text: "I don't recognize this charge at all — I don't think I've been to this provider." },
        { from: "agent", text: "That's worth looking into. Give me a moment to check your visit history and any linked family accounts." },
      ],
    },
  ];

  const REASONS = [
    { name: "Amount exceeds auto-approval limit", pct: 38 },
    { name: "Requires payer callback", pct: 27 },
    { name: "Conflicting account records", pct: 19 },
    { name: "Patient requested human review", pct: 16 },
  ];

  const CHART_DAYS = [
    { label: "Mon", ai: 34, human: 6 },
    { label: "Tue", ai: 29, human: 4 },
    { label: "Wed", ai: 41, human: 7 },
    { label: "Thu", ai: 37, human: 5 },
    { label: "Fri", ai: 45, human: 8 },
    { label: "Sat", ai: 22, human: 2 },
    { label: "Sun", ai: 18, human: 3 },
  ];

  /* ---------------------------------------------------------
     ICONS (inline, reused across components)
     --------------------------------------------------------- */
  const ICON_CHECK = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>';
  const ICON_CHEVRON = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>';
  const ICON_SPARK = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>';
  const ICON_FLAG = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h13l-3 4 3 4H5"/></svg>';
  const ICON_ARROW = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

  /* ---------------------------------------------------------
     VIEW SWITCHING
     --------------------------------------------------------- */
  const switchBtns = document.querySelectorAll(".view-switch-btn");
  switchBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      switchBtns.forEach((b) => { b.classList.remove("is-active"); b.setAttribute("aria-selected", "false"); });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");
      const target = btn.dataset.view;
      document.querySelectorAll(".view").forEach((v) => v.classList.remove("is-active"));
      document.getElementById("view-" + target).classList.add("is-active");
    });
  });

  /* ===========================================================
     PATIENT CHAT
     =========================================================== */
  const chatLog = document.getElementById("chatLog");
  const composerForm = document.getElementById("composerForm");
  const composerInput = document.getElementById("composerInput");
  const quickChips = document.getElementById("quickChips");
  const voiceBtn = document.getElementById("voiceBtn");
  const agentStatus = document.getElementById("agentStatus");

  function scrollChatToBottom() {
    chatLog.scrollTop = chatLog.scrollHeight;
  }

  function addUserMessage(text) {
    const el = document.createElement("div");
    el.className = "msg msg--user";
    el.innerHTML = `<div class="msg-bubble"></div>`;
    el.querySelector(".msg-bubble").textContent = text;
    chatLog.appendChild(el);
    scrollChatToBottom();
  }

  function addAgentMessage(text) {
    return new Promise((resolve) => {
      const typing = document.createElement("div");
      typing.className = "msg msg--agent";
      typing.innerHTML = `<div class="msg-typing"><span></span><span></span><span></span></div>`;
      chatLog.appendChild(typing);
      scrollChatToBottom();
      agentStatus.textContent = "Typing…";

      setTimeout(() => {
        typing.remove();
        const el = document.createElement("div");
        el.className = "msg msg--agent";
        el.innerHTML = `<div class="msg-bubble"></div>`;
        el.querySelector(".msg-bubble").textContent = text;
        chatLog.appendChild(el);
        scrollChatToBottom();
        agentStatus.textContent = "Online · usually replies instantly";
        resolve();
      }, 850 + Math.random() * 500);
    });
  }

  function addTrace(steps) {
    const wrap = document.createElement("div");
    wrap.className = "msg-trace";
    wrap.innerHTML = `
      <button type="button" class="msg-trace-toggle">
        ${ICON_CHEVRON}
        <span>${ICON_SPARK.replace('width="14" height="14"', 'width="12" height="12"')} How I checked this</span>
      </button>
      <div class="msg-trace-steps">
        ${steps.map((s) => `<div class="msg-trace-step">${ICON_CHECK}<span>${s}</span></div>`).join("")}
      </div>
    `;
    wrap.querySelector(".msg-trace-toggle").addEventListener("click", () => {
      wrap.classList.toggle("is-open");
    });
    chatLog.appendChild(wrap);
    scrollChatToBottom();
  }

  function addResolutionCard(title, body, figure) {
    const el = document.createElement("div");
    el.className = "msg-resolution";
    el.innerHTML = `
      <div class="msg-resolution-head">${ICON_CHECK.replace('width="13" height="13"', 'width="16" height="16"')}<span class="msg-resolution-title">${title}</span></div>
      <div class="msg-resolution-body">${body}</div>
      ${figure ? `<div class="msg-resolution-figure">${figure}</div>` : ""}
    `;
    chatLog.appendChild(el);
    scrollChatToBottom();
  }

  function addEscalationCard(caseId) {
    const el = document.createElement("div");
    el.className = "msg-escalation";
    el.innerHTML = `
      <div class="msg-escalation-head">${ICON_FLAG}<span class="msg-escalation-title">Escalated to a billing specialist</span></div>
      <div class="msg-escalation-body">This needs a closer look than I can give automatically. A specialist will review your account and follow up within one business day.</div>
      <span class="msg-escalation-id">${caseId}</span>
    `;
    chatLog.appendChild(el);
    scrollChatToBottom();
  }

  function setChipsDisabled(disabled) {
    quickChips.querySelectorAll(".chip").forEach((c) => (c.disabled = disabled));
  }

  const SCRIPTS = {
    "This charge doesn't look right": async () => {
      addTrace([
        "Pulling invoice INV-88213 and your active plan details.",
        "Cross-referencing the visit against your insurance EOB.",
        "Checking CPT 99396 against your co-pay schedule.",
        "Found it — a $45 co-pay was applied twice by mistake.",
      ]);
      await new Promise((r) => setTimeout(r, 1500));
      await addAgentMessage("Good news — I found the issue. A $45 co-pay was applied twice for this visit.");
      addResolutionCard("Resolved automatically", "Removed the duplicate co-pay charge. Your corrected balance is shown below.", "$367.00");
    },
    "I already paid this": async () => {
      addTrace([
        "Searching your payment history for the last 30 days.",
        "Found a $412.00 payment made July 2 via card ending 7743.",
        "Matching payment to invoice INV-88213 by amount and date.",
        "Applying payment to your balance.",
      ]);
      await new Promise((r) => setTimeout(r, 1500));
      await addAgentMessage("You're right — I found your payment, it just hadn't posted yet.");
      addResolutionCard("Resolved automatically", "Applied your July 2 payment to this invoice. Nothing further is owed.", "$0.00");
    },
    "Can you explain this charge?": async () => {
      addTrace([
        "Pulling the itemized breakdown for invoice INV-88213.",
        "Matching each CPT code to a plain-language description.",
      ]);
      await new Promise((r) => setTimeout(r, 1300));
      await addAgentMessage("This invoice covers your annual wellness exam ($260) and a basic metabolic panel ordered during the visit ($152), billed under your PPO co-insurance after the portion your plan covered.");
      await addAgentMessage("Let me know if you'd like me to double-check anything against your plan.");
    },
    "I need a payment plan": async () => {
      addTrace([
        "Reviewing your account standing and payment history.",
        "You qualify for a self-serve installment plan, no interest.",
      ]);
      await new Promise((r) => setTimeout(r, 1300));
      await addAgentMessage("You're eligible for a 3, 4, or 6-month plan with no added interest.");
      addResolutionCard("Payment plan ready", "Suggested plan: 4 months at $103.00/mo, first charge today. Reply to confirm or ask for a different schedule.", "$103.00 / mo");
    },
  };

  async function handleUserInput(text) {
    if (!text.trim()) return;
    addUserMessage(text);
    composerInput.value = "";
    setChipsDisabled(true);

    const script = SCRIPTS[text];
    if (script) {
      await script();
    } else {
      addTrace([
        "Reading your message for the invoice, amount, and intent.",
        "Searching account, claims, and payment history for a match.",
      ]);
      await new Promise((r) => setTimeout(r, 1400));
      await addAgentMessage("Thanks for the detail. This looks like it needs a closer look than I can resolve automatically.");
      addEscalationCard("CASE-" + Math.floor(4500 + Math.random() * 400));
    }
    setChipsDisabled(false);
  }

  composerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleUserInput(composerInput.value);
  });

  quickChips.addEventListener("click", (e) => {
    const btn = e.target.closest(".chip");
    if (!btn || btn.disabled) return;
    handleUserInput(btn.dataset.prompt);
  });

  // Mock voice input: visually toggles listening state, then fills a sample query.
  let listening = false;
  voiceBtn.addEventListener("click", () => {
    if (listening) return;
    listening = true;
    voiceBtn.classList.add("is-listening");
    agentStatus.textContent = "Listening…";
    composerInput.placeholder = "Listening…";
    setTimeout(() => {
      listening = false;
      voiceBtn.classList.remove("is-listening");
      agentStatus.textContent = "Online · usually replies instantly";
      composerInput.placeholder = "Describe the issue, or type a question…";
      handleUserInput("This charge doesn't look right");
    }, 1800);
  });

  // Initial greeting on load
  window.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
      addAgentMessage("Hi Maria, I'm here to help with your $412.00 statement from Riverside Family Medicine. What's going on?");
    }, 400);
  });

  /* ===========================================================
     PROVIDER DASHBOARD
     =========================================================== */
  const queueTableBody = document.getElementById("queueTableBody");
  const queueCount = document.getElementById("queueCount");
  const queueFilters = document.getElementById("queueFilters");
  let activeFilter = "all";

  function statusTagHTML(status) {
    const map = {
      "AI Resolving": "status-tag--resolving",
      "Escalated": "status-tag--escalated",
      "Resolved": "status-tag--resolved",
    };
    return `<span class="status-tag ${map[status]}">${status}</span>`;
  }

  function renderQueue() {
    const rows = DISPUTES.filter((d) => activeFilter === "all" || d.status === activeFilter);
    queueTableBody.innerHTML = "";
    if (!rows.length) {
      queueTableBody.innerHTML = `<tr class="empty-row"><td colspan="6">No disputes match this filter.</td></tr>`;
      return;
    }
    rows.forEach((d, i) => {
      const tr = document.createElement("tr");
      tr.style.animationDelay = (i * 0.03) + "s";
      tr.innerHTML = `
        <td class="q-patient">${d.patient}</td>
        <td class="q-issue">${d.issue}</td>
        <td class="q-amount">${d.amount > 0 ? "$" + d.amount.toFixed(2) : "—"}</td>
        <td>${statusTagHTML(d.status)}</td>
        <td class="q-time">${d.lastActivity}</td>
        <td class="q-arrow">${ICON_ARROW}</td>
      `;
      tr.addEventListener("click", () => openDrawer(d));
      queueTableBody.appendChild(tr);
    });
  }

  queueFilters.addEventListener("click", (e) => {
    const btn = e.target.closest(".filter-pill");
    if (!btn) return;
    queueFilters.querySelectorAll(".filter-pill").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    activeFilter = btn.dataset.filter;
    renderQueue();
  });

  queueCount.textContent = DISPUTES.filter((d) => d.status !== "Resolved").length;

  /* --- Stat count-up --- */
  function animateCount(el, target, duration = 900) {
    const start = performance.now();
    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }
    requestAnimationFrame(tick);
  }

  document.querySelectorAll(".stat-value[data-count]").forEach((el) => {
    animateCount(el, parseInt(el.dataset.count, 10));
  });
  document.querySelectorAll(".stat-value[data-static]").forEach((el) => {
    el.textContent = el.dataset.static;
  });

  /* --- Bar chart --- */
  const barChart = document.getElementById("barChart");
  const maxTotal = Math.max(...CHART_DAYS.map((d) => d.ai + d.human));
  barChart.innerHTML = CHART_DAYS.map((d) => {
    const aiH = Math.round((d.ai / maxTotal) * 130);
    const humanH = Math.round((d.human / maxTotal) * 130);
    return `
      <div class="bar-col">
        <div class="bar-stack" style="height:${aiH + humanH}px">
          <div class="bar-seg-human" style="height:${humanH}px"></div>
          <div class="bar-seg-ai" style="height:${aiH}px"></div>
        </div>
        <span class="bar-day-label">${d.label}</span>
      </div>
    `;
  }).join("");

  /* --- Reason list --- */
  const reasonList = document.getElementById("reasonList");
  reasonList.innerHTML = REASONS.map((r) => `
    <li class="reason-row">
      <span class="reason-name">${r.name}</span>
      <span class="reason-bar-track"><span class="reason-bar-fill" style="width:${r.pct}%"></span></span>
      <span class="reason-pct">${r.pct}%</span>
    </li>
  `).join("");

  /* --- Case drawer --- */
  const drawer = document.getElementById("caseDrawer");
  const drawerOverlay = document.getElementById("drawerOverlay");
  const drawerClose = document.getElementById("drawerClose");
  const drawerId = document.getElementById("drawerId");
  const drawerName = document.getElementById("drawerName");
  const traceList = document.getElementById("traceList");
  const drawerResolution = document.getElementById("drawerResolution");
  const drawerTranscript = document.getElementById("drawerTranscript");
  const drawerActions = document.getElementById("drawerActions");
  const drawerTabs = document.querySelectorAll(".drawer-tab");

  function openDrawer(d) {
    drawerId.textContent = d.id + " · " + d.issue;
    drawerName.textContent = d.patient;

    traceList.innerHTML = d.trace.map((t) => `
      <li class="trace-item ${t.pending ? "is-pending" : ""}">
        <div class="trace-time">${t.time}</div>
        <div class="trace-text">${t.text}</div>
      </li>
    `).join("");

    drawerResolution.innerHTML = d.resolution
      ? `<strong>${d.status === "Escalated" ? "Needs your review" : "Outcome"}:</strong> ${d.resolution}`
      : `<strong>In progress:</strong> The AI agent is still working this case with the patient.`;

    drawerTranscript.innerHTML = d.transcript.map((m) => `
      <div class="msg msg--${m.from}">
        <div class="msg-bubble">${m.text}</div>
      </div>
    `).join("");

    if (d.status === "Escalated") {
      drawerActions.innerHTML = `
        <button class="btn btn-secondary" id="btnOverride">Contact patient</button>
        <button class="btn btn-primary" id="btnApprove">Approve adjustment</button>
      `;
    } else if (d.status === "AI Resolving") {
      drawerActions.innerHTML = `
        <button class="btn btn-secondary" id="btnOverride">Take over case</button>
        <button class="btn btn-primary" id="btnApprove">Let AI continue</button>
      `;
    } else {
      drawerActions.innerHTML = `
        <button class="btn btn-secondary" id="btnOverride">Reopen case</button>
        <button class="btn btn-primary" id="btnApprove">Mark reviewed</button>
      `;
    }

    drawer.classList.add("is-open");
    drawer.setAttribute("aria-hidden", "false");
    drawerOverlay.classList.add("is-open");
    drawerTabs.forEach((t) => t.classList.remove("is-active"));
    drawerTabs[0].classList.add("is-active");
    document.querySelectorAll(".drawer-panel").forEach((p) => p.classList.remove("is-active"));
    document.getElementById("panel-trace").classList.add("is-active");
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    drawer.setAttribute("aria-hidden", "true");
    drawerOverlay.classList.remove("is-open");
  }

  drawerClose.addEventListener("click", closeDrawer);
  drawerOverlay.addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDrawer();
  });

  drawerTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      drawerTabs.forEach((t) => t.classList.remove("is-active"));
      tab.classList.add("is-active");
      document.querySelectorAll(".drawer-panel").forEach((p) => p.classList.remove("is-active"));
      document.getElementById("panel-" + tab.dataset.tab).classList.add("is-active");
    });
  });

  drawerActions.addEventListener("click", (e) => {
    if (e.target.id === "btnApprove" || e.target.id === "btnOverride") {
      closeDrawer();
    }
  });

  /* --- Sidebar nav (visual only for this prototype) --- */
  document.querySelectorAll(".dash-nav-item").forEach((item) => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".dash-nav-item").forEach((i) => i.classList.remove("is-active"));
      item.classList.add("is-active");
      if (item.dataset.panel === "resolved") {
        activeFilter = "Resolved";
        queueFilters.querySelectorAll(".filter-pill").forEach((b) => b.classList.remove("is-active"));
        queueFilters.querySelector('[data-filter="Resolved"]').classList.add("is-active");
        renderQueue();
      } else if (item.dataset.panel === "queue") {
        activeFilter = "all";
        queueFilters.querySelectorAll(".filter-pill").forEach((b) => b.classList.remove("is-active"));
        queueFilters.querySelector('[data-filter="all"]').classList.add("is-active");
        renderQueue();
      }
    });
  });

  renderQueue();
})();
