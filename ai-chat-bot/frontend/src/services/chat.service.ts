import type {
  ChatMessage,
  KnowledgeCategory,
  SendMessageRequest,
  SendMessageResponse,
} from '../types/chat';

function formatTimeNow(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function inferCategory(prompt: string, fallback: KnowledgeCategory): Exclude<KnowledgeCategory, 'all'> {
  if (fallback !== 'all') return fallback;
  const q = prompt.toLowerCase();
  if (q.includes('git') || q.includes('repo') || q.includes('enterprise-ui') || q.includes('bot')) {
    return 'git';
  }
  if (q.includes('work') || q.includes('company') || q.includes('role') || q.includes('pr') || q.includes('test')) {
    return 'work';
  }
  if (q.includes('edu') || q.includes('college') || q.includes('degree') || q.includes('timeline') || q.includes('milestone')) {
    return 'education';
  }
  return 'git';
}

function buildMockAssistantMessage(req: SendMessageRequest): ChatMessage {
  const createdAt = formatTimeNow();
  const category = inferCategory(req.prompt, req.scope.category);
  const attachmentNote =
    req.attachments.length > 0
      ? ` (with ${req.attachments.length} attachment${req.attachments.length > 1 ? 's' : ''})`
      : '';

  if (category === 'work') {
    return {
      id: `msg-${Date.now()}-a`,
      conversationId: req.conversationId,
      role: 'assistant',
      content: `Here is a structured look at your work experience and engineering workflow${attachmentNote} (${req.scope.detailLevel} view):`,
      createdAt,
      categoryTag: 'work',
      heroFormat: 'comparison-table',
      comparisonTable: {
        title: 'Work & Engineering Matrix',
        columns: ['Domain', 'Stack / Workflow', 'Day-to-Day Focus'],
        rows: [
          ['Frontend App', 'React, TypeScript, Monorepo', 'UI features, data tables, clean state'],
          ['Code Quality', 'PRs, Linting, SonarQube', 'Safe merges, consistent patterns, reviews'],
          ['Testing & Hiring', 'Unit Tests, DOM, React Hooks', 'Test scripts and technical interviews'],
        ],
      },
      accordionNotes: [
        {
          id: 'note-work-1',
          title: 'Backend Integration Readiness',
          content:
            'When the Express + PostgreSQL + Gemini service is wired up, this response will come from recent conversation context and your persisted profile knowledge base.',
        },
      ],
    };
  }

  if (category === 'education') {
    return {
      id: `msg-${Date.now()}-a`,
      conversationId: req.conversationId,
      role: 'assistant',
      content: `Here is your education and milestone progression${attachmentNote}:`,
      createdAt,
      categoryTag: 'education',
      heroFormat: 'timeline-stepper',
      timelineMilestones: [
        {
          id: 'ms-edu-1',
          title: 'Academic & Project Foundations',
          subtitle: 'Core CS, Projects & Pitch Reviews',
          dateLabel: 'Stage 1',
          description: 'Built foundational software projects, structured presentations, and problem-solving habits.',
          badge: 'Education',
        },
        {
          id: 'ms-edu-2',
          title: 'Production Frontend & Testing',
          subtitle: 'React + TypeScript Engineering',
          dateLabel: 'Stage 2',
          description: 'Applied TypeScript, component design, and testing practices in real-world codebases.',
          badge: 'Work',
        },
        {
          id: 'ms-edu-3',
          title: 'Design System & AI Assistant UI',
          subtitle: 'enterprise-ui & ai-chat-bot',
          dateLabel: '2026',
          description: 'Created a modular React design system and a Gemini-style profile assistant interface.',
          badge: 'Git',
        },
      ],
    };
  }

  return {
    id: `msg-${Date.now()}-a`,
    conversationId: req.conversationId,
    role: 'assistant',
    content: `Here is a profile breakdown from your personal Git projects & stack${attachmentNote}:`,
    createdAt,
    categoryTag: 'git',
    heroFormat: 'project-card',
    projectCard: {
      title: req.scope.focusEntity || 'enterprise-ui & ai-chat-bot Frontend',
      category: 'git',
      summary:
        'Built with React 19, TypeScript, Vite, and Tailwind CSS v4—combining reusable enterprise UI primitives with a focused Gemini-style chat workspace.',
      stack: ['React 19', 'TypeScript', 'Vite', 'Tailwind CSS v4', 'Node.js'],
      highlights: [
        'Consumes local enterprise-ui components and @source styling cleanly',
        'Keeps service contracts (chat, conversation, auth) decoupled for the backend API',
        'Supports category filtering, attachments, and structured single-hero message views',
      ],
      repoOrOrg: 'Local Monorepo / Personal Git',
      period: '2026',
      collapsibleNotes:
        'Mock UI note: Swap the mock generator inside chat.service.ts with your backend POST endpoint once the Express + Prisma + Gemini API is ready.',
    },
  };
}

export interface ChatService {
  sendMessage(request: SendMessageRequest, signal?: AbortSignal): Promise<SendMessageResponse>;
}

export const chatService: ChatService = {
  async sendMessage(request: SendMessageRequest, signal?: AbortSignal): Promise<SendMessageResponse> {
    const trimmed = request.prompt.trim();
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      conversationId: request.conversationId,
      role: 'user',
      content: trimmed || 'Shared an attachment for profile context.',
      createdAt: formatTimeNow(),
      attachments: request.attachments,
      categoryTag: request.scope.category === 'all' ? undefined : request.scope.category,
    };

    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(resolve, 650);
      if (signal) {
        if (signal.aborted) {
          window.clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
          return;
        }
        signal.addEventListener(
          'abort',
          () => {
            window.clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
          },
          { once: true }
        );
      }
    });

    const assistantMessage = buildMockAssistantMessage(request);
    return { userMessage, assistantMessage };
  },
};