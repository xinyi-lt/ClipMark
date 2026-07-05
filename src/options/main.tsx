import React, { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { getSettings, saveSettings } from "../shared/storage";
import type { HighlightColor, UserSettings } from "../shared/types";
import "./styles.css";

const COLORS: HighlightColor[] = ["yellow", "green", "blue", "pink"];

function App() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [status, setStatus] = useState("Loading");

  useEffect(() => {
    void getSettings().then((loaded) => {
      setSettings(loaded);
      setStatus("");
    });
  }, []);

  const updateColor = useCallback((defaultColor: HighlightColor) => {
    setSettings((current) => (current ? { ...current, defaultColor } : current));
  }, []);

  const save = useCallback(async () => {
    if (!settings) {
      return;
    }

    await saveSettings(settings);
    setStatus("Saved.");
  }, [settings]);

  if (!settings) {
    return <main>{status}</main>;
  }

  return (
    <main>
      <h1>ClipMark Options</h1>

      <section>
        <h2>Default color</h2>
        <div className="color-row">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`swatch swatch-${color}`}
              aria-pressed={settings.defaultColor === color}
              title={color}
              onClick={() => updateColor(color)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2>Markdown file name</h2>
        <input
          value={settings.fileNameTemplate}
          onChange={(event) => setSettings({ ...settings, fileNameTemplate: event.target.value })}
        />
        <p>Available tokens: {"{date}"}, {"{title}"}.</p>
      </section>

      <button type="button" onClick={save}>
        Save options
      </button>
      {status ? <p className="status">{status}</p> : null}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
