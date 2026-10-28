// Readings of the solved text, served from public/audio as mp3. Each section
// heading gets a play button; the two koans were recorded as two voices
// (narrator and master), one file per voice with a pause where the other
// voice speaks, and those files were cut at the pauses into one clip per line
// so each line has its own button and the dialogue plays in order.
//
// The headings are matched in order against the injected reading page; if the
// research repo's page changes shape, the build stops here rather than putting
// a button beside the wrong text.

type Entry = { tag: "h2" | "h3"; text: string; clips?: string[]; paras?: string[][] };

const a = (name: string) => `/audio/${name}.mp3`;

const KOAN_1: string[][] = [
  [a("koan1-n1")], // A man decided to go and study with a master...
  [a("koan1-m1")], // "Who are you who wishes to study here?"
  [a("koan1-n2")], // The student told the master his name.
  [a("koan1-m2")], // "That is not who you are, that is only what you are called..."
  [a("koan1-n3")], // The man thought for a moment, and replied, "I am a professor."
  [a("koan1-m3")], // "That is what you do, not who you are..."
  [a("koan1-n4")], // Confused, the man thought some more...
  [a("koan1-m4")], // "That is only your species, not who you are..."
  [a("koan1-n5")], // After a moment of thought, the professor replied...
  [a("koan1-m5")], // "That is merely what you are, not who you are..."
  [a("koan1-n6")], // The man was getting irritated...
  [a("koan1-n7"), a("koan1-m6")], // After a long pause the master replied, "Then you are welcome to come study."
];

const KOAN_2: string[][] = [
  [a("koan2-n1"), a("koan2-m1")], // During a lesson, the master explained the I. "The I is the voice of the circumference."
  [a("koan2-n2"), a("koan2-m2")], // When asked by a student..., the master said, "It is a voice inside your head."
  [a("koan2-n3")], // "I don't have a voice in my head," thought the student...
  [a("koan2-n4"), a("koan2-m3")], // The master stopped the student, and said, "The voice that just said..."
  [a("koan2-n5")], // And the students were enlightened.
];

const SCRIPT: Entry[] = [
  { tag: "h2", text: "A Warning", clips: [a("warning")] },
  { tag: "h2", text: "Welcome", clips: [a("welcome")] },
  { tag: "h3", text: "Wisdom", clips: [a("wisdom")] },
  { tag: "h3", text: "Some Wisdom" },
  { tag: "h3", text: "Know This" },
  { tag: "h2", text: "A Koan", clips: KOAN_1.flat(), paras: KOAN_1 },
  { tag: "h3", text: "An Instruction", clips: [a("koan1-n8")] },
  { tag: "h2", text: "The Loss of Divinity", clips: [a("loss-of-divinity")] },
  { tag: "h3", text: "Consumption", clips: [a("lod-consumption")] },
  { tag: "h3", text: "Preservation", clips: [a("lod-preservation")] },
  { tag: "h3", text: "Adherence", clips: [a("lod-adherence")] },
  { tag: "h3", text: "Some Wisdom", clips: [a("lod-some-wisdom")] },
  { tag: "h3", text: "An Instruction", clips: [a("lod-instruction")] },
  { tag: "h2", text: "A Koan", clips: KOAN_2.flat(), paras: KOAN_2 },
  { tag: "h3", text: "An Instruction", clips: [a("koan2-n6")] },
  { tag: "h3", text: "Know This" },
  { tag: "h2", text: "An End", clips: [a("end")] },
  { tag: "h2", text: "Parable", clips: [a("parable")] },
];

function button(clips: string[], label: string, cls: string): string {
  return `<button type="button" class="play ${cls}" data-clips="${clips.join("|")}" aria-label="${label}" aria-pressed="false"></button>`;
}

function lineLabel(clips: string[]): string {
  const voices = clips.map((c) => (/-m\d/.test(c) ? "master" : "narrator"));
  return `Play this line (${[...new Set(voices)].join(", then ")})`;
}

/** Adds play buttons to the reading page's headings and to each line of the two koans. */
export function injectAudio(html: string): string {
  let i = 0;
  let paras: string[][] | null = null;
  const out = html.replace(/<h([23])(?: class="red")?>([^<]*)<\/h[23]>|<p class="t[^"]*">/g, (m, lvl: string | undefined, text: string | undefined) => {
    if (lvl !== undefined) {
      const e = SCRIPT[i++];
      if (!e || e.tag !== `h${lvl}` || e.text !== text) {
        throw new Error(`audio: heading ${i} is h${lvl} "${text}" but the audio script expects ${e ? `${e.tag} "${e.text}"` : "no more headings"}`);
      }
      paras = e.paras ? e.paras.slice() : null;
      if (!e.clips) return m;
      const label = e.paras ? `Play the whole koan, line by line` : `Listen: ${text}`;
      return m.replace(`</h${lvl}>`, ` ${button(e.clips, label, "play-sec")}</h${lvl}>`);
    }
    if (!paras || paras.length === 0) return m;
    const clips = paras.shift() as string[];
    return m.replace(/ class="(t[^"]*)"/, ' class="$1 audio"') + button(clips, lineLabel(clips), "play-line");
  });
  if (i !== SCRIPT.length) throw new Error(`audio: the reading page has ${i} headings, the audio script lists ${SCRIPT.length}`);
  if (paras && (paras as string[][]).length) throw new Error("audio: a koan has fewer lines on the page than clips in the script");
  return out;
}

/** Every clip the script refers to, for the build-time existence check. */
export function audioFiles(): string[] {
  const all = new Set<string>();
  for (const e of SCRIPT) { e.clips?.forEach((c) => all.add(c)); e.paras?.flat().forEach((c) => all.add(c)); }
  return [...all].sort();
}
