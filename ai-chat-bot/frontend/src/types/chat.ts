export type KnowledgeCategory = 'all' | 'git' | 'work' | 'education';

export type ResponseDetailLevel = 'concise' | 'detailed' | 'technical';

export type RichHeroFormat =
  | 'none'
  | 'project-card'
  | 'comparison-table'
  | 'timeline-stepper'
  | 'accordion-notes';

export interface AttachmentItem {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  previewUrl: string;
}

export interface ProjectCardPayload {
  title: string;
  category: Exclude<KnowledgeCategory, 'all'>;
  summary: string;
  stack: string[];
  highlights: string[];
  repoOrOrg?: string;
  period?: string;
  collapsibleNotes?: string;
}

export interface ComparisonTablePayload {
  title: string;
  columns: string[];
  rows: string[][];
}

export interface TimelineMilestone {
  id: string;
  title: string;
  subtitle: string;
  dateLabel: string;
  description: string;
  badge?: string;
}

export interface AccordionNoteItem {
  id: string;
  title: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  attachments?: AttachmentItem[];
  categoryTag?: Exclude<KnowledgeCategory, 'all'>;
  heroFormat?: RichHeroFormat;
  projectCard?: ProjectCardPayload;
  comparisonTable?: ComparisonTablePayload;
  timelineMilestones?: TimelineMilestone[];
  accordionNotes?: AccordionNoteItem[];
  rating?: number;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  pinned?: boolean;
  preview?: string;
}

export interface ChatScopeFilter {
  category: KnowledgeCategory;
  focusEntity?: string;
  detailLevel: ResponseDetailLevel;
  includedSources: {
    git: boolean;
    work: boolean;
    education: boolean;
    notes: boolean;
  };
  maxItems: number;
  fromDate?: string;
}

export interface SendMessageRequest {
  conversationId: string;
  prompt: string;
  attachments: AttachmentItem[];
  scope: ChatScopeFilter;
}

export interface SendMessageResponse {
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
}

export interface AuthSession {
  userId: string;
  displayName: string;
  role: 'guest' | 'owner';
}