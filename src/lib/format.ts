const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/London",
  weekday: "short",
  day: "2-digit",
  month: "short",
});

export function formatUkKickoff(isoUtc: string) {
  return `${dateTimeFormatter.format(new Date(isoUtc))} UK`;
}

export function formatUkDate(isoUtc: string) {
  return dateFormatter.format(new Date(isoUtc));
}

export function formatStageLabel(stage: string) {
  return stage.replace("-", " ");
}