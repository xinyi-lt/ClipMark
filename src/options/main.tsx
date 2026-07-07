import React, { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { getSettings, saveSettings } from "../shared/storage";
import type { HighlightColor, SelectionTrigger, UserSettings } from "../shared/types";
import "./styles.css";

const COLORS: HighlightColor[] = ["yellow", "green", "blue", "pink"];
const TRIGGERS: SelectionTrigger[] = ["dot", "contextMenuOnly"];

const t = (key: string, substitutions?: string[]) => chrome.i18n.getMessage(key, substitutions);

function colorLabel(color: HighlightColor): string {
  return t(`content_color_${color}`);
}

if (typeof document !== "undefined") {
  document.documentElement.lang = chrome.i18n.getUILanguage();
  document.title = t("options_title");
}

function App() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [status, setStatus] = useState(t("options_status_loading"));

  useEffect(() => {
    void getSettings().then((loaded) => {
      setSettings(loaded);
      setStatus("");
    });
  }, []);

  const updateColor = useCallback((defaultColor: HighlightColor) => {
    setSettings((current) => (current ? { ...current, defaultColor } : current));
  }, []);

  const updateTrigger = useCallback((selectionTrigger: SelectionTrigger) => {
    setSettings((current) => (current ? { ...current, selectionTrigger } : current));
  }, []);

  const save = useCallback(async () => {
    if (!settings) {
      return;
    }

    await saveSettings(settings);
    setStatus(t("options_status_saved"));
  }, [settings]);

  if (!settings) {
    return <main>{status}</main>;
  }

  return (
    <main>
      <h1>{t("options_title")}</h1>

      <section>
        <h2>{t("options_heading_color")}</h2>
        <div className="color-row">
          {COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`swatch swatch-${color}`}
              aria-pressed={settings.defaultColor === color}
              title={colorLabel(color)}
              onClick={() => updateColor(color)}
            />
          ))}
        </div>
      </section>

      <section>
        <h2>{t("options_heading_trigger")}</h2>
        <div className="segmented-control">
          {TRIGGERS.map((trigger) => (
            <button
              key={trigger}
              type="button"
              aria-pressed={settings.selectionTrigger === trigger}
              onClick={() => updateTrigger(trigger)}
            >
              {t(`options_trigger_${trigger}`)}
            </button>
          ))}
        </div>
        <p>{t("options_trigger_hint")}</p>
      </section>


      <section>
        <h2>{t("options_heading_filename")}</h2>
        <input
          value={settings.fileNameTemplate}
          onChange={(event) => setSettings({ ...settings, fileNameTemplate: event.target.value })}
        />
        <p>{t("options_tokens_label", ["{date}", "{title}"])}</p>
      </section>

      <button type="button" onClick={save}>
        {t("options_btn_save")}
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
