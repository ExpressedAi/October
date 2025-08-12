import { type AgentConfig } from './indexeddb';

export function downloadJSON(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function parseAgentConfig(content: string): AgentConfig | null {
  try {
    const parsed = JSON.parse(content) as AgentConfig;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !("mainPrompt" in parsed) ||
      !Array.isArray((parsed as any).commands) ||
      !Array.isArray((parsed as any).cartridges)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function importAgentConfig(
  file: File, 
  onSuccess: (config: AgentConfig) => void,
  onError: (message: string) => void
) {
  const reader = new FileReader();
  reader.onload = () => {
    const parsed = parseAgentConfig(String(reader.result));
    if (parsed) {
      onSuccess(parsed);
    } else {
      onError("Invalid config file.");
    }
  };
  reader.readAsText(file);
}