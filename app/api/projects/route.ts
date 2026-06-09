import { NextResponse } from "next/server";
import { requireProjectUser } from "../../../src/server/auth";
import { createProject, listProjects } from "../../../src/server/projectsRepository";
import { databaseRuntimeSummary, hasDatabaseProviders } from "../../../src/server/database";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const user = await requireProjectUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const database = databaseRuntimeSummary();
    if (!hasDatabaseProviders()) return NextResponse.json({ projects: [], configured: false, database });

    const projects = await listProjects(user);
    return NextResponse.json({ projects, configured: true, database });
  } catch (error) {
    return NextResponse.json({ projects: [], configured: false, database: databaseRuntimeSummary(), error: error instanceof Error ? error.message : String(error) });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireProjectUser(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const database = databaseRuntimeSummary();
    if (!hasDatabaseProviders()) return NextResponse.json({ project: null, configured: false, database, error: "No database provider configured" });

    const input = await request.json();
    const project = await createProject(user, input);
    return NextResponse.json({ project, configured: true, database }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ project: null, configured: false, database: databaseRuntimeSummary(), error: error instanceof Error ? error.message : String(error) });
  }
}
