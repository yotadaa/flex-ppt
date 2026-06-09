import type { DashboardProject } from "../components/dashboard/projectData";
import { queryAllProviders, writePoolsInOrder, type SqlStatement } from "./database";
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
  updated_at: string | Date;
  owner_email: string;
};

type ProjectInput = Partial<Pick<DashboardProject, "title" | "description" | "type" | "category" | "thumbnail" | "visibility" | "slideCount" | "accent">>;

const projectFields = "id, provider, user_id, title, description, type, category, thumbnail, visibility, slide_count, accent, updated_at, owner_email";

const selectByUserSql: SqlStatement = {
  postgres: `select ${projectFields}
     from public.projects
     where user_id = $1
     order by updated_at desc`,
  mysql: `select ${projectFields}
     from projects
     where user_id = ?
     order by updated_at desc`,
};

const selectByIdSql: SqlStatement = {
  postgres: `select ${projectFields}
     from public.projects
     where id = $1 and user_id = $2`,
  mysql: `select ${projectFields}
     from projects
     where id = ? and user_id = ?`,
};

const insertSql: SqlStatement = {
  postgres: `insert into public.projects
          (id, provider, user_id, owner_email, title, description, type, category, thumbnail, visibility, slide_count, accent)
         values
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
  mysql: `insert into projects
          (id, provider, user_id, owner_email, title, description, type, category, thumbnail, visibility, slide_count, accent)
         values
          (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
};

const updateSql: SqlStatement = {
  postgres: `update public.projects
     set title = coalesce($3, title),
         description = coalesce($4, description),
         category = coalesce($5, category),
         thumbnail = coalesce($6, thumbnail),
         visibility = coalesce($7, visibility),
         accent = coalesce($8, accent),
         updated_at = now()
     where id = $1 and user_id = $2`,
  mysql: `update projects
     set title = coalesce(?, title),
         description = coalesce(?, description),
         category = coalesce(?, category),
         thumbnail = coalesce(?, thumbnail),
         visibility = coalesce(?, visibility),
         accent = coalesce(?, accent),
         updated_at = current_timestamp
     where id = ? and user_id = ?`,
};

const deleteSql: SqlStatement = {
  postgres: `delete from public.projects where id = $1 and user_id = $2`,
  mysql: `delete from projects where id = ? and user_id = ?`,
};

export async function listProjects(user: AuthenticatedUser): Promise<DashboardProject[]> {
  const results = await queryAllProviders<ProjectRow>(selectByUserSql, [user.id]);
  throwIfAllProvidersFailed(results);

  return results.flatMap((result) => result.rows.map(rowToProject));
}

export async function createProject(user: AuthenticatedUser, input: ProjectInput): Promise<DashboardProject> {
  const id = crypto.randomUUID();
  const targets = writePoolsInOrder();
  if (!targets.length) throw new Error("No database provider configured.");

  const errors: string[] = [];
  for (const target of targets) {
    try {
      await target.query<ProjectRow>(insertSql, [
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
      ]);

      const result = await target.query<ProjectRow>(selectByIdSql, [id, user.id]);
      const row = result.rows[0];
      if (!row) throw new Error("Project insert did not return a persisted row.");
      return rowToProject(row);
    } catch (error) {
      errors.push(`${target.provider.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`All database providers failed. ${errors.join(" | ")}`);
}

export async function getProject(user: AuthenticatedUser, id: string): Promise<DashboardProject | null> {
  const results = await queryAllProviders<ProjectRow>(selectByIdSql, [id, user.id]);
  throwIfAllProvidersFailed(results);

  const row = results.flatMap((result) => result.rows)[0];
  return row ? rowToProject(row) : null;
}

export async function updateProject(user: AuthenticatedUser, id: string, input: ProjectInput): Promise<DashboardProject | null> {
  const updateValuesByDialect = (dialect: "postgres" | "mysql") => (
    dialect === "mysql"
      ? [input.title, input.description, input.category, input.thumbnail, input.visibility, input.accent, id, user.id]
      : [id, user.id, input.title, input.description, input.category, input.thumbnail, input.visibility, input.accent]
  );

  const targets = writePoolsInOrder();
  if (!targets.length) throw new Error("No database provider configured.");

  const errors: string[] = [];
  for (const target of targets) {
    try {
      await target.query<ProjectRow>(updateSql, updateValuesByDialect(target.provider.dialect));
    } catch (error) {
      errors.push(`${target.provider.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  if (errors.length === targets.length) throw new Error(`All database providers failed. ${errors.join(" | ")}`);

  return getProject(user, id);
}

export async function deleteProject(user: AuthenticatedUser, id: string) {
  const results = await queryAllProviders<{ id: string }>(deleteSql, [id, user.id]);
  throwIfAllProvidersFailed(results);

  return results.some((result) => result.affectedRows > 0);
}

function rowToProject(row: ProjectRow): DashboardProject {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    ownerEmail: row.owner_email,
    type: row.type,
    category: row.category,
    updatedAt: normalizeTimestamp(row.updated_at),
    thumbnail: row.thumbnail,
    visibility: row.visibility,
    slideCount: Number(row.slide_count),
    provider: row.provider,
    accent: row.accent,
  };
}

function normalizeTimestamp(value: string | Date) {
  return value instanceof Date ? value.toISOString() : value;
}

function throwIfAllProvidersFailed(results: Array<{ provider: { name: string }; error?: Error }>) {
  if (results.length && results.every((result) => result.error)) {
    throw new Error(`All database providers failed. ${results.map((result) => `${result.provider.name}: ${result.error?.message}`).join(" | ")}`);
  }
}
