import type { ChatMessage, ConversationSummary } from '../types/chat';

const STORAGE_KEY_CONVERSATIONS = 'ai_chat_bot_conversations_v1';
const STORAGE_KEY_MESSAGES = 'ai_chat_bot_messages_v1';

const INITIAL_CONVERSATIONS: ConversationSummary[] = [
  {
    id: 'conv-git-projects',
    title: 'Personal Git Projects & Stack',
    updatedAt: 'Today',
    pinned: true,
    preview: 'enterprise-ui component library, ai-chat-bot, React & TypeScript architecture',
  },
  {
    id: 'conv-work-experience',
    title: 'Work Experience & Frontend Roles',
    updatedAt: 'Yesterday',
    pinned: false,
    preview: 'Monorepo React TypeScript work, testing, PRs, and engineering workflow',
  },
  {
    id: 'conv-education-timeline',
    title: 'Education & Milestones',
    updatedAt: 'Nov 2026',
    pinned: false,
    preview: 'Academic background, technical projects, and career milestones',
  },
];

const INITIAL_MESSAGES_BY_CONV: Record<string, ChatMessage[]> = {
  'conv-git-projects': [
    {
      id: 'msg-git-1',
      conversationId: 'conv-git-projects',
      role: 'user',
      content: 'Tell me about my personal Git projects and frontend stack.',
      createdAt: '10:15 AM',
    },
    {
      id: 'msg-git-2',
      conversationId: 'conv-git-projects',
      role: 'assistant',
      content:
        'Your personal repositories focus on scalable React and TypeScript architecture, reusable UI design systems, and practical full-stack/AI tooling.',
      createdAt: '10:15 AM',
      categoryTag: 'git',
      heroFormat: 'project-card',
      projectCard: {
        title: 'enterprise-ui (React + TypeScript Design System)',
        category: 'git',
        summary:
          'A React, TypeScript, and Vite component library with Tailwind CSS v4, Storybook documentation, ESLint, and unit tests built for enterprise UI consistency.',
        stack: ['React 19', 'TypeScript', 'Vite', 'Tailwind CSS v4', 'Storybook'],
        highlights: [
          'Scoped cleanly for React applications with modular primitives and composite components',
          'Structured with design tokens, accessible interactions, and unit test coverage',
          'Reused locally inside ai-chat-bot as the shared UI foundation',
        ],
        repoOrOrg: 'Personal Git Repositories',
        period: '2026',
        collapsibleNotes:
          'Architecture note: Kept enterprise-ui as a dedicated design system package so product apps can consume tested primitives and layout patterns without duplicating styles.',
      },
    },
  ],
  'conv-work-experience': [
    {
      id: 'msg-work-1',
      conversationId: 'conv-work-experience',
      role: 'user',
      content: 'Summarize my work experience and core engineering strengths.',
      createdAt: 'Yesterday',
    },
    {
      id: 'msg-work-2',
      conversationId: 'conv-work-experience',
      role: 'assistant',
      content:
        'Your day-to-day engineering work centers on React + TypeScript applications in a monorepo, code quality checks, and frontend testing.',
      createdAt: 'Yesterday',
      categoryTag: 'work',
      heroFormat: 'comparison-table',
      comparisonTable: {
        title: 'Core Engineering Areas & Focus',
        columns: ['Area', 'Primary Tools', 'Key Focus'],
        rows: [
          ['Frontend Architecture', 'React, TypeScript, Vite', 'Data tables, UI state, maintainable components'],
          ['Quality & Reviews', 'ESLint, SonarQube, Git PRs', 'Clean diffs, merge conflict resolution, standards'],
          ['Testing & Interviews', 'Unit Testing, React DOM, Hooks', 'Reliable test scripts and candidate evaluation'],
        ],
      },
    },
  ],
  'conv-education-timeline': [
    {
      id: 'msg-edu-1',
      conversationId: 'conv-education-timeline',
      role: 'user',
      content: 'Walk me through my education and key milestones.',
      createdAt: 'Nov 2026',
    },
    {
      id: 'msg-edu-2',
      conversationId: 'conv-education-timeline',
      role: 'assistant',
      content:
        'Here is a chronological snapshot of your academic and technical milestones.',
      createdAt: 'Nov 2026',
      categoryTag: 'education',
      heroFormat: 'timeline-stepper',
      timelineMilestones: [
        {
          id: 'ms-1',
          title: 'Foundations & Incubation Exposure',
          subtitle: 'Academic & Early Project Building',
          dateLabel: 'Foundation',
          description: 'Built early technical projects, pitch decks, and core computer science fundamentals.',
          badge: 'Education',
        },
        {
          id: 'ms-2',
          title: 'Frontend & Systems Engineering',
          subtitle: 'React, TypeScript & Monorepo Workflows',
          dateLabel: 'Career',
          description: 'Shipped production UI features, test suites, and code reviews in a TypeScript codebase.',
          badge: 'Work',
        },
        {
          id: 'ms-3',
          title: 'Design System & Personal AI Assistant',
          subtitle: 'enterprise-ui & ai-chat-bot Frontend',
          dateLabel: '2026',
          description: 'Building reusable UI primitives and a Gemini-style personal knowledge interface.',
          badge: 'Git',
        },
      ],
    },
  ],
};

function readConversations(): ConversationSummary[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(INITIAL_CONVERSATIONS));
      return INITIAL_CONVERSATIONS;
    }
    return JSON.parse(raw) as ConversationSummary[];
  } catch {
    return INITIAL_CONVERSATIONS;
  }
}

function writeConversations(conversations: ConversationSummary[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations));
  } catch {
    // Ignore storage quota errors in UI mock mode
  }
}

function readMessagesMap(): Record<string, ChatMessage[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(INITIAL_MESSAGES_BY_CONV));
      return INITIAL_MESSAGES_BY_CONV;
    }
    return JSON.parse(raw) as Record<string, ChatMessage[]>;
  } catch {
    return INITIAL_MESSAGES_BY_CONV;
  }
}

function writeMessagesMap(map: Record<string, ChatMessage[]>): void {
  try {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(map));
  } catch {
    // Ignore storage quota errors in UI mock mode
  }
}

export interface ConversationService {
  listConversations(): Promise<ConversationSummary[]>;
  createConversation(title?: string): Promise<ConversationSummary>;
  renameConversation(id: string, title: string): Promise<ConversationSummary[]>;
  togglePinConversation(id: string): Promise<ConversationSummary[]>;
  deleteConversation(id: string): Promise<ConversationSummary[]>;
  clearAllConversations(): Promise<ConversationSummary[]>;
  getMessages(conversationId: string): Promise<ChatMessage[]>;
  saveMessages(conversationId: string, messages: ChatMessage[], titleHint?: string): Promise<void>;
  rateMessage(conversationId: string, messageId: string, rating: number): Promise<ChatMessage[]>;
}

export const conversationService: ConversationService = {
  async listConversations(): Promise<ConversationSummary[]> {
    return readConversations();
  },

  async createConversation(title = 'New Chat'): Promise<ConversationSummary> {
    const conversations = readConversations();
    const newConv: ConversationSummary = {
      id: `conv-${Date.now()}`,
      title,
      updatedAt: 'Just now',
      pinned: false,
      preview: 'Ask about your Git projects, work experience, tech stack, or education',
    };
    const next = [newConv, ...conversations];
    writeConversations(next);

    const map = readMessagesMap();
    map[newConv.id] = [];
    writeMessagesMap(map);

    return newConv;
  },

  async renameConversation(id: string, title: string): Promise<ConversationSummary[]> {
    const trimmed = title.trim();
    if (!trimmed) return readConversations();
    const next = readConversations().map((c) =>
      c.id === id ? { ...c, title: trimmed, updatedAt: 'Just now' } : c
    );
    writeConversations(next);
    return next;
  },

  async togglePinConversation(id: string): Promise<ConversationSummary[]> {
    const next = readConversations().map((c) =>
      c.id === id ? { ...c, pinned: !c.pinned } : c
    );
    writeConversations(next);
    return next;
  },

  async deleteConversation(id: string): Promise<ConversationSummary[]> {
    const next = readConversations().filter((c) => c.id !== id);
    writeConversations(next);

    const map = readMessagesMap();
    delete map[id];
    writeMessagesMap(map);

    return next;
  },

  async clearAllConversations(): Promise<ConversationSummary[]> {
    writeConversations([]);
    writeMessagesMap({});
    return [];
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    const map = readMessagesMap();
    return map[conversationId] ?? [];
  },

  async saveMessages(
    conversationId: string,
    messages: ChatMessage[],
    titleHint?: string
  ): Promise<void> {
    const map = readMessagesMap();
    map[conversationId] = messages;
    writeMessagesMap(map);

    const conversations = readConversations();
    const lastMsg = messages[messages.length - 1];
    const updatedList = conversations.map((c) => {
      if (c.id !== conversationId) return c;
      const shouldSetTitle =
        titleHint && (c.title === 'New Chat' || c.title.trim().length === 0);
      return {
        ...c,
        title: shouldSetTitle ? titleHint.slice(0, 48) : c.title,
        updatedAt: 'Just now',
        preview: lastMsg ? lastMsg.content.slice(0, 90) : c.preview,
      };
    });
    writeConversations(updatedList);
  },

  async rateMessage(
    conversationId: string,
    messageId: string,
    rating: number
  ): Promise<ChatMessage[]> {
    const map = readMessagesMap();
    const current = map[conversationId] ?? [];
    const updated = current.map((m) => (m.id === messageId ? { ...m, rating } : m));
    map[conversationId] = updated;
    writeMessagesMap(map);
    return updated;
  },
};