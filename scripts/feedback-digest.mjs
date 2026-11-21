import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const batchSize = 100;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const wikiURL = /^https:\/\/[a-z0-9-]+\.feishu\.cn\/wiki\/[a-z0-9]+$/i;
const reportDate = /^\d{4}-\d{2}-\d{2}$/;
const typeNames = { problem: '遇到问题', improvement: '使用体验改进', feature_request: '想要新功能' };
const areaNames = {
  appearance: '外观与像素编辑', motion_typing: '动作与打字', desktop_interaction: '桌面交互',
  productivity: '提醒与效率工具', install_updates: '安装与更新', other: '其他／不确定',
};
const [action, target, key] = process.argv.slice(2);

function lark(args, input) {
  const result = execFileSync(process.env.PET_FEEDBACK_LARK_CLI ?? join(homedir(), '.local/bin/lark-cli'), args, {
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
    timeout: 45_000,
    input,
    stdio: [input === undefined ? 'ignore' : 'pipe', 'pipe', 'pipe'],
    env: { ...process.env, LARKSUITE_CLI_NO_UPDATE_NOTIFIER: '1', LARKSUITE_CLI_NO_SKILLS_NOTIFIER: '1' },
  });
  const response = JSON.parse(result);
  if (response.ok !== true) throw new Error('飞书返回失败。');
  return response.data;
}

function sql(query) {
  if (!/^app_[a-z0-9]+$/i.test(target ?? '')) throw new Error('需要有效的妙搭应用 ID。');
  return lark(['apps', '+db-execute', '--app-id', target, '--as', 'user',
    '--environment', 'online', '--sql', query, '--yes']);
}

function read() {
  const rows = sql(`
    SELECT id, message, app_version, feedback_type, feature_area, issue_id, daily_date::text, daily_url,
      _created_at, count(*) OVER () AS pending_count
    FROM pet_feedback
    WHERE reported_at IS NULL AND _created_at < CURRENT_TIMESTAMP - INTERVAL '10 seconds'
    ORDER BY _created_at, id LIMIT ${batchSize}
  `);
  const pending = Number(rows[0]?.pending_count ?? 0);
  const items = rows.map((row) => ({
    id: row.id, message: row.message, appVersion: row.app_version, createdAt: row._created_at,
    feedbackType: row.feedback_type, feedbackTypeName: typeNames[row.feedback_type] ?? '未分类',
    featureArea: row.feature_area, featureAreaName: areaNames[row.feature_area] ?? '未分类',
    issueId: row.issue_id, dailyDate: row.daily_date, dailyUrl: row.daily_url,
  }));
  const hash = createHash('sha256').update(items.map((item) => item.id).join(',')).digest('hex');
  return { pending, items, key: items.length ? `pet-feedback-${hash.slice(0, 28)}` : null };
}

function issues() {
  const rows = sql(`
    SELECT issue_id, issue_title, issue_is_test, daily_date::text, daily_url,
      (array_agg(feature_area ORDER BY _created_at, id) FILTER (WHERE feature_area IS NOT NULL))[1] AS feature_area,
      count(*) AS feedback_count
    FROM pet_feedback WHERE issue_id IS NOT NULL
    GROUP BY issue_id, issue_title, issue_is_test, daily_date, daily_url
    ORDER BY daily_date, daily_url
  `);
  const grouped = new Map();
  for (const row of rows) {
    const issue = grouped.get(row.issue_id) ?? {
      id: row.issue_id, title: row.issue_title, isTest: row.issue_is_test, count: 0,
      featureAreaName: areaNames[row.feature_area] ?? '未分类', dailyReports: [],
    };
    issue.count += Number(row.feedback_count);
    issue.dailyReports.push({ date: row.daily_date, url: row.daily_url });
    grouped.set(issue.id, issue);
  }
  return [...grouped.values()];
}

function assign() {
  const { date, url, groups } = JSON.parse(readFileSync(0, 'utf8'));
  if (!reportDate.test(date) || !wikiURL.test(url) || !Array.isArray(groups) || !groups.length) {
    throw new Error('需要有效的日报日期、链接和问题分组。');
  }

  const existing = new Map(issues().map((issue) => [issue.id, issue]));
  const assigned = new Map();
  const issueIds = new Set();
  const values = [];
  for (const group of groups) {
    const { issueId, itemIds, isTest = false } = group;
    if (!uuid.test(issueId) || issueIds.has(issueId) || !Array.isArray(itemIds) || !itemIds.length || typeof isTest !== 'boolean') {
      throw new Error('无效的问题分组。');
    }
    issueIds.add(issueId);
    const previous = existing.get(issueId);
    const title = previous?.title ?? group.title?.trim();
    if (typeof title !== 'string' || !title || [...title].length > 120 || /[\u0000-\u001f\\]/.test(title)
        || (previous ? previous.isTest !== isTest : !itemIds.includes(issueId))) {
      throw new Error('新问题必须使用组内某条反馈的 ID，测试与正式问题须使用各自的编号。');
    }
    for (const id of itemIds) {
      if (!uuid.test(id) || assigned.has(id) || assigned.size === batchSize) throw new Error('无效或重复的反馈 ID。');
      assigned.set(id, issueId);
      values.push(`('${id}'::uuid, '${issueId}'::uuid, '${title.replaceAll("'", "''")}', ${isTest})`);
    }
  }

  sql(`WITH entries(id, issue_id, title, is_test) AS (VALUES ${values.join(', ')}),
      confirmed AS (
        SELECT count(*) AS count FROM entries JOIN pet_feedback AS feedback ON feedback.id = entries.id
        WHERE (feedback.issue_id IS NULL AND feedback.reported_at IS NULL)
          OR (feedback.issue_id = entries.issue_id AND feedback.daily_date = '${date}' AND feedback.daily_url = '${url}')
      )
      UPDATE pet_feedback AS feedback SET issue_id = entry.issue_id, issue_title = entry.title,
        issue_is_test = entry.is_test, daily_date = '${date}', daily_url = '${url}', _updated_at = CURRENT_TIMESTAMP
      FROM entries AS entry
      WHERE feedback.id = entry.id AND feedback.issue_id IS NULL AND feedback.reported_at IS NULL
        AND (SELECT count FROM confirmed) = ${assigned.size}`);
  const ids = [...assigned.keys()].map((id) => `'${id}'`).join(', ');
  const resolved = sql(`SELECT id, issue_id, daily_date::text, daily_url FROM pet_feedback WHERE id IN (${ids})`);
  if (resolved.length !== assigned.size || resolved.some((row) =>
    assigned.get(row.id) !== row.issue_id || row.daily_date !== date || row.daily_url !== url)) {
    throw new Error('存在此前已归到其他问题或日期的反馈，需核对原归档记录。');
  }
  return { assigned: resolved.length, issueIds: [...issueIds] };
}

function escapeXML(text) {
  return String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function sync() {
  const { issueIds } = JSON.parse(readFileSync(0, 'utf8'));
  if (!wikiURL.test(key) || !Array.isArray(issueIds) || issueIds.some((id) => !uuid.test(id))) {
    throw new Error('需要有效的迭代清单链接和问题编号。');
  }
  const allIssues = new Map(issues().map((issue) => [issue.id, issue]));
  const parent = ['--as', 'user', '--doc', key];
  const fetchDoc = () => lark(['docs', '+fetch', ...parent, '--detail', 'with-ids']).document;

  for (const id of new Set(issueIds)) {
    const issue = allIssues.get(id);
    if (!issue || issue.dailyReports.some(({ url, date }) => !wikiURL.test(url) || !reportDate.test(date))) {
      throw new Error('问题记录或相关日报无效。');
    }
    const metric = `涉及功能 ${issue.featureAreaName} · 累计 ${issue.count} 条`;
    const marker = `反馈编号 ${id}`;
    const links = issue.dailyReports.map(({ date, url }) => `<a href="${url}">${date}</a>`).join('、');
    const stats = `<p>${escapeXML(metric)} · 相关日报 ${links} · ${marker}</p>`;
    const document = fetchDoc();
    if (!/<h1\b[^>]*>迭代清单<\/h1>/.test(document.content)) throw new Error('未找到「迭代清单」标题。');
    const matches = [...document.content.matchAll(/<p\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/p>/g)]
      .filter(([, , body]) => body.includes(marker));
    if (matches.length > 1) throw new Error('迭代清单内存在重复的问题编号。');
    const match = matches[0];
    const current = match?.[2];
    const matchesStats = (content) => content.includes(metric)
      && issue.dailyReports.every(({ url }) => content.includes(url));
    if (current && matchesStats(current)) continue;

    const label = issue.isTest ? '【流程测试】' : '';
    const draft = match ? stats : `<h2>${label}${escapeXML(issue.title)}</h2>${stats}<p>处理状态：待确认</p>`;
    const command = match ? ['--command', 'block_replace', '--block-id', match[1]] : ['--command', 'append'];
    const result = lark(['docs', '+update', ...parent, ...command, '--revision-id', String(document.revision_id),
      '--doc-format', 'xml', '--content', '-'], draft);
    if (result.result !== 'success') throw new Error('迭代清单写入未完成。');
    const verified = fetchDoc().content;
    if (!verified.includes(marker) || !matchesStats(verified)) throw new Error('迭代清单回读核对失败。');
  }
  return { verified: new Set(issueIds).size };
}

function mark() {
  const { items } = JSON.parse(readFileSync(0, 'utf8'));
  if (!Array.isArray(items) || items.length > batchSize || items.some((item) => !uuid.test(item?.id))) {
    throw new Error('反馈批次无效。');
  }
  if (!items.length) return { marked: 0 };
  const ids = items.map((item) => `'${item.id}'`).join(', ');
  const result = sql(`UPDATE pet_feedback SET reported_at = CURRENT_TIMESTAMP, _updated_at = CURRENT_TIMESTAMP
    WHERE reported_at IS NULL AND id IN (${ids})`);
  return { marked: result.rows_affected };
}

function send() {
  if (!/^ou_[a-z0-9]+$/i.test(target ?? '') || !/^pet-feedback-[a-z0-9-]{1,35}$/.test(key ?? '')) {
    throw new Error('需要有效的飞书私聊收件人和去重键。');
  }
  const message = readFileSync(0, 'utf8').trim();
  if (!message || Buffer.byteLength(message) > 12_000 || message.includes('\u0000')) throw new Error('日报内容无效。');
  const result = lark(['im', '+messages-send', '--as', 'bot', '--user-id', target,
    '--text', message, '--idempotency-key', key]);
  if (typeof result.message_id !== 'string' || !result.message_id) throw new Error('飞书未返回消息 ID。');
  return { messageId: result.message_id };
}

try {
  const operations = { read, issues, assign, sync, mark, send };
  if (!Object.hasOwn(operations, action)) {
    throw new Error('用法：feedback-digest.mjs read|issues|assign|mark <应用 ID>，sync <应用 ID> <知识库链接>，或 send <收件人 ID> <去重键>。');
  }
  console.log(JSON.stringify(operations[action]()));
} catch (error) {
  const detail = error.stderr ? ` 飞书命令退出码 ${error.status ?? error.signal ?? error.code ?? '未知'}。` : ` ${error.message}`;
  console.error(`桌宠反馈日报操作失败。${detail}`);
  process.exitCode = 1;
}
