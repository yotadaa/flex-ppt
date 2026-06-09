import { ArrowDownIcon, ArrowUpIcon, CodeBracketSquareIcon, DocumentDuplicateIcon, EyeIcon, EyeSlashIcon, LockClosedIcon, LockOpenIcon, RectangleStackIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { BaseElementLayer, BaseElementOverride, BaseImageLayer, BaseImageOverride, DesignShape, SlideComment, SlideContainer, SlideLayer } from "../types";
import { normalizeAssetUrl } from "../utils/slideDom";
import { AppButton, IconButton, NumberStepper } from "./ui/controls";

type LayerPanelProps = {
  layers: SlideLayer[];
  containers: SlideContainer[];
  shapes: DesignShape[];
  comments: SlideComment[];
  baseImages: BaseImageLayer[];
  baseElements: BaseElementLayer[];
  selectedLayerId: string | null;
  onSelectLayer: (id: string | null) => void;
  onUpdateLayer: (id: string, patch: Partial<SlideLayer>, saveHistory?: boolean, historyBeforePatch?: Partial<SlideLayer>) => void;
  onUpdateContainer: (id: string, patch: Partial<SlideContainer>, saveHistory?: boolean, historyBeforePatch?: Partial<SlideContainer>) => void;
  onDeleteLayer: (id: string) => void;
  onDeleteContainer: (id: string) => void;
  onDeleteBaseImage: (id: string) => void;
  onDeleteBaseElement: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onDuplicateContainer: (id: string) => void;
  onUpdateShape: (id: string, patch: Partial<DesignShape>) => void;
  onDeleteShape: (id: string) => void;
  onDuplicateShape: (id: string) => void;
  onUpdateComment: (id: string, patch: Partial<SlideComment>) => void;
  onDeleteComment: (id: string) => void;
  onUpdateBaseImage: (id: string, patch: Partial<BaseImageOverride>, saveHistory?: boolean, historyBeforePatch?: Partial<BaseImageOverride>) => void;
  onUpdateBaseElement: (id: string, patch: Partial<BaseElementOverride>, saveHistory?: boolean, historyBeforePatch?: Partial<BaseElementOverride>) => void;
  onDuplicateBaseImage: (id: string) => void;
};

export default function LayerPanel({
  layers,
  containers,
  shapes,
  comments,
  baseImages,
  baseElements,
  selectedLayerId,
  onSelectLayer,
  onUpdateLayer,
  onUpdateContainer,
  onDeleteLayer,
  onDeleteContainer,
  onDeleteBaseImage,
  onDeleteBaseElement,
  onDuplicateLayer,
  onDuplicateContainer,
  onUpdateShape,
  onDeleteShape,
  onDuplicateShape,
  onUpdateComment,
  onDeleteComment,
  onUpdateBaseImage,
  onUpdateBaseElement,
  onDuplicateBaseImage,
}: LayerPanelProps) {
  if (!layers.length && !containers.length && !shapes.length && !comments.length && !baseImages.length && !baseElements.length) {
    return <p className="empty-note">Belum ada layer tambahan di slide ini. Insert gambar dari tab Assets.</p>;
  }

  return (
    <section className="layer-panel">
      {baseImages.length ? (
        <div className="base-layer-group">
          <h3>Gambar bawaan slide</h3>
          {baseImages
            .slice()
            .sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))
            .map((image) => {
              const visible = image.visible !== false;
              const locked = image.locked === true;
              const isBehindText = image.depth === "back";
              const hasRect = image.x != null && image.y != null && image.width != null;
              return (
                <article key={image.id} className={`layer-row base-layer-row ${selectedLayerId === image.id ? "active" : ""} ${visible ? "" : "is-hidden"}`}>
                  <IconButton
                    label={`Pilih gambar ${image.name}`}
                    className="layer-thumb"
                    icon={<img src={normalizeAssetUrl(image.src)} alt={image.alt || image.name} />}
                    onClick={() => onSelectLayer(image.id)}
                  />
                  <div className="layer-main">
                    <AppButton variant="ghost" size="sm" className="layer-title" onClick={() => onSelectLayer(image.id)}>
                      {image.name}
                    </AppButton>
                    <p>{hasRect ? "Gambar bawaan sudah menjadi layer terkelola." : "Posisi gambar sedang dibaca dari slide."}</p>
                    {hasRect ? (
                      <div className="layer-fields">
                        <NumberStepper label="X" min={0} max={95} value={Math.round(image.x ?? 0)} onChange={(value) => onUpdateBaseImage(image.id, { x: value })} />
                        <NumberStepper label="Y" min={0} max={92} value={Math.round(image.y ?? 0)} onChange={(value) => onUpdateBaseImage(image.id, { y: value })} />
                        <NumberStepper label="W" min={4} max={95} value={Math.round(image.width ?? 12)} onChange={(value) => onUpdateBaseImage(image.id, { width: value })} />
                        <NumberStepper label="H" min={3} max={88} value={Math.round(image.height ?? 8)} onChange={(value) => onUpdateBaseImage(image.id, { height: value })} />
                        <NumberStepper label="Z" min={1} max={999} value={image.zIndex ?? 12} onChange={(value) => onUpdateBaseImage(image.id, { zIndex: value })} />
                      </div>
                    ) : null}
                    <div className="layer-actions">
                      <AppButton size="sm" icon={visible ? <EyeSlashIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />} onClick={() => onUpdateBaseImage(image.id, { visible: !visible })}>{visible ? "Hide" : "Show"}</AppButton>
                      <AppButton size="sm" icon={locked ? <LockOpenIcon aria-hidden="true" /> : <LockClosedIcon aria-hidden="true" />} onClick={() => onUpdateBaseImage(image.id, { locked: !locked })}>{locked ? "Unlock" : "Lock"}</AppButton>
                      <AppButton size="sm" icon={<ArrowUpIcon aria-hidden="true" />} onClick={() => onUpdateBaseImage(image.id, { zIndex: (image.zIndex ?? 12) + 1 })}>Front</AppButton>
                      <AppButton size="sm" icon={<ArrowDownIcon aria-hidden="true" />} onClick={() => onUpdateBaseImage(image.id, { zIndex: Math.max(1, (image.zIndex ?? 12) - 1) })}>Back</AppButton>
                      <AppButton size="sm" icon={isBehindText ? <ArrowUpIcon aria-hidden="true" /> : <ArrowDownIcon aria-hidden="true" />} onClick={() => onUpdateBaseImage(image.id, { depth: isBehindText ? "front" : "back" })}>{isBehindText ? "Depan teks" : "Belakang teks"}</AppButton>
                      <AppButton size="sm" icon={<DocumentDuplicateIcon aria-hidden="true" />} onClick={() => onDuplicateBaseImage(image.id)}>Duplicate</AppButton>
                      <AppButton size="sm" variant="danger" className="danger-text" icon={<TrashIcon aria-hidden="true" />} onClick={() => onDeleteBaseImage(image.id)}>Delete</AppButton>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      ) : null}

      {baseElements.length ? (
        <div className="base-layer-group">
          <h3>Kartu dan callout bawaan</h3>
          {baseElements
            .slice()
            .sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0))
            .map((element) => {
              const visible = element.visible !== false;
              const locked = element.locked === true;
              const isBehindText = element.depth === "back";
              const hasRect = element.x != null && element.y != null && element.width != null && element.height != null;
              return (
                <article key={element.id} className={`layer-row base-element-row ${selectedLayerId === element.id ? "active" : ""} ${visible ? "" : "is-hidden"}`}>
                  <IconButton
                    label={`Pilih kartu ${element.name}`}
                    className="layer-thumb element-thumb"
                    icon={<RectangleStackIcon aria-hidden="true" />}
                    onClick={() => onSelectLayer(element.id)}
                  />
                  <div className="layer-main">
                    <AppButton variant="ghost" size="sm" className="layer-title" onClick={() => onSelectLayer(element.id)}>
                      {element.name}
                    </AppButton>
                    <p>{hasRect ? "Kartu bawaan sudah menjadi layer terkelola." : "Posisi kartu sedang dibaca dari slide."}</p>
                    {hasRect ? (
                      <div className="layer-fields">
                        <NumberStepper label="X" min={0} max={95} value={Math.round(element.x ?? 0)} onChange={(value) => onUpdateBaseElement(element.id, { x: value })} />
                        <NumberStepper label="Y" min={0} max={92} value={Math.round(element.y ?? 0)} onChange={(value) => onUpdateBaseElement(element.id, { y: value })} />
                        <NumberStepper label="W" min={4} max={95} value={Math.round(element.width ?? 12)} onChange={(value) => onUpdateBaseElement(element.id, { width: value })} />
                        <NumberStepper label="H" min={3} max={82} value={Math.round(element.height ?? 8)} onChange={(value) => onUpdateBaseElement(element.id, { height: value })} />
                        <NumberStepper label="Z" min={1} max={999} value={element.zIndex ?? 18} onChange={(value) => onUpdateBaseElement(element.id, { zIndex: value })} />
                      </div>
                    ) : null}
                    <div className="layer-actions">
                      <AppButton size="sm" icon={visible ? <EyeSlashIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />} onClick={() => onUpdateBaseElement(element.id, { visible: !visible })}>{visible ? "Hide" : "Show"}</AppButton>
                      <AppButton size="sm" icon={locked ? <LockOpenIcon aria-hidden="true" /> : <LockClosedIcon aria-hidden="true" />} onClick={() => onUpdateBaseElement(element.id, { locked: !locked })}>{locked ? "Unlock" : "Lock"}</AppButton>
                      <AppButton size="sm" icon={<ArrowUpIcon aria-hidden="true" />} onClick={() => onUpdateBaseElement(element.id, { zIndex: (element.zIndex ?? 18) + 1 })}>Front</AppButton>
                      <AppButton size="sm" icon={<ArrowDownIcon aria-hidden="true" />} onClick={() => onUpdateBaseElement(element.id, { zIndex: Math.max(1, (element.zIndex ?? 18) - 1) })}>Back</AppButton>
                      <AppButton size="sm" icon={isBehindText ? <ArrowUpIcon aria-hidden="true" /> : <ArrowDownIcon aria-hidden="true" />} onClick={() => onUpdateBaseElement(element.id, { depth: isBehindText ? "front" : "back" })}>{isBehindText ? "Depan teks" : "Belakang teks"}</AppButton>
                      <AppButton size="sm" variant="danger" className="danger-text" icon={<TrashIcon aria-hidden="true" />} onClick={() => onDeleteBaseElement(element.id)}>Hide card</AppButton>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      ) : null}

      {containers.length ? (
        <div className="base-layer-group">
          <h3>Container dinamis</h3>
          {containers
            .slice()
            .sort((a, b) => b.zIndex - a.zIndex)
            .map((container) => {
              const isBehindText = container.depth === "back";
              return (
                <article key={container.id} className={`layer-row base-element-row ${selectedLayerId === container.id ? "active" : ""} ${container.visible ? "" : "is-hidden"}`}>
                  <IconButton
                    label={`Pilih container ${container.name}`}
                    className="layer-thumb element-thumb"
                    icon={<CodeBracketSquareIcon aria-hidden="true" />}
                    onClick={() => onSelectLayer(container.id)}
                  />
                  <div className="layer-main">
                    <AppButton variant="ghost" size="sm" className="layer-title" onClick={() => onSelectLayer(container.id)}>
                      {container.name}
                    </AppButton>
                    <p>{container.kind.toUpperCase()} container - provider {container.provider}</p>
                    <div className="layer-fields">
                      <NumberStepper label="X" min={0} max={95} value={Math.round(container.x)} onChange={(value) => onUpdateContainer(container.id, { x: value })} />
                      <NumberStepper label="Y" min={0} max={92} value={Math.round(container.y)} onChange={(value) => onUpdateContainer(container.id, { y: value })} />
                      <NumberStepper label="W" min={4} max={95} value={Math.round(container.width)} onChange={(value) => onUpdateContainer(container.id, { width: value })} />
                      <NumberStepper label="H" min={3} max={82} value={Math.round(container.height)} onChange={(value) => onUpdateContainer(container.id, { height: value })} />
                      <NumberStepper label="Z" min={1} max={999} value={container.zIndex} onChange={(value) => onUpdateContainer(container.id, { zIndex: value })} />
                    </div>
                    <div className="layer-actions">
                      <AppButton size="sm" icon={container.visible ? <EyeSlashIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />} onClick={() => onUpdateContainer(container.id, { visible: !container.visible })}>{container.visible ? "Hide" : "Show"}</AppButton>
                      <AppButton size="sm" icon={container.locked ? <LockOpenIcon aria-hidden="true" /> : <LockClosedIcon aria-hidden="true" />} onClick={() => onUpdateContainer(container.id, { locked: !container.locked })}>{container.locked ? "Unlock" : "Lock"}</AppButton>
                      <AppButton size="sm" icon={<ArrowUpIcon aria-hidden="true" />} onClick={() => onUpdateContainer(container.id, { zIndex: container.zIndex + 1 })}>Front</AppButton>
                      <AppButton size="sm" icon={<ArrowDownIcon aria-hidden="true" />} onClick={() => onUpdateContainer(container.id, { zIndex: Math.max(1, container.zIndex - 1) })}>Back</AppButton>
                      <AppButton size="sm" icon={isBehindText ? <ArrowUpIcon aria-hidden="true" /> : <ArrowDownIcon aria-hidden="true" />} onClick={() => onUpdateContainer(container.id, { depth: isBehindText ? "front" : "back" })}>{isBehindText ? "Depan teks" : "Belakang teks"}</AppButton>
                      <AppButton size="sm" icon={<DocumentDuplicateIcon aria-hidden="true" />} onClick={() => onDuplicateContainer(container.id)}>Duplicate</AppButton>
                      <AppButton size="sm" variant="danger" className="danger-text" icon={<TrashIcon aria-hidden="true" />} onClick={() => onDeleteContainer(container.id)}>Delete</AppButton>
                    </div>
                  </div>
                </article>
              );
            })}
        </div>
      ) : null}

      {shapes.length ? (
        <div className="base-layer-group">
          <h3>Editorial shapes</h3>
          {shapes
            .slice()
            .sort((a, b) => b.zIndex - a.zIndex)
            .map((shape) => (
              <article key={shape.id} className={`layer-row base-element-row ${selectedLayerId === shape.id ? "active" : ""} ${shape.visible ? "" : "is-hidden"}`}>
                <IconButton
                  label={`Pilih shape ${shape.name}`}
                  className="layer-thumb element-thumb"
                  icon={<RectangleStackIcon aria-hidden="true" />}
                  onClick={() => onSelectLayer(shape.id)}
                />
                <div className="layer-main">
                  <AppButton variant="ghost" size="sm" className="layer-title" onClick={() => onSelectLayer(shape.id)}>
                    {shape.name}
                  </AppButton>
                  <p>{shape.kind} - {shape.componentId ? "component" : "editable shape"}</p>
                  <div className="layer-fields">
                    <NumberStepper label="X" min={0} max={95} value={Math.round(shape.x)} onChange={(value) => onUpdateShape(shape.id, { x: value })} />
                    <NumberStepper label="Y" min={0} max={92} value={Math.round(shape.y)} onChange={(value) => onUpdateShape(shape.id, { y: value })} />
                    <NumberStepper label="W" min={2} max={96} value={Math.round(shape.width)} onChange={(value) => onUpdateShape(shape.id, { width: value })} />
                    <NumberStepper label="H" min={2} max={88} value={Math.round(shape.height)} onChange={(value) => onUpdateShape(shape.id, { height: value })} />
                  </div>
                  <div className="layer-actions">
                    <AppButton size="sm" icon={shape.visible ? <EyeSlashIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />} onClick={() => onUpdateShape(shape.id, { visible: !shape.visible })}>{shape.visible ? "Hide" : "Show"}</AppButton>
                    <AppButton size="sm" icon={shape.locked ? <LockOpenIcon aria-hidden="true" /> : <LockClosedIcon aria-hidden="true" />} onClick={() => onUpdateShape(shape.id, { locked: !shape.locked })}>{shape.locked ? "Unlock" : "Lock"}</AppButton>
                    <AppButton size="sm" icon={<ArrowUpIcon aria-hidden="true" />} onClick={() => onUpdateShape(shape.id, { zIndex: shape.zIndex + 1 })}>Front</AppButton>
                    <AppButton size="sm" icon={<ArrowDownIcon aria-hidden="true" />} onClick={() => onUpdateShape(shape.id, { zIndex: Math.max(1, shape.zIndex - 1) })}>Back</AppButton>
                    <AppButton size="sm" icon={<DocumentDuplicateIcon aria-hidden="true" />} onClick={() => onDuplicateShape(shape.id)}>Duplicate</AppButton>
                    <AppButton size="sm" variant="danger" className="danger-text" icon={<TrashIcon aria-hidden="true" />} onClick={() => onDeleteShape(shape.id)}>Delete</AppButton>
                  </div>
                </div>
              </article>
            ))}
        </div>
      ) : null}

      {comments.length ? (
        <div className="base-layer-group">
          <h3>Comments</h3>
          {comments.map((comment) => (
            <article key={comment.id} className={`layer-row base-element-row ${selectedLayerId === comment.id ? "active" : ""}`}>
              <IconButton
                label="Pilih comment"
                className="layer-thumb element-thumb"
                icon={<CodeBracketSquareIcon aria-hidden="true" />}
                onClick={() => onSelectLayer(comment.id)}
              />
              <div className="layer-main">
                <AppButton variant="ghost" size="sm" className="layer-title" onClick={() => onSelectLayer(comment.id)}>
                  {comment.resolved ? "Resolved comment" : "Comment"}
                </AppButton>
                <p>{comment.text}</p>
                <div className="layer-fields">
                  <NumberStepper label="X" min={0} max={95} value={Math.round(comment.x)} onChange={(value) => onUpdateComment(comment.id, { x: value })} />
                  <NumberStepper label="Y" min={0} max={92} value={Math.round(comment.y)} onChange={(value) => onUpdateComment(comment.id, { y: value })} />
                </div>
                <div className="layer-actions">
                  <AppButton size="sm" onClick={() => onUpdateComment(comment.id, { resolved: !comment.resolved })}>{comment.resolved ? "Reopen" : "Resolve"}</AppButton>
                  <AppButton size="sm" variant="danger" className="danger-text" icon={<TrashIcon aria-hidden="true" />} onClick={() => onDeleteComment(comment.id)}>Delete</AppButton>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {layers
        .slice()
        .sort((a, b) => b.zIndex - a.zIndex)
        .map((layer) => {
          const isBehindText = layer.depth === "back";
          return (
          <article key={layer.id} className={`layer-row ${selectedLayerId === layer.id ? "active" : ""}`}>
            <IconButton
              label={`Pilih layer ${layer.name}`}
              className="layer-thumb"
              icon={<img src={normalizeAssetUrl(layer.src)} alt={layer.name} />}
              onClick={() => onSelectLayer(layer.id)}
            />
            <div className="layer-main">
              <AppButton variant="ghost" size="sm" className="layer-title" onClick={() => onSelectLayer(layer.id)}>
                {layer.name}
              </AppButton>
              <div className="layer-fields">
                <NumberStepper label="X" min={0} max={95} value={Math.round(layer.x)} onChange={(value) => onUpdateLayer(layer.id, { x: value })} />
                <NumberStepper label="Y" min={0} max={92} value={Math.round(layer.y)} onChange={(value) => onUpdateLayer(layer.id, { y: value })} />
                <NumberStepper label="W" min={4} max={95} value={Math.round(layer.width)} onChange={(value) => onUpdateLayer(layer.id, { width: value })} />
                <NumberStepper label="H" min={3} max={88} value={Math.round(layer.height ?? 8)} onChange={(value) => onUpdateLayer(layer.id, { height: value })} />
                <NumberStepper label="Z" min={1} max={999} value={layer.zIndex} onChange={(value) => onUpdateLayer(layer.id, { zIndex: value })} />
              </div>
              <div className="layer-actions">
                <AppButton size="sm" icon={layer.visible ? <EyeSlashIcon aria-hidden="true" /> : <EyeIcon aria-hidden="true" />} onClick={() => onUpdateLayer(layer.id, { visible: !layer.visible })}>{layer.visible ? "Hide" : "Show"}</AppButton>
                <AppButton size="sm" icon={layer.locked ? <LockOpenIcon aria-hidden="true" /> : <LockClosedIcon aria-hidden="true" />} onClick={() => onUpdateLayer(layer.id, { locked: !layer.locked })}>{layer.locked ? "Unlock" : "Lock"}</AppButton>
                <AppButton size="sm" icon={<ArrowUpIcon aria-hidden="true" />} onClick={() => onUpdateLayer(layer.id, { zIndex: layer.zIndex + 1 })}>Front</AppButton>
                <AppButton size="sm" icon={<ArrowDownIcon aria-hidden="true" />} onClick={() => onUpdateLayer(layer.id, { zIndex: layer.zIndex - 1 })}>Back</AppButton>
                <AppButton size="sm" icon={isBehindText ? <ArrowUpIcon aria-hidden="true" /> : <ArrowDownIcon aria-hidden="true" />} onClick={() => onUpdateLayer(layer.id, { depth: isBehindText ? "front" : "back" })}>{isBehindText ? "Depan teks" : "Belakang teks"}</AppButton>
                <AppButton size="sm" icon={<DocumentDuplicateIcon aria-hidden="true" />} onClick={() => onDuplicateLayer(layer.id)}>Duplicate</AppButton>
                <AppButton size="sm" variant="danger" className="danger-text" icon={<TrashIcon aria-hidden="true" />} onClick={() => onDeleteLayer(layer.id)}>Delete</AppButton>
              </div>
            </div>
          </article>
        );
        })}
    </section>
  );
}
