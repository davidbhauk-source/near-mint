const MATCHERS = {
  marvel: (p) => /^marvel/i.test(p ?? ""),
  dc: (p) => /^dc\b/i.test(p ?? ""),
  image: (p) => /^image/i.test(p ?? ""),
};

export function matchesPublisher(publisher, key) {
  if (!key || key.toLowerCase() === "all") return true;
  const fn = MATCHERS[key.toLowerCase()];
  return fn ? fn(publisher) : true;
}