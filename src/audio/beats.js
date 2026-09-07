export function sectionBeats(section) {
  const bars = Number(section?.bars) || 0;
  return Math.max(0, bars) * 4;
}

export function songTimeline(sections) {
  let cursor = 0;
  const mapped = (sections || []).map((section) => {
    const beats = sectionBeats(section);
    const entry = {
      id: section.id,
      type: section.type,
      startBeat: cursor,
      beats,
    };
    cursor += beats;
    return entry;
  });
  return { totalBeats: cursor, sections: mapped };
}

export function beatToSeconds(beat, bpm) {
  return (beat * 60) / bpm;
}

export function sectionAtBeat(timeline, beat) {
  return timeline.sections.find((s) => beat >= s.startBeat && beat < s.startBeat + s.beats) || null;
}
