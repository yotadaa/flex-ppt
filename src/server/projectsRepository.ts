import type { DashboardProject } from "../components/dashboard/projectData";
import { nextWritePool, queryAllProviders } from "./database";
import type { AuthenticatedUser } from "./auth";

type ProjectRow = {
  id: string;
  provider: string;
  user_id: string;
  title: string;
  description: string;
  type: DashboardProject["type"];
  category: string;
  thumbnail: string;
  visibility: DashboardProject["visibility"];
  slide_count: number;
  accent: string;
  updated_at: string;
  owner_email: string;
};

type ProjectInput = Partial<Pick<DashboardProject, "title" | "description" | "type" | "category" | "thumbnail" | "visibility" | "slideCount" | "accent">>;

export async function listProjects(user: AuthenticatedUser): Promise<DashboardProject[]> {
  const results = await queryAllProviders<ProjectRow>(
    `select id, provider, user_id, title, description, type, category, thumbnail, visibility, slide_count, accent, updated_at, owner_email
     from public.projects
     where user_id = $1
     order by updated_at desc`,
    [user.id],
  );

  return results.flatMap((result) => result.rows.map(rowToProject));
}

export async function createProject(user: AuthenticatedUser, input: ProjectInput): Promise<DashboardProject> {
  const id = crypto.randomUUID();
  const target = nextWritePool();
  if (!target) throw new Error("No database provider configured.");

  const result = await target.pool.query<ProjectRow>(
    `insert into public.projects
      (id, provider, user_id, owner_email, title, description, type, category, thumbnail, visibility, slide_count, accent)
     values
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     returning id, provider, user_id, title, description, type, category, thumbnail, visibility, slide_count, accent, updated_at, owner_email`,
    [
      id,
      target.provider.name,
      user.id,
      user.email,
      input.title || "Untitled Flex-PPT",
      input.description || "Presentation workspace baru.",
      input.type || "presentation",
      input.category || "Draft",
      input.thumbnail || "/assets/generated-concept/integrated-scheduling-pipeline.png",
      input.visibility || "private",
      input.slideCount || 1,
      input.accent || "#14b8a6",
    ],
  );

  const row = result.rows[0];
  if (!row) throw new Error("Project insert did not return a row.");

  return rowToProject(row);
}

export async function getProject(user: AuthenticatedUser, id: string): Promise<DashboardProject | null> {
  const results = await queryAllProviders<ProjectRow>(
    `select id, provider, user_id, title, description, type, category, thumbnail, visibility, slide_count, accent, updated_at, owner_email
     from public.projects
     where id = $1 and user_id = $2`,
    [id, user.id],
  );
  const row = results.flatMap((result) => result.rows)[0];
  return row ? rowToProject(row) : null;
}

export async function updateProject(user: AuthenticatedUser, id: string, input: ProjectInput): Promise<DashboardProject | null> {
  const results = await queryAllProviders<ProjectRow>(
    `update public.projects
     set title = coalesce($3, title),
         description = coalesce($4, description),
         category = coalesce($5, category),
         thumbnail = coalesce($6, thumbnail),
         visibility = coalesce($7, visibility),
         accent = coalesce($8, accent),
         updated_at = now()
     where id = $1 and user_id = $2
     returning id, provider, user_id, title, description, type, category, thumbnail, visibility, slide_count, accent, updated_at, owner_email`,
    [id, user.id, input.title, input.description, input.category, input.thumbnail, input.visibility, input.accent],
  );
  const row = results.flatMap((result) => result.rows)[0];
  return row ? rowToProject(row) : null;
}

export async function deleteProject(user: AuthenticatedUser, id: string) {
  const results = await queryAllProviders<{ id: string }>(
    `delete from public.projects where id = $1 and user_id = $2 returning id`,
    [id, user.id],
  );
  return results.some((result) => result.rows.length > 0);
}

function rowToProject(row: ProjectRow): DashboardProject {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    ownerEmail: row.owner_email,
    type: row.type,
    category: row.category,
    updatedAt: row.updated_at,
    thumbnail: row.thumbnail,
    visibility: row.visibility,
    slideCount: row.slide_count,
    provider: row.provider,
    accent: row.accent,
  };
}
