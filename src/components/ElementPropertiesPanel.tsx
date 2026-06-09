import {
  ArrowPathIcon,
  CodeBracketSquareIcon,
  CubeTransparentIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  LockOpenIcon,
  PaintBrushIcon,
  RectangleGroupIcon,
  SquaresPlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useMemo } from "react";
import type { ReactNode } from "react";
import type { ComponentDefinition, DesignShape, SlideComment, SlideContainer, TextShapeRole } from "../types";
import { AppButton, ColorField, NumberStepper, SelectMenu, TextField } from "./ui/controls";

type ElementPropertiesPanelProps = {
  selectedLayerId: string | null;
  shapes: DesignShape[];
  comments: SlideComment[];
  containers: SlideContainer[];
  components: ComponentDefinition[];
  onUpdateShape: (id: string, patch: Partial<DesignShape>) => void;
  onDeleteShape: (id: string) => void;
  onDuplicateShape: (id: string) => void;
  onUpdateComment: (id: string, patch: Partial<SlideComment>) => void;
  onDeleteComment: (id: string) => void;
  onUpdateContainer: (id: string, patch: Partial<SlideContainer>, saveHistory?: boolean, historyBeforePatch?: Partial<SlideContainer>) => void;
  onDeleteContainer: (id: string) => void;
  onDuplicateContainer: (id: string) => void;
  onCreateComponent: () => void;
};

const textRoleOptions: Array<{ value: TextShapeRole; label: string; note: string }> = [
  { value: "body", label: "Body", note: "Regular slide text" },
  { value: "heading", label: "Heading", note: "Large title style" },
  { value: "subheading", label: "Sub-heading", note: "Section lead style" },
];

export default function ElementPropertiesPanel({
  selectedLayerId,
  shapes,
  comments,
  containers,
  components,
  onUpdateShape,
  onDeleteShape,
  onDuplicateShape,
  onUpdateComment,
  onDeleteComment,
  onUpdateContainer,
  onDeleteContainer,
  onDuplicateContainer,
  onCreateComponent,
}: ElementPropertiesPanelProps) {
  const selectedShape = useMemo(() => shapes.find((shape) => shape.id === selectedLayerId) || null, [selectedLayerId, shapes]);
  const selectedComment = useMemo(() => comments.find((comment) => comment.id === selectedLayerId) || null, [selectedLayerId, comments]);
  const selectedContainer = useMemo(() => containers.find((container) => container.id === selectedLayerId) || null, [selectedLayerId, containers]);
  const component = useMemo(
    () => components.find((item) => item.sourceId === selectedLayerId) || null,
    [components, selectedLayerId],
  );

  if (selectedShape) {
    return (
      <section className="properties-panel" aria-label="Selected shape properties">
        <PanelHeader icon={<RectangleGroupIcon aria-hidden="true" />} title={selectedShape.name} subtitle={selectedShape.kind} />
        <PropertySection title="Position">
          <div className="property-grid">
            <NumberStepper label="X" min={0} max={95} value={Math.round(selectedShape.x)} onChange={(value) => onUpdateShape(selectedShape.id, { x: value })} />
            <NumberStepper label="Y" min={0} max={92} value={Math.round(selectedShape.y)} onChange={(value) => onUpdateShape(selectedShape.id, { y: value })} />
            <NumberStepper label="R" min={-360} max={360} value={Math.round(selectedShape.rotation)} onChange={(value) => onUpdateShape(selectedShape.id, { rotation: value })} />
            <NumberStepper label="Z" min={1} max={999} value={selectedShape.zIndex} onChange={(value) => onUpdateShape(selectedShape.id, { zIndex: value })} />
          </div>
        </PropertySection>
        <PropertySection title="Layout">
          <div className="property-grid">
            <NumberStepper label="W" min={2} max={96} value={Math.round(selectedShape.width)} onChange={(value) => onUpdateShape(selectedShape.id, { width: value })} />
            <NumberStepper label="H" min={2} max={88} value={Math.round(selectedShape.height)} onChange={(value) => onUpdateShape(selectedShape.id, { height: value })} />
            <NumberStepper label="Radius" min={0} max={80} value={Math.round(selectedShape.cornerRadius)} onChange={(value) => onUpdateShape(selectedShape.id, { cornerRadius: value })} />
            <NumberStepper label="Opacity" min={0} max={100} value={Math.round(selectedShape.opacity * 100)} onChange={(value) => onUpdateShape(selectedShape.id, { opacity: value / 100 })} />
          </div>
        </PropertySection>
        <PropertySection title="Appearance">
          <ColorField label="Fill" value={colorInputValue(selectedShape.fill, selectedShape.kind === "text" ? "#111827" : "#f8fafc")} onChange={(value) => onUpdateShape(selectedShape.id, { fill: value })} icon={<PaintBrushIcon aria-hidden="true" />} />
          <ColorField label="Stroke" value={colorInputValue(selectedShape.stroke, "#0f172a")} onChange={(value) => onUpdateShape(selectedShape.id, { stroke: value })} />
          <NumberStepper label="Stroke width" min={0} max={24} step={0.5} value={selectedShape.strokeWidth} onChange={(value) => onUpdateShape(selectedShape.id, { strokeWidth: value })} />
          {selectedShape.kind === "text" ? (
            <>
              <SelectMenu label="Role" value={selectedShape.textRole || "body"} options={textRoleOptions} onChange={(value) => {
                const preset = textRolePreset(value);
                onUpdateShape(selectedShape.id, { textRole: value, ...preset });
              }} />
              <div className="property-grid">
                <NumberStepper label="Size" min={8} max={120} value={Math.round(selectedShape.fontSize ?? 28)} onChange={(value) => onUpdateShape(selectedShape.id, { fontSize: value })} />
                <NumberStepper label="Weight" min={100} max={950} step={50} value={selectedShape.fontWeight ?? 700} onChange={(value) => onUpdateShape(selectedShape.id, { fontWeight: value })} />
              </div>
              <TextField label="Text" value={selectedShape.text} onChange={(event) => onUpdateShape(selectedShape.id, { text: event.target.value })} />
            </>
          ) : null}
        </PropertySection>
        <PropertySection title="Component">
          <div className="property-actions">
            <AppButton size="sm" icon={<CubeTransparentIcon aria-hidden="true" />} disabled={Boolean(component)} onClick={onCreateComponent}>
              {component ? component.name : "Make component"}
            </AppButton>
            <AppButton size="sm" icon={selectedShape.visible ? <EyeSlashIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />} onClick={() => onUpdateShape(selectedShape.id, { visible: !selectedShape.visible })}>
              {selectedShape.visible ? "Hide" : "Show"}
            </AppButton>
            <AppButton size="sm" icon={selectedShape.locked ? <LockOpenIcon aria-hidden="true" /> : <LockClosedIcon aria-hidden="true" />} onClick={() => onUpdateShape(selectedShape.id, { locked: !selectedShape.locked })}>
              {selectedShape.locked ? "Unlock" : "Lock"}
            </AppButton>
            <AppButton size="sm" icon={<SquaresPlusIcon aria-hidden="true" />} onClick={() => onDuplicateShape(selectedShape.id)}>Duplicate</AppButton>
            <AppButton size="sm" variant="danger" icon={<TrashIcon aria-hidden="true" />} onClick={() => onDeleteShape(selectedShape.id)}>Delete</AppButton>
          </div>
        </PropertySection>
      </section>
    );
  }

  if (selectedContainer) {
    return (
      <section className="properties-panel" aria-label="Selected container properties">
        <PanelHeader icon={<CodeBracketSquareIcon aria-hidden="true" />} title={selectedContainer.name} subtitle={`${selectedContainer.kind} container`} />
        <PropertySection title="Position">
          <div className="property-grid">
            <NumberStepper label="X" min={0} max={95} value={Math.round(selectedContainer.x)} onChange={(value) => onUpdateContainer(selectedContainer.id, { x: value })} />
            <NumberStepper label="Y" min={0} max={92} value={Math.round(selectedContainer.y)} onChange={(value) => onUpdateContainer(selectedContainer.id, { y: value })} />
            <NumberStepper label="Z" min={1} max={999} value={selectedContainer.zIndex} onChange={(value) => onUpdateContainer(selectedContainer.id, { zIndex: value })} />
          </div>
        </PropertySection>
        <PropertySection title="Layout">
          <div className="property-grid">
            <NumberStepper label="W" min={4} max={95} value={Math.round(selectedContainer.width)} onChange={(value) => onUpdateContainer(selectedContainer.id, { width: value })} />
            <NumberStepper label="H" min={3} max={82} value={Math.round(selectedContainer.height)} onChange={(value) => onUpdateContainer(selectedContainer.id, { height: value })} />
          </div>
        </PropertySection>
        <PropertySection title="Actions">
          <div className="property-actions">
            <AppButton size="sm" icon={<CubeTransparentIcon aria-hidden="true" />} disabled={Boolean(component)} onClick={onCreateComponent}>
              {component ? component.name : "Make component"}
            </AppButton>
            <AppButton size="sm" icon={selectedContainer.visible ? <EyeSlashIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />} onClick={() => onUpdateContainer(selectedContainer.id, { visible: !selectedContainer.visible })}>
              {selectedContainer.visible ? "Hide" : "Show"}
            </AppButton>
            <AppButton size="sm" icon={selectedContainer.locked ? <LockOpenIcon aria-hidden="true" /> : <LockClosedIcon aria-hidden="true" />} onClick={() => onUpdateContainer(selectedContainer.id, { locked: !selectedContainer.locked })}>
              {selectedContainer.locked ? "Unlock" : "Lock"}
            </AppButton>
            <AppButton size="sm" icon={<ArrowPathIcon aria-hidden="true" />} onClick={() => onUpdateContainer(selectedContainer.id, { depth: selectedContainer.depth === "back" ? "front" : "back" })}>
              {selectedContainer.depth === "back" ? "Front depth" : "Back depth"}
            </AppButton>
            <AppButton size="sm" icon={<SquaresPlusIcon aria-hidden="true" />} onClick={() => onDuplicateContainer(selectedContainer.id)}>Duplicate</AppButton>
            <AppButton size="sm" variant="danger" icon={<TrashIcon aria-hidden="true" />} onClick={() => onDeleteContainer(selectedContainer.id)}>Delete</AppButton>
          </div>
        </PropertySection>
      </section>
    );
  }

  if (selectedComment) {
    return (
      <section className="properties-panel" aria-label="Selected comment properties">
        <PanelHeader icon={<CubeTransparentIcon aria-hidden="true" />} title="Comment" subtitle={selectedComment.authorEmail} />
        <PropertySection title="Position">
          <div className="property-grid">
            <NumberStepper label="X" min={0} max={95} value={Math.round(selectedComment.x)} onChange={(value) => onUpdateComment(selectedComment.id, { x: value })} />
            <NumberStepper label="Y" min={0} max={92} value={Math.round(selectedComment.y)} onChange={(value) => onUpdateComment(selectedComment.id, { y: value })} />
          </div>
        </PropertySection>
        <PropertySection title="Thread">
          <label className="container-textarea">
            <span>Comment</span>
            <textarea value={selectedComment.text} onChange={(event) => onUpdateComment(selectedComment.id, { text: event.target.value })} />
          </label>
          <div className="property-actions">
            <AppButton size="sm" onClick={() => onUpdateComment(selectedComment.id, { resolved: !selectedComment.resolved })}>
              {selectedComment.resolved ? "Reopen" : "Resolve"}
            </AppButton>
            <AppButton size="sm" variant="danger" icon={<TrashIcon aria-hidden="true" />} onClick={() => onDeleteComment(selectedComment.id)}>Delete</AppButton>
          </div>
        </PropertySection>
      </section>
    );
  }

  return (
    <section className="properties-panel empty-properties" aria-label="No selected element">
      <PanelHeader icon={<RectangleGroupIcon aria-hidden="true" />} title="No selection" subtitle="Select a shape, container, comment, or layer." />
    </section>
  );
}

function PanelHeader({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <header className="properties-head">
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <small>{subtitle}</small>
      </div>
    </header>
  );
}

function textRolePreset(role: TextShapeRole): Partial<DesignShape> {
  if (role === "heading") return { fontSize: 56, fontWeight: 850, height: 12 };
  if (role === "subheading") return { fontSize: 34, fontWeight: 720, height: 9 };
  return { fontSize: 28, fontWeight: 650, height: 8 };
}

function colorInputValue(value: string, fallback: string) {
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function PropertySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="property-section">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
