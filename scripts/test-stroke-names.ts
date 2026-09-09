/**
 * 笔名分类器验证脚本（一次性）
 * 运行：node --experimental-strip-types scripts/test-stroke-names.ts
 * 数据：/tmp/{新}.json（hanzi-writer-data@2.0.1）
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { strokeNameFromMedians } from "../src/utils/strokeName.ts";

interface CharData {
  strokes: string[];
  medians: number[][][];
}

const files = readdirSync("/tmp").filter((f) => f.endsWith(".json") && f !== "test_dl.json" && f !== "yong.json" && f !== "font_compare.png");
// yong.json 改名兼容
if (existsSync("/tmp/永.json")) files.push("永.json");

let fail = 0;
for (const file of files.sort()) {
  const char = file.slice(0, -5);
  try {
    const d = JSON.parse(readFileSync(`/tmp/${file}`, "utf8")) as CharData;
    if (!d.strokes || d.strokes.length === 0) continue;
    const names = d.strokes.map((p, i) =>
      strokeNameFromMedians(d.medians[i] as [number, number][], p) ?? "?"
    );
    if (names.includes("?")) fail++;
    console.log(`${char.padEnd(2)} (${d.strokes.length}): ${names.join(" ")}`);
  } catch (e) {
    console.log(`${char}: ERR ${String(e).slice(0, 60)}`); fail++;
  }
}
console.log(fail === 0 ? "\n全部解析成功" : `\n${fail} 处异常`);
