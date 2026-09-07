import { getAdminSession } from "@/lib/admin/auth";
import { getCmsSnapshotByRevision } from "@/lib/cms/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ revision: string }> },
) {
  if (!(await getAdminSession())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { revision: source } = await params;
  const revision = Number(source);

  if (!Number.isSafeInteger(revision) || revision < 0) {
    return new Response("Invalid revision", { status: 400 });
  }

  const snapshot = await getCmsSnapshotByRevision(revision);

  if (!snapshot) {
    return new Response("Snapshot not found", { status: 404 });
  }

  return new Response(`${JSON.stringify(snapshot, null, 2)}\n`, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="genlix-cms-revision-${revision}.json"`,
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
