export type Category = 'Spatial' | 'Structural' | 'MEP' | 'Materials' | 'Regulatory' | 'Cost';

export interface CategoryMeta {
  id: Category;
  label: string;
  description: string;
  color: string; // Tailind badge color
  borderColor: string;
  bgColor: string;
  textColor: string;
  hex: string;
}

export interface BoundingBox {
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // percentage 0-100
  height: number; // percentage 0-100
}

export interface Extraction {
  id: string;
  projectId: string;
  documentId: string;
  pageNumber: number;
  category: Category;
  value: string;
  confidence: number; // 0 - 100
  bbox: BoundingBox;
  status: 'verified' | 'flagged' | 'corrected';
  extractedAt: string;
  elementId?: string; // e.g. "C1", "AHU-04", "RM-102"
}

export interface FocusConstraint {
  id: string;
  projectId: string;
  text: string;
  tag: 'Columns' | 'MEP' | 'Materials' | 'Exclusion' | 'PageRange' | 'General' | 'Zoning';
  category?: Category;
  isActive: boolean;
}

export interface Correction {
  id: string;
  extractionId: string;
  projectId: string;
  elementId?: string;
  originalValue: string;
  correctedValue: string;
  correctedBy: string;
  timestamp: string;
}

export interface DocumentPage {
  pageNumber: number;
  title: string;
  drawingType: 'floor_plan' | 'structural_grid' | 'mep_layout' | 'detail_section' | 'specifications';
  dimensions: { width: number; height: number };
  svgContent?: string; // High-res blueprint drawings
}

export interface Document {
  id: string;
  projectId: string;
  name: string;
  fileName: string;
  fileSize: string;
  pageCount: number;
  uploadedAt: string;
  pages: DocumentPage[];
}

export interface Project {
  id: string;
  name: string;
  code: string;
  owner: string;
  createdAt: string;
  description: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Principal Architect' | 'Structural Lead' | 'MEP Engineer' | 'BIM Specialist';
  avatarUrl?: string;
}

export interface DiagramNode {
  id: string;
  label: string;
  subLabel?: string;
  category: Category;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DiagramEdge {
  from: string;
  to: string;
  relationship: string;
}

export interface DiagramData {
  projectId: string;
  documentId: string;
  title: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}
