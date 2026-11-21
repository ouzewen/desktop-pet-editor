const byId = id => document.getElementById(id);
const dialog = byId('preview');

function element(tag, text) {
  const node = document.createElement(tag);
  if (text) node.textContent = text;
  return node;
}

const detailLabels = {
  base: '底毛', head: '头部', torso: '躯干', upper: '额顶', whole: '整体',
  center: '中央', 'right-heavy': '右侧面积较大', small: '小面积', large: '大面积',
  black: '黑色', white: '白色', 'orange-black': '橘色与深色', 'orange-left': '画面左侧为橘色', 'eye-mask': '眼周',
  recolorable: '颜色按照片选取',
};

function showPreview(src, title, transparent = false) {
  byId('preview-title').textContent = title;
  const image = byId('preview-image');
  image.alt = title;
  image.src = src;
  dialog.classList.toggle('part-preview', transparent);
  dialog.showModal();
}

function cropTransparentImage(image) {
  const { naturalWidth: width, naturalHeight: height } = image;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context || !width || !height) return;
  context.drawImage(image, 0, 0);
  const { data } = context.getImageData(0, 0, width, height);
  let left = width, right = 0, top = height, bottom = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!data[(y * width + x) * 4 + 3]) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
    }
  }
  if (left > right) return;
  const cropped = context.getImageData(left, top, right - left + 1, bottom - top + 1);
  canvas.width = cropped.width + 12;
  canvas.height = cropped.height + 12;
  context.putImageData(cropped, 6, 6);
  image.src = canvas.toDataURL();
}

function thumbnail(src, title, transparent = false) {
  const button = element('button');
  button.type = 'button';
  button.className = 'library-thumb' + (transparent ? ' component-thumb' : '');
  button.setAttribute('aria-label', '放大' + title);
  const image = element('img');
  image.alt = '';
  if (transparent) image.addEventListener('load', () => cropTransparentImage(image), { once: true });
  image.src = src;
  button.addEventListener('click', () => showPreview(image.src, title, transparent));
  button.append(image);
  return button;
}

function portraitCard(portrait, componentNames, revealComponent) {
  const article = element('article');
  article.className = 'library-card';
  const tools = element('div');
  tools.className = 'library-tools';
  const typing = element('button', '看特别快打字');
  typing.type = 'button';
  typing.addEventListener('click', () => showPreview(portrait.typing, portrait.label + ' · 特别快打字'));
  tools.append(typing);
  for (const id of portrait.components) {
    const link = element('a', componentNames.get(id) ?? id);
    link.href = '#component-' + encodeURIComponent(id);
    link.addEventListener('click', () => revealComponent(id));
    tools.append(link);
  }
  article.append(thumbnail(portrait.preview, portrait.label + ' · 整体形象'), element('h3', portrait.label),
    element('p', portrait.description), tools);
  return article;
}

function componentCard(part, regionLabels) {
  const article = element('article');
  article.className = 'library-card';
  article.id = 'component-' + part.id;
  const details = [part.slot, part.side, part.pigment, part.coverage].map(key => detailLabels[key]).filter(Boolean);
  const locations = element('ul');
  locations.className = 'component-locations';
  locations.setAttribute('aria-label', '覆盖部位');
  for (const id of part.regions) locations.append(element('li', regionLabels.get(id)));
  const tools = element('div');
  tools.className = 'library-tools';
  const source = element('a', '下载 Aseprite 源稿');
  source.href = part.source;
  source.download = part.file;
  tools.append(source);
  article.append(part.preview ? thumbnail(part.preview, part.label + ' · 独立组件', true) : element('p', '暂无独立预览'),
    element('h4', part.label), element('p', part.variant), locations, element('p', details.join(' · ')), tools);
  return article;
}

function componentBrowser(taxonomy, components) {
  const groupSelect = byId('part-group');
  const categorySelect = byId('part-category');
  const regionSelect = byId('part-region');
  const gallery = byId('components');
  const categories = taxonomy.flatMap(group => group.categories);
  const regionLabels = new Map(categories.flatMap(category => category.regions.map(region => [region.id, region.label])));
  const cards = new Map(components.map(part => [part.id, componentCard(part, regionLabels)]));
  const groupByRegion = new Map(taxonomy.flatMap(group => group.categories.flatMap(category =>
    category.regions.map(region => [region.id, group.id]))));

  function options(select, allLabel, entries) {
    const current = select.value;
    select.replaceChildren(new Option(allLabel, ''), ...entries.map(entry => new Option(entry.label, entry.id)));
    if (entries.some(entry => entry.id === current)) select.value = current;
  }

  function render() {
    const group = taxonomy.find(item => item.id === groupSelect.value);
    const availableCategories = group?.categories ?? categories;
    options(categorySelect, '全部部位', availableCategories);
    const category = availableCategories.find(item => item.id === categorySelect.value);
    const availableRegions = category?.regions ?? availableCategories.flatMap(item => item.regions);
    options(regionSelect, '全部位置', availableRegions);

    const position = regionSelect.value;
    const regions = new Set(availableRegions.filter(region =>
      !position || region.id === position || region.parent === position).map(region => region.id));
    const matches = components.filter(part => part.regions.some(id => regions.has(id)));
    byId('component-count').textContent = `${matches.length} 个组件`;
    gallery.replaceChildren();
    for (const section of taxonomy) {
      const matchingGroup = matches.filter(part => {
        const firstMatchingRegion = part.regions.find(id => regions.has(id));
        return groupByRegion.get(firstMatchingRegion) === section.id;
      });
      if (!matchingGroup.length) continue;
      const block = element('div');
      block.className = 'component-group';
      const grid = element('div');
      grid.className = 'library-grid';
      for (const part of matchingGroup) grid.append(cards.get(part.id));
      block.append(element('h3', section.label), grid);
      gallery.append(block);
    }
    if (!matches.length) gallery.append(element('p', '这个位置暂时没有已审核的组件。'));
  }

  groupSelect.addEventListener('change', () => {
    categorySelect.value = '';
    regionSelect.value = '';
    render();
  });
  categorySelect.addEventListener('change', () => {
    regionSelect.value = '';
    render();
  });
  regionSelect.addEventListener('change', render);
  options(groupSelect, '全部大类', taxonomy);
  render();

  return id => {
    const card = cards.get(id);
    if (!card) return;
    if (!card.isConnected) {
      groupSelect.value = '';
      categorySelect.value = '';
      regionSelect.value = '';
      render();
    }
    requestAnimationFrame(() => card.scrollIntoView({ block: 'nearest' }));
  };
}

async function load() {
  const response = await fetch('/api/library');
  if (!response.ok) throw new Error('素材库暂时无法读取，请刷新重试。');
  const { portraits, components, taxonomy } = await response.json();
  const componentNames = new Map(components.map(part => [part.id, part.label]));
  const revealComponent = componentBrowser(taxonomy, components);
  byId('portraits').replaceChildren(...portraits.map(portrait => portraitCard(portrait, componentNames, revealComponent)));
  byId('library-status').hidden = true;
  const restoreLinkedComponent = () => {
    const match = window.location.hash.match(/^#component-([a-z0-9-]+)$/);
    if (match) revealComponent(match[1]);
  };
  window.addEventListener('hashchange', restoreLinkedComponent);
  restoreLinkedComponent();
}

dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
load().catch(() => { byId('library-status').textContent = '素材库暂时无法读取，请刷新重试。'; });
