export async function loadGzipJson(url: string) {
  // 1. 圧縮データを取得
  const response = await fetch(url);

  if (!response.body) {
    throw new Error("この環境ではストリームがサポートされていません！");
  }

  // 2. GZIPデータを解凍
  const decompressedStream = response.body.pipeThrough(
    new DecompressionStream("gzip")
  );
  const reader = decompressedStream.getReader();

  // 3. データを文字列として構築
  let jsonString = "";
  const decoder = new TextDecoder();

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    jsonString += decoder.decode(value, { stream: true });
  }

  // 4. JSONとしてパースして返す
  return JSON.parse(jsonString);
}
