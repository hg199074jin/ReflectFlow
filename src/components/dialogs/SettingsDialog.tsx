import { useState, useEffect, useRef } from 'react';
import { useTimelineStore } from '../../store';
import { Button } from '../primitives/Button';
import { Input } from '../primitives/Input';
import { Select } from '../primitives/Select';
import { importFromZip } from '../../services/import/markdownImport';
import { saveEntry } from '../../store/persistence';
import type { Settings } from '../../lib/schema';

type ThemeMode = 'light' | 'dark' | 'auto';

function getStoredTheme(): ThemeMode {
  try {
    return (localStorage.getItem('theme') as ThemeMode) || 'auto';
  } catch {
    return 'auto';
  }
}

function applyTheme(theme: ThemeMode) {
  try {
    localStorage.setItem('theme', theme);
  } catch { /* ignore */ }
  if (theme === 'auto') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

interface SettingsDialogProps {
  onClose: () => void;
}

export function SettingsDialog({ onClose }: SettingsDialogProps) {
  const settings = useTimelineStore((s) => s.settings);
  const saveSettings = useTimelineStore((s) => s.saveSettings);

  const [baseUrl, setBaseUrl] = useState(settings.llm.baseUrl);
  const [apiKey, setApiKey] = useState(settings.llm.apiKey);
  const [model, setModel] = useState(settings.llm.model);
  const [folderStructure, setFolderStructure] = useState(settings.export.folderStructure);
  const [includeAI, setIncludeAI] = useState(settings.export.includeAI);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [theme, setTheme] = useState<ThemeMode>(getStoredTheme);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!baseUrl.trim()) newErrors.baseUrl = 'Required';
    if (!model.trim()) newErrors.model = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportStatus(null);
    try {
      const entries = await importFromZip(file);
      if (entries.length === 0) {
        setImportStatus('No valid entries found in the file');
        return;
      }

      // Save each entry to IndexedDB and update store
      const currentEntries = useTimelineStore.getState().entries;
      const updated = { ...currentEntries };
      let imported = 0;
      let skipped = 0;

      for (const entry of entries) {
        if (updated[entry.date]) {
          skipped++;
        } else {
          updated[entry.date] = entry;
          await saveEntry(entry);
          imported++;
        }
      }

      useTimelineStore.setState({ entries: updated });
      setImportStatus(`已导入 ${imported} 条记录${skipped > 0 ? `，跳过 ${skipped} 条已存在记录` : ''}`);
    } catch (err) {
      setImportStatus(err instanceof Error ? err.message : '导入失败');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    const newSettings: Settings = {
      llm: {
        provider: 'openai-compatible',
        apiKey,
        model,
        baseUrl,
      },
      export: {
        folderStructure,
        includeAI,
      },
    };
    await saveSettings(newSettings);
    onClose();
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" role="dialog" aria-label="Settings" onClick={(e) => e.stopPropagation()}>
        <h2 className="dialog-title">设置</h2>
        <div className="settings-form">
          <div className="settings-section">
            <h3 className="settings-section-title">AI 模型配置</h3>
            <Input
              label="Base URL"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              error={errors.baseUrl}
              placeholder="https://api.openai.com/v1"
            />
            <Input
              label="API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
            <Input
              label="模型名称"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              error={errors.model}
              placeholder="gpt-4o-mini"
            />
            <p className="settings-note">密钥仅保存在浏览器本地存储中。</p>
          </div>
          <div className="settings-section">
            <h3 className="settings-section-title">外观</h3>
            <Select
              label="主题"
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemeMode)}
            >
              <option value="auto">跟随系统</option>
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </Select>
          </div>
          <div className="settings-section">
            <h3 className="settings-section-title">导出设置</h3>
            <Select
              label="文件夹结构"
              value={folderStructure}
              onChange={(e) => setFolderStructure(e.target.value as 'flat' | 'year-month')}
            >
              <option value="flat">扁平</option>
              <option value="year-month">年/月</option>
            </Select>
            <label>
              <input
                type="checkbox"
                checked={includeAI}
                onChange={(e) => setIncludeAI(e.target.checked)}
              />
              {' '}导出时包含 AI 内容
            </label>
          </div>
          <div className="settings-section">
            <h3 className="settings-section-title">导入数据</h3>
            <p className="settings-note">从之前导出的 ZIP 文件导入记录。</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".zip"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              loading={importing}
            >
              导入 ZIP
            </Button>
            {importStatus && (
              <p className="settings-note" style={{ marginTop: '0.5rem' }}>{importStatus}</p>
            )}
          </div>
        </div>
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button onClick={handleSave}>保存</Button>
        </div>
      </div>
    </div>
  );
}
