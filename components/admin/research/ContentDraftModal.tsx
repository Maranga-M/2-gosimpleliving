import React, { useState } from 'react';
import { X, Loader2, Copy, FileText, MessageSquare, Mail, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../Button';
import { ContentDraftContext, generateContentDraft } from '../../../services/researchService.proxy';

type DraftType = 'blog' | 'social' | 'email';

const DRAFT_TYPES: { key: DraftType; label: string; icon: React.ElementType; description: string }[] = [
  { key: 'blog', label: 'Blog Post', icon: FileText, description: '700-900 word SEO post with product links' },
  { key: 'social', label: 'Social Captions', icon: MessageSquare, description: 'TikTok, Instagram & Pinterest variants' },
  { key: 'email', label: 'Email Newsletter', icon: Mail, description: 'Subject line + affiliate email body' },
];

interface ContentDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: ContentDraftContext;
  onAddAsBlogPost?: (content: string, title: string) => void;
}

export const ContentDraftModal: React.FC<ContentDraftModalProps> = ({ isOpen, onClose, context, onAddAsBlogPost }) => {
  const [selectedType, setSelectedType] = useState<DraftType>('blog');
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setDraft('');
    try {
      const content = await generateContentDraft(selectedType, context);
      setDraft(content);
      toast.success('Content draft generated!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate draft');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTypeChange = (type: DraftType) => {
    setSelectedType(type);
    setDraft('');
  };

  const extractTitle = (md: string): string => {
    const match = md.match(/^#\s+(.+)/m);
    return match ? match[1] : context.query;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles size={20} className="text-purple-500 shrink-0" />
            <h2 className="font-bold text-slate-900 dark:text-white">Draft Content</h2>
            <span className="text-sm text-slate-500 truncate">for "{context.query}"</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-3 gap-2">
            {DRAFT_TYPES.map(({ key, label, icon: Icon, description }) => (
              <button
                key={key}
                onClick={() => handleTypeChange(key)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-center transition-all ${selectedType === key ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700'}`}
              >
                <Icon size={18} className={selectedType === key ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'} />
                <span className={`text-xs font-bold ${selectedType === key ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-400'}`}>{label}</span>
                <span className="text-[10px] text-slate-400 leading-tight">{description}</span>
              </button>
            ))}
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full gap-2">
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isGenerating ? 'Generating...' : `Generate ${DRAFT_TYPES.find(t => t.key === selectedType)?.label}`}
          </Button>

          {draft && (
            <div className="space-y-3">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 max-h-72 overflow-y-auto">
                <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">{draft}</pre>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => { navigator.clipboard.writeText(draft); toast.success('Copied!'); }}
                  variant="outline"
                  className="flex-1 gap-2"
                >
                  <Copy size={15} />Copy to Clipboard
                </Button>
                {selectedType === 'blog' && onAddAsBlogPost && (
                  <Button
                    onClick={() => { onAddAsBlogPost(draft, extractTitle(draft)); onClose(); toast.success('Added as blog post draft!'); }}
                    className="flex-1 gap-2"
                  >
                    <FileText size={15} />Add as Blog Post
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
