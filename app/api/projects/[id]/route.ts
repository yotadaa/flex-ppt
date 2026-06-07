import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../../src/server/auth";
import { deleteProject, getProject, updateProject } from "../../../../src/server/projectsRepository";
import { hasDatabaseProviders } from "../../../../src/server/database";

export const runtime = "nodejs";

type ProjectRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: ProjectRouteContext) {
  const user = await requireAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasDatabaseProviders()) return NextResponse.json({ project: null, configured: false });

  const { id } = await context.params;
  const project = await getProject(user, id);
  return project ? NextResponse.json({ project, configured: true }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function PATCH(request: Request, context: ProjectRouteContext) {
  const user = await requireAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasDatabaseProviders()) return NextResponse.json({ error: "No database provider configured" }, { status: 503 });

  const { id } = await context.params;
  const input = await request.json();
  const project = await updateProject(user, id, input);
  return project ? NextResponse.json({ project }) : NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function DELETE(request: Request, context: ProjectRouteContext) {
  const user = await requireAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasDatabaseProviders()) return NextResponse.json({ error: "No database provider configured" }, { status: 503 });

  const { id } = await context.params;
  const deleted = await deleteProject(user, id);
  return NextResponse.json({ deleted });
}

