import type { ScoredPlan, JudgeVerdict, ParticipantProfile, DateInfo } from '../types';
import { getCurrencySymbol } from './currency';
import { getComponentLinks, extractDestination } from './links';

export function generatePlanHtml(plan: ScoredPlan, judgeVerdict?: JudgeVerdict | null, participants?: ParticipantProfile, dateInfo?: DateInfo): string {
  const currency = getCurrencySymbol(plan.display_currency?.code || 'USD');
  const destination = extractDestination(plan.components);

  // Group components by day
  const grouped: Record<string, typeof plan.components> = {};
  plan.components.filter(c => c.type !== 'logistics').forEach(comp => {
    const day = String(comp.itinerary_day || 1);
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(comp);
  });
  const sortedDays = Object.entries(grouped).sort(([a], [b]) => Number(a) - Number(b));

  const daysHtml = sortedDays.map(([dayNum, components]) => {
    const items = components.map(comp => {
      const links = getComponentLinks(comp, destination, participants, dateInfo);
      const linksHtml = links.map(l =>
        `<a href="${l.url}" target="_blank" rel="noopener" style="color:#4f46e5;text-decoration:none;font-size:12px;background:#eef2ff;padding:2px 8px;border-radius:4px;margin-right:4px;">${l.label}</a>`
      ).join('');

      return `
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <strong style="color:#1e293b;">${comp.title}</strong>
            <span style="font-family:monospace;color:#64748b;background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:13px;">
              ${currency}${comp.cost_estimate.toLocaleString()}
            </span>
          </div>
          <p style="color:#475569;font-size:14px;margin:8px 0;">${comp.details}</p>
          <div style="margin-top:8px;">
            <span style="font-size:10px;text-transform:uppercase;font-weight:700;color:#818cf8;letter-spacing:1px;margin-right:8px;">${comp.type}</span>
            ${linksHtml}
          </div>
        </div>`;
    }).join('');

    return `
      <div style="margin-bottom:24px;">
        <h3 style="color:#312e81;font-size:18px;border-bottom:2px solid #e0e7ff;padding-bottom:6px;margin-bottom:12px;">Day ${dayNum}</h3>
        ${items}
      </div>`;
  }).join('');

  const verdictHtml = judgeVerdict ? `
    <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;padding:16px;margin-top:24px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
        <strong style="color:#065f46;">Feasibility Verdict</strong>
        <span style="font-family:monospace;font-weight:700;color:#047857;background:#d1fae5;padding:2px 10px;border-radius:6px;">${judgeVerdict.score}/100</span>
      </div>
      <p style="color:#065f46;font-size:14px;margin:0;">${judgeVerdict.reasoning}</p>
      ${judgeVerdict.feedback.length > 0 ? `
        <div style="margin-top:12px;padding-top:12px;border-top:1px solid #a7f3d0;">
          <strong style="font-size:11px;text-transform:uppercase;color:#047857;letter-spacing:1px;">Considerations</strong>
          <ul style="margin:8px 0 0;padding-left:20px;color:#065f46;font-size:14px;">
            ${judgeVerdict.feedback.map(f => `<li style="margin-bottom:4px;">${f}</li>`).join('')}
          </ul>
        </div>` : ''}
    </div>` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${plan.title} - Event Pragmetizer</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:700px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-top:24px;margin-bottom:24px;">

    <div style="background:#0f172a;color:#fff;padding:40px;text-align:center;">
      <div style="display:inline-block;background:rgba(16,185,129,0.15);color:#6ee7b7;padding:4px 16px;border-radius:20px;font-size:13px;font-weight:700;border:1px solid rgba(16,185,129,0.3);margin-bottom:16px;">
        Approved &amp; Finalized
      </div>
      <h1 style="margin:0 0 8px;font-size:32px;">${plan.title}</h1>
      <p style="color:#94a3b8;font-size:16px;margin:0;">Total Budget: ${currency}${plan.total_estimated_budget.toLocaleString()}</p>
    </div>

    <div style="padding:32px;">
      <h2 style="color:#1e293b;font-size:16px;margin-bottom:8px;">Summary</h2>
      <p style="color:#475569;font-size:14px;line-height:1.6;margin-bottom:24px;">${plan.summary}</p>

      <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />

      <h2 style="color:#1e293b;font-size:16px;margin-bottom:16px;">Detailed Schedule</h2>
      ${daysHtml}

      ${verdictHtml}

      <div style="text-align:center;margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;">
        <p style="color:#94a3b8;font-size:12px;margin:0;">Generated by Event Pragmetizer</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function downloadPlanHtml(plan: ScoredPlan, judgeVerdict?: JudgeVerdict | null, participants?: ParticipantProfile, dateInfo?: DateInfo): void {
  const html = generatePlanHtml(plan, judgeVerdict, participants, dateInfo);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${plan.title.replace(/[^a-zA-Z0-9]/g, '_')}_plan.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
