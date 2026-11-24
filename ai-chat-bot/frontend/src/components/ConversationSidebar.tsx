// Phase 5 Conversation Sidebar — Search, Pin, Rename (PATCH), Delete Confirmation Dialog & Responsive Side Nav / Drawer

import { useEffect, useState, type KeyboardEvent } from 'react';
import type { ConversationSummary } from '../types/chat';

interface ConversationSidebarProps {
  conversations: ConversationSummary[]; // Saved conversations from GET /api/conversations
  activeConversationId: number | null; // Currently selected conversation ID in PostgreSQL
  isLoadingList: boolean; // True while fetching the conversation list
  deletingId: number | null; // ID of conversation currently being deleted via DELETE /api/conversations/{id}
  renamingId?: number | null; // ID of conversation currently being renamed via PATCH /api/conversations/{id}
  isMobileDrawer?: boolean; // Renders as a mobile overlay drawer when true
  onSelectConversation: (conversationId: number) => void; // Switches to a saved thread
  onNewChat: () => void; // Starts a new conversation
  onRenameConversation: (conversationId: number, nextTitle: string) => Promise<void> | void; // Calls PATCH /api/conversations/{id}
  onTogglePinConversation: (conversationId: number) => void; // Toggles pin state for a conversation
  onDeleteConversation: (conversationId: number) => void; // Deletes a thread and cascades messages
  onCollapse: () => void; // Collapses the sidebar or closes mobile drawer
}

// Formats ISO `updated_at` from PostgreSQL into a compact label (e.g. "02:39 AM" or "Nov 24")
function formatUpdatedLabel(isoString: string): string {
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) {
    return isoString;
  }

  const now = new Date();
  const isSameDay =
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getDate() === now.getDate();

  if (isSameDay) {
    return parsed.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return parsed.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  });
}

export function ConversationSidebar({
  conversations,
  activeConversationId,
  isLoadingList,
  deletingId,
  renamingId = null,
  isMobileDrawer = false,
  onSelectConversation,
  onNewChat,
  onRenameConversation,
  onTogglePinConversation,
  onDeleteConversation,
  onCollapse,
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [pendingDeleteConv, setPendingDeleteConv] = useState<ConversationSummary | null>(null);

  useEffect(() => {
    if (!pendingDeleteConv) return;
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPendingDeleteConv(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pendingDeleteConv]);

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const filteredConversations = (
    trimmedQuery
      ? conversations.filter((conv) =>
          (conv.title || `Conversation #${conv.id}`).toLowerCase().includes(trimmedQuery)
        )
      : conversations
  ).slice().sort((a, b) => {
    const pinDiff = Number(Boolean(b.is_pinned)) - Number(Boolean(a.is_pinned));
    if (pinDiff !== 0) return pinDiff;
    return 0;
  });

  const startEditing = (conv: ConversationSummary) => {
    setEditingId(conv.id);
    setDraftTitle(conv.title || `Conversation #${conv.id}`);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setDraftTitle('');
  };

  const commitRename = async (conversationId: number) => {
    const cleanTitle = draftTitle.trim();
    if (!cleanTitle) {
      cancelEditing();
      return;
    }
    setEditingId(null);
    await onRenameConversation(conversationId, cleanTitle);
  };

  const handleRenameKeyDown = (e: KeyboardEvent<HTMLInputElement>, conversationId: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void commitRename(conversationId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEditing();
    }
  };

  const sidebarContent = (
    <aside
      aria-label="Conversation navigation"
      className="w-72 shrink-0 border-r border-slate-200 bg-slate-50/95 flex flex-col justify-between p-3 h-full"
    >
      <div className="flex flex-col gap-3 min-h-0 flex-1">
        {/* Top Actions: + New Chat & Hide/Close */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onNewChat}
            className="flex-1 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer text-left"
          >
            + New Chat
          </button>

          <button
            type="button"
            onClick={onCollapse}
            title={isMobileDrawer ? 'Close drawer' : 'Collapse sidebar'}
            className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {isMobileDrawer ? 'Close' : 'Hide'}
          </button>
        </div>

        {/* Search Input */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search saved chats..."
          aria-label="Search saved chats"
          className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
        />

        {/* Persisted Conversations List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5">
          {isLoadingList && conversations.length === 0 ? (
            <div className="space-y-2 px-1 py-2">
              <div className="h-12 rounded-xl bg-slate-200/70 animate-pulse" />
              <div className="h-12 rounded-xl bg-slate-200/70 animate-pulse" />
              <div className="h-12 rounded-xl bg-slate-200/70 animate-pulse" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <p className="text-xs text-slate-400 px-2 py-6 text-center">
              {trimmedQuery ? 'No matching conversations' : 'No saved conversations yet'}
            </p>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const isDeleting = deletingId === conv.id;
              const isRenaming = renamingId === conv.id;
              const isEditing = editingId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    if (!isDeleting && !isEditing) {
                      onSelectConversation(conv.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isDeleting && !isEditing) {
                      e.preventDefault();
                      onSelectConversation(conv.id);
                    }
                  }}
                  className={`group flex flex-col gap-1.5 px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-white border border-slate-200 text-slate-900 font-medium shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <input
                          type="text"
                          value={draftTitle}
                          maxLength={200}
                          autoFocus
                          aria-label="Rename conversation"
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => setDraftTitle(e.target.value)}
                          onKeyDown={(e) => handleRenameKeyDown(e, conv.id)}
                          onBlur={() => void commitRename(conv.id)}
                          className="w-full px-2 py-1 rounded border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:border-slate-500"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5 min-w-0">
                          {conv.is_pinned && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-semibold shrink-0">
                              Pinned
                            </span>
                          )}
                          <p className="truncate">
                            {isRenaming
                              ? 'Renaming...'
                              : conv.title || `Conversation #${conv.id}`}
                          </p>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-400 mt-0.5 font-normal">
                        {formatUpdatedLabel(conv.updated_at)}
                      </p>
                    </div>
                  </div>

                  {/* Row Actions: Pin, Rename, Delete */}
                  <div
                    className="flex items-center justify-end gap-1.5 pt-0.5 opacity-80 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => onTogglePinConversation(conv.id)}
                      className="px-1.5 py-0.5 rounded text-[11px] text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
                    >
                      {conv.is_pinned ? 'Unpin' : 'Pin'}
                    </button>

                    <button
                      type="button"
                      disabled={isDeleting || isRenaming}
                      onClick={() => startEditing(conv)}
                      className="px-1.5 py-0.5 rounded text-[11px] text-slate-500 hover:text-slate-900 hover:bg-slate-200/70 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      Rename
                    </button>

                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => setPendingDeleteConv(conv)}
                      aria-label={`Delete conversation ${conv.title}`}
                      className="px-1.5 py-0.5 rounded text-[11px] text-slate-500 hover:text-rose-700 hover:bg-rose-50 disabled:opacity-40 transition-colors cursor-pointer"
                    >
                      {isDeleting ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Persistence Badge */}
      <div className="pt-3 mt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
        <span>PostgreSQL History</span>
        <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-medium">
          Phase 5
        </span>
      </div>

      {/* Delete Confirmation Dialog */}
      {pendingDeleteConv && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-conv-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onClick={() => setPendingDeleteConv(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="delete-conv-dialog-title"
              className="text-sm font-semibold text-slate-900"
            >
              Delete conversation?
            </h2>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              This will permanently remove{' '}
              <span className="font-medium text-slate-900">
                "{pendingDeleteConv.title || `Conversation #${pendingDeleteConv.id}`}"
              </span>{' '}
              and all its persisted messages.
            </p>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingDeleteConv(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetId = pendingDeleteConv.id;
                  setPendingDeleteConv(null);
                  onDeleteConversation(targetId);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-medium hover:bg-rose-700 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );

  if (isMobileDrawer) {
    return (
      <div className="fixed inset-0 z-40 flex md:hidden">
        <div
          className="fixed inset-0 bg-slate-950/35"
          onClick={onCollapse}
          aria-hidden="true"
        />
        <div className="relative z-10 h-full">{sidebarContent}</div>
      </div>
    );
  }

  return sidebarContent;
}