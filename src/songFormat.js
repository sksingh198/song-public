export function songToText(song) {
  const lines = [
    song.title,
    `${song.language} · ${song.genre} · ${song.mood} · ${song.bpm} BPM · Key ${song.key}`,
    `Vocal: ${song.vocalStyle}`,
    song.rhymeNotes,
    "",
  ];
  for (const section of song.sections) {
    lines.push(`[${section.name}]`);
    lines.push(section.chords.join("  |  "));
    for (const lyric of section.lyrics) {
      lines.push(lyric.text);
    }
    lines.push("");
  }
  return lines.join("\n").trim();
}
