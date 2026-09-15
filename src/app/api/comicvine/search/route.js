export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const offset = searchParams.get("offset") ?? "0";

  if (!q) return Response.json({ error: "No query" }, { status: 400 });

  const url = `https://comicvine.gamespot.com/api/volumes/?api_key=${process.env.COMICVINE_API_KEY}&format=json&filter=name:${encodeURIComponent(q)}&field_list=id,name,publisher,start_year,count_of_issues,image,description&limit=25&offset=${offset}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "NearMint/1.0" },
  });

  if (!res.ok) {
    return Response.json({ error: "ComicVine error" }, { status: 500 });
  }

  const data = await res.json();
  const volumes = data.results ?? [];

  // Sort: exact title matches first, then starts-with, then everything else
  const q_lower = q.toLowerCase().trim();
  const sorted = [...volumes].sort((a, b) => {
    const aName = a.name?.toLowerCase() ?? "";
    const bName = b.name?.toLowerCase() ?? "";
    const aExact = aName === q_lower;
    const bExact = bName === q_lower;
    const aStarts = aName.startsWith(q_lower);
    const bStarts = bName.startsWith(q_lower);

    if (aExact && !bExact) return -1;
    if (bExact && !aExact) return 1;
    if (aStarts && !bStarts) return -1;
    if (bStarts && !aStarts) return 1;
    return 0;
  });

  // Fetch people for each volume in parallel
  const volumesWithPeople = await Promise.all(
    sorted.map(async (volume) => {
      try {
        const detailUrl = `https://comicvine.gamespot.com/api/volume/4050-${volume.id}/?api_key=${process.env.COMICVINE_API_KEY}&format=json&field_list=people`;
        const detailRes = await fetch(detailUrl, {
          headers: { "User-Agent": "NearMint/1.0" },
        });
        const detailData = await detailRes.json();
        const people = detailData.results?.people ?? [];

        const creative_team = {
          writers: [],
          pencilers: [],
          colorists: [],
          letterers: [],
        };

        people.forEach(({ name, role }) => {
          const roles = role?.toLowerCase() ?? "";
          if (roles.includes("writer")) creative_team.writers.push(name);
          if (roles.includes("pencil")) creative_team.pencilers.push(name);
          if (roles.includes("color")) creative_team.colorists.push(name);
          if (roles.includes("letter")) creative_team.letterers.push(name);
        });

        return { ...volume, creative_team };
      } catch {
        return { ...volume, creative_team: {} };
      }
    })
  );

  return Response.json({
    results: volumesWithPeople,
    total: data.number_of_total_results ?? 0,
  });
}