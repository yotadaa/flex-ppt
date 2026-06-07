export type ThemeName = "light" | "mint" | "navy" | "paper" | "contrast";
export type FontFamilyName = "inter" | "jakarta" | "noto" | "sourceSerif" | "robotoSlab" | "system" | "serif" | "mono" | "rounded";

export type ThesisBlock = {
  id: string;
  kind: "paragraph";
  index: number;
  style: string;
  headingLevel: number;
  section: string;
  text: string;
  searchText: string;
  tokens: string[];
};

export type ThesisTable = {
  id: string;
  kind: "table";
  index: number;
  section: string;
  rows: string[][];
  searchText: string;
  tokens: string[];
};

export type ThesisData = {
  summary: {
    source: string;
    paragraphCount: number;
    headingCount: number;
    tableCount: number;
    requiredTerms: Record<string, boolean>;
  };
  blocks: ThesisBlock[];
  tables: ThesisTable[];
};

export type ReferenceSlideEntry = {
  status?: string;
  page?: number;
  image?: string;
  score?: number;
  hits?: string[];
  slideTitle?: string;
  note?: string;
};

export type ReferenceEntry = {
  citation: string;
  file: string;
  title: string;
  sourceIndex?: number;
  slides?: number[];
  status?: string;
  note?: string | null;
  page?: number;
  image?: string;
  bySlide?: Record<string, ReferenceSlideEntry>;
  articleUrl?: string;
};

export type Slide = {
  index: number;
  title: string;
  chapter: string;
  citations: string[];
  bodyText: string;
  images: string[];
  html: string;
};

export type SlidesData = {
  slides: Slide[];
  referencePdfs: Record<string, ReferenceEntry>;
};

export type AssetKind = "slide" | "isometric" | "gui" | "reference" | "logo";

export type AssetItem = {
  id: string;
  name: string;
  path: string;
  relativePath: string;
  kind: AssetKind;
  size: number;
};

export type ImageDepth = "back" | "front";
export type ImageFrame = "screen";
export type BaseElementKind = "card" | "callout" | "metric" | "element";

export type AssetsData = {
  assets: AssetItem[];
};

export type SelectionTarget = {
  slideIndex: number;
  editId: string;
  tag: string;
  text: string;
  kind: "text" | "image" | "element";
  imageSrc?: string;
};

export type SlideLayer = {
  id: string;
  slideIndex: number;
  assetId: string;
  src: string;
  name: string;
  x: number;
  y: number;
  width: number;
  zIndex: number;
  depth?: ImageDepth;
  visible: boolean;
  locked: boolean;
};

export type BaseImageOverride = {
  id: string;
  slideIndex: number;
  editId: string;
  src: string;
  name: string;
  alt: string;
  x: number;
  y: number;
  width: number;
  zIndex: number;
  depth?: ImageDepth;
  frame?: ImageFrame;
  visible: boolean;
  locked: boolean;
};

export type BaseImageLayer = {
  id: string;
  slideIndex: number;
  editId: string;
  src: string;
  name: string;
  alt: string;
  x?: number;
  y?: number;
  width?: number;
  zIndex?: number;
  depth?: ImageDepth;
  frame?: ImageFrame;
  visible?: boolean;
  locked?: boolean;
};

export type BaseElementOverride = {
  id: string;
  slideIndex: number;
  editId: string;
  html: string;
  name: string;
  kind: BaseElementKind;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  depth?: ImageDepth;
  visible: boolean;
  locked: boolean;
};

export type BaseElementLayer = {
  id: string;
  slideIndex: number;
  editId: string;
  html: string;
  name: string;
  kind: BaseElementKind;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  depth?: ImageDepth;
  visible?: boolean;
  locked?: boolean;
};

export type EditorSnapshot = {
  slideHtmlByIndex: Record<number, string>;
  layers: SlideLayer[];
  baseImageOverrides: Record<string, BaseImageOverride>;
  baseElementOverrides: Record<string, BaseElementOverride>;
  theme: ThemeName;
  fontFamily: FontFamilyName;
  accent: string;
};

export type EditorState = EditorSnapshot & {
  currentSlide: number;
  theme: ThemeName;
  fontFamily: FontFamilyName;
  accent: string;
  selectedTarget: SelectionTarget | null;
  selectedLayerId: string | null;
  draftQuery: string;
  inspectorTab: "draft" | "assets" | "layers" | "references";
  history: EditorSnapshot[];
  future: EditorSnapshot[];
  autosavedAt: number;
};

export type DraftSelection = {
  id: string;
  blockId: string;
  section: string;
  text: string;
};
