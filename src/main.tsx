import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { strToU8, zipSync } from 'fflate';
import { nameLength, options, parts, presets, readConfig, type Config, type Part, type PresetId } from './model';
import { actions, png, render, type Action } from './render';
import './style.css';

const labels: Record<Part, string> = { ear: '耳朵', muzzle: '嘴鼻', tail: '尾巴', eye: '眼睛', palette: '毛色' };
const actionLabels: Record<Action, string> = { sit: '正面坐姿', left: '向左跑', right: '向右跑', typing: '打字' };
const steps = ['选体型', '选框架', '换细节', '起名'];
const defaultId = 'preset_m1_12';

function download(blob: Blob, file: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function App() {
  const [step, setStep] = useState(0);
  const [config, setConfig] = useState<Config>({ ...presets[defaultId] });
  const [base, setBase] = useState<Config>(presets[defaultId]);
  const [presetId, setPresetId] = useState<PresetId | null>(defaultId);
  const [history, setHistory] = useState<Config[]>([]);
  const [action, setAction] = useState<Action>('sit');
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (canvas.current) render(canvas.current, config, action, frame);
  }, [config, action, frame]);

  useEffect(() => {
    if (!playing || action === 'sit') return;
    const timer = window.setInterval(() => setFrame(i => (i + 1) % actions[action]), action === 'typing' ? 145 : 88);
    return () => window.clearInterval(timer);
  }, [action, playing]);

  function chooseAction(next: Action) {
    setFrame(0);
    setAction(next);
    setPlaying(next !== 'sit');
  }

  function setPart(part: Part, value: string) {
    const next = { ...config, [part]: value } as Config;
    apply(next);
  }

  function apply(next: Config) {
    setHistory(previous => [...previous.slice(-19), config]);
    setConfig(next);
    setMessage('');
  }

  function selectPreset(id: PresetId) {
    const next = presets[id];
    setPresetId(id);
    setBase(next);
    setConfig({ ...next, name: config.name === base.name ? next.name : config.name });
    setHistory([]);
    setMessage('');
  }

  function cycle(part: Part, direction: number) {
    const ids = Object.keys(options[part]);
    const next = ids[(ids.indexOf(config[part]) + direction + ids.length) % ids.length];
    setPart(part, next);
  }

  function randomize() {
    const next = { ...config };
    for (const part of parts) {
      const ids = Object.keys(options[part]);
      Object.assign(next, { [part]: ids[Math.floor(Math.random() * ids.length)] });
    }
    apply(next);
  }

  function undo() {
    const previous = history.at(-1);
    if (!previous) return;
    setConfig(previous);
    setHistory(history.slice(0, -1));
    setMessage('');
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.currentTarget.files?.[0];
    event.currentTarget.value = '';
    if (!selected) return;
    try {
      const next = readConfig(JSON.parse(await selected.text()));
      const match = (Object.keys(presets) as PresetId[]).find(id => parts.every(part => presets[id][part] === next[part]));
      setPresetId(match ?? null);
      setBase(match ? presets[match] : next);
      setConfig(next);
      setHistory([]);
      setStep(3);
      setMessage('已导入同一份 M1 配置');
    } catch (error) {
      setMessage(`导入失败 · ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async function exportBundle() {
    setBusy(true);
    setMessage('');
    try {
      const checked = readConfig(config);
      const sizes = [1, 2, 4] as const;
      const pictures = await Promise.all(sizes.map(async scale =>
        [`pet-${scale}x.png`, new Uint8Array(await (await png(checked, scale)).arrayBuffer())] as const,
      ));
      const zip = zipSync({
        ...Object.fromEntries(pictures),
        'pet-config.json': strToU8(JSON.stringify(checked, null, 2) + '\n'),
      });
      download(new Blob([Uint8Array.from(zip).buffer], { type: 'application/zip' }), 'desktop-pet-m1.zip');
      setMessage('已导出 3 档透明 PNG 和 pet-config.json');
    } catch (error) {
      setMessage(`导出失败 · ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setBusy(false);
    }
  }

  const selected = presetId && parts.every(part => config[part] === presets[presetId][part]);
  const validName = nameLength(config.name) >= 1 && nameLength(config.name) <= 8;

  return (
    <main>
      <header>
        <div><p className="kicker">桌面宠物 / M1</p><h1>宠物形象编辑器</h1></div>
        <div>
          <button className="secondary" onClick={() => fileInput.current?.click()}>导入 JSON</button>
          <input ref={fileInput} type="file" accept=".json,application/json" onChange={importFile} hidden aria-label="选择配置文件" />
        </div>
      </header>

      <div className="workspace">
        <section className="preview" aria-label="画布预览">
          <div className="preview-heading">
            <div><h2>{config.name.trim() || '未命名'}</h2><p>{selected && presetId ? presets[presetId].name : '自定义'} · 标准短毛</p></div>
            <span className="dimensions">160 × 160</span>
          </div>
          <div className="stage"><canvas ref={canvas} width="160" height="160" aria-label="宠物像素预览" /></div>
          <div className="actions" aria-label="动作预览">
            {(Object.keys(actions) as Action[]).map(key =>
              <button key={key} aria-pressed={action === key} onClick={() => chooseAction(key)}>{actionLabels[key]}</button>,
            )}
          </div>
          {action !== 'sit' && <div className="timeline">
            <button onClick={() => setPlaying(!playing)}>{playing ? '暂停' : '播放'}</button>
            <button onClick={() => { setPlaying(false); setFrame(i => (i + actions[action] - 1) % actions[action]); }}>上一帧</button>
            <span>{frame + 1} / {actions[action]}</span>
            <button onClick={() => { setPlaying(false); setFrame(i => (i + 1) % actions[action]); }}>下一帧</button>
          </div>}
        </section>

        <section className="panel" aria-label="形象设置">
          <nav aria-label="编辑步骤">
            {steps.map((label, i) => <button key={label} aria-current={step === i ? 'step' : undefined} onClick={() => setStep(i)}>{label}</button>)}
          </nav>
          <div className="panel-content">
            {step === 0 && <>
              <h2>选择体型</h2>
              <button className="choice picked" onClick={() => setStep(1)}><strong>中型</strong><span>M1 标准短毛</span></button>
            </>}
            {step === 1 && <>
              <h2>选择框架或品种</h2>
              <button className={`choice ${presetId === null ? 'picked' : ''}`} onClick={() => { setPresetId(null); setBase(config); setStep(2); }}><strong>M1 标准短毛</strong><span>自定义</span></button>
              <div className="preset-list">
                {(Object.keys(presets) as PresetId[]).map(id => <button key={id} className={`choice ${id === presetId && selected ? 'picked' : ''}`} onClick={() => selectPreset(id)}><strong>{presets[id].name}</strong></button>)}
              </div>
            </>}
            {step === 2 && <>
              <h2>更换细节</h2>
              <div className="tools">
                <button onClick={randomize}>随机</button>
                <button disabled={!history.length} onClick={undo}>撤销</button>
                <button onClick={() => apply({ ...base, name: config.name })}>恢复默认</button>
              </div>
              <div className="part-list">
                {parts.map(part => {
                  const dict: Record<string, string> = options[part];
                  return <div className="part" key={part}>
                    <label htmlFor={part}>{labels[part]}</label>
                    <button aria-label={`上一款${labels[part]}`} onClick={() => cycle(part, -1)}>‹</button>
                    <select id={part} value={config[part]} onChange={event => setPart(part, event.target.value)}>
                      {Object.entries(dict).map(([id, name]) => <option value={id} key={id}>{name}</option>)}
                    </select>
                    <button aria-label={`下一款${labels[part]}`} onClick={() => cycle(part, 1)}>›</button>
                  </div>;
                })}
              </div>
              {config.eye === 'Y03' && <p className="hint">眯眯眼常驻会看不到眨眼动画。</p>}
            </>}
            {step === 3 && <>
              <h2>给宠物起名</h2>
              <label className="name-label" htmlFor="pet-name">宠物名</label>
              <input id="pet-name" value={config.name} onChange={event => setConfig({ ...config, name: event.target.value })} aria-invalid={!validName} aria-describedby="name-help" />
              <p id="name-help" className={validName ? 'hint' : 'hint invalid'}>需要 1–8 字 · 当前 {nameLength(config.name)} 字</p>
              <dl className="summary">
                {parts.map(part => <div key={part}><dt>{labels[part]}</dt><dd>{(options[part] as Record<string, string>)[config[part]]}</dd></div>)}
              </dl>
            </>}
          </div>
          <div className="panel-footer">
            {step > 0 && <button className="secondary" onClick={() => setStep(step - 1)}>上一步</button>}
            {step < 3 && <button className="secondary" onClick={() => setStep(3)}>直接开始</button>}
            {step < 3 ? <button className="primary" onClick={() => setStep(step + 1)}>继续</button> : <button className="primary" disabled={!validName || busy} onClick={() => void exportBundle()}>{busy ? '正在导出' : '导出 PNG + JSON'}</button>}
          </div>
          <p className="status" role="status">{message}</p>
        </section>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
