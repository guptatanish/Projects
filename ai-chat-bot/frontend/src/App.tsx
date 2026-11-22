import { useEffect, useRef, useState } from 'react';
import { chatService } from './services/chat.service';
import { conversationService } from './services/conversation.service';
import type {
  AttachmentItem,
  ChatMessage,
  ChatScopeFilter,
  ConversationSummary,
  KnowledgeCategory,
} from './types/chat';

const DEFAULT_SCOPE: ChatScopeFilter = {
  category: 'all',
  detailLevel: 'detailed',
  includedSources: {
    git: true,
    work: true,
    education: true,
    notes: true,
  },
  maxItems: 5,
};

const STARTER_PROMPTS = [
  'Personal Git projects & stack',
  'Work experience & monorepo architecture',
  'Education & career milestones',
];

export default function App() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [scope, setScope] = useState<ChatScopeFilter>(DEFAULT_SCOPE);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = window.setTimeout(() => setToastMessage(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await conversationService.listConversations();
      if (cancelled) return;
      setConversations(list);
      if (list.length > 0) {
        const firstId = list[0].id;
        setActiveConvId(firstId);
        const initialMsgs = await conversationService.getMessages(firstId);
        if (!cancelled) {
          setMessages(initialMsgs);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSelectConversation = async (id: string) => {
    setActiveConvId(id);
    const msgs = await conversationService.getMessages(id);
    setMessages(msgs);
  };

  const handleNewChat = async () => {
    const created = await conversationService.createConversation('New Chat');
    const updatedList = await conversationService.listConversations();
    setConversations(updatedList);
    setActiveConvId(created.id);
    setMessages([]);
    setPrompt('');
    setAttachments([]);
  };

  const handleDeleteConversation = async (id: string) => {
    const remaining = await conversationService.deleteConversation(id);
    setConversations(remaining);
    if (activeConvId === id) {
      if (remaining.length > 0) {
        setActiveConvId(remaining[0].id);
        setMessages(await conversationService.getMessages(remaining[0].id));
      } else {
        const fresh = await conversationService.createConversation('New Chat');
        setConversations([fresh]);
        setActiveConvId(fresh.id);
        setMessages([]);
      }
    }
    showToast('Conversation deleted');
  };

  const handleStopGeneration = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsGenerating(false);
    showToast('Generation stopped');
  };

  const handleSend = async (customPrompt?: string) => {
    const textToSend = (customPrompt ?? prompt).trim();
    if ((!textToSend && attachments.length === 0) || isGenerating) return;

    let currentConvId = activeConvId;
    if (!currentConvId) {
      const created = await conversationService.createConversation('New Chat');
      currentConvId = created.id;
      setActiveConvId(created.id);
      setConversations(await conversationService.listConversations());
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsGenerating(true);
    setPrompt('');
    const currentAttachments = [...attachments];
    setAttachments([]);

    try {
      const { userMessage, assistantMessage } = await chatService.sendMessage(
        {
          conversationId: currentConvId,
          prompt: textToSend,
          attachments: currentAttachments,
          scope,
        },
        controller.signal
      );

      const nextMessages = [...messages, userMessage, assistantMessage];
      setMessages(nextMessages);
      await conversationService.saveMessages(currentConvId, nextMessages, textToSend);
      setConversations(await conversationService.listConversations());
    } catch (err) {
      if ((err as Error)?.name !== 'AbortError') {
        showToast('Could not generate mock response');
      }
    } finally {
      abortControllerRef.current = null;
      setIsGenerating(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.title.toLowerCase().includes(q) ||
      (c.preview?.toLowerCase().includes(q) ?? false)
    );
  });

  const isEmptyChat = messages.length === 0 && !isGenerating;

  const composerElement = (
    <div className="w-full max-w-3xl mx-auto">
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-3 transition-all">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            {(['all', 'git', 'work', 'education'] as KnowledgeCategory[]).map((cat) => {
              const active = scope.category === cat;
              const label =
                cat === 'all'
                  ? 'All Info'
                  : cat === 'git'
                    ? 'Git Projects'
                    : cat === 'work'
                      ? 'Work'
                      : 'Education';
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setScope((prev) => ({ ...prev, category: cat }))}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    active
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <span className="text-[11px] text-slate-400">
            Mock Profile UI • Enter to send
          </span>
        </div>

        <div className="flex items-end gap-2">
          <textarea
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Ask about your Git projects, work experience, tech stack, or education..."
            className="flex-1 resize-none bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none leading-relaxed"
          />

          {isGenerating ? (
            <button
              type="button"
              onClick={handleStopGeneration}
              className="px-3.5 py-2 rounded-xl text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer shrink-0"
            >
              Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleSend()}
              disabled={!prompt.trim() && attachments.length === 0}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shrink-0"
            >
              Send
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full flex bg-white text-slate-900 overflow-hidden">
      {/* Collapsible Left Sidebar */}
      {sidebarOpen && (
        <aside className="w-72 shrink-0 border-r border-slate-200 bg-slate-50/80 flex flex-col justify-between p-3">
          <div className="flex flex-col gap-3 min-h-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => void handleNewChat()}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer text-left"
              >
                + New Chat
              </button>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                title="Collapse sidebar"
              >
                Hide
              </button>
            </div>

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
            />

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
              {filteredConversations.length === 0 ? (
                <p className="text-xs text-slate-400 px-2 py-4 text-center">
                  No matching chats
                </p>
              ) : (
                filteredConversations.map((conv) => {
                  const isActive = conv.id === activeConvId;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => void handleSelectConversation(conv.id)}
                      className={`group flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-white border border-slate-200 text-slate-900 font-medium shadow-2xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate">{conv.title}</p>
                        {conv.preview && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                            {conv.preview}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDeleteConversation(conv.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 px-1.5 py-0.5 rounded text-[11px] text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-opacity cursor-pointer"
                        title="Delete chat"
                      >
                        Del
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-3 mt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Personal Profile UI</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 font-medium">
              Mock Data
            </span>
          </div>
        </aside>
      )}

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col min-w-0 h-full bg-white">
        {/* Top Bar */}
        <header className="h-14 shrink-0 border-b border-slate-100 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {!sidebarOpen && (
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Chats
              </button>
            )}
            <h1 className="text-sm font-semibold text-slate-800 truncate">
              Personal Profile &amp; Knowledge Assistant
            </h1>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Git • Work • Education
          </span>
        </header>

        {/* Empty State (Centered Composer) vs Active Chat (Docked Bottom Composer) */}
        {isEmptyChat ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
            <div className="max-w-xl w-full text-center mb-6">
              <p className="text-2xl font-semibold tracking-tight text-slate-900">
                What would you like to explore?
              </p>
              <p className="text-sm text-slate-500 mt-1.5">
                Ask about your personal Git projects, work experience, tech stack, or education.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                {STARTER_PROMPTS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => void handleSend(starter)}
                    className="px-3 py-1.5 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>

            {composerElement}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="max-w-3xl mx-auto space-y-5">
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                          isUser
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-50 border border-slate-200/80 text-slate-800'
                        }`}
                      >
                        <p>{msg.content}</p>

                        {!isUser && msg.projectCard && (
                          <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3.5 text-slate-800">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-sm text-slate-900">
                                {msg.projectCard.title}
                              </p>
                              {msg.projectCard.period && (
                                <span className="text-[11px] text-slate-500">
                                  {msg.projectCard.period}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-1">
                              {msg.projectCard.summary}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2.5">
                              {msg.projectCard.stack.map((tech) => (
                                <span
                                  key={tech}
                                  className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {!isUser && msg.comparisonTable && (
                          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 bg-white">
                            <table className="w-full text-left border-collapse text-xs">
                              <thead>
                                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                                  {msg.comparisonTable.columns.map((col) => (
                                    <th key={col} className="py-2 px-3 font-semibold">
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {msg.comparisonTable.rows.map((row, idx) => (
                                  <tr
                                    key={idx}
                                    className="border-b last:border-b-0 border-slate-100 text-slate-700"
                                  >
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx} className="py-2 px-3">
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {!isUser && msg.timelineMilestones && (
                          <div className="mt-3 space-y-2">
                            {msg.timelineMilestones.map((item) => (
                              <div
                                key={item.id}
                                className="rounded-xl border border-slate-200 bg-white p-3"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-semibold text-xs text-slate-900">
                                    {item.title}
                                  </span>
                                  <span className="text-[11px] text-slate-500">
                                    {item.dateLabel}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  {item.subtitle}
                                </p>
                                <p className="text-xs text-slate-700 mt-1">
                                  {item.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 mt-1 px-1">
                        {msg.createdAt}
                      </span>
                    </div>
                  );
                })}

                {isGenerating && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="inline-block h-2 w-2 rounded-full bg-slate-400 animate-pulse" />
                    <span>Thinking...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Docked Bottom Composer */}
            <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3">
              {composerElement}
            </div>
          </>
        )}
      </main>

      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 text-white text-xs px-3.5 py-2 shadow-md">
          {toastMessage}
        </div>
      )}
    </div>
  );
}