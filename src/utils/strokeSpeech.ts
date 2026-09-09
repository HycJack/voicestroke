/**
 * 笔名语音播报 —— 基于 Web Speech API（speechSynthesis），纯本地发音，无需网络。
 * 与 PWA 离线主题一致：不依赖任何外部语音服务。
 */

let cachedVoice: SpeechSynthesisVoice | null = null;
let voiceLoading = false;

function pickVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  if (voiceLoading || typeof window === "undefined") return null;

  const synth = window.speechSynthesis;
  if (!synth) return null;
  const voices = synth.getVoices();
  if (voices.length === 0) {
    // 首次调用时 voices 可能尚未异步加载完成
    voiceLoading = true;
    synth.addEventListener(
      "voiceschanged",
      () => {
        voiceLoading = false;
        cachedVoice =
          voices.find((v) => v.lang.toLowerCase().startsWith("zh-cn")) ??
          voices.find((v) => v.lang.toLowerCase().startsWith("zh")) ??
          null;
      },
      { once: true }
    );
    return null;
  }
  cachedVoice =
    voices.find((v) => v.lang.toLowerCase().startsWith("zh-cn")) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("zh")) ??
    null;
  return cachedVoice;
}

export function isStrokeVoiceSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** 播报一个笔名（先打断正在播的内容，避免叠音） */
export function speakStrokeName(name: string): void {
  if (!isStrokeVoiceSupported() || !name) return;
  const synth = window.speechSynthesis;
  if (synth.speaking) synth.cancel();
  const utter = new SpeechSynthesisUtterance(name);
  utter.lang = "zh-CN";
  const voice = pickVoice();
  if (voice) utter.voice = voice;
  utter.rate = 0.85; // 教学场景稍慢
  utter.pitch = 1.05;
  synth.speak(utter);
}

/** 立即停止播报 */
export function cancelStrokeVoice(): void {
  if (isStrokeVoiceSupported()) window.speechSynthesis.cancel();
}