# macOS And Canva Reference Research

Date: 2026-06-08

This research note captures the visual references and implementation decisions for the Flex-PPT dashboard and editor shell. The target is mac-ish, not a literal macOS clone: calm grouped navigation, restrained material layers, native-feeling controls, and a project dashboard inspired by Canva's information architecture.

## Sources Reviewed

- Apple Human Interface Guidelines: Materials  
  <https://developer.apple.com/design/Human-Interface-Guidelines/materials?changes=_2_5>
- Apple Human Interface Guidelines: Toolbars  
  <https://developer.apple.com/design/Human-Interface-Guidelines/toolbars?changes=_8>
- Apple Human Interface Guidelines: Sidebars  
  <https://developer.apple.com/design/Human-Interface-Guidelines/sidebars?changes=la_11>
- Supabase Auth with Next.js quickstart, for auth architecture alignment  
  <https://supabase.com/docs/guides/auth/quickstarts/nextjs>
- Supabase JavaScript signUp docs, for email/password behavior and no-confirmation note  
  <https://supabase.com/docs/client/auth-signup>
- Supabase auth helpers to SSR migration note, for current package choice  
  <https://supabase.com/docs/guides/troubleshooting/how-to-migrate-from-supabase-auth-helpers-to-ssr-package-5NRunM>
- Next.js App Router docs and Route Handlers docs, for the conversion route  
  <https://nextjs.org/docs/app>  
  <https://nextjs.org/docs/app/getting-started/route-handlers>
- Public screenshot/reference pages discovered during visual research:
  - System Settings overview with sidebar pattern: <https://en.wikipedia.org/wiki/System_Settings>
  - Apple Notes support page with notes sidebar/list/detail pattern: <https://support.apple.com/en-sg/guide/notes/apd8b73d28be/mac>
  - Wikimedia Finder/About Finder screenshot reference: <https://commons.wikimedia.org/wiki/File:About_Finder_window.png>
  - SwiftoDo macOS screenshots for native multi-pane desktop app density: <https://swiftodoapp.com/desktop/macos-screenshots/>
  - Canva-like dashboard screenshots provided by the user in this thread.

## macOS Design Principles To Apply

1. Material is structural, not decorative.
   - Use translucent or glass-like surfaces for titlebar, sidebar, inspector, modal, and dashboard rails.
   - Keep the slide canvas and card thumbnails sufficiently opaque for readability.
   - Avoid making content itself too transparent.

2. Toolbars orient and expose frequent actions.
   - Use a two-layer editor chrome: a compact titlebar plus a task toolbar/progress row.
   - Keep frequently used commands visible: navigation, search, undo/redo, command palette, fullscreen, settings.
   - Move less common operations into menus/panels.

3. Sidebars should show information hierarchy.
   - Use grouped section headers in the project dashboard and slide rail.
   - Avoid a flat endless list when categories exist.
   - Keep item labels compact, with ellipsis for long project names.

4. Native-feeling controls beat decorative labels.
   - Icon buttons for commands.
   - Segmented controls for modes.
   - Menus for option sets.
   - Toggles for binary settings.
   - Traffic-light chrome on modal/window-like surfaces.

5. Motion should orient.
   - Slide transitions, dashboard view switches, modal entry, and command palette entry should feel quick and spatial.
   - Avoid constant ambient motion in work surfaces.

## Canva Dashboard References To Apply

The user-provided screenshots emphasize:

- Left vertical global nav with Create/Home/Projects/Templates-like destinations.
- Secondary rail for project/folder context.
- Large search field centered in the first viewport.
- Recents row with thumbnails and metadata.
- Designs grid with clear preview cards.
- Filter controls for owner/type/date and sort/view controls.
- Private/shared labels and owner badges.

Flex-PPT adaptation:

- Use "Create", "Home", "Projects", "Templates", "AI", "Trash" as nav language, but route them to Flex-PPT features.
- Make "Projects" the default authenticated page.
- Use actual Flex-PPT seed project cards based on the current 45-slide deck, not fake marketing cards.
- Create button opens a new presentation project and can later choose template size.
- Search filters project titles and slide content metadata.

## Implementation Decisions

1. Next.js conversion
   - Use App Router.
   - Keep existing `src/components`, `src/hooks`, `src/utils`, and static `public/data`.
   - Move global style imports into `app/layout.tsx`.
   - Replace Vite-only environment access with Next-compatible utilities.
   - Use port `5999` for dev and start scripts.

2. Auth
   - Use Supabase email/password only.
   - No OAuth, phone, magic link, or confirmation UI.
   - Supabase project setting must have email confirmation disabled; when disabled, `signUp` returns a session immediately.
   - The UI handles the fallback case where Supabase still returns a user but no session by telling the user to disable confirmation in the Supabase dashboard.

3. Database and provider round robin
   - Parse comma-separated `DATABASE_URL` and `DIRECT_URL`.
   - Randomize the initial provider index on server start.
   - Advance provider selection round-robin for writes.
   - Store `provider` on every application table.
   - Aggregate project reads across configured providers when possible.

4. Dynamic slide containers
   - Add first-class containers independent from existing base images/cards.
   - Container types: HTML, SVG, image.
   - Containers have x/y/width/height/z/depth/visibility/lock/provider.
   - User can add a blank HTML container, edit the HTML, import an image URL/file, ask AI for HTML structure, or ask AI for SVG.
   - AI generation uses `llm_endpoint` and `llm_api_key` from env through a server route, never directly from the browser.

5. Mac-ish visual system
   - Dashboard uses a window-like shell, traffic lights, translucent sidebars, centered search, compact controls, and project thumbnails.
   - Editor uses a more native titlebar but preserves existing slide canvas behavior.
   - Controls keep high contrast and stable dimensions.

## Audit Checklist

- Auth screen renders when unauthenticated and never exposes server secrets.
- Dashboard renders after session or demo mode and resembles the user-provided Canva structure.
- Project cards open the editor without losing existing slide functionality.
- Existing 45 slides render and search works.
- Layer editing still works.
- New containers can be created, edited, moved, resized, hidden, duplicated, and rendered.
- AI route returns structured HTML/SVG or a deterministic fallback when LLM env is absent.
- `npm run build` passes.
- Browser validation at `http://127.0.0.1:5999` has no runtime crash.

