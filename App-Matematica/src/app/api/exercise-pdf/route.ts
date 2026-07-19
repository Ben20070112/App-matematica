import type { NextRequest } from "next/server";

import { exercisePdfSources } from "@/lib/exercise-bank";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const topicId = request.nextUrl.searchParams.get("topic");
  const sourceUrl = topicId ? exercisePdfSources[topicId] : undefined;

  if (!sourceUrl) {
    return Response.json({ error: "Tema de exercício inválido." }, { status: 400 });
  }

  try {
    const upstream = await fetch(sourceUrl, {
      cache: "force-cache",
      headers: {
        Accept: "application/pdf",
        "User-Agent": "Plano-A-Matematica/1.0",
      },
    });

    if (!upstream.ok || !upstream.body) {
      return Response.json({ error: "Não foi possível carregar o enunciado." }, { status: 502 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
        "Content-Disposition": `inline; filename="${topicId}.pdf"`,
        "Content-Type": upstream.headers.get("content-type") ?? "application/pdf",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "Não foi possível ligar à fonte do enunciado." }, { status: 502 });
  }
}

