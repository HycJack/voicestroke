/**
 * 笔名分类器 —— 根据 hanzi-writer 字数据的 medians（笔划中线）识别每笔名称。
 *
 * 坐标系：hanzi-writer-data 使用 y-up（y 越大越靠上）。
 * 局限：hanzi-writer 的 stroke path 是闭合轮廓、medians 常缺转折/钩细节，
 *       因此本分类器为**几何启发式近似**：
 *       - 单基本上限（横/竖/撇/捺/点/提）覆盖良好
 *       - 「横折」类用轮廓宽高比辅助（宽明显大于高）
 *       - 钩用窄高比启发（竖笔特窄 → 竖钩）
 *       对复杂复合笔（如「马」的竖折折钩）输出近似名。
 */

export type StrokePoint = [number, number];

interface RawSegment {
  from: StrokePoint;
  to: StrokePoint;
  len: number;
  angle: number; // atan2 弧度，0=右，+PI/2=上(y-up)，-PI/2=下
}

/* ---------- medians 几何 ---------- */

function dist(a: StrokePoint, b: StrokePoint): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

function polylineLen(pts: StrokePoint[]): number {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]);
  return s;
}

/** 方向变化 ≥ 阈值切段 */
function splitSegments(pts: StrokePoint[]): RawSegment[] {
  const out: RawSegment[] = [];
  let start = pts[0];
  let prevAngle: number | null = null;

  for (let i = 1; i < pts.length; i++) {
    const end = pts[i];
    const len = dist(start, end);
    if (len < 1e-3) continue;
    const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);

    if (prevAngle !== null) {
      let diff = Math.abs(angle - prevAngle) % (Math.PI * 2);
      if (diff > Math.PI) diff = Math.PI * 2 - diff;
      if (diff >= Math.PI * 0.22) {
        out.push({
          from: start,
          to: pts[i - 1],
          len: dist(start, pts[i - 1]),
          angle: prevAngle,
        });
        start = pts[i - 1];
      }
    }
    prevAngle = angle;
    if (i === pts.length - 1) {
      out.push({ from: start, to: end, len, angle });
    }
  }
  if (out.length === 0 && pts.length >= 2) {
    out.push({ from: pts[0], to: pts[pts.length - 1], len: dist(pts[0], pts[pts.length - 1]), angle: Math.atan2(pts[pts.length - 1][1] - pts[0][1], pts[pts.length - 1][0] - pts[0][0]) });
  }
  return out;
}

/** 合并几乎同向的相邻段（消除顿笔/拐点轻微回摆） */
function mergeNearParallel(segs: RawSegment[]): RawSegment[] {
  const out: RawSegment[] = [];
  for (const s of segs) {
    if (out.length === 0) {
      out.push(s);
      continue;
    }
    const prev = out[out.length - 1];
    let diff = Math.abs(s.angle - prev.angle) % (Math.PI * 2);
    if (diff > Math.PI) diff = Math.PI * 2 - diff;
    if (diff < Math.PI * 0.06) {
      out[out.length - 1] = {
        from: prev.from,
        to: s.to,
        len: dist(prev.from, s.to),
        angle: Math.atan2(s.to[1] - prev.from[1], s.to[0] - prev.from[0]),
      };
    } else {
      out.push(s);
    }
  }
  return out;
}

/* ---------- 轮廓 bbox（辅助判「横折」） ---------- */

interface BBox {
  w: number;
  h: number;
  aspect: number; // 宽高比
}

/** 从闭合轮廓 path 取数字包围盒（含控制点，方向上足够稳） */
export function contourBbox(pathD: string): BBox | null {
  const nums = pathD.match(/-?\d*\.?\d+(?:e-?\d+)?/g);
  if (!nums || nums.length < 4) return null;
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = parseFloat(nums[i]);
    const y = parseFloat(nums[i + 1]);
    if (Number.isNaN(x) || Number.isNaN(y)) continue;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  const w = maxX - minX;
  const h = maxY - minY;
  if (w <= 0 || h <= 0) return null;
  return { w, h, aspect: w / h };
}

/* ---------- 方向分类 ---------- */

/** aspect：轮廓宽高比，用于区分「横折」（扁）与被误归为横折的斜笔 */
function classifyDirection(dx: number, dy: number, aspect?: number): string {
  const slope = Math.abs(dy) / Math.max(Math.abs(dx), 1e-3);
  const absDx = Math.abs(dx);

  if (slope < 0.25) {
    // 近水平 → 横（右上坡度过小不构成提）
    return "横";
  }
  if (slope > 2.4 && absDx < 220) return "竖";
  if (dx > 0 && dy > 0) return "提";
  if (dx < 0 && dy < 0) return "撇";
  if (dx > 0 && dy < 0) {
    // 右下斜：极扁轮廓 → 横折（横+竖 合成）；否则 捺
    return aspect !== undefined && aspect >= 1.6 ? "横折" : "捺";
  }
  return "竖"; // 左上（罕见回笔）
}

/** 两段组合命名 */
function combine2(a: string, b: string): string {
  const pair = a + b;
  const TABLE: Record<string, string> = {
    横竖: "横折",
    竖横: "竖折",
    横撇: "横撇",
    横捺: "横撇",
    竖撇: "竖撇",
    竖提: "竖提",
    撇点: "撇点",
    撇横: "撇折",
    撇捺: "撇捺",
    横提: "横折提",
    竖竖: "竖折",
  };
  return TABLE[pair] ?? a + b;
}

/* ---------- 主入口 ---------- */

/**
 * 由单笔的 medians 识别笔名。
 * pathD 可选：提供该笔的 SVG outline path 用于宽高比辅助（横折识别）。
 */
export function strokeNameFromMedians(
  medians: StrokePoint[] | null | undefined,
  pathD?: string
): string | null {
  if (!medians || medians.length < 2) return null;

  const total = polylineLen(medians);
  if (total < 1) return null;

  const bbox = pathD ? contourBbox(pathD) : null;
  const aspect = bbox?.aspect;

  // 点：整笔很短、近垂直落点或轻斜短点
  const raw = splitSegments(medians);
  const merged = mergeNearParallel(raw);
  const MIN_FRAG = Math.max(45, total * 0.12);
  const tail = merged.length ? merged[merged.length - 1] : null;
  let segments = merged.filter((s) => s === tail || s.len >= MIN_FRAG);
  if (segments.length === 0) segments = merged;

  if (segments.length === 1) {
    const s = segments[0];
    const dx = s.to[0] - s.from[0];
    const dy = s.to[1] - s.from[1];
    const slope = Math.abs(dy) / Math.max(Math.abs(dx), 1e-3);
    if (total < 170 && slope > 0.5) return "点";
    const name = classifyDirection(dx, dy, aspect);
    return name;
  }

  const names = segments.map((s) =>
    classifyDirection(s.to[0] - s.from[0], s.to[1] - s.from[1])
  );

  // 钩检测：尾段上挑（dy>0）且较短（medians 含钩时）
  const isHook =
    segments.length >= 2 &&
    tail !== null &&
    tail.len < Math.max(150, total * 0.28) &&
    tail.to[1] - tail.from[1] > Math.abs(tail.to[0] - tail.from[0]) * 0.7;

  const seq = isHook ? names.slice(0, -1) : names;

  if (seq.length === 1) {
    return isHook ? `${seq[0]}钩` : seq[0];
  }
  // 折笔画典型：竖→横→竖（竖折折）／横→竖→横（横折折）
  if (seq.length === 3 && seq[0] === "竖" && seq[1] === "横" && seq[2] === "竖") {
    return isHook ? "竖折折钩" : "竖折折";
  }
  if (seq.length === 3 && seq[0] === "横" && seq[1] === "竖" && seq[2] === "横") {
    return isHook ? "横折折钩" : "横折折";
  }
  let out = seq[0];
  for (let i = 1; i < seq.length; i++) out = combine2(out, seq[i]);
  if (isHook) out += "钩";
  return out;
}