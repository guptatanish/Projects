// Phase 3 Conversation Sidebar — Displays persisted PostgreSQL threads with New Chat, search, switch, and delete

import { useState } from 'react';
import type { ConversationSummary } from '../types/chat';

interface ConversationSidebarProps {
  conversations: ConversationSummary[]; // Saved conversations from GET /api/conversations
  activeConversationId: number | null; // Currently selected conversation ID in PostgreSQL
  isLoadingList: boolean; // True while fetching the conversation list
  deletingId: number | null; // ID of conversation currently being deleted via DELETE /api/conversations/{id}
  onSelectConversation: (conversationId: number) => void; // Switches to a saved thread
  onNewChat: () => void; // Starts a new conversation
  onDeleteConversation: (conversationId: number) => void; // Deletes a thread and cascades messages
  onCollapse: () => void; // Collapses the sidebar
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
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onCollapse,
}: ConversationSidebarProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');

  const trimmedQuery = searchQuery.trim().toLowerCase();
  const filteredConversations = trimmedQuery
    ? conversations.filter((conv) => conv.title.toLowerCase().includes(trimmedQuery))
    : conversations;

  return (
    <aside className="w-72 shrink-0 border-r border-slate-200 bg-slate-50/80 flex flex-col justify-between p-3 h-full">
      <div className="flex flex-col gap-3 min-h-0 flex-1">
        {/* Top Actions: + New Chat & Hide */}
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
            title="Collapse sidebar"
            className="px-2.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Hide
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
              <div className="h-11 rounded-xl bg-slate-200/70 animate-pulse" />
              <div className="h-11 rounded-xl bg-slate-200/70 animate-pulse" />
              <div className="h-11 rounded-xl bg-slate-200/70 animate-pulse" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <p className="text-xs text-slate-400 px-2 py-6 text-center">
              {trimmedQuery ? 'No matching conversations' : 'No saved conversations yet'}
            </p>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConversationId;
              const isDeleting = deletingId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    if (!isDeleting) {
                      onSelectConversation(conv.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isDeleting) {
                      e.preventDefault();
                      onSelectConversation(conv.id);
                    }
                  }}
                  className={`group flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-white border border-slate-200 text-slate-900 font-medium shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100 border border-transparent'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{conv.title || `Conversation #${conv.id}`}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-normal">
                      {formatUpdatedLabel(conv.updated_at)}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={(e) => {
                      // Prevent triggering `onSelectConversation` on the parent row when deleting
                      e.stopPropagation();
                      onDeleteConversation(conv.id);
                    }}
                    title="Delete conversation"
                    aria-label={`Delete conversation ${conv.title}`}
                    className="opacity-70 group-hover:opacity-100 disabled:opacity-40 px-2 py-1 rounded-md text-[11px] text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-all cursor-pointer shrink-0"
                  >
                    {isDeleting ? '...' : 'Delete'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer Persistence Badge */}
      <div className="pt-3 mt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
        <span>PostgreSQL History</span>
        <span className="px-2 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 font-medium">
          Phase 3
        </span>
      </div>
    </aside>
  );
}