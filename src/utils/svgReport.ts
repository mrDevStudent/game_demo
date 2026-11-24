import { CAMPUS_ROOMS } from '../data/questionnaires';
import { QuestArchiveRecord } from '../types';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export function buildQuestReportSvg(record: QuestArchiveRecord): string {
  const width = 1120;
  const height = 1360;

  const participantLabel = record.demographics.name.trim() || 'Anonymous';
  const createdDate = new Date(record.createdAtMs).toLocaleString();
  const statusColor = record.archiveStatus === 'archived' ? '#d97706' : '#059669';
  const statusBg = record.archiveStatus === 'archived' ? '#fef3c7' : '#d1fae5';
  const statusText = record.archiveStatus === 'archived' ? 'ARCHIVED' : 'ACTIVE';

  // Map campus coordinates [-26..26] into SVG box (x: 56..436, y: 312..692) => size 380x380
  const mapX = 56;
  const mapY = 312;
  const mapSize = 380;
  const toSvgX = (wx: number) => mapX + ((wx + 26) / 52) * mapSize;
  const toSvgY = (wz: number) => mapY + ((wz + 26) / 52) * mapSize;

  const roomMeta = CAMPUS_ROOMS.map((room) => {
    const orderNum = record.roomOrder.indexOf(room.id) + 1;
    const roomAnswers = record.answers.filter((a) => a.roomId === room.id);
    const avgRespMs =
      roomAnswers.length > 0
        ? Math.round(roomAnswers.reduce((s, a) => s + a.responseTimeMs, 0) / roomAnswers.length)
        : 0;
    const fillHex = `#${room.wallColor.toString(16).padStart(6, '0')}`;
    return {
      ...room,
      orderNum,
      avgRespMs,
      fillHex,
    };
  });

  const pathPoints = record.samples
    .map((pt) => `${toSvgX(pt.x).toFixed(1)},${toSvgY(pt.z).toFixed(1)}`)
    .join(' ');
  const startPt = record.samples[0];
  const endPt = record.samples[record.samples.length - 1];

  const buildingRects = roomMeta
    .map((r) => {
      const bx = toSvgX(r.x - 5.2);
      const by = toSvgY(r.z - 4.2);
      const bw = (10.4 / 52) * mapSize;
      const bh = (8.4 / 52) * mapSize;
      const cx = toSvgX(r.x);
      const cy = toSvgY(r.z);
      const orderBadge =
        r.orderNum > 0
          ? `<circle cx="${bx + bw - 10}" cy="${by + 10}" r="11" fill="#0f172a"/>
             <text x="${bx + bw - 10}" y="${by + 14}" text-anchor="middle" font-size="11" font-weight="700" fill="#ffffff">${r.orderNum}</text>`
          : '';
      return `
        <rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="6" fill="${r.fillHex}" stroke="#334155" stroke-width="1.5"/>
        <text x="${cx.toFixed(1)}" y="${(cy + 4).toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#0f172a">${escapeXml(r.name)}</text>
        ${orderBadge}
      `;
    })
    .join('\n');

  const answerRows = record.answers
    .slice(0, 20)
    .map((ans, idx) => {
      const y = 786 + idx * 25.5;
      const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
      return `
        <rect x="44" y="${y - 17}" width="1032" height="25" fill="${bg}"/>
        <text x="58" y="${y}" font-size="11" font-weight="600" fill="#64748b">${idx + 1}</text>
        <text x="96" y="${y}" font-size="11" font-weight="600" fill="#0f172a">${escapeXml(truncateText(ans.roomName, 18))}</text>
        <text x="235" y="${y}" font-size="11" fill="#334155">${escapeXml(truncateText(ans.patientName, 22))}</text>
        <rect x="408" y="${y - 12}" width="24" height="17" rx="4" fill="#dbeafe"/>
        <text x="420" y="${y}" text-anchor="middle" font-size="11" font-weight="700" fill="#1d4ed8">${escapeXml(ans.selectedOption)}</text>
        <text x="448" y="${y}" font-size="11" fill="#1e293b">${escapeXml(truncateText(ans.selectedText, 68))}</text>
        <text x="1062" y="${y}" text-anchor="end" font-size="11" font-family="ui-monospace, monospace" fill="#475569">${(ans.responseTimeMs / 1000).toFixed(2)}s</text>
      `;
    })
    .join('\n');

  const notesBlock = record.adminNotes.trim()
    ? escapeXml(truncateText(record.adminNotes.trim(), 170))
    : 'No administrator notes recorded.';

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <style>
      text { font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    </style>
  </defs>

  <rect width="${width}" height="${height}" fill="#f1f5f9"/>
  <rect x="20" y="20" width="${width - 40}" height="${height - 40}" rx="18" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>

  <!-- Header -->
  <rect x="20" y="20" width="${width - 40}" height="96" rx="18" fill="#0f172a"/>
  <rect x="20" y="92" width="${width - 40}" height="24" fill="#0f172a"/>
  <text x="48" y="58" font-size="12" font-weight="600" fill="#93c5fd" letter-spacing="1.2">CAMPUS QUEST · ADMIN ARCHIVE SVG REPORT</text>
  <text x="48" y="88" font-size="24" font-weight="700" fill="#ffffff">Participant ${escapeXml(record.participant)} · ${escapeXml(participantLabel)}</text>

  <rect x="920" y="46" width="144" height="34" rx="8" fill="${statusBg}"/>
  <text x="992" y="68" text-anchor="middle" font-size="12" font-weight="700" fill="${statusColor}">${statusText}</text>

  <!-- Demographics & KPI Row -->
  <rect x="44" y="136" width="510" height="116" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="64" y="160" font-size="11" font-weight="700" fill="#64748b">PARTICIPANT METADATA</text>
  <text x="64" y="184" font-size="13" fill="#0f172a"><tspan font-weight="700">Section:</tspan> ${escapeXml(record.demographics.section)}   <tspan font-weight="700">Age:</tspan> ${record.demographics.age}</text>
  <text x="64" y="206" font-size="13" fill="#0f172a"><tspan font-weight="700">Gender / Avatar:</tspan> ${escapeXml(record.demographics.gender)} (${escapeXml(record.character)})</text>
  <text x="64" y="228" font-size="11.5" fill="#475569">Submitted: ${escapeXml(createdDate)}${record.editedBy ? ` · Edited by ${escapeXml(record.editedBy)}` : ''}</text>

  <rect x="572" y="136" width="116" height="116" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="630" y="166" text-anchor="middle" font-size="11" font-weight="600" fill="#64748b">QUESTIONS</text>
  <text x="630" y="206" text-anchor="middle" font-size="24" font-weight="700" fill="#0f172a">${record.totalAnswered}/20</text>
  <text x="630" y="232" text-anchor="middle" font-size="11" fill="#059669">Completed</text>

  <rect x="702" y="136" width="116" height="116" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="760" y="166" text-anchor="middle" font-size="11" font-weight="600" fill="#64748b">DURATION</text>
  <text x="760" y="206" text-anchor="middle" font-size="24" font-weight="700" fill="#0f172a">${formatDuration(record.durationMs)}</text>
  <text x="760" y="232" text-anchor="middle" font-size="11" fill="#64748b">Total Time</text>

  <rect x="832" y="136" width="116" height="116" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="890" y="166" text-anchor="middle" font-size="11" font-weight="600" fill="#64748b">DISTANCE</text>
  <text x="890" y="206" text-anchor="middle" font-size="24" font-weight="700" fill="#0f172a">${record.distance}m</text>
  <text x="890" y="232" text-anchor="middle" font-size="11" fill="#64748b">Walked</text>

  <rect x="962" y="136" width="114" height="116" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="1019" y="166" text-anchor="middle" font-size="11" font-weight="600" fill="#64748b">MOVE TIME</text>
  <text x="1019" y="206" text-anchor="middle" font-size="24" font-weight="700" fill="#0f172a">${formatDuration(record.moveTimeMs)}</text>
  <text x="1019" y="232" text-anchor="middle" font-size="11" fill="#64748b">Active Walk</text>

  <!-- Spatial Map + Building Order -->
  <text x="44" y="286" font-size="13" font-weight="700" fill="#0f172a">SPATIAL TRAJECTORY MAP (CAMPUS QUAD)</text>
  <rect x="${mapX - 12}" y="${mapY - 12}" width="${mapSize + 24}" height="${mapSize + 24}" rx="12" fill="#e2efe0" stroke="#cbd5e1"/>
  <!-- Campus Quad Cross Paths -->
  <rect x="${toSvgX(-2.6).toFixed(1)}" y="${mapY}" width="${((5.2 / 52) * mapSize).toFixed(1)}" height="${mapSize}" fill="#d6cfc2"/>
  <rect x="${mapX}" y="${toSvgY(-2.6).toFixed(1)}" width="${mapSize}" height="${((5.2 / 52) * mapSize).toFixed(1)}" fill="#d6cfc2"/>
  <circle cx="${toSvgX(0).toFixed(1)}" cy="${toSvgY(0).toFixed(1)}" r="30" fill="#d6cfc2" stroke="#94a3b8" stroke-width="1.5"/>
  ${buildingRects}
  ${pathPoints ? `<polyline points="${pathPoints}" fill="none" stroke="#2563eb" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" opacity="0.88"/>` : ''}
  ${startPt ? `<circle cx="${toSvgX(startPt.x).toFixed(1)}" cy="${toSvgY(startPt.z).toFixed(1)}" r="5.5" fill="#10b981" stroke="#ffffff" stroke-width="1.5"/>` : ''}
  ${endPt ? `<circle cx="${toSvgX(endPt.x).toFixed(1)}" cy="${toSvgY(endPt.z).toFixed(1)}" r="5.5" fill="#e11d48" stroke="#ffffff" stroke-width="1.5"/>` : ''}

  <!-- Room Order & Notes Right Column -->
  <text x="476" y="286" font-size="13" font-weight="700" fill="#0f172a">ROOM SEQUENCE &amp; RESPONSE SUMMARY</text>
  <rect x="476" y="300" width="600" height="270" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>
  ${roomMeta
    .map((r, i) => {
      const ry = 336 + i * 58;
      return `
        <rect x="494" y="${ry - 20}" width="564" height="46" rx="8" fill="#ffffff" stroke="#e2e8f0"/>
        <circle cx="518" cy="${ry + 3}" r="13" fill="#1e293b"/>
        <text x="518" y="${ry + 7}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#ffffff">${r.orderNum || '-'}</text>
        <text x="544" y="${ry - 1}" font-size="13" font-weight="700" fill="#0f172a">${escapeXml(r.name)}</text>
        <text x="544" y="${ry + 15}" font-size="11" fill="#64748b">${escapeXml(r.subtitle)}</text>
        <text x="1042" y="${ry + 6}" text-anchor="end" font-size="12" font-weight="600" fill="#2563eb">Avg ${(r.avgRespMs / 1000).toFixed(2)}s / question</text>
      `;
    })
    .join('\n')}

  <text x="476" y="600" font-size="12" font-weight="700" fill="#0f172a">ADMIN / RESEARCHER NOTES</text>
  <rect x="476" y="612" width="600" height="92" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>
  <text x="496" y="642" font-size="12" fill="#334155">${notesBlock}</text>

  <!-- 20 Questionnaire Responses Table -->
  <text x="44" y="742" font-size="13" font-weight="700" fill="#0f172a">RECORDED QUESTIONNAIRE RESPONSES (20 ITEMS)</text>
  <rect x="44" y="752" width="1032" height="24" rx="6" fill="#1e293b"/>
  <text x="58" y="768" font-size="10.5" font-weight="700" fill="#f8fafc">#</text>
  <text x="96" y="768" font-size="10.5" font-weight="700" fill="#f8fafc">ROOM</text>
  <text x="235" y="768" font-size="10.5" font-weight="700" fill="#f8fafc">CLIENT NPC</text>
  <text x="408" y="768" font-size="10.5" font-weight="700" fill="#f8fafc">OPT</text>
  <text x="448" y="768" font-size="10.5" font-weight="700" fill="#f8fafc">SELECTED RESPONSE</text>
  <text x="1062" y="768" text-anchor="end" font-size="10.5" font-weight="700" fill="#f8fafc">RT</text>

  ${answerRows}

  <text x="44" y="1324" font-size="10.5" fill="#64748b">Generated by Campus Quest Admin Archive · Record ID: ${escapeXml(record.id)} · Policy: No Delete</text>
</svg>`;
}

export function buildArchiveCohortSvg(records: QuestArchiveRecord[]): string {
  const rows = records.slice(0, 28);
  const width = 1040;
  const height = 190 + Math.max(1, rows.length) * 32;

  const rowSvg = rows
    .map((r, i) => {
      const y = 148 + i * 32;
      const bg = i % 2 === 0 ? '#f8fafc' : '#ffffff';
      const statusColor = r.archiveStatus === 'archived' ? '#b45309' : '#047857';
      return `
        <rect x="32" y="${y - 20}" width="976" height="30" fill="${bg}"/>
        <text x="48" y="${y}" font-size="12" font-weight="700" fill="#1d4ed8">${escapeXml(r.participant)}</text>
        <text x="150" y="${y}" font-size="12" fill="#0f172a">${escapeXml(truncateText(r.demographics.name || 'Anonymous', 20))}</text>
        <text x="340" y="${y}" font-size="12" fill="#334155">${escapeXml(truncateText(r.demographics.section, 16))}</text>
        <text x="490" y="${y}" font-size="12" fill="#334155">${r.demographics.age} / ${escapeXml(r.demographics.gender)}</text>
        <text x="615" y="${y}" font-size="12" font-weight="600" fill="#0f172a">${formatDuration(r.durationMs)}</text>
        <text x="705" y="${y}" font-size="12" fill="#334155">${r.distance}m</text>
        <text x="790" y="${y}" font-size="11.5" font-weight="700" fill="${statusColor}">${r.archiveStatus.toUpperCase()}</text>
        <text x="992" y="${y}" text-anchor="end" font-size="11" fill="#64748b">${new Date(r.createdAtMs).toLocaleDateString()}</text>
      `;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="#f1f5f9"/>
  <rect x="16" y="16" width="${width - 32}" height="${height - 32}" rx="16" fill="#ffffff" stroke="#cbd5e1"/>
  <rect x="16" y="16" width="${width - 32}" height="74" rx="16" fill="#0f172a"/>
  <rect x="16" y="70" width="${width - 32}" height="20" fill="#0f172a"/>
  <text x="40" y="48" font-size="11" font-weight="700" fill="#93c5fd">CAMPUS QUEST · COHORT ARCHIVE EXPORT</text>
  <text x="40" y="74" font-size="20" font-weight="700" fill="#ffffff">Archived Study Sessions (${records.length} total, showing ${rows.length})</text>

  <rect x="32" y="104" width="976" height="26" rx="6" fill="#1e293b"/>
  <text x="48" y="121" font-size="10.5" font-weight="700" fill="#f8fafc">CODE</text>
  <text x="150" y="121" font-size="10.5" font-weight="700" fill="#f8fafc">PARTICIPANT</text>
  <text x="340" y="121" font-size="10.5" font-weight="700" fill="#f8fafc">SECTION</text>
  <text x="490" y="121" font-size="10.5" font-weight="700" fill="#f8fafc">AGE / GENDER</text>
  <text x="615" y="121" font-size="10.5" font-weight="700" fill="#f8fafc">TIME</text>
  <text x="705" y="121" font-size="10.5" font-weight="700" fill="#f8fafc">DIST</text>
  <text x="790" y="121" font-size="10.5" font-weight="700" fill="#f8fafc">STATUS</text>
  <text x="992" y="121" text-anchor="end" font-size="10.5" font-weight="700" fill="#f8fafc">DATE</text>

  ${rowSvg}
</svg>`;
}

export function downloadSvgFile(svgContent: string, filename: string): void {
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}
