import { useState, useMemo } from 'react';
import { useTimelineStore, getClassifiableBullets } from '../../store';
import { Button } from '../../components/primitives/Button';
import { Input } from '../../components/primitives/Input';
import { getAllThemes, mapClassifiedProjectsToRefs } from './projectUtils';
import { createOpenAICompatibleProvider } from '../../services/llm/openaiCompatible';

export function ThemeManagementPanel() {
  const { entries, selectedMonth, setProjects, setAIInFlight } = useTimelineStore();
  const settings = useTimelineStore((s) => s.settings);
  const aiInFlight = useTimelineStore((s) => s.aiInFlight['classify-' + selectedMonth]);

  const [error, setError] = useState<string | null>(null);
  const [renamingTheme, setRenamingTheme] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const themes = useMemo(() => getAllThemes(entries), [entries]);

  const handleClassify = async () => {
    setAIInFlight('classify-' + selectedMonth, true);
    setError(null);

    try {
      const provider = createOpenAICompatibleProvider(settings.llm);
      const bullets = getClassifiableBullets(selectedMonth);

      if (bullets.length === 0) {
        setError('No bullets to classify');
        return;
      }

      const rawProjects = await provider.classifyProjects(bullets);
      const projects = mapClassifiedProjectsToRefs(rawProjects, bullets);
      setProjects(projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Classification failed');
    } finally {
      setAIInFlight('classify-' + selectedMonth, false);
    }
  };

  const handleRename = (oldName: string) => {
    if (!newName.trim() || newName === oldName) {
      setRenamingTheme(null);
      return;
    }

    // Update all entries with the new theme name
    for (const entry of Object.values(entries)) {
      if (entry.ai?.projects) {
        const projects = entry.ai.projects.map((p) =>
          p.name === oldName ? { ...p, name: newName.trim() } : p
        );
        if (projects.some((p) => p.name === newName.trim())) {
          useTimelineStore.getState().setProjects(projects);
        }
      }
    }

    setRenamingTheme(null);
    setNewName('');
  };

  return (
    <div className="theme-management-panel">
      <div className="theme-management-header">
        <h3>Work Themes</h3>
        <Button
          onClick={handleClassify}
          loading={aiInFlight}
        >
          Classify Projects
        </Button>
      </div>

      {error && <p className="theme-management-error">{error}</p>}

      {themes.length === 0 ? (
        <p className="theme-management-empty">
          No themes classified yet. Click "Classify Projects" to auto-detect themes.
        </p>
      ) : (
        <div className="theme-list">
          {themes.map((theme) => (
            <div key={theme} className="theme-item">
              {renamingTheme === theme ? (
                <div className="theme-rename-form">
                  <Input
                    label="New name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={theme}
                  />
                  <Button size="sm" onClick={() => handleRename(theme)}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setRenamingTheme(null)}>Cancel</Button>
                </div>
              ) : (
                <>
                  <span className="theme-name">{theme}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => { setRenamingTheme(theme); setNewName(theme); }}
                  >
                    Rename
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
