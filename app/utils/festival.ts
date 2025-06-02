type FestivalJa = {
  日付区分: "絶対日付" | "相対日付"; // recurrenceType
  開催月日?: string; // MM-DD
  開催月?: number; // 1〜12
  開催月第何週?: number; // 1〜5
  開催月何曜日?: string; // '日'〜'土'
  開始オフセット?: number;
  終了オフセット?: number;
};

export function weekdayStrToNumber(weekday: string): number {
  const map: Record<string, number> = {
    日: 0,
    月: 1,
    火: 2,
    水: 3,
    木: 4,
    金: 5,
    土: 6,
  };
  return map[weekday] ?? 0;
}

export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? -6 : 1 - day; // 月曜始まり
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function isBetween(date: Date, start: Date, end: Date): boolean {
  return date >= start && date <= end;
}

export function formatDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0"); // 月は 0 始まり
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

export function getCalculatedDateJa(
  festival: FestivalJa,
  referenceDate = new Date()
): Date[] {
  const results: Date[] = [];
  const currentYear = referenceDate.getFullYear();
  const weekStart = getStartOfWeek(referenceDate);
  const weekEnd = addDays(weekStart, 6);

  if (festival.日付区分 === "絶対日付" && festival.開催月日) {
    const fullDateStr = `${festival.開催月日}-${currentYear}`; // MM-DD-YYYY
    const parsed = new Date(fullDateStr);
    if (!isNaN(parsed.getTime())) {
      results.push(parsed);
    }
  } else if (festival.日付区分 === "相対日付") {
    const {
      開催月第何週 = 1,
      開催月何曜日 = "日",
      開始オフセット = 0,
      終了オフセット = 0,
      開催月,
    } = festival;

    if (開催月 === referenceDate.getMonth() + 1) {
      const weekdayNum = weekdayStrToNumber(開催月何曜日);
      const firstDayOfMonth = new Date(
        referenceDate.getFullYear(),
        開催月 - 1,
        1
      );
      const firstDayWeekday = firstDayOfMonth.getDay(); // 0=Sun, ..., 6=Sat

      const offsetToWeekday = (weekdayNum - firstDayWeekday + 7) % 7;
      const baseDate = new Date(firstDayOfMonth);
      baseDate.setDate(
        baseDate.getDate() + offsetToWeekday + 7 * (開催月第何週 - 1)
      );

      for (let i = 開始オフセット; i <= 終了オフセット; i++) {
        const d = addDays(baseDate, i);
        results.push(d);
      }
    }
  }

  return results;
}
