import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "../../../src/server/auth";
import { createProject, listProjects } from "../../../src/server/projectsRepository";
import { hasDatabaseProviders } from "../../../src/server/database";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const user = await requireAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasDatabaseProviders()) return NextResponse.json({ projects: [], configured: false });

  const projects = await listProjects(user);
  return NextResponse.json({ projects, configured: true });
}

export async function POST(request: Request) {
  const user = await requireAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasDatabaseProviders()) return NextResponse.json({ error: "No database provider configured" }, { status: 503 });

  const input = await request.json();
  const project = await createProject(user, input);
  return NextResponse.json({ project }, { status: 201 });
}

