import { LitElement, css, html } from "lit";
import * as d3 from "d3";

export type OrgChartNode = {
  id: string;
  name: string;
  kind?: string;
  main?: boolean;
};

export type OrgChartEdge = {
  from: string;
  to: string;
  label?: string;
};

export type EdgeLabelColorIndices = Record<string, number>;
export type OrgChartViewMode = "card" | "node";
// "radial": concentric rings by depth around the main entity. "cluster": each parent sits at the centre of its own
// circle of children, and clusters are joined by their parent links.
export type OrgChartArrangement = "radial" | "cluster";

export type MainEntityColor = {
  background: string;
  border: string;
  text: string;
  secondaryText: string;
};

export type NodeColor = {
  background: string;
  border: string;
  text: string;
  secondaryText: string;
};

export type OrgChartLayoutConfig = {
  firstRingRadius: number;
  ringSpacing: number;
  nodeWidth: number;
  nodeHeight: number;
  mainNodeWidth: number;
  mainNodeHeight: number;
  nodeRadius: number;
  mainNodeRadius: number;
  initialLevels: number;
  fitPadding: number;
};

export type OrgChartValidationIssue = {
  code: "duplicate-node-id" | "missing-edge-node" | "multiple-main-nodes" | "directed-cycle" | "unreachable-node";
  message: string;
  severity: "error" | "warning";
  nodeId?: string;
  edge?: OrgChartEdge;
};

type LayoutNode = OrgChartNode & {
  level: number;
  angle: number;
  px: number;
  py: number;
  parentId?: string;
};

export const DEFAULT_COLORS = [
  "#2f6bff", "#16a078", "#9a63d2", "#e28a2b", "#d94f70",
  "#247f9e", "#7c6ee6", "#58a63c", "#c65bca", "#d36b32",
  "#3b83bd", "#849b2e", "#b65785", "#168c87", "#a76b38",
  "#526fd1", "#769f55", "#bb5757", "#547e8f", "#8066a8",
];

export const DEFAULT_MAIN_ENTITY_COLOR: MainEntityColor = {
  background: "#143c32",
  border: "#285d4d",
  text: "#ffffff",
  secondaryText: "#b7cac3",
};

export const DEFAULT_LAYOUT_CONFIG: OrgChartLayoutConfig = {
  firstRingRadius: 215,
  ringSpacing: 205,
  nodeWidth: 184,
  nodeHeight: 62,
  mainNodeWidth: 218,
  mainNodeHeight: 76,
  nodeRadius: 36,
  mainNodeRadius: 48,
  initialLevels: 1,
  fitPadding: 64,
};

export class OrgHierarchyChart extends LitElement {
  static styles = css`
    :host { position:relative; display:block; width:100%; height:100%; min-height:0; overflow:hidden; color:var(--org-text); background:var(--org-background); }
    svg { position:absolute; inset:0; display:block; width:100%; height:100%; cursor:grab; touch-action:none; user-select:none; background-color:var(--org-background); background-image:radial-gradient(var(--org-dot) .75px,transparent .75px); background-size:17px 17px; }
    svg:active { cursor:grabbing; }
    .depth-ring { fill:none; stroke:var(--org-ring); stroke-width:1; stroke-dasharray:3 7; vector-effect:non-scaling-stroke; }
    .edge { fill:none; stroke-width:2; vector-effect:non-scaling-stroke; }
    .edge-label rect { fill:var(--org-label-background); stroke-width:1; vector-effect:non-scaling-stroke; }
    .edge-label text { font:700 10px Arial,sans-serif; dominant-baseline:middle; text-anchor:middle; }
    svg[data-arrangement="cluster"] .edge { stroke-width:1.6; }
    svg[data-arrangement="cluster"] .node-name,svg[data-arrangement="cluster"] .node-kind { paint-order:stroke; stroke:var(--org-background); stroke-width:4px; stroke-linejoin:round; }
    svg[data-arrangement="cluster"] .edge-label rect { display:none; }
    svg[data-arrangement="cluster"] .edge-label text { font:700 8.5px Arial,sans-serif; paint-order:stroke; stroke:var(--org-background); stroke-width:3px; stroke-linejoin:round; }
    svg[data-arrangement="cluster"] .node { filter:none; }
    .node { cursor:move; filter:drop-shadow(0 5px 8px rgba(22,51,42,.13)); }
    .node-rect,.node-circle { stroke-width:1.5; vector-effect:non-scaling-stroke; }
    .node:hover .node-rect,.node.selected .node-rect,.node:hover .node-circle,.node.selected .node-circle { stroke-width:2.5; }
    .node:focus-visible { outline:none; }
    .node:focus-visible .node-rect,.node:focus-visible .node-circle { stroke:#17211d; stroke-width:3; stroke-dasharray:5 3; }
    .node-name { font:700 11px Arial,sans-serif; dominant-baseline:middle; }
    .node-kind { font:700 8px Arial,sans-serif; letter-spacing:.55px; }
    .more-badge rect { stroke:#fff; stroke-width:2; vector-effect:non-scaling-stroke; }
    .more-badge text { fill:#fff; font:800 8px Arial,sans-serif; text-anchor:middle; dominant-baseline:middle; }
    .focus-label { fill:var(--org-muted); font:800 8px Arial,sans-serif; letter-spacing:1.5px; text-anchor:middle; }
    .legend-bg { fill:var(--org-legend-background); stroke:var(--org-ring); }
    .legend text { fill:var(--org-muted); font:500 9px Arial,sans-serif; dominant-baseline:middle; }
  `;

  private _nodes: OrgChartNode[] = [];
  private _edges: OrgChartEdge[] = [];
  private _mainEntityId = "";
  private _colors = [...DEFAULT_COLORS];
  private _mainEntityColor = { ...DEFAULT_MAIN_ENTITY_COLOR };
  private _edgeLabelColorIndices: EdgeLabelColorIndices = {};
  private _nodeColorConfig: Partial<NodeColor> = {};
  private _backgroundColor?: string;
  private _viewMode: OrgChartViewMode = "card";
  private _arrangement: OrgChartArrangement = "radial";
  private _clusterLeaves = new Set<string>();
  private _layoutConfig = { ...DEFAULT_LAYOUT_CONFIG };
  private _layoutNodes: LayoutNode[] = [];
  private _expanded = new Set<string>();
  private _activeMainId = "";
  private _nodeById = new Map<string, LayoutNode>();
  private _nodeInputById = new Map<string, OrgChartNode>();
  private _edgeLabelIndex = new Map<string, number>();
  private _childrenById = new Map<string, string[]>();
  private _edgesByNode = new Map<string, OrgChartEdge[]>();
  private _svg?: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private _viewport?: d3.Selection<SVGGElement, unknown, null, undefined>;
  private _zoom?: d3.ZoomBehavior<SVGSVGElement, unknown>;
  private _resizeObserver?: ResizeObserver;
  private _layoutWidth = 0;
  private _layoutHeight = 0;
  private _zoomValue = 1;

  render() {
    return html`<svg role="img" aria-label="Interactive organisation hierarchy">
      <defs></defs><g class="viewport"></g><g class="legend"></g>
    </svg>`;
  }

  firstUpdated() {
    this._applyTheme();
    this._svg = d3.select(this.renderRoot.querySelector("svg") as SVGSVGElement);
    this._viewport = d3.select(this.renderRoot.querySelector(".viewport") as SVGGElement);
    this._zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.08, 4])
      .filter((event) => event.type !== "wheel" && !(event.target as Element).closest(".node"))
      .on("zoom", (event) => {
        this._zoomValue = event.transform.k;
        this._viewport?.attr("transform", event.transform.toString());
        this._emitState();
      });
    this._svg.call(this._zoom).on("dblclick.zoom", null);
    this._svg.node()?.addEventListener("wheel", this._handleWheel, { passive: false });
    this._resizeObserver = new ResizeObserver(() => {
      this._resizePositions();
      this._draw();
    });
    this._resizeObserver.observe(this);
    this._initializeData();
  }

  disconnectedCallback() {
    this._resizeObserver?.disconnect();
    this._svg?.node()?.removeEventListener("wheel", this._handleWheel);
    super.disconnectedCallback();
  }

  get nodes() { return this._nodes; }
  set nodes(value: OrgChartNode[]) { this.setData({ nodes: value, edges: this._edges }); }
  get edges() { return this._edges; }
  set edges(value: OrgChartEdge[]) { this.setData({ nodes: this._nodes, edges: value }); }
  get mainEntityId() { return this._mainEntityId; }
  set mainEntityId(value: string) { this._mainEntityId = value; this._initializeData(); }
  get colors() { return this._colors; }
  set colors(value: string[]) { this.setConfig({ colors: value }); }
  get edgeLabelColorIndices() { return this._edgeLabelColorIndices; }
  set edgeLabelColorIndices(value: EdgeLabelColorIndices) { this.setConfig({ edgeLabelColorIndices: value }); }
  get mainEntityColor() { return this._mainEntityColor; }
  set mainEntityColor(value: Partial<MainEntityColor>) { this.setConfig({ mainEntityColor: value }); }
  get nodeColor() { return this._nodeColorConfig; }
  set nodeColor(value: Partial<NodeColor>) { this.setConfig({ nodeColor: value }); }
  get backgroundColor() { return this._backgroundColor; }
  set backgroundColor(value: string | undefined) { this.setConfig({ backgroundColor: value }); }
  get layoutConfig() { return { ...this._layoutConfig }; }
  set layoutConfig(value: Partial<OrgChartLayoutConfig>) { this.setConfig({ layout: value }); }
  get viewMode() { return this._viewMode; }
  set viewMode(value: OrgChartViewMode) { this.setViewMode(value); }
  get arrangement() { return this._arrangement; }
  set arrangement(value: OrgChartArrangement) { this.setArrangement(value); }

  setData(data: { nodes: OrgChartNode[]; edges: OrgChartEdge[]; mainEntityId?: string }) {
    this._nodes = Array.isArray(data.nodes) ? data.nodes : [];
    this._edges = Array.isArray(data.edges) ? data.edges : [];
    if (data.mainEntityId) this._mainEntityId = data.mainEntityId;
    this._activeMainId = "";
    this._initializeData();
  }

  setConfig(config: { colors?: string[]; edgeLabelColorIndices?: EdgeLabelColorIndices; mainEntityColor?: Partial<MainEntityColor>; nodeColor?: Partial<NodeColor>; backgroundColor?: string; layout?: Partial<OrgChartLayoutConfig>; viewMode?: OrgChartViewMode; arrangement?: OrgChartArrangement }) {
    if (config.colors?.length) this._colors = config.colors.slice(0, 20);
    if (config.edgeLabelColorIndices) this._edgeLabelColorIndices = { ...config.edgeLabelColorIndices };
    if (config.mainEntityColor) this._mainEntityColor = { ...this._mainEntityColor, ...config.mainEntityColor };
    if (config.nodeColor) this._nodeColorConfig = { ...this._nodeColorConfig, ...config.nodeColor };
    if (config.backgroundColor !== undefined) this._backgroundColor = config.backgroundColor;
    if (config.viewMode) this._viewMode = config.viewMode === "node" ? "node" : "card";
    if (config.arrangement && config.arrangement !== this._arrangement) {
      this._arrangement = config.arrangement === "cluster" ? "cluster" : "radial";
      if (!config.layout) this._calculateLayout();
    }
    if (config.layout) {
      this._layoutConfig = this._normalizeLayoutConfig({ ...this._layoutConfig, ...config.layout });
      this._calculateLayout();
      this._setInitialExpansion();
    }
    this._applyTheme();
    this._draw();
  }

  setViewMode(mode: OrgChartViewMode) {
    const nextMode: OrgChartViewMode = mode === "node" ? "node" : "card";
    if (nextMode === this._viewMode) return false;
    this._viewMode = nextMode;
    if (this._arrangement === "cluster") this._calculateLayout();
    this._draw();
    this._fitVisibleView();
    this.dispatchEvent(new CustomEvent("org-chart-view-mode-change", { detail: { viewMode: this._viewMode }, bubbles: true, composed: true }));
    return true;
  }

  setArrangement(arrangement: OrgChartArrangement) {
    const next: OrgChartArrangement = arrangement === "cluster" ? "cluster" : "radial";
    if (next === this._arrangement) return false;
    this._arrangement = next;
    this._calculateLayout();
    this._draw();
    this._fitVisibleView();
    this.dispatchEvent(new CustomEvent("org-chart-arrangement-change", { detail: { arrangement: next }, bubbles: true, composed: true }));
    return true;
  }

  expandAll() {
    this._expanded = new Set(this._layoutNodes.map((node) => node.id));
    this._draw();
    this._fitVisibleView();
    this._emitExpansion("org-chart-node-expand", undefined, true);
  }
  collapseAll() {
    this._expanded = new Set([this._activeMainId]);
    this._draw();
    this._fitVisibleView();
    this._emitExpansion("org-chart-node-collapse", undefined, true);
  }
  expandNode(id: string) {
    const node = this._nodeById.get(id);
    if (!node || this._expanded.has(id)) return false;
    this._expanded.add(id);
    this._draw();
    this._emitExpansion("org-chart-node-expand", node);
    return true;
  }
  collapseNode(id: string) {
    const node = this._nodeById.get(id);
    if (!node || id === this._activeMainId || !this._expanded.has(id)) return false;
    [id, ...this._descendantIds(id)].forEach((nodeId) => this._expanded.delete(nodeId));
    this._draw();
    this._emitExpansion("org-chart-node-collapse", node);
    return true;
  }
  expandToLevel(level: number) {
    const normalized = Math.max(1, Math.floor(level));
    this._expanded = new Set(this._layoutNodes.filter((node) => node.level < normalized).map((node) => node.id));
    this._expanded.add(this._activeMainId);
    this._draw();
    this.dispatchEvent(new CustomEvent("org-chart-level-change", { detail: { level: normalized, visibleNodes: this.getVisibleNodes() }, bubbles: true, composed: true }));
  }
  getVisibleNodes(): OrgChartNode[] {
    const visible = this._visibleIds();
    return [...visible].map((id) => this._nodeInputById.get(id)).filter((node): node is OrgChartNode => Boolean(node)).map((node) => ({ ...node }));
  }
  zoomIn() { this._scaleBy(1.25); }
  zoomOut() { this._scaleBy(0.8); }

  fitView() {
    this._fitVisibleView();
  }

  private _fitVisibleView() {
    if (!this._svg || !this._zoom || !this._layoutNodes.length) return;
    const visible = this._visibleIds();
    const shown = this._layoutNodes.filter((node) => visible.has(node.id));
    const minX = d3.min(shown, (node) => node.px - this._dimensions(node).width / 2) ?? 0;
    const maxX = d3.max(shown, (node) => node.px + this._dimensions(node).width / 2) ?? 1;
    const minY = d3.min(shown, (node) => node.py - this._dimensions(node).height / 2) ?? 0;
    const maxY = d3.max(shown, (node) => node.py + this._dimensions(node).height / 2) ?? 1;
    const width = this.clientWidth;
    const height = this.clientHeight;
    const padding = this._layoutConfig.fitPadding;
    const scale = Math.max(0.08, Math.min(1.5, (width - padding * 2) / (maxX - minX), (height - padding * 2) / (maxY - minY)));
    const transform = d3.zoomIdentity.translate(width / 2 - scale * (minX + maxX) / 2, height / 2 - scale * (minY + maxY) / 2).scale(scale);
    this._svg.call(this._zoom.transform, transform);
  }

  resetView() {
    this._calculateLayout();
    this._setInitialExpansion();
    if (this._svg && this._zoom) this._svg.call(this._zoom.transform, d3.zoomIdentity);
    this._draw();
  }

  private _resolvedMainId() {
    if (this._activeMainId) return this._activeMainId;
    return this._nodes.find((node) => node.main)?.id
      ?? (this._nodes.some((node) => node.id === this._mainEntityId) ? this._mainEntityId : undefined)
      ?? this._nodes[0]?.id
      ?? "";
  }
  private _isMain(node: OrgChartNode) { return node.id === this._resolvedMainId(); }
  private _dimensions(node: OrgChartNode) {
    if (this._viewMode === "node") {
      const radius = this._circleRadius(node);
      return { width: radius * 2, height: radius * 2 };
    }
    const base = this._baseCardSize(node);
    return { width: base.width, height: Math.max(base.height, this._cardText(node).contentHeight + 26) };
  }
  private _baseCardSize(node: OrgChartNode) {
    return this._isMain(node)
      ? { width: this._layoutConfig.mainNodeWidth, height: this._layoutConfig.mainNodeHeight }
      : { width: this._layoutConfig.nodeWidth, height: this._layoutConfig.nodeHeight };
  }
  private _paletteColor(index: number) { const colors = this._colors.length ? this._colors : DEFAULT_COLORS; return colors[((index % colors.length) + colors.length) % colors.length]; }
  private _edgeColor(edge: OrgChartEdge) { return this._paletteColor(this._edgeColorIndex(edge)); }
  private _resolvedNodeColor(): NodeColor {
    const defaults: NodeColor = { background: "#ffffff", border: "#5f8175", text: "#21312b", secondaryText: "#82908a" };
    return { ...defaults, ...this._nodeColorConfig };
  }
  private _applyTheme() {
    this.style.setProperty("--org-background", this._backgroundColor ?? "#fbfcfb");
    this.style.setProperty("--org-text", "#17211d");
    this.style.setProperty("--org-muted", "#75817b");
    this.style.setProperty("--org-ring", "#dce4e0");
    this.style.setProperty("--org-dot", "#d6ddda");
    this.style.setProperty("--org-label-background", "#ffffff");
    this.style.setProperty("--org-legend-background", "rgba(255,255,255,.95)");
  }

  private _normalizeLayoutConfig(config: OrgChartLayoutConfig): OrgChartLayoutConfig {
    const positive = (value: number, fallback: number, minimum = 1) => Number.isFinite(value) ? Math.max(minimum, value) : fallback;
    return {
      firstRingRadius: positive(config.firstRingRadius, DEFAULT_LAYOUT_CONFIG.firstRingRadius, 20),
      ringSpacing: positive(config.ringSpacing, DEFAULT_LAYOUT_CONFIG.ringSpacing, 20),
      nodeWidth: positive(config.nodeWidth, DEFAULT_LAYOUT_CONFIG.nodeWidth, 60),
      nodeHeight: positive(config.nodeHeight, DEFAULT_LAYOUT_CONFIG.nodeHeight, 30),
      mainNodeWidth: positive(config.mainNodeWidth, DEFAULT_LAYOUT_CONFIG.mainNodeWidth, 60),
      mainNodeHeight: positive(config.mainNodeHeight, DEFAULT_LAYOUT_CONFIG.mainNodeHeight, 30),
      nodeRadius: positive(config.nodeRadius, DEFAULT_LAYOUT_CONFIG.nodeRadius, 12),
      mainNodeRadius: positive(config.mainNodeRadius, DEFAULT_LAYOUT_CONFIG.mainNodeRadius, 16),
      initialLevels: Math.max(1, Math.floor(positive(config.initialLevels, DEFAULT_LAYOUT_CONFIG.initialLevels))),
      fitPadding: positive(config.fitPadding, DEFAULT_LAYOUT_CONFIG.fitPadding, 0),
    };
  }

  private _validateData(): OrgChartValidationIssue[] {
    const issues: OrgChartValidationIssue[] = [];
    const seen = new Set<string>();
    this._nodes.forEach((node) => {
      if (seen.has(node.id)) issues.push({ code: "duplicate-node-id", severity: "error", nodeId: node.id, message: `Duplicate node id: ${node.id}` });
      seen.add(node.id);
    });
    const mains = this._nodes.filter((node) => node.main);
    if (mains.length > 1) issues.push({ code: "multiple-main-nodes", severity: "error", message: "Only one node can have main: true." });
    this._edges.forEach((edge) => {
      if (!seen.has(edge.from) || !seen.has(edge.to)) issues.push({ code: "missing-edge-node", severity: "error", edge, message: `Edge ${edge.from} → ${edge.to} references a missing node.` });
    });
    const validEdges = this._edges.filter((edge) => seen.has(edge.from) && seen.has(edge.to));
    const outgoing = new Map(this._nodes.map((node) => [node.id, [] as string[]]));
    validEdges.forEach((edge) => outgoing.get(edge.from)?.push(edge.to));
    const state = new Map<string, number>();
    let hasCycle = false;
    const visit = (id: string) => {
      if (state.get(id) === 1) { hasCycle = true; return; }
      if (state.get(id) === 2 || hasCycle) return;
      state.set(id, 1); outgoing.get(id)?.forEach(visit); state.set(id, 2);
    };
    this._nodes.forEach((node) => visit(node.id));
    if (hasCycle) issues.push({ code: "directed-cycle", severity: "error", message: "The edge data contains a directed cycle." });
    const mainId = mains[0]?.id ?? (seen.has(this._mainEntityId) ? this._mainEntityId : this._nodes[0]?.id);
    if (mainId) {
      const adjacent = new Map(this._nodes.map((node) => [node.id, [] as string[]]));
      validEdges.forEach((edge) => { adjacent.get(edge.from)?.push(edge.to); adjacent.get(edge.to)?.push(edge.from); });
      const reachable = new Set([mainId]);
      const queue = [mainId];
      while (queue.length) { const current = queue.shift() as string; adjacent.get(current)?.forEach((next) => { if (!reachable.has(next)) { reachable.add(next); queue.push(next); } }); }
      this._nodes.filter((node) => !reachable.has(node.id)).forEach((node) => issues.push({ code: "unreachable-node", severity: "warning", nodeId: node.id, message: `Node ${node.id} is not connected to the main entity.` }));
    }
    return issues;
  }

  private _initializeData() {
    if (!this._svg || !this._nodes.length) return;
    const issues = this._validateData();
    if (issues.length) this.dispatchEvent(new CustomEvent("org-chart-error", { detail: { issues }, bubbles: true, composed: true }));
    if (issues.some((issue) => issue.severity === "error")) {
      this._layoutNodes = [];
      this._viewport?.selectAll("*").remove();
      return;
    }
    this._activeMainId = this._nodes.find((node) => node.main)?.id
      ?? (this._nodes.some((node) => node.id === this._mainEntityId) ? this._mainEntityId : this._nodes[0].id);
    this._nodeInputById = new Map(this._nodes.map((node) => [node.id, node]));
    this._edgeLabelIndex = new Map([...new Set(this._edges.map((edge) => edge.label ?? "Related"))].map((label, index) => [label, index]));
    this._edgesByNode = new Map(this._nodes.map((node) => [node.id, []]));
    this._edges.forEach((edge) => {
      this._edgesByNode.get(edge.from)?.push(edge);
      if (edge.to !== edge.from) this._edgesByNode.get(edge.to)?.push(edge);
    });
    this._calculateLayout();
    this._setInitialExpansion();
    this._draw();
    this.dispatchEvent(new CustomEvent("org-chart-ready", { detail: { nodeCount: this._nodes.length, edgeCount: this._edges.length }, bubbles: true, composed: true }));
  }

  private _setInitialExpansion() {
    this._expanded = new Set(this._layoutNodes.filter((node) => node.level < this._layoutConfig.initialLevels).map((node) => node.id));
    if (this._activeMainId) this._expanded.add(this._activeMainId);
  }

  private _calculateLayout() {
    if (!this._nodes.length) return;
    const width = this.clientWidth || 900;
    const height = this.clientHeight || 560;
    const mainId = this._resolvedMainId();
    const nodes: LayoutNode[] = this._nodes.map((node) => ({ ...node, level: 0, angle: 0, px: width / 2, py: height / 2 }));
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const adjacent = new Map(nodes.map((node) => [node.id, [] as string[]]));
    this._edges.forEach((edge) => {
      if (!adjacent.has(edge.from) || !adjacent.has(edge.to)) return;
      adjacent.get(edge.from)?.push(edge.to);
      adjacent.get(edge.to)?.push(edge.from);
    });
    const levels = new Map([[mainId, 0]]);
    const parents = new Map<string, string>();
    const queue = [mainId];
    while (queue.length) {
      const current = queue.shift() as string;
      adjacent.get(current)?.forEach((next) => {
        if (!levels.has(next)) { levels.set(next, (levels.get(current) ?? 0) + 1); parents.set(next, current); queue.push(next); }
      });
    }
    const maxConnectedLevel = Math.max(0, ...levels.values());
    nodes.filter((node) => !levels.has(node.id)).forEach((node) => levels.set(node.id, maxConnectedLevel + 1));
    const main = byId.get(mainId);
    if (main) Object.assign(main, { level: 0, angle: 0, px: width / 2, py: height / 2 });
    const firstLevel = nodes.filter((node) => levels.get(node.id) === 1);
    const step = (Math.PI * 2) / Math.max(1, firstLevel.length);
    const start = -Math.PI / 2 - step / 2;
    firstLevel.forEach((node, index) => { node.level = 1; node.parentId = mainId; node.angle = start + index * step; });
    nodes.filter((node) => (levels.get(node.id) ?? 0) > 1).sort((a, b) => (levels.get(a.id) ?? 0) - (levels.get(b.id) ?? 0)).forEach((node) => {
      node.level = levels.get(node.id) ?? 1;
      const parent = byId.get(parents.get(node.id) ?? "");
      if (parent) {
        node.parentId = parent.id;
        const siblings = (adjacent.get(parent.id) ?? []).filter((id) => parents.get(id) === parent.id);
        node.angle = parent.angle + (siblings.indexOf(node.id) - (siblings.length - 1) / 2) * 0.2;
      } else node.angle = start + nodes.indexOf(node) * 0.35;
    });
    nodes.filter((node) => node.id !== mainId).forEach((node) => {
      const radius = this._radiusForLevel(node.level);
      node.px = width / 2 + Math.cos(node.angle) * radius;
      node.py = height / 2 + Math.sin(node.angle) * radius;
    });
    if (this._arrangement === "cluster" && main) this._clusterPositions(nodes, parents, main);
    this._layoutNodes = nodes;
    this._nodeById = new Map(nodes.map((node) => [node.id, node]));
    this._childrenById = new Map(nodes.map((node) => [node.id, []]));
    nodes.forEach((node) => { if (node.parentId) this._childrenById.get(node.parentId)?.push(node.id); });
    this._layoutWidth = width;
    this._layoutHeight = height;
  }

  private _resizePositions() {
    if (!this._layoutNodes.length) return;
    const width = this.clientWidth;
    const height = this.clientHeight;
    const dx = (width - this._layoutWidth) / 2;
    const dy = (height - this._layoutHeight) / 2;
    this._layoutNodes.forEach((node) => { node.px += dx; node.py += dy; });
    this._layoutWidth = width;
    this._layoutHeight = height;
  }

  // Cluster layout: entities linked to a single other entity become "leaves" packed in a tight ring around that
  // neighbour; every other entity is a backbone hub. Hubs are spread apart with a force simulation (long links,
  // collision by cluster size), then each hub's leaves fill the ring, leaving gaps where backbone links leave.
  private _clusterPositions(nodes: LayoutNode[], _parents: Map<string, string>, main: LayoutNode) {
    const byId = new Map(nodes.map((node) => [node.id, node]));
    const adjacent = new Map(nodes.map((node) => [node.id, new Set<string>()]));
    this._edges.forEach((edge) => {
      if (edge.from === edge.to || !adjacent.has(edge.from) || !adjacent.has(edge.to)) return;
      adjacent.get(edge.from)?.add(edge.to);
      adjacent.get(edge.to)?.add(edge.from);
    });
    const degree = (id: string) => adjacent.get(id)?.size ?? 0;
    const hubOf = new Map<string, string>();
    nodes.forEach((node) => {
      const [neighbour] = [...(adjacent.get(node.id) ?? [])];
      if (degree(node.id) === 1 && degree(neighbour) > 1) hubOf.set(node.id, neighbour);
    });
    const hubs = nodes.filter((node) => !hubOf.has(node.id) && degree(node.id) > 0);
    if (!hubs.length) hubs.push(main);
    const leavesOf = new Map(hubs.map((hub) => [hub.id, nodes.filter((node) => hubOf.get(node.id) === hub.id)]));
    this._clusterLeaves = new Set(hubOf.keys());

    const card = this._viewMode === "card";
    const leafArc = (node: LayoutNode) => card ? this._baseCardSize(node).width + 60 : Math.max(this._circleRadius(node) * 2 + 24, 62);
    const labelReach = (node: LayoutNode) => card ? this._baseCardSize(node).width / 2 + 12 : this._circleRadius(node) + 120;
    const hubSize = (hub: LayoutNode) => card ? this._baseCardSize(hub).width / 2 + 12 : this._circleRadius(hub) + 45;
    const ringFor = (hub: LayoutNode, available = Math.PI * 2) => {
      const leaves = leavesOf.get(hub.id) ?? [];
      if (!leaves.length) return 0;
      const nearest = card ? this._baseCardSize(hub).width * 0.75 + 70 : this._circleRadius(hub) + 130;
      return Math.max(nearest, leaves.reduce((sum, leaf) => sum + leafArc(leaf), 0) / available);
    };
    // Angle left for leaves once backbone links and (in node view) the hub's own label gap are kept free.
    const leafAngle = (hub: LayoutNode) => {
      const links = [...(adjacent.get(hub.id) ?? [])].filter((id) => !hubOf.has(id)).length;
      return Math.max(Math.PI, Math.PI * 2 - links * 0.64 - (card ? 0 : 1.7));
    };
    const estimatedRing = (hub: LayoutNode) => ringFor(hub, leafAngle(hub));
    const clusterRadius = (hub: LayoutNode) => {
      const leaves = leavesOf.get(hub.id) ?? [];
      return leaves.length ? estimatedRing(hub) + Math.max(...leaves.map(labelReach)) : hubSize(hub);
    };
    // Backbone links only need to clear the two rings (leaves leave a gap where the link passes).
    const linkLength = (a: LayoutNode, b: LayoutNode) => Math.max(card ? 280 : 150, estimatedRing(a) + estimatedRing(b) + (card ? 220 : 110));

    // Backbone: seed hubs breadth-first from the main entity's hub, then relax with forces.
    const rootHub = byId.get(hubOf.get(main.id) ?? main.id) ?? hubs[0];
    const hubIds = new Set(hubs.map((hub) => hub.id));
    const gap = card ? 200 : 120;
    const placed = new Set([rootHub.id]);
    const queue: { hub: LayoutNode; direction: number; turn: number }[] = [{ hub: rootHub, direction: 0, turn: 1 }];
    while (queue.length) {
      const { hub, direction, turn } = queue.shift() as { hub: LayoutNode; direction: number; turn: number };
      const next = [...(adjacent.get(hub.id) ?? [])].filter((id) => hubIds.has(id) && !placed.has(id)).map((id) => byId.get(id) as LayoutNode);
      const arc = hub.id === rootHub.id ? Math.PI * 2 : Math.PI * 0.9;
      next.forEach((child, index) => {
        const angle = hub.id === rootHub.id
          ? -Math.PI / 4 + index * (arc / Math.max(1, next.length))
          : direction + (next.length === 1 ? turn * 0.35 : -arc / 2 + index * (arc / (next.length - 1)));
        const distance = linkLength(hub, child);
        child.px = hub.px + Math.cos(angle) * distance;
        child.py = hub.py + Math.sin(angle) * distance;
        placed.add(child.id);
        queue.push({ hub: child, direction: angle, turn: -turn });
      });
    }
    if (hubs.length > 1) {
      type SimNode = d3.SimulationNodeDatum & { node: LayoutNode; radius: number };
      const simNodes: SimNode[] = hubs.map((hub) => ({ node: hub, radius: clusterRadius(hub), x: hub.px, y: hub.py, ...(hub.id === rootHub.id ? { fx: hub.px, fy: hub.py } : {}) }));
      const simById = new Map(simNodes.map((item) => [item.node.id, item]));
      const links = this._edges
        .filter((edge) => simById.has(edge.from) && simById.has(edge.to) && edge.from !== edge.to)
        .map((edge) => ({ source: simById.get(edge.from) as SimNode, target: simById.get(edge.to) as SimNode }));
      const simulation = d3.forceSimulation(simNodes)
        .force("link", d3.forceLink<SimNode, (typeof links)[number]>(links).distance((link) => linkLength(link.source.node, link.target.node)).strength(0.9))
        .force("charge", d3.forceManyBody<SimNode>().strength(-320).distanceMax(card ? 1400 : 700))
        .force("collide", d3.forceCollide<SimNode>((item) => item.radius + gap / 4).strength(1).iterations(3))
        .alphaDecay(0.01)
        .stop();
      for (let tick = 0; tick < 700; tick += 1) simulation.tick();
      simNodes.forEach((item) => { item.node.px = item.x ?? item.node.px; item.node.py = item.y ?? item.node.py; });
    }

    // Leaves: fill the ring around each hub, skipping a wedge around every backbone link.
    hubs.forEach((hub) => {
      const leaves = leavesOf.get(hub.id) ?? [];
      if (!leaves.length) return;
      const blocked = [...(adjacent.get(hub.id) ?? [])].filter((id) => hubIds.has(id))
        .map((id) => { const other = byId.get(id) as LayoutNode; return Math.atan2(other.py - hub.py, other.px - hub.px); })
        .map((angle) => (angle + Math.PI * 2) % (Math.PI * 2)).sort((a, b) => a - b);
      // In node view the hub's name sits below it, so keep that direction free as well.
      const reserved = card ? [] : [{ angle: Math.PI / 2, wedge: 0.85 }];
      const gaps = [...blocked.map((angle) => ({ angle, wedge: Math.min(0.32, Math.PI / (blocked.length * 2 + 2)) })), ...reserved]
        .sort((a, b) => a.angle - b.angle);
      const segments = gaps.length
        ? gaps.map((gap, index) => {
          const next = index + 1 < gaps.length ? gaps[index + 1] : { angle: gaps[0].angle + Math.PI * 2, wedge: gaps[0].wedge };
          return { start: gap.angle + gap.wedge, length: Math.max(0, next.angle - gap.angle - gap.wedge - next.wedge) };
        })
        : [{ start: -Math.PI / 2, length: Math.PI * 2 }];
      const total = segments.reduce((sum, segment) => sum + segment.length, 0) || Math.PI * 2;
      const ring = ringFor(hub, total);
      const step = total / leaves.length;
      let cursor = step / 2;
      leaves.forEach((leaf) => {
        let offset = cursor;
        const segment = segments.find((item) => { if (offset <= item.length) return true; offset -= item.length; return false; }) ?? segments[0];
        const angle = segment.start + Math.min(offset, segment.length);
        leaf.angle = angle;
        leaf.px = hub.px + Math.cos(angle) * ring;
        leaf.py = hub.py + Math.sin(angle) * ring;
        cursor += step;
      });
    });
    // Keep the main entity near the centre of the canvas.
    const shiftX = (this.clientWidth || 900) / 2 - main.px;
    const shiftY = (this.clientHeight || 560) / 2 - main.py;
    if (Number.isFinite(shiftX) && Number.isFinite(shiftY)) nodes.forEach((node) => { node.px += shiftX; node.py += shiftY; });
  }

  // Circles are drawn at half size in the cluster arrangement so dense clusters stay compact.
  private _circleRadius(node: OrgChartNode) {
    const radius = this._isMain(node) ? this._layoutConfig.mainNodeRadius : this._layoutConfig.nodeRadius;
    return this._arrangement === "cluster" ? Math.max(10, radius * 0.5) : radius;
  }

  private _radiusForLevel(level: number) { return this._layoutConfig.firstRingRadius + (level - 1) * this._layoutConfig.ringSpacing; }
  private _descendantIds(id: string) {
    const descendants: string[] = [];
    const queue = [...(this._childrenById.get(id) ?? [])];
    while (queue.length) { const current = queue.shift() as string; descendants.push(current); queue.push(...(this._childrenById.get(current) ?? [])); }
    return descendants;
  }
  private _shownEdges() { return this._edges.filter((edge) => this._expanded.has(edge.from) || this._expanded.has(edge.to)); }
  private _visibleIds(edges = this._shownEdges()) { const ids = new Set([this._activeMainId, ...this._expanded]); edges.forEach((edge) => { ids.add(edge.from); ids.add(edge.to); }); return ids; }
  private _boundary(node: OrgChartNode, ux: number, uy: number) {
    if (this._viewMode === "node") return this._circleRadius(node);
    const size = this._dimensions(node);
    return Math.min((size.width / 2) / Math.max(Math.abs(ux), 0.001), (size.height / 2) / Math.max(Math.abs(uy), 0.001));
  }
  private _edgePoints(edge: OrgChartEdge) {
    const source = this._nodeById.get(edge.from) as LayoutNode;
    const target = this._nodeById.get(edge.to) as LayoutNode;
    const dx = target.px - source.px;
    const dy = target.py - source.py;
    const length = Math.max(1, Math.hypot(dx, dy));
    const ux = dx / length;
    const uy = dy / length;
    const start = this._boundary(source, ux, uy) + 4;
    const end = this._boundary(target, ux, uy) + 8;
    return { x1: source.px + ux * start, y1: source.py + uy * start, x2: target.px - ux * end, y2: target.py - uy * end };
  }

  private _measureContext?: CanvasRenderingContext2D | null;
  // Card view and cluster node view wrap names; radial node view keeps one line beside the circle.
  private _nodeNameLines(node: OrgChartNode) {
    if (this._viewMode === "card") return this._cardText(node).name;
    return this._arrangement === "cluster" ? this._cardText(node, 150).name : [node.name];
  }
  private _cardTextCache = new Map<string, { name: string[]; kind: string[]; contentHeight: number }>();

  // Word-wraps a card's name (up to 3 lines) and uppercase kind (up to 2 lines) to the card width.
  private _cardText(node: OrgChartNode, wrapWidth?: number) {
    const width = wrapWidth ?? this._baseCardSize(node).width - 30;
    const kind = (node.kind ?? "Entity").toUpperCase();
    const key = `${width}|${node.name}|${kind}`;
    const cached = this._cardTextCache.get(key);
    if (cached) return cached;
    this._measureContext ??= document.createElement("canvas").getContext("2d");
    const context = this._measureContext;
    const wrap = (text: string, font: string, letterSpacing: number, maxLines: number, maxWidth: number) => {
      if (!context) return [text];
      context.font = font;
      const fits = (value: string) => context.measureText(value).width + value.length * letterSpacing <= maxWidth;
      const lines: string[] = [];
      let current = "";
      for (const word of text.split(/\s+/)) {
        const candidate = current ? `${current} ${word}` : word;
        if (fits(candidate) || !current) current = candidate;
        else { lines.push(current); current = word; }
      }
      if (current) lines.push(current);
      if (lines.length <= maxLines) return lines;
      let last = lines.slice(maxLines - 1).join(" ");
      while (last.length > 1 && !fits(`${last}…`)) last = last.slice(0, -1).trimEnd();
      return [...lines.slice(0, maxLines - 1), `${last}…`];
    };
    const name = wrap(node.name, "700 11px Arial, sans-serif", 0, 3, width);
    const kindLines = wrap(kind, "700 8px Arial, sans-serif", 0.55, 2, width - 8);
    const result = { name, kind: kindLines, contentHeight: name.length * 12.5 + 6 + kindLines.length * 10.5 };
    this._cardTextCache.set(key, result);
    return result;
  }

  private _nodeLabelPosition(node: LayoutNode, main: LayoutNode) {
    if (this._viewMode === "card") {
      const text = this._cardText(node);
      const top = -text.contentHeight / 2;
      return { x: -this._dimensions(node).width / 2 + 15, nameY: top + 6.25, kindY: top + text.name.length * 12.5 + 14, anchor: "start" };
    }
    const radius = this._circleRadius(node);
    if (this._arrangement === "cluster" && this._clusterLeaves.has(node.id)) {
      const lines = this._nodeNameLines(node).length;
      const cos = Math.cos(node.angle);
      const sin = Math.sin(node.angle);
      const anchor = cos > 0.1 ? "start" : cos < -0.1 ? "end" : "middle";
      const x = cos * (radius + 6);
      const blockHeight = (lines - 1) * 12.5 + 14;
      const centerY = sin * (radius + 6) + (anchor === "middle" ? Math.sign(sin || 1) * (blockHeight / 2 + 6) : 0);
      const nameY = centerY - blockHeight / 2 + 4;
      return { x, nameY, kindY: nameY + (lines - 1) * 12.5 + 12, anchor };
    }
    if (this._isMain(node) || this._arrangement === "cluster") {
      const lines = this._nodeNameLines(node).length;
      return { x: 0, nameY: radius + 17, kindY: radius + 21 + lines * 12.5, anchor: "middle" };
    }
    const dx = node.px - main.px;
    const dy = node.py - main.py;
    const length = Math.max(1, Math.hypot(dx, dy));
    const tangentX = -dy / length;
    const tangentY = dx / length;
    const distance = radius + 15;
    const x = tangentX * distance;
    const centerY = tangentY * distance;
    return { x, nameY: centerY - 5, kindY: centerY + 11, anchor: x > 8 ? "start" : x < -8 ? "end" : "middle" };
  }

  private _positionEdgeLabels(labels: d3.Selection<SVGGElement, OrgChartEdge, SVGGElement, unknown>, edgeGeometry: Map<OrgChartEdge, { x1: number; y1: number; x2: number; y2: number }>, groups: d3.Selection<SVGGElement, LayoutNode, SVGGElement, unknown>) {
    type Bounds = { x: number; y: number; width: number; height: number };
    const padded = (box: Bounds, amount: number): Bounds => ({ x: box.x - amount, y: box.y - amount, width: box.width + amount * 2, height: box.height + amount * 2 });
    const intersects = (a: Bounds, b: Bounds) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
    const obstacles: Bounds[] = groups.nodes().map((element) => {
      const node = d3.select<SVGGElement, LayoutNode>(element).datum();
      const box = element.getBBox();
      return padded({ x: node.px + box.x, y: node.py + box.y, width: box.width, height: box.height }, 7);
    });
    const focusLabel = this._viewport?.select<SVGTextElement>("text.focus-label").node();
    if (focusLabel) obstacles.push(padded(focusLabel.getBBox(), 6));
    if (this._arrangement === "cluster") {
      // Cluster view: small labels written along the edge, kept upright.
      labels.each((edge, index, elements) => {
        const geometry = edgeGeometry.get(edge);
        if (!geometry) return;
        let angle = Math.atan2(geometry.y2 - geometry.y1, geometry.x2 - geometry.x1) * 180 / Math.PI;
        if (angle > 90) angle -= 180;
        if (angle < -90) angle += 180;
        d3.select(elements[index]).attr("transform", `translate(${(geometry.x1 + geometry.x2) / 2},${(geometry.y1 + geometry.y2) / 2}) rotate(${angle})`);
      });
      return;
    }
    const placed: Bounds[] = [];
    labels.each((edge, index, elements) => {
      const element = elements[index];
      const geometry = edgeGeometry.get(edge);
      if (!geometry) return;
      const box = element.getBBox();
      const centerX = (geometry.x1 + geometry.x2) / 2;
      const centerY = (geometry.y1 + geometry.y2) / 2;
      const dx = geometry.x2 - geometry.x1;
      const dy = geometry.y2 - geometry.y1;
      const length = Math.max(1, Math.hypot(dx, dy));
      const normalX = -dy / length;
      const normalY = dx / length;
      const offsets = [0, 27, -27, 46, -46, 66, -66];
      let chosen = offsets[offsets.length - 1];
      for (const offset of offsets) {
        const candidate = padded({ x: centerX + normalX * offset + box.x, y: centerY + normalY * offset + box.y, width: box.width, height: box.height }, 4);
        if (![...obstacles, ...placed].some((other) => intersects(candidate, other))) { chosen = offset; break; }
      }
      const x = centerX + normalX * chosen;
      const y = centerY + normalY * chosen;
      d3.select(element).attr("transform", `translate(${x},${y})`);
      placed.push(padded({ x: x + box.x, y: y + box.y, width: box.width, height: box.height }, 4));
    });
  }

  private _draw() {
    if (!this._viewport || !this._layoutNodes.length) return;
    const edges = this._shownEdges().filter((edge) => this._nodeById.has(edge.from) && this._nodeById.has(edge.to));
    const visible = this._visibleIds(edges);
    const shownNodes = this._layoutNodes.filter((node) => visible.has(node.id));
    const edgeGeometry = new Map(edges.map((edge) => [edge, this._edgePoints(edge)]));
    const main = this._nodeById.get(this._activeMainId);
    if (!main) return;
    this._svg?.attr("data-arrangement", this._arrangement);
    this._drawMarkers();
    const rings = this._viewport.selectAll<SVGGElement, unknown>("g.rings").data([0]).join("g").attr("class", "rings");
    const edgeLayer = this._viewport.selectAll<SVGGElement, unknown>("g.edges").data([0]).join("g").attr("class", "edges");
    const labelLayer = this._viewport.selectAll<SVGGElement, unknown>("g.labels").data([0]).join("g").attr("class", "labels");
    const nodeLayer = this._viewport.selectAll<SVGGElement, unknown>("g.nodes").data([0]).join("g").attr("class", "nodes");
    const depths = [...new Set(shownNodes.map((node) => node.level).filter(Boolean))];
    rings.selectAll("circle").data(this._arrangement === "cluster" ? [] : depths).join("circle").attr("class", "depth-ring").attr("cx", main.px).attr("cy", main.py).attr("r", (depth) => this._radiusForLevel(depth));
    edgeLayer.selectAll<SVGLineElement, OrgChartEdge>("line").data(edges, (edge) => `${edge.from}-${edge.to}-${edge.label}`).join("line").attr("class", "edge")
      .attr("x1", (edge) => edgeGeometry.get(edge)?.x1 ?? 0).attr("y1", (edge) => edgeGeometry.get(edge)?.y1 ?? 0).attr("x2", (edge) => edgeGeometry.get(edge)?.x2 ?? 0).attr("y2", (edge) => edgeGeometry.get(edge)?.y2 ?? 0)
      .attr("stroke", (edge) => this._edgeColor(edge)).attr("marker-end", (edge) => `url(#org-arrow-${this._edgeColorIndex(edge)})`);
    const labels = labelLayer.selectAll<SVGGElement, OrgChartEdge>("g.edge-label").data(edges, (edge) => `${edge.from}-${edge.to}-${edge.label}`).join((enter) => { const group = enter.append("g").attr("class", "edge-label"); group.append("rect").attr("rx", 6).attr("y", -10).attr("height", 20); group.append("text"); return group; });
    labels.attr("transform", (edge) => { const point = edgeGeometry.get(edge) ?? { x1: 0, y1: 0, x2: 0, y2: 0 }; return `translate(${(point.x1 + point.x2) / 2},${(point.y1 + point.y2) / 2})`; });
    labels.select("rect").attr("x", (edge) => -((edge.label?.length ?? 0) * 6.2 + 18) / 2).attr("width", (edge) => (edge.label?.length ?? 0) * 6.2 + 18).attr("stroke", (edge) => this._edgeColor(edge));
    labels.select("text").text((edge) => edge.label ?? "Related").attr("fill", (edge) => this._edgeColor(edge));
    this._viewport.selectAll("text.focus-label").data([main]).join("text").attr("class", "focus-label").attr("x", main.px).attr("y", main.py - (this._viewMode === "node" ? this._circleRadius(main) + 17 : this._dimensions(main).height / 2 + 16)).text("MAIN ENTITY");
    const groups = nodeLayer.selectAll<SVGGElement, LayoutNode>("g.node").data(shownNodes, (node) => node.id).join((enter) => {
      const group = enter.append("g").attr("class", "node").attr("tabindex", 0).attr("role", "button");
      group.append("rect").attr("class", "node-rect").attr("rx", 9); group.append("circle").attr("class", "node-circle"); group.append("text").attr("class", "node-name"); group.append("text").attr("class", "node-kind");
      const badge = group.append("g").attr("class", "more-badge"); badge.append("rect").attr("rx", 10).attr("width", 25).attr("height", 20).attr("x", -12.5).attr("y", -10); badge.append("text"); group.append("title"); return group;
    });
    groups.attr("transform", (node) => `translate(${node.px},${node.py})`).attr("aria-label", (node) => `${node.name}, ${node.kind ?? "Entity"}`).attr("aria-expanded", (node) => this._expanded.has(node.id) ? "true" : "false");
    groups.select<SVGRectElement>(".node-rect").attr("x", (node) => -this._dimensions(node).width / 2).attr("y", (node) => -this._dimensions(node).height / 2).attr("width", (node) => this._dimensions(node).width).attr("height", (node) => this._dimensions(node).height)
      .attr("display", this._viewMode === "card" ? null : "none").attr("fill", (node) => this._isMain(node) ? this._mainEntityColor.background : this._resolvedNodeColor().background).attr("stroke", (node) => this._isMain(node) ? this._mainEntityColor.border : this._resolvedNodeColor().border);
    groups.select<SVGCircleElement>(".node-circle").attr("r", (node) => this._circleRadius(node))
      .attr("display", this._viewMode === "node" ? null : "none").attr("fill", (node) => this._isMain(node) ? this._mainEntityColor.background : this._resolvedNodeColor().background).attr("stroke", (node) => this._isMain(node) ? this._mainEntityColor.border : this._resolvedNodeColor().border);
    groups.select<SVGTextElement>(".node-name").attr("x", (node) => this._nodeLabelPosition(node, main).x).attr("y", (node) => this._nodeLabelPosition(node, main).nameY).attr("text-anchor", (node) => this._nodeLabelPosition(node, main).anchor).attr("fill", (node) => this._viewMode === "node" ? this._resolvedNodeColor().text : this._isMain(node) ? this._mainEntityColor.text : this._resolvedNodeColor().text).each((node, index, elements) => {
      const text = d3.select(elements[index]);
      const x = this._nodeLabelPosition(node, main).x;
      const lines = this._nodeNameLines(node);
      text.text(null).selectAll("tspan").data(lines).join("tspan").attr("x", x).attr("dy", (_, line) => line ? 12.5 : 0).text((line) => line);
    });
    groups.select<SVGTextElement>(".node-kind").attr("x", (node) => this._nodeLabelPosition(node, main).x).attr("y", (node) => this._nodeLabelPosition(node, main).kindY).attr("text-anchor", (node) => this._nodeLabelPosition(node, main).anchor).attr("fill", (node) => this._viewMode === "node" ? this._resolvedNodeColor().secondaryText : this._isMain(node) ? this._mainEntityColor.secondaryText : this._resolvedNodeColor().secondaryText).each((node, index, elements) => {
      const text = d3.select(elements[index]);
      const x = this._nodeLabelPosition(node, main).x;
      const lines = this._viewMode === "card" ? this._cardText(node).kind : [(node.kind ?? "Entity").toUpperCase()];
      text.text(null).selectAll("tspan").data(lines).join("tspan").attr("x", x).attr("dy", (_, line) => line ? 10.5 : 0).text((line) => line);
    });
    groups.select("title").text((node) => `${node.name}\n${node.kind ?? "Entity"}`);
    const shownEdgeSet = new Set(edges);
    groups.select<SVGGElement>(".more-badge").each((node, index, elements) => {
      const count = (this._edgesByNode.get(node.id) ?? []).filter((edge) => !shownEdgeSet.has(edge)).length;
      const radius = this._circleRadius(node);
      const group = d3.select(elements[index]).attr("display", count ? null : "none").attr("transform", this._viewMode === "node" ? `translate(${radius * .72},${-radius * .72})` : `translate(${this._dimensions(node).width / 2},${-this._dimensions(node).height / 2})`);
      group.select("rect").attr("fill", this._resolvedNodeColor().border);
      group.select("text").text(`+${count}`);
    });
    this._positionEdgeLabels(labels, edgeGeometry, groups);
    this._attachNodeBehavior(groups);
    this._drawLegend();
    this._emitState();
  }

  private _edgeColorIndex(edge: OrgChartEdge) {
    const label = edge.label ?? "Related";
    const configured = this._edgeLabelColorIndices[label];
    const index = Number.isInteger(configured) ? configured : (this._edgeLabelIndex.get(label) ?? 0);
    const length = Math.max(1, this._colors.length);
    return ((index % length) + length) % length;
  }
  private _drawMarkers() {
    const defs = this._svg?.select("defs");
    if (!defs) return;
    const markers = defs.selectAll<SVGMarkerElement, string>("marker").data(this._colors, (_, index) => String(index)).join("marker").attr("id", (_, index) => `org-arrow-${index}`).attr("viewBox", "0 0 10 10").attr("refX", 9).attr("refY", 5).attr("markerWidth", 8).attr("markerHeight", 8).attr("orient", "auto").attr("markerUnits", "userSpaceOnUse");
    markers.selectAll("path").data((color) => [color]).join("path").attr("d", "M 0 0 L 10 5 L 0 10 z").attr("fill", (color) => color);
  }

  private _attachNodeBehavior(groups: d3.Selection<SVGGElement, LayoutNode, SVGGElement, unknown>) {
    const drag = d3.drag<SVGGElement, LayoutNode>().container(() => this._viewport?.node() as SVGGElement).clickDistance(4).subject((_, node) => ({ x: node.px, y: node.py }))
      .on("start", (event) => { event.sourceEvent.stopPropagation(); d3.select(event.sourceEvent.currentTarget).classed("selected", true).raise(); })
      .on("drag", (event, node) => { this._moveNode(node, event.x - node.px, event.y - node.py); this._draw(); })
      .on("end", (_, node) => this.dispatchEvent(new CustomEvent("org-chart-node-move", { detail: { node: { ...node }, position: { x: node.px, y: node.py } }, bubbles: true, composed: true })));
    groups.call(drag).on("click", (event, node) => {
      groups.classed("selected", false); d3.select(event.currentTarget).classed("selected", true);
      if (!this._isMain(node)) this._toggleNode(node.id);
      this.dispatchEvent(new CustomEvent("org-chart-node-select", { detail: { node }, bubbles: true, composed: true }));
    }).on("keydown", (event: KeyboardEvent, node) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (!this._isMain(node)) this._toggleNode(node.id); }
      const movement: Record<string, [number, number]> = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -12], ArrowDown: [0, 12] };
      if (movement[event.key]) { event.preventDefault(); this._moveNode(node, ...movement[event.key]); this._draw(); }
    });
  }

  private _toggleNode(id: string) { this._expanded.has(id) ? this.collapseNode(id) : this.expandNode(id); }
  private _moveNode(node: LayoutNode, dx: number, dy: number) {
    if (this._isMain(node)) this._layoutNodes.forEach((item) => { item.px += dx; item.py += dy; });
    else { node.px += dx; node.py += dy; }
  }

  private _emitExpansion(type: "org-chart-node-expand" | "org-chart-node-collapse", node?: LayoutNode, all = false) {
    this.dispatchEvent(new CustomEvent(type, { detail: { node: node ? { ...node } : undefined, all, visibleNodes: this.getVisibleNodes() }, bubbles: true, composed: true }));
  }

  private _drawLegend() {
    const legend = d3.select(this.renderRoot.querySelector(".legend") as SVGGElement).attr("transform", `translate(18,${this.clientHeight - 44})`);
    legend.selectAll("rect.legend-bg").data([0]).join("rect").attr("class", "legend-bg").attr("width", 335).attr("height", 28).attr("rx", 6);
    const items = [{ x: 14, label: "Arrow shows relationship direction", color: "#31594c", shape: "line" }, { x: 178, label: "Person", color: "#587bb4", shape: "circle" }, { x: 247, label: "Organisation", color: "#567b6d", shape: "square" }];
    const groups = legend.selectAll<SVGGElement, typeof items[number]>("g.legend-item").data(items).join("g").attr("class", "legend-item").attr("transform", (item) => `translate(${item.x},14)`);
    groups.each(function(item) { const group = d3.select(this); group.selectAll("*").remove(); if (item.shape === "line") group.append("path").attr("d", "M0,0 H15 M11,-4 L15,0 L11,4").attr("fill", "none").attr("stroke", item.color); else if (item.shape === "circle") group.append("circle").attr("r", 4).attr("fill", item.color); else group.append("rect").attr("x", -4).attr("y", -4).attr("width", 8).attr("height", 8).attr("rx", 2).attr("fill", item.color); group.append("text").attr("x", item.shape === "line" ? 21 : 9).text(item.label); });
  }

  private _scaleBy(factor: number) { if (this._svg && this._zoom) this._svg.call(this._zoom.scaleBy, factor, [this.clientWidth / 2, this.clientHeight / 2]); }
  private _handleWheel = (event: WheelEvent) => { event.preventDefault(); this._scaleBy(Math.exp(-event.deltaY * 0.0015)); };
  private _emitState() { this.dispatchEvent(new CustomEvent("org-chart-state-change", { detail: { zoom: this._zoomValue, expandedCount: this._expanded.size, nodeCount: this._layoutNodes.length, viewMode: this._viewMode }, bubbles: true, composed: true })); }
}

if (typeof window !== "undefined" && !customElements.get("org-hierarchy-chart")) customElements.define("org-hierarchy-chart", OrgHierarchyChart);

declare global {
  interface HTMLElementTagNameMap { "org-hierarchy-chart": OrgHierarchyChart; }
}
