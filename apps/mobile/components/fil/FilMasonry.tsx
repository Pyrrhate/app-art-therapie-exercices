import { useMemo } from "react";
import { useWindowDimensions, View } from "react-native";
import type { FilEntry } from "@/lib/fil/types";
import { estimateFilTileHeight, FilVisualTile } from "./FilVisualTile";

function distribute<T>(
  items: T[],
  columns: number,
  heightOf: (item: T) => number
): T[][] {
  const cols = Array.from({ length: columns }, () => [] as T[]);
  const heights = Array(columns).fill(0);
  for (const item of items) {
    let index = 0;
    for (let c = 1; c < columns; c++) {
      if (heights[c] < heights[index]) index = c;
    }
    cols[index].push(item);
    heights[index] += heightOf(item);
  }
  return cols;
}

interface FilMasonryProps {
  entries: FilEntry[];
  selectMode?: boolean;
  selectedIds?: string[];
  onPressEntry: (entry: FilEntry) => void;
}

export function FilMasonry({
  entries,
  selectMode = false,
  selectedIds = [],
  onPressEntry,
}: FilMasonryProps) {
  const { width } = useWindowDimensions();
  const columns = width >= 900 ? 3 : 2;

  const cols = useMemo(
    () => distribute(entries, columns, estimateFilTileHeight),
    [entries, columns]
  );

  return (
    <View className="flex-row gap-2 items-start">
      {cols.map((col, i) => (
        <View key={i} className="flex-1">
          {col.map((entry) => (
            <FilVisualTile
              key={entry.id}
              entry={entry}
              height={estimateFilTileHeight(entry)}
              selectMode={selectMode}
              selected={selectedIds.includes(entry.id)}
              onPress={() => onPressEntry(entry)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
