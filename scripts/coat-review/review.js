import { openRetouch } from './retouch.js';
import { hasRetouch } from './retouch-data.js';

const byId = id => document.getElementById(id);
const stage = byId('stage');
const nav = byId('groups');
const progress = byId('progress');
const noteField = byId('overall-note');
const status = byId('status');
const next = byId('next');
const submit = byId('submit');
const dialog = byId('preview');

function node(tag, className, content = '') {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = content;
  return element;
}

function preview(src, title) {
  byId('preview-title').textContent = title;
  const image = byId('preview-image');
  image.alt = title;
  image.src = src;
  dialog.showModal();
}

function referenceButton(src, title) {
  const button = node('button', 'image-button reference-image');
  button.type = 'button';
  button.setAttribute('aria-label', `放大${title}`);
  const image = node('img');
  image.src = src;
  image.alt = title;
  button.append(image, node('span', 'zoom', '放大'));
  button.addEventListener('click', () => preview(image.src, title));
  return button;
}

async function start() {
  const response = await fetch('/api/review');
  if (!response.ok) throw new Error('无法读取素材');
  const { round, saved } = await response.json();
  const key = `coat-review:${round.id}`;
  let local;
  try { local = JSON.parse(localStorage.getItem(key)); } catch { /* Use submitted data if storage is unavailable. */ }
  const submitted = saved?.round === round.id ? saved : null;
  let draft = {
    groups: Object.fromEntries(submitted?.groups.map(entry => [entry.id, {
      choice: entry.choice ?? '', feedback: entry.feedback,
      ...(entry.choices && { choices: entry.choices }),
      ...(entry.retouches && { retouches: entry.retouches }),
    }]) ?? []),
    note: submitted?.note ?? '',
  };
  if (local?.dirty && local.groups && typeof local.note === 'string') draft = local;
  let current = Math.max(0, round.groups.findIndex(group => !ready(group)));
  let dirty = Boolean(local?.dirty);
  let savedAt = submitted?.submittedAt;
  let storageAvailable = true;
  let saving = false;

  function entry(group) {
    const record = draft.groups[group.id] ??= { choice: '', feedback: '' };
    record.choices ??= group.options.filter(option => option.id === record.choice).map(option => option.id);
    return record;
  }

  function ready(group) {
    const record = entry(group);
    const { choice, feedback } = record;
    if (edited(group, record)) return true;
    return choice === 'reject' ? Boolean(feedback.trim()) : record.choices.length > 0;
  }

  function edited(group, record) {
    return Boolean((group.retouch ?? round.retouch) && Object.values(record.retouches ?? {}).some(hasRetouch));
  }

  function say(message = '') {
    if (status.textContent !== message) status.textContent = message;
  }

  function update() {
    const count = round.groups.filter(ready).length;
    progress.max = round.groups.length;
    progress.value = count;
    byId('progress-text').textContent = `${count} / ${round.groups.length}`;
    [...nav.children].forEach((button, index) => {
      const group = round.groups[index];
      button.setAttribute('aria-current', index === current ? 'step' : 'false');
      button.querySelector('.group-state').textContent = ready(group) ? '✓' : entry(group).choice ? '待补意见' : '待评';
    });
    next.hidden = current === round.groups.length - 1 && count === round.groups.length;
    next.disabled = saving;
    next.textContent = current === round.groups.length - 1 ? '去未完成组 →' : '下一组 →';
    submit.disabled = saving || (!dirty && Boolean(savedAt));
    submit.textContent = saving ? '正在保存…' : savedAt ? '更新评审' : '提交评审';
    const group = round.groups[current];
    const all = stage.querySelector('.select-all');
    if (all) all.disabled = saving || entry(group).choices.length === group.options.length;
  }

  function change() {
    dirty = true;
    try { localStorage.setItem(key, JSON.stringify({ ...draft, dirty: true })); }
    catch { storageAvailable = false; }
    say(storageAvailable ? '草稿已保存' : '草稿暂存在当前页面，请及时提交。');
    update();
  }

  function choiceInput(value, id) {
    const input = node('input', 'visually-hidden');
    input.type = 'checkbox';
    input.value = value;
    input.id = id;
    return input;
  }

  function clearError() {
    byId('group-error').textContent = '';
    byId('feedback').removeAttribute('aria-invalid');
  }

  function render() {
    const group = round.groups[current];
    const record = entry(group);
    const header = node('header', 'stage-head');
    const heading = node('h2', '', group.title);
    heading.tabIndex = -1;
    header.append(heading, node('p', '', group.description));
    const animations = [];
    if (group.options.some(option => option.motion)) {
      const toggle = node('button', 'motion-toggle', '播放特别快打字');
      toggle.type = 'button';
      toggle.setAttribute('aria-pressed', 'false');
      toggle.addEventListener('click', () => {
        const playing = toggle.getAttribute('aria-pressed') === 'false';
        toggle.textContent = playing ? '回到定格' : '播放特别快打字';
        toggle.setAttribute('aria-pressed', String(playing));
        for (const { image, option } of animations) image.src = playing ? option.motion : option.typing;
      });
      header.append(toggle);
    }
    if (group.detail) {
      const detail = node('button', 'motion-toggle', group.detailLabel);
      detail.type = 'button';
      detail.addEventListener('click', () => preview(group.detail, group.detailLabel));
      header.append(detail);
    }
    const comparison = node('div', 'comparison');
    const reference = node('figure', 'reference');
    const referenceLabel = group.referenceLabel ?? '参考原图';
    reference.append(node('figcaption', 'card-heading', referenceLabel), referenceButton(group.reference, referenceLabel));
    const options = node('fieldset', 'options');
    options.append(node('legend', 'visually-hidden', '选择方案，可多选'));
    const inputs = [];
    const grid = node('div', 'cards');
    for (const option of group.options) {
      const card = node('div', 'card');
      const id = `choice-${option.id}`;
      const input = choiceInput(option.id, id);
      inputs.push(input);
      input.addEventListener('change', () => {
        record.choice = '';
        record.choices = inputs.filter(candidate => candidate.checked).map(candidate => candidate.value);
        selectionChanged();
      });
      const label = node('label', 'card-label');
      label.htmlFor = id;
      const title = node('span', 'candidate-title');
      title.append(node('span', 'code', option.id), node('strong', '', option.label));
      label.append(title, node('span', 'option-description', option.description), node('span', 'choice-mark'));
      const visual = node('div', 'sprite-image');
      const pictureLabel = node('label', 'picture-label');
      pictureLabel.htmlFor = id;
      const picture = node('img', 'sprite');
      picture.src = option.image;
      picture.alt = '';
      pictureLabel.append(picture);
      const zoom = node('button', 'zoom', '放大');
      zoom.type = 'button';
      const previewTitle = option.id + ' ' + option.label;
      zoom.setAttribute('aria-label', `放大${previewTitle}`);
      zoom.addEventListener('click', () => preview(option.image, previewTitle));
      visual.append(pictureLabel, zoom);
      if (option.typing) {
        const poses = node('div', 'pose-previews');
        const idle = node('figure', 'pose');
        idle.append(visual, node('figcaption', '', '待机'));
        const typing = node('figure', 'pose');
        const typingVisual = referenceButton(option.typing, previewTitle + ' · 特别快打字');
        const typingImage = typingVisual.querySelector('img');
        typingImage.classList.add('sprite');
        if (option.motion) animations.push({ image: typingImage, option });
        typing.append(typingVisual, node('figcaption', '', '特别快打字'));
        poses.append(idle, typing);
        card.append(input, label, poses);
      } else {
        card.append(input, label, visual);
      }
      if ((group.retouch ?? round.retouch) && option.typing) {
        const edit = node('button', 'retouch-open');
        edit.type = 'button';
        edit.setAttribute('aria-label', '像素微调 ' + previewTitle);
        const refresh = () => {
          edit.textContent = hasRetouch(record.retouches?.[option.id]) ? '像素微调 · 已编辑' : '像素微调';
        };
        refresh();
        edit.addEventListener('click', async () => {
          if (saving) return;
          edit.disabled = true;
          try {
            await openRetouch(option, group.retouch ?? round.retouch, record.retouches?.[option.id], changes => {
              const retouches = record.retouches ??= {};
              if (hasRetouch(changes)) retouches[option.id] = changes;
              else delete retouches[option.id];
              if (!Object.keys(retouches).length) delete record.retouches;
              refresh();
              field.required = record.choice === 'reject' && !edited(group, record);
              hint.textContent = field.required ? '必填' : '选填';
              if (ready(group)) clearError();
              change();
            }, () => !saving && edit.isConnected);
          } catch (error) {
            say(`无法打开像素微调 · ${error.message}`);
          } finally {
            edit.disabled = false;
          }
        });
        card.append(edit);
      }
      grid.append(card);
    }
    const reject = node('div', 'reject');
    const rejectId = 'choice-reject';
    const rejectInput = choiceInput('reject', rejectId);
    const rejectLabel = node('label', 'reject-label');
    rejectLabel.htmlFor = rejectId;
    rejectLabel.append(node('span', 'choice-mark'), node('strong', '', '都不选'));
    reject.append(rejectInput, rejectLabel);
    rejectInput.addEventListener('change', () => {
      record.choice = rejectInput.checked ? 'reject' : '';
      record.choices = [];
      selectionChanged();
    });
    const all = node('button', 'secondary select-all', '全选');
    all.type = 'button';
    all.addEventListener('click', () => {
      record.choice = '';
      record.choices = group.options.map(option => option.id);
      selectionChanged();
    });
    const selectedCount = node('span', 'selection-count');
    selectedCount.setAttribute('aria-live', 'polite');
    const controls = node('div', 'selection-controls');
    controls.append(all, reject, selectedCount);
    options.append(grid, controls);
    comparison.append(reference, options);

    const feedback = node('div', 'feedback');
    const feedbackLabel = node('label', '', '修改意见');
    feedbackLabel.htmlFor = 'feedback';
    const needsText = record.choice === 'reject' && !edited(group, record);
    const hint = node('span', 'hint', needsText ? '必填' : '选填');
    hint.id = 'feedback-hint';
    const field = node('textarea');
    field.id = 'feedback';
    field.rows = 3;
    field.maxLength = 1000;
    field.required = needsText;
    field.placeholder = '写下想保留的部分，或想改的颜色、位置和面积。';
    field.value = record.feedback;
    field.setAttribute('aria-describedby', 'group-error');
    field.addEventListener('input', () => {
      record.feedback = field.value;
      if (field.value.trim()) clearError();
      change();
    });
    const error = node('p', 'error');
    error.id = 'group-error';
    error.setAttribute('role', 'alert');
    feedback.append(feedbackLabel, hint, field, error);

    function syncSelection() {
      rejectInput.checked = record.choice === 'reject';
      for (const input of inputs) input.checked = record.choices.includes(input.value);
      selectedCount.textContent = `已选 ${record.choices.length} / ${group.options.length}`;
      field.required = rejectInput.checked && !edited(group, record);
      hint.textContent = field.required ? '必填' : '选填';
    }

    function selectionChanged() {
      syncSelection();
      if (!field.required || field.value.trim()) clearError();
      change();
    }

    syncSelection();
    stage.replaceChildren(header, comparison, feedback);
    update();
  }

  function go(index, focus = true) {
    current = index;
    render();
    if (focus) stage.querySelector('h2').focus();
  }

  function check(group) {
    if (ready(group)) return true;
    const noChoice = !entry(group).choice;
    const error = byId('group-error');
    if (group.retouch ?? round.retouch) {
      error.textContent = noChoice ? '请勾选候选、选「都不选」，或提交像素微调。' : '请填写修改意见，或在候选稿上做像素微调。';
    } else {
      error.textContent = noChoice ? '请勾选候选，或选「都不选」。' : '选「都不选」时，请填写修改意见。';
    }
    if (noChoice) stage.querySelector('input[type=checkbox]').focus();
    else {
      byId('feedback').setAttribute('aria-invalid', 'true');
      byId('feedback').focus();
    }
    return false;
  }

  byId('round-label').textContent = round.label;
  for (const [index, group] of round.groups.entries()) {
    const button = node('button', 'group-link');
    button.type = 'button';
    button.append(node('span', '', group.label), node('span', 'group-state'));
    button.addEventListener('click', () => go(index));
    nav.append(button);
  }
  noteField.value = draft.note;
  noteField.addEventListener('input', () => { draft.note = noteField.value; change(); });
  byId('actions').hidden = false;
  byId('overall').hidden = false;
  render();
  if (dirty) say('已恢复草稿');
  else if (savedAt) say('已提交，可以继续修改。');

  next.addEventListener('click', () => {
    if (!check(round.groups[current])) return;
    const index = current === round.groups.length - 1
      ? round.groups.findIndex(group => !ready(group)) : current + 1;
    if (index >= 0) go(index);
  });

  submit.addEventListener('click', async () => {
    const unfinished = round.groups.findIndex(group => !ready(group));
    if (unfinished >= 0) {
      if (unfinished !== current) go(unfinished);
      check(round.groups[current]);
      return;
    }
    saving = true;
    update();
    document.querySelectorAll('input, textarea').forEach(field => { field.disabled = true; });
    [...nav.children].forEach(button => { button.disabled = true; });
    try {
      const response = await fetch('/api/review', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ round: round.id, groups: draft.groups, note: draft.note }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      savedAt = result.saved.submittedAt;
      dirty = false;
      try { localStorage.removeItem(key); } catch { /* Submitted data is on disk. */ }
      say('评审已提交。');
    } catch (error) {
      say(`提交失败 · ${error.message}`);
    } finally {
      saving = false;
      document.querySelectorAll('input, textarea').forEach(field => { field.disabled = false; });
      [...nav.children].forEach(button => { button.disabled = false; });
      update();
    }
  });
}

dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
start().catch(error => { stage.replaceChildren(node('p', 'error', `页面加载失败 · ${error.message}`)); });
