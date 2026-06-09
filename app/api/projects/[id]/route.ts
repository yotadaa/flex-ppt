import { NextResponse } from "next/server";
import { requireProjectUser } from "../../../../src/server/auth";
import { deleteProject, getProject, updateProject } from "../../../../src/server/projectsRepository";
import { databaseRuntimeSummary, hasDatabaseProviders } from "../../../../src/server/database";

export const runtime = "nodejs";

type ProjectRouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: ProjectRouteContext) {
  try {
    const user = await requireProjectUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const database = databaseRuntimeSummary();
    if (!hasDatabaseProviders()) return NextResponse.json({ project: null, configured: false, database });

    const { id } = await context.params;
    const project = await getProject(user, id);
    return project ? NextResponse.json({ project, configured: true, database }) : NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ project: null, configured: false, database: databaseRuntimeSummary(), error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: ProjectRouteContext) {
  try {
    const user = await requireProjectUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const database = databaseRuntimeSummary();
    if (!hasDatabaseProviders()) return NextResponse.json({ error: "No database provider configured", database }, { status: 503 });

    const { id } = await context.params;
    const input = await request.json();
    const project = await updateProject(user, id, input);
    return project ? NextResponse.json({ project, configured: true, database }) : NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error), database: databaseRuntimeSummary() }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: ProjectRouteContext) {
  try {
    const user = await requireProjectUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const database = databaseRuntimeSummary();
    if (!hasDatabaseProviders()) return NextResponse.json({ error: "No database provider configured", database }, { status: 503 });

    const { id } = await context.params;
    const deleted = await deleteProject(user, id);
    return NextResponse.json({ deleted, configured: true, database });
  } catch (error) {
    return NextResponse.json({ deleted: false, database: databaseRuntimeSummary(), error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
