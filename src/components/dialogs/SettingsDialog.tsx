import { useState } from 'react';
import { useTimelineStore } from '../../store';
import { Button } from '../primitives/Button';
import { Input } from '../primitives/Input';
import { Select } from '../primitives/Select';
import type { Settings } from '../../lib/schema';

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

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!baseUrl.trim()) newErrors.baseUrl = 'Required';
    if (!model.trim()) newErrors.model = 'Required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        <h2 className="dialog-title">Settings</h2>
        <div className="settings-form">
          <div className="settings-section">
            <h3 className="settings-section-title">LLM Provider</h3>
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
              label="Model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              error={errors.model}
              placeholder="gpt-4o-mini"
            />
            <p className="settings-note">Key is stored locally in browser storage.</p>
          </div>
          <div className="settings-section">
            <h3 className="settings-section-title">Export</h3>
            <Select
              label="Folder Structure"
              value={folderStructure}
              onChange={(e) => setFolderStructure(e.target.value as 'flat' | 'year-month')}
            >
              <option value="flat">Flat</option>
              <option value="year-month">Year/Month</option>
            </Select>
            <label>
              <input
                type="checkbox"
                checked={includeAI}
                onChange={(e) => setIncludeAI(e.target.checked)}
              />
              {' '}Include AI in export
            </label>
          </div>
        </div>
        <div className="dialog-actions">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </div>
      </div>
    </div>
  );
}
