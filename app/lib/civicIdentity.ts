import { CIVIC_WORDS, STATE_ABBR } from "./constants";

export function generateCivicIdentity(state: string) {
  const stateAbbr = STATE_ABBR[state] || "US";

  const word =
    CIVIC_WORDS[Math.floor(Math.random() * CIVIC_WORDS.length)];

  const digits = Math.floor(1000 + Math.random() * 9000);

  return {
    state,
    stateAbbr,
    civicName: `${word}${digits}`,
    displayName: `${stateAbbr} • ${word}${digits}`,
  };
}