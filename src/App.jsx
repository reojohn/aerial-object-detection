import { useMemo, useRef, useState } from "react";

const supportedTypes = ["jpg", "jpeg", "png", "mp4", "avi", "mov", "mkv"];
const API_URL = "http://127.0.0.1:8000";

const emptySummary = {
  human: 0,
  soldier: 0,
  drone: 0,
  quadcopter: 0
};

const classConfig = [
  {
    key: "human",
    label: "Human",
    dot: "bg-emerald-400",
    accent: "text-emerald-300",
    border: "border-emerald-400/25",
    progress: "bg-emerald-400",
    glow: "shadow-[0_0_24px_rgba(52,211,153,0.35)]"
  },
  {
    key: "soldier",
    label: "Soldier",
    dot: "bg-rose-400",
    accent: "text-rose-300",
    border: "border-rose-400/25",
    progress: "bg-rose-400",
    glow: "shadow-[0_0_24px_rgba(251,113,133,0.35)]"
  },
  {
    key: "drone",
    label: "Drone",
    dot: "bg-sky-400",
    accent: "text-sky-300",
    border: "border-sky-400/25",
    progress: "bg-sky-400",
    glow: "shadow-[0_0_24px_rgba(56,189,248,0.35)]"
  },
  {
    key: "quadcopter",
    label: "Quadcopter",
    dot: "bg-violet-400",
    accent: "text-violet-300",
    border: "border-violet-400/25",
    progress: "bg-violet-400",
    glow: "shadow-[0_0_24px_rgba(167,139,250,0.35)]"
  }
];

function isVideo(fileName = "") {
  return /\.(mp4|avi|mov|mkv)$/i.test(fileName);
}

function getFileExtension(fileName = "") {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

function formatBytes(bytes = 0) {
  if (!bytes) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);

  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function createDemoSummary(fileName, confidence) {
  const base = Array.from(fileName).reduce((total, char) => total + char.charCodeAt(0), 0);
  const confidenceBoost = Math.round(confidence * 10);

  return {
    human: Math.max(0, (base + confidenceBoost) % 4),
    soldier: Math.max(0, (base + confidenceBoost * 2) % 3),
    drone: Math.max(0, (base + confidenceBoost * 3) % 5),
    quadcopter: Math.max(0, (base + confidenceBoost * 4) % 4)
  };
}

function Icon({ type, className = "h-5 w-5" }) {
  const icons = {
    upload: <path d="M12 16V5m0 0 4 4m-4-4-4 4M5 19h14" />,
    play: <path d="M8 6.5v11l8-5.5-8-5.5Z" />,
    folder: <path d="M3.5 8A2.5 2.5 0 0 1 6 5.5h3.2l1.8 2H18A2.5 2.5 0 0 1 20.5 10v7A2.5 2.5 0 0 1 18 19.5H6A2.5 2.5 0 0 1 3.5 17V8Z" />,
    pin: <path d="M12 21s6-5.33 6-11a6 6 0 1 0-12 0c0 5.67 6 11 6 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />,
    info: <path d="M12 17v-5m0-4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0Z" />,
    check: <path d="m5 12 4.2 4.2L19 6.8" />,
    alert: <path d="M12 9v4m0 4h.01M10.28 3.86 2.82 17a2 2 0 0 0 1.72 3h14.92a2 2 0 0 0 1.72-3L13.72 3.86a2 2 0 0 0-3.44 0Z" />,
    shield: <path d="M12 3.5 19 6v5.5c0 4.4-2.8 7.6-7 9-4.2-1.4-7-4.6-7-9V6l7-2.5Z" />,
    eye: <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
    file: <path d="M14 3.5H7A2.5 2.5 0 0 0 4.5 6v12A2.5 2.5 0 0 0 7 20.5h10A2.5 2.5 0 0 0 19.5 18V9L14 3.5Zm0 0V9h5.5" />,
    radar: <path d="M12 3v3m0 12v3m9-9h-3M6 12H3m15.36-6.36-2.12 2.12M7.76 16.24l-2.12 2.12m12.72 0-2.12-2.12M7.76 7.76 5.64 5.64M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />,
    human: <path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0" />,
soldier: <path d="M12 3 5 6v5c0 4.5 2.9 7.8 7 10 4.1-2.2 7-5.5 7-10V6l-7-3Zm-3.5 8h7M9 15h6" />,
drone: <path d="M12 12h.01M12 12 7 7m5 5 5-5m-5 5-5 5m5-5 5 5M5 5h4v4H5V5Zm10 0h4v4h-4V5ZM5 15h4v4H5v-4Zm10 0h4v4h-4v-4Z" />,
quadcopter: <path d="M12 12h.01M12 12H7m5 0h5m-5 0V7m0 5v5M4 4h4v4H4V4Zm12 0h4v4h-4V4ZM4 16h4v4H4v-4Zm12 0h4v4h-4v-4Z" />,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[type]}
    </svg>
  );
}

function StatusBox({ status }) {
  const statusMap = {
    info: {
      title: "System Status",
      icon: "info",
      classes: "border-slate-700/80 bg-slate-900/70 text-slate-200"
    },
    success: {
      title: "Success",
      icon: "check",
      classes: "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
    },
    error: {
      title: "Error",
      icon: "alert",
      classes: "border-rose-500/25 bg-rose-500/10 text-rose-100"
    }
  };

  const current = statusMap[status.type || "info"];

  return (
    <div id="statusBox" className={`status-card ${current.classes}`}>
      <div className="flex items-start gap-3">
        <div className="icon-circle">
          <Icon type={current.icon} className="h-4 w-4" />
        </div>

        <div className="min-w-0">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-white/70">
            {current.title}
          </p>
          <p className="mt-1 break-words text-sm leading-relaxed">
            {status.message}
          </p>
        </div>
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="app-sidebar">
      <div className="flex justify-center pb-2 pt-1">
        <img
          src="/logo.png"
          alt="Aerial Threat Detection Logo"
          className="w-[215px] max-w-full object-contain drop-shadow-[0_18px_34px_rgba(37,99,235,0.25)] sm:w-[235px]"
        />
      </div>

      <nav className="grid gap-2 sm:grid-cols-3 lg:grid-cols-1">
        <a className="nav-link active">Detection</a>
        <a className="nav-link">Model Summary</a>
        <a className="nav-link">Ethics Note</a>
      </nav>

      <div className="subtle-panel">
        <div className="mb-4 flex items-center justify-between gap-3">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
            System
          </span>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.12em] text-emerald-200">
            Ready
          </span>
        </div>

        <div className="grid gap-2.5">
          <SystemRow label="Classes" value="4" />
          <SystemRow label="Model" value="YOLOv8" />
          <SystemRow label="Mode" value="Prototype" />
        </div>
      </div>

      <div className="ethics-panel">
        <div className="flex items-center gap-2 text-amber-100">
          <Icon type="shield" className="h-5 w-5" />
          <strong className="text-sm">Educational Use Only</strong>
        </div>

        <p className="text-[13px] leading-relaxed text-slate-400">
          This system is developed as an academic computer vision prototype for visual classification research and presentation purposes.
        </p>
      </div>
    </aside>
  );
}

function SystemRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.035] px-3.5 py-3">
      <span className="text-sm font-semibold text-slate-400">{label}</span>
      <span className="text-sm font-black text-slate-100">{value}</span>
    </div>
  );
}

function Hero() {
  return (
    <section className="hero-card premium-card">
      <div className="absolute -right-24 -top-28 h-72 w-72 rounded-full bg-sky-500/15 blur-3xl" />
      <div className="absolute -bottom-28 left-1/3 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative z-10 grid items-start gap-8 xl:grid-cols-[1fr_290px]">
        <div>
          <span className="hero-badge">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.8)]" />
            Aerial Vision Detection Prototype
          </span>

          <h2 className="mt-5 max-w-4xl text-[clamp(2.1rem,4vw,3.6rem)] font-black leading-[0.94] tracking-[-0.065em] text-white">
            Aerial Threat Detection for Image and Video Analysis
          </h2>

          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-slate-400">
            A prototype for reviewing aerial images and videos with human, soldier, drone, and quadcopter classification summaries.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <HeroStat label="Detection Model" value="YOLOv8" helper="Object detection framework" />
         <HeroStat
  label="Target Classes"
  value="4"
  helper="Human, Soldier, Drone, Quadcopter"
  icons={[
    {
      type: "human",
      label: "Human",
      color: "text-emerald-300",
      border: "border-emerald-400/20"
    },
    {
      type: "soldier",
      label: "Soldier",
      color: "text-rose-300",
      border: "border-rose-400/20"
    },
    {
      type: "drone",
      label: "Drone",
      color: "text-sky-300",
      border: "border-sky-400/20"
    },
    {
      type: "quadcopter",
      label: "Quadcopter",
      color: "text-violet-300",
      border: "border-violet-400/20"
    }
  ]}
/>
        </div>
      </div>
    </section>
  );
}

function HeroStat({ label, value, helper, icons = [] }) {
  return (
    <div className="stat-panel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
            {label}
          </p>
          <strong className="mt-2 block text-[32px] font-black leading-none tracking-[-0.05em] text-white">
            {value}
          </strong>
        </div>

        {icons.length > 0 && (
          <div className="flex flex-wrap justify-end gap-1.5">
            {icons.map((item) => (
              <div
                key={item.type}
                className={`grid h-8 w-8 place-items-center rounded-xl border bg-slate-950/60 ${item.border} ${item.color}`}
                title={item.label}
              >
                <Icon type={item.type} className="h-4 w-4" />
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-2 text-xs font-semibold text-slate-500">{helper}</p>
    </div>
  );
}

function SectionHeader({ step, title, description }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="section-step">{step}</div>

      <div>
        <h3 className="text-xl font-black tracking-[-0.04em] text-white">
          {title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}

function UploadPanel({
  selectedFile,
  confidence,
  onConfidenceChange,
  onSelectFile,
  onRunDetection,
  onDownloadSummary,
  running,
  status,
  fileInputRef
}) {
  return (
    <section className="premium-card p-6">
      <SectionHeader
        step="01"
        title="Upload Image or Video"
        description="Select JPG, PNG, MP4, AVI, MOV, or MKV."
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.mp4,.avi,.mov,.mkv,image/jpeg,image/png,video/mp4,video/quicktime"
        className="hidden"
        onChange={onSelectFile}
      />

      <button
        id="selectFileBtn"
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="btn btn-primary"
      >
        <span className="flex items-center justify-center gap-2">
          <Icon type="upload" className="h-4 w-4" />
          Choose File
        </span>
      </button>

      <div
        id="selectedFileBox"
        className={`file-box ${
          selectedFile
            ? "border-sky-500/20 bg-sky-500/10 text-slate-100"
            : "border-slate-700/80 bg-slate-900/60 text-slate-400"
        }`}
      >
        {selectedFile ? (
          <div className="flex items-start gap-3">
            <div className="icon-box bg-sky-500/10 text-sky-200">
              <Icon type="file" className="h-4 w-4" />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-sky-300">
                Selected File
              </p>

              <strong className="mt-1 block break-all text-sm text-white">
                {selectedFile.name}
              </strong>

              <small className="mt-1 block text-xs leading-relaxed text-slate-400">
                {formatBytes(selectedFile.size)} · {selectedFile.type || getFileExtension(selectedFile.name).toUpperCase()}
              </small>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="icon-box bg-slate-800 text-slate-400">
              <Icon type="upload" className="h-4 w-4" />
            </div>

            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
                No File Selected
              </p>
              <p className="mt-1 text-sm text-slate-400">
                Choose a supported aerial image or video to begin analysis.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="subtle-panel">
        <label
          htmlFor="confidenceRange"
          className="mb-3 flex items-center justify-between gap-3"
        >
          <span className="text-sm font-bold text-slate-300">
            Confidence Threshold
          </span>

          <span
            id="confidenceValue"
            className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-xs font-extrabold text-sky-200"
          >
            {confidence.toFixed(2)}
          </span>
        </label>

        <input
          id="confidenceRange"
          type="range"
          min="0.10"
          max="0.90"
          step="0.05"
          value={confidence}
          onChange={(event) => onConfidenceChange(Number(event.target.value))}
          className="confidence-slider"
        />

        <div className="mt-3 flex justify-between text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-600">
          <span>Low</span>
          <span>Balanced</span>
          <span>High</span>
        </div>
      </div>

      <button
        id="runBtn"
        type="button"
        disabled={!selectedFile || running}
        onClick={onRunDetection}
        className="btn btn-success mt-4 disabled:cursor-not-allowed disabled:opacity-45"
      >
        <span className="flex items-center justify-center gap-2">
          <Icon type="play" className="h-4 w-4" />
          {running ? "Running Analysis..." : "Run Detection Analysis"}
        </span>
      </button>

      <button
        id="openOutputsBtn"
        type="button"
        onClick={onDownloadSummary}
        className="btn btn-secondary mt-2.5"
      >
        <span className="flex items-center justify-center gap-2">
          <Icon type="folder" className="h-4 w-4" />
          Download Summary
        </span>
      </button>

      <StatusBox status={status} />
    </section>
  );
}

function PreviewPanel({ previewUrl, selectedFile, running, onShowLocation }) {
  const hasPreview = Boolean(previewUrl && selectedFile);
  const showAsVideo = selectedFile
    ? isVideo(selectedFile.name) || selectedFile.type.startsWith("video/")
    : false;

  return (
    <section className="premium-card p-6">
      <div className="mb-5 flex items-start justify-between gap-4 max-sm:flex-col">
        <SectionHeader
          step="02"
          title="Detection Preview"
          description="Uploaded aerial media will appear here for review and analysis."
        />

        <button
          id="showLocationBtn"
          type="button"
          disabled={!hasPreview}
          onClick={onShowLocation}
          className="btn btn-secondary max-sm:w-full disabled:cursor-not-allowed disabled:opacity-45"
        >
          <span className="flex items-center justify-center gap-2">
            <Icon type="pin" className="h-4 w-4" />
            Open Preview
          </span>
        </button>
      </div>

      <div id="previewArea" className="preview-box">
        <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2">
          <span className="hud-chip">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Monitor
          </span>
          <span className="hud-chip">
            {hasPreview ? "Media Loaded" : running ? "Processing" : "Idle"}
          </span>
        </div>

        {running ? (
          <Placeholder message="Processing aerial media. Preview and classification summary will update shortly." />
        ) : hasPreview ? (
          showAsVideo ? (
            <video
              key={previewUrl}
              controls
              muted
              className="relative z-10 max-h-[620px] w-full rounded-2xl bg-black object-contain shadow-2xl"
            >
              <source src={previewUrl} />
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={previewUrl}
              alt="Detection preview"
              className="relative z-10 max-h-[620px] w-full rounded-2xl bg-black object-contain shadow-2xl"
            />
          )
        ) : (
          <Placeholder message="Upload an image or video and run detection analysis to display the preview." />
        )}
      </div>
    </section>
  );
}

function Placeholder({ message }) {
  return (
    <div className="relative z-10 grid place-items-center gap-5 px-6 py-10 text-center">
      <div className="radar-sweep" />

      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-sky-300/80">
          Awaiting Media Input
        </p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
          {message}
        </p>
      </div>
    </div>
  );
}

function DetectionSummary({ summary }) {
  const total = classConfig.reduce((sum, item) => sum + (summary[item.key] || 0), 0);

  return (
    <section className="premium-card p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
            Classification Result
          </p>
          <h3 className="mt-1 text-xl font-black tracking-[-0.04em] text-white">
            Detection Summary
          </h3>
        </div>

        <div className="rounded-2xl border border-slate-700/80 bg-slate-900/70 px-4 py-3 text-right shadow-inner">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
            Total
          </p>
          <strong className="text-2xl font-black leading-none text-white">
            {total}
          </strong>
        </div>
      </div>

      <div id="summaryCards" className="grid gap-4 md:grid-cols-2">
        {classConfig.map((item) => {
          const count = summary[item.key] || 0;
          const width = total > 0 ? (count / total) * 100 : 0;

          return (
            <div
              key={item.key}
              className={`group rounded-[24px] border bg-slate-900/55 p-5 transition duration-200 hover:-translate-y-0.5 hover:bg-slate-900/75 ${item.border}`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={`h-3 w-3 rounded-full ${item.dot} ${item.glow}`} />
                  <span className={`text-xs font-extrabold uppercase tracking-[0.12em] ${item.accent}`}>
                    {item.label}
                  </span>
                </div>

                <span className="text-xs font-semibold text-slate-500">
                  {total > 0 ? `${Math.round(width)}%` : "0%"}
                </span>
              </div>

              <strong className="mt-5 block text-[40px] font-black leading-none tracking-[-0.06em] text-white">
                {count}
              </strong>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full ${item.progress}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ClassLegend() {
  return (
    <section className="premium-card p-6">
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
          Label Guide
        </p>
        <h3 className="mt-1 text-xl font-black tracking-[-0.04em] text-white">
          Class Legend
        </h3>
      </div>

      <div className="my-5 grid gap-3">
        {classConfig.map((item) => (
          <div
            key={item.key}
            className={`flex items-center gap-4 rounded-[22px] border bg-slate-900/60 px-4 py-4 ${item.border}`}
          >
            <span className={`h-3.5 w-3.5 shrink-0 rounded-full ${item.dot} ${item.glow}`} />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-white">
                {item.label}
              </p>
              <p className={`mt-1 text-[11px] font-extrabold uppercase tracking-[0.14em] ${item.accent}`}>
                Detection Class
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[24px] border border-amber-500/20 bg-amber-500/10 p-4">
        <p className="text-[13px] leading-relaxed text-amber-50/85">
          Classification labels are based on the project dataset. Human review remains required before interpreting any result in a high-stakes context.
        </p>
      </div>
    </section>
  );
}

function ModelPanel() {
  return (
    <section className="premium-card p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <ModelItem title="Detection Engine" value="YOLOv8" />
        <ModelItem title="Supported Inputs" value="Images and Videos" />
        <ModelItem title="Output Type" value="Preview and Classification Summary" />
      </div>
    </section>
  );
}

function ModelItem({ title, value }) {
  return (
    <div className="rounded-[22px] border border-slate-700/80 bg-slate-900/55 p-4 shadow-inner transition duration-200 hover:-translate-y-0.5 hover:bg-slate-900/75">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-sm font-black text-slate-100">
        {value}
      </p>
    </div>
  );
}

export default function App() {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [confidence, setConfidence] = useState(0.25);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState({
    message: "Ready. Upload an aerial image or video to begin analysis.",
    type: "info"
  });
  const [summary, setSummary] = useState(emptySummary);

  const summaryReport = useMemo(() => {
    return {
      project: "Aerial Threat Detection",
      mode: "prototype",
      classes: ["Human", "Soldier", "Drone", "Quadcopter"],
      fileName: selectedFile?.name || null,
      fileSize: selectedFile?.size || 0,
      confidence,
      summary,
      note: "This build connects to a local Python YOLOv8 backend for 4-class detection. Human review is required for high-stakes interpretation."
    };
  }, [selectedFile, confidence, summary]);

  function handleSelectFile(event) {
    const file = event.target.files?.[0];

    if (!file) {
      setStatus({ message: "File selection cancelled.", type: "info" });
      return;
    }

    const extension = getFileExtension(file.name);

    if (!supportedTypes.includes(extension)) {
      setStatus({
        message: "Unsupported file type. Please choose JPG, PNG, MP4, AVI, MOV, or MKV.",
        type: "error"
      });
      return;
    }

    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);

    setSelectedFile(file);
    setPreviewUrl(objectUrl);
    setSummary(emptySummary);
    setStatus({
      message: "Media uploaded successfully. Ready to run detection analysis.",
      type: "info"
    });
  }

  async function handleRunDetection() {
    if (!selectedFile) return;

    setRunning(true);
    setStatus({
      message: "Running YOLOv8 detection through the local Python backend. Please wait...",
      type: "info"
    });

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("confidence", String(confidence));

    try {
      const response = await fetch(`${API_URL}/detect`, {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Detection failed.");
      }

      setSummary({
        human: data.summary?.human || 0,
        soldier: data.summary?.soldier || 0,
        drone: data.summary?.drone || 0,
        quadcopter: data.summary?.quadcopter || 0
      });
      setPreviewUrl(data.output_url);
      setStatus({
        message: "YOLOv8 detection complete. Processed preview and 4-class summary are now available.",
        type: "success"
      });
    } catch (error) {
      setStatus({
        message: `Detection failed: ${error.message}. Make sure the backend is running with: python backend/app.py`,
        type: "error"
      });
    } finally {
      setRunning(false);
    }
  }

  function handleDownloadSummary() {
    const blob = new Blob([JSON.stringify(summaryReport, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "aerial-threat-detection-summary.json";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    setStatus({
      message: "Detection summary report downloaded.",
      type: "success"
    });
  }

  function handleShowLocation() {
    if (previewUrl) {
      window.open(previewUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-shell">
        <Hero />

        <section className="grid gap-6 xl:grid-cols-[380px_minmax(0,1fr)]">
          <UploadPanel
            selectedFile={selectedFile}
            confidence={confidence}
            onConfidenceChange={setConfidence}
            onSelectFile={handleSelectFile}
            onRunDetection={handleRunDetection}
            onDownloadSummary={handleDownloadSummary}
            running={running}
            status={status}
            fileInputRef={fileInputRef}
          />

          <PreviewPanel
            previewUrl={previewUrl}
            selectedFile={selectedFile}
            running={running}
            onShowLocation={handleShowLocation}
          />
        </section>

        <section className="grid items-start gap-6 xl:grid-cols-[1.05fr_0.95fr]">
  <DetectionSummary summary={summary} />
  <ClassLegend />
</section>

        <ModelPanel />
      </main>
    </div>
  );
}