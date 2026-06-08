import { BookOpenIcon, CodeBracketSquareIcon, DocumentTextIcon, PhotoIcon, RectangleStackIcon } from "@heroicons/react/24/outline";
import type { AssetItem, AssetsData, BaseElementLayer, BaseElementOverride, BaseImageLayer, BaseImageOverride, ComponentDefinition, DesignShape, EditorState, ReferenceEntry, SlideComment, SlideContainer, SlideContainerKind, SlidesData, ThesisData, SlideLayer } from "../types";
import DraftPanel from "./DraftPanel";
import AssetPanel from "./AssetPanel";
import LayerPanel from "./LayerPanel";
import ContainerPanel from "./ContainerPanel";
import ReferencePreview from "./ReferencePreview";
import ElementPropertiesPanel from "./ElementPropertiesPanel";

type InspectorProps = {
  state: EditorState;
  slidesData: SlidesData;
  thesisData: ThesisData;
  assetsData: AssetsData;
  onSetTab: (tab: EditorState["inspectorTab"]) => void;
  onSetDraftQuery: (query: string) => void;
  onReplaceImage: (asset: AssetItem) => void;
  onAddLayer: (asset: AssetItem) => void;
  onUpdateLayer: (id: string, patch: Partial<SlideLayer>, saveHistory?: boolean, historyBeforePatch?: Partial<SlideLayer>) => void;
  onAddContainer: (kind?: SlideContainerKind, patch?: Partial<SlideContainer>) => void;
  onUpdateContainer: (id: string, patch: Partial<SlideContainer>, saveHistory?: boolean, historyBeforePatch?: Partial<SlideContainer>) => void;
  onDeleteContainer: (id: string) => void;
  onDuplicateContainer: (id: string) => void;
  onDeleteLayer: (id: string) => void;
  onDeleteBaseImage: (id: string) => void;
  onDeleteBaseElement: (id: string) => void;
  onDuplicateLayer: (id: string) => void;
  onUpdateBaseImage: (id: string, patch: Partial<BaseImageOverride>, saveHistory?: boolean, historyBeforePatch?: Partial<BaseImageOverride>) => void;
  onUpdateBaseElement: (id: string, patch: Partial<BaseElementOverride>, saveHistory?: boolean, historyBeforePatch?: Partial<BaseElementOverride>) => void;
  onDuplicateBaseImage: (id: string) => void;
  onSelectLayer: (id: string | null) => void;
  baseImages: BaseImageLayer[];
  baseElements: BaseElementLayer[];
  shapes: DesignShape[];
  comments: SlideComment[];
  components: ComponentDefinition[];
  onUpdateShape: (id: string, patch: Partial<DesignShape>) => void;
  onDeleteShape: (id: string) => void;
  onDuplicateShape: (id: string) => void;
  onUpdateComment: (id: string, patch: Partial<SlideComment>) => void;
  onDeleteComment: (id: string) => void;
  onCreateComponent: () => void;
};

const tabs: Array<{ id: EditorState["inspectorTab"]; label: string; Icon: typeof DocumentTextIcon }> = [
  { id: "assets", label: "Assets", Icon: PhotoIcon },
  { id: "draft", label: "Draft", Icon: DocumentTextIcon },
  { id: "layers", label: "Layers", Icon: RectangleStackIcon },
  { id: "containers", label: "Containers", Icon: CodeBracketSquareIcon },
  { id: "references", label: "References", Icon: BookOpenIcon },
];

export default function Inspector({
  state,
  slidesData,
  thesisData,
  assetsData,
  onSetTab,
  onSetDraftQuery,
  onReplaceImage,
  onAddLayer,
  onUpdateLayer,
  onAddContainer,
  onUpdateContainer,
  onDeleteContainer,
  onDuplicateContainer,
  onDeleteLayer,
  onDeleteBaseImage,
  onDeleteBaseElement,
  onDuplicateLayer,
  onUpdateBaseImage,
  onUpdateBaseElement,
  onDuplicateBaseImage,
  onSelectLayer,
  baseImages,
  baseElements,
  shapes,
  comments,
  components,
  onUpdateShape,
  onDeleteShape,
  onDuplicateShape,
  onUpdateComment,
  onDeleteComment,
  onCreateComponent,
}: InspectorProps) {
  const slide = slidesData.slides.find((item) => item.index === state.currentSlide) || slidesData.slides[0];
  const layers = state.layers.filter((layer) => layer.slideIndex === state.currentSlide);
  const containers = state.containers.filter((container) => container.slideIndex === state.currentSlide);

  return (
    <aside className="inspector">
      <div className="right-sidebar-shell">
        <nav className="right-sidebar-tabs" aria-label="Inspector sections">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={state.inspectorTab === tab.id ? "active" : ""}
              title={tab.label}
              aria-label={tab.label}
              aria-current={state.inspectorTab === tab.id ? "page" : undefined}
              onClick={() => onSetTab(tab.id)}
            >
              <tab.Icon aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="inspector-body">
        <ElementPropertiesPanel
          selectedLayerId={state.selectedLayerId}
          shapes={shapes}
          comments={comments}
          containers={containers}
          components={components}
          onUpdateShape={onUpdateShape}
          onDeleteShape={onDeleteShape}
          onDuplicateShape={onDuplicateShape}
          onUpdateComment={onUpdateComment}
          onDeleteComment={onDeleteComment}
          onUpdateContainer={onUpdateContainer}
          onDeleteContainer={onDeleteContainer}
          onDuplicateContainer={onDuplicateContainer}
          onCreateComponent={onCreateComponent}
        />

        {state.inspectorTab === "draft" ? (
          <DraftPanel
            blocks={thesisData.blocks}
            query={state.draftQuery || slide.title}
            onQueryChange={onSetDraftQuery}
          />
        ) : null}

        {state.inspectorTab === "assets" ? (
          <AssetPanel
            assets={assetsData.assets}
            selectedTarget={state.selectedTarget}
            selectedLayerId={state.selectedLayerId}
            onAddLayer={onAddLayer}
            onReplaceImage={onReplaceImage}
          />
        ) : null}

        {state.inspectorTab === "layers" ? (
          <LayerPanel
            layers={layers}
            containers={containers}
            shapes={shapes}
            comments={comments}
            baseImages={baseImages}
            baseElements={baseElements}
            selectedLayerId={state.selectedLayerId}
            onSelectLayer={onSelectLayer}
            onUpdateLayer={onUpdateLayer}
            onUpdateContainer={onUpdateContainer}
            onDeleteLayer={onDeleteLayer}
            onDeleteContainer={onDeleteContainer}
            onDeleteBaseImage={onDeleteBaseImage}
            onDeleteBaseElement={onDeleteBaseElement}
            onDuplicateLayer={onDuplicateLayer}
            onDuplicateContainer={onDuplicateContainer}
            onUpdateShape={onUpdateShape}
            onDeleteShape={onDeleteShape}
            onDuplicateShape={onDuplicateShape}
            onUpdateComment={onUpdateComment}
            onDeleteComment={onDeleteComment}
            onUpdateBaseImage={onUpdateBaseImage}
            onUpdateBaseElement={onUpdateBaseElement}
            onDuplicateBaseImage={onDuplicateBaseImage}
          />
        ) : null}

        {state.inspectorTab === "containers" ? (
          <ContainerPanel
            containers={containers}
            assets={assetsData.assets}
            selectedLayerId={state.selectedLayerId}
            onSelectLayer={onSelectLayer}
            onAddContainer={onAddContainer}
            onUpdateContainer={onUpdateContainer}
            onDeleteContainer={onDeleteContainer}
            onDuplicateContainer={onDuplicateContainer}
          />
        ) : null}

        {state.inspectorTab === "references" ? (
          <div className="references-panel">
            <ReferencePreview slide={slide} references={slidesData.referencePdfs as Record<string, ReferenceEntry>} limit={8} variant="list" />
          </div>
        ) : null}
      </div>
    </aside>
  );
}
