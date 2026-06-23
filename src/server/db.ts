import fs from 'fs';
import path from 'path';
import { Project, Document, Extraction, FocusConstraint, Correction, User, DiagramData } from '../types';
import { DEMO_PROJECTS, DEMO_DOCUMENTS, DEMO_EXTRACTIONS, DEMO_FOCUS_BOXES, DEMO_CORRECTIONS, DEMO_USERS, DEMO_DIAGRAM } from '../data/demoData';

export interface DatabaseSchema {
  projects: Project[];
  documents: Document[];
  extractions: Extraction[];
  focus_boxes: FocusConstraint[];
  corrections: Correction[];
  users: User[];
  diagrams: Record<string, DiagramData>; // by projectId
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'archidoc_db.json');

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = {
      projects: [...DEMO_PROJECTS],
      documents: [...DEMO_DOCUMENTS],
      extractions: [...DEMO_EXTRACTIONS],
      focus_boxes: [...DEMO_FOCUS_BOXES],
      corrections: [...DEMO_CORRECTIONS],
      users: [...DEMO_USERS],
      diagrams: {
        'prj-alpha': { ...DEMO_DIAGRAM }
      }
    };
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        this.data = { ...this.data, ...parsed };
      } else {
        this.save();
      }
    } catch (e) {
      console.warn('Could not read persistent DB file, using in-memory demo state:', e);
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Could not write persistent DB file:', e);
    }
  }

  public getProjects(): Project[] {
    return this.data.projects;
  }

  public getProject(id: string): Project | undefined {
    return this.data.projects.find(p => p.id === id);
  }

  public createProject(project: Project): Project {
    this.data.projects.unshift(project);
    this.save();
    return project;
  }

  public getDocuments(projectId: string): Document[] {
    return this.data.documents.filter(d => d.projectId === projectId);
  }

  public getDocument(docId: string): Document | undefined {
    return this.data.documents.find(d => d.id === docId);
  }

  public addDocument(doc: Document): Document {
    this.data.documents.push(doc);
    this.save();
    return doc;
  }

  public getFocusBoxes(projectId: string): FocusConstraint[] {
    return this.data.focus_boxes.filter(f => f.projectId === projectId);
  }

  public addFocusBox(constraint: FocusConstraint): FocusConstraint {
    this.data.focus_boxes.push(constraint);
    this.save();
    return constraint;
  }

  public deleteFocusBox(id: string) {
    this.data.focus_boxes = this.data.focus_boxes.filter(f => f.id !== id);
    this.save();
  }

  public getExtractions(projectId: string, docId?: string): Extraction[] {
    return this.data.extractions.filter(e => e.projectId === projectId && (!docId || e.documentId === docId));
  }

  public addExtractions(extractions: Extraction[]) {
    this.data.extractions.push(...extractions);
    this.save();
  }

  public updateExtraction(id: string, value: string, status: 'verified' | 'flagged' | 'corrected', user: string): Extraction | null {
    const extIndex = this.data.extractions.findIndex(e => e.id === id);
    if (extIndex === -1) return null;

    const originalValue = this.data.extractions[extIndex].value;
    this.data.extractions[extIndex].value = value;
    this.data.extractions[extIndex].status = status;

    // Recalculate confidence if corrected
    if (status === 'corrected' && this.data.extractions[extIndex].confidence < 85) {
      this.data.extractions[extIndex].confidence = 100;
    }

    const correction: Correction = {
      id: `cor-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      extractionId: id,
      projectId: this.data.extractions[extIndex].projectId,
      elementId: this.data.extractions[extIndex].elementId,
      originalValue,
      correctedValue: value,
      correctedBy: user || 'Anonymous Lead',
      timestamp: new Date().toISOString(),
    };

    this.data.corrections.unshift(correction);
    this.save();
    return this.data.extractions[extIndex];
  }

  public getCorrections(projectId: string): Correction[] {
    return this.data.corrections.filter(c => c.projectId === projectId);
  }

  public getDiagram(projectId: string): DiagramData | undefined {
    return this.data.diagrams[projectId];
  }

  public saveDiagram(projectId: string, diagram: DiagramData) {
    this.data.diagrams[projectId] = diagram;
    this.save();
  }
}

export const db = new Database();
