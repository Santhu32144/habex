import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Pin,
  Trash2,
  X,
  Palette,
  Search,
  BookOpen,
  Tag,
  Hash,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@supabase/supabase-js';

interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pinned: boolean;
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_LABELS = ['Personal', 'Work', 'Ideas', 'Important', 'To-Do'];

const LABEL_COLORS: Record<string, string> = {
  'Personal': 'bg-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/30',
  'Work': 'bg-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500/30',
  'Ideas': 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-500/30',
  'Important': 'bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30',
  'To-Do': 'bg-green-500/20 text-green-600 dark:text-green-400 hover:bg-green-500/30',
};

const NOTE_COLORS = [
  { name: 'Default', value: 'bg-card', border: 'border-border' },
  { name: 'Red', value: 'bg-red-500/10', border: 'border-red-500/30' },
  { name: 'Orange', value: 'bg-orange-500/10', border: 'border-orange-500/30' },
  { name: 'Yellow', value: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  { name: 'Green', value: 'bg-green-500/10', border: 'border-green-500/30' },
  { name: 'Blue', value: 'bg-blue-500/10', border: 'border-blue-500/30' },
  { name: 'Purple', value: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { name: 'Pink', value: 'bg-pink-500/10', border: 'border-pink-500/30' },
];

const STORAGE_KEY = 'notebook-notes';
const LABELS_STORAGE_KEY = 'notebook-labels';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const Notebook: React.FC = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [customLabels, setCustomLabels] = useState<string[]>(() => {
    const saved = localStorage.getItem(LABELS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabelFilter, setSelectedLabelFilter] = useState<string | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({ title: '', content: '', color: 'bg-card', labels: [] as string[] });
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [newLabelInput, setNewLabelInput] = useState('');
  const [showLabelInput, setShowLabelInput] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const allLabels = [...DEFAULT_LABELS, ...customLabels];

  // Fetch notes from Supabase on mount
  useEffect(() => {
    if (user?.id) {
      loadNotesFromDatabase();
    }
  }, [user?.id]);

  const loadNotesFromDatabase = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error loading notes:', error);
        toast.error('Failed to load notes');
        return;
      }

      if (data) {
        const formattedNotes = data.map((n: any) => ({
          id: n.id,
          title: n.title,
          content: n.content,
          color: n.color || 'bg-card',
          pinned: n.pinned || false,
          labels: n.labels || [],
          createdAt: new Date(n.created_at),
          updatedAt: new Date(n.updated_at),
        }));
        setNotes(formattedNotes);
      }
    } catch (error) {
      console.error('Error loading notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setIsLoading(false);
    }
  };

  // Save custom labels to localStorage
  useEffect(() => {
    localStorage.setItem(LABELS_STORAGE_KEY, JSON.stringify(customLabels));
  }, [customLabels]);

  const addCustomLabel = (label: string) => {
    const trimmed = label.trim();
    if (trimmed && !allLabels.includes(trimmed)) {
      setCustomLabels(prev => [...prev, trimmed]);
      toast.success(`Label "${trimmed}" created`);
    }
    setNewLabelInput('');
    setShowLabelInput(false);
  };

  const getLabelColor = (label: string) => {
    return LABEL_COLORS[label] || 'bg-muted text-muted-foreground hover:bg-muted/80';
  };

  const toggleNoteLabel = (noteId: string, label: string) => {
    setNotes(prev => prev.map(n => {
      if (n.id === noteId) {
        const hasLabel = n.labels.includes(label);
        return {
          ...n,
          labels: hasLabel 
            ? n.labels.filter(l => l !== label)
            : [...n.labels, label]
        };
      }
      return n;
    }));
  };

  const addNote = async () => {
    if (!newNote.title.trim() && !newNote.content.trim()) {
      setIsAddingNote(false);
      return;
    }

    if (!user?.id) {
      toast.error('Please log in first');
      return;
    }

    try {
      const noteId = Date.now().toString();
      const { error } = await supabase.from('notes').insert({
        id: noteId,
        user_id: user.id,
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        color: newNote.color,
        pinned: false,
        labels: newNote.labels,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Error adding note:', error);
        toast.error('Failed to add note');
        return;
      }

      const note: Note = {
        id: noteId,
        title: newNote.title.trim(),
        content: newNote.content.trim(),
        color: newNote.color,
        pinned: false,
        labels: newNote.labels,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setNotes(prev => [note, ...prev]);
      setNewNote({ title: '', content: '', color: 'bg-card', labels: [] });
      setIsAddingNote(false);
      toast.success('Note added');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Failed to add note');
    }
  };

  const updateNote = async (updatedNote: Note) => {
    if (!user?.id) {
      toast.error('Please log in first');
      return;
    }

    try {
      const { error } = await supabase
        .from('notes')
        .update({
          title: updatedNote.title,
          content: updatedNote.content,
          color: updatedNote.color,
          labels: updatedNote.labels,
          updated_at: new Date().toISOString(),
        })
        .eq('id', updatedNote.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating note:', error);
        toast.error('Failed to update note');
        return;
      }

      setNotes(prev => prev.map(n =>
        n.id === updatedNote.id
          ? { ...updatedNote, updatedAt: new Date() }
          : n
      ));
      setEditingNote(null);
      toast.success('Note updated');
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Failed to update note');
    }
  };

  const deleteNote = async (id: string) => {
    if (!user?.id) {
      toast.error('Please log in first');
      return;
    }

    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting note:', error);
        toast.error('Failed to delete note');
        return;
      }

      setNotes(prev => prev.filter(n => n.id !== id));
      setEditingNote(null);
      toast.success('Note deleted');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const togglePin = async (id: string) => {
    if (!user?.id) {
      toast.error('Please log in first');
      return;
    }

    try {
      const note = notes.find(n => n.id === id);
      if (!note) return;

      const { error } = await supabase
        .from('notes')
        .update({
          pinned: !note.pinned,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error toggling pin:', error);
        return;
      }

      setNotes(prev => prev.map(n =>
        n.id === id ? { ...n, pinned: !n.pinned } : n
      ));
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  const changeColor = async (id: string, color: string) => {
    if (!user?.id) {
      toast.error('Please log in first');
      return;
    }

    try {
      const { error } = await supabase
        .from('notes')
        .update({
          color,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error changing color:', error);
        return;
      }

      setNotes(prev => prev.map(n =>
        n.id === id ? { ...n, color } : n
      ));
      setShowColorPicker(null);
    } catch (error) {
      console.error('Error changing color:', error);
    }
  };

  // Filter and sort notes
  const filteredNotes = notes
    .filter(note => {
      const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesLabel = !selectedLabelFilter || note.labels.includes(selectedLabelFilter);
      return matchesSearch && matchesLabel;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });

  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const otherNotes = filteredNotes.filter(n => !n.pinned);

  const getColorBorder = (colorValue: string) => {
    return NOTE_COLORS.find(c => c.value === colorValue)?.border || 'border-border';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading your notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <BookOpen className="w-7 h-7 text-primary" />
            Notebook
          </h1>
          <p className="text-muted-foreground">
            Your personal notes and ideas • Synced across devices
          </p>
        </div>
        
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Label Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Tag className="w-4 h-4" /> Filter:
        </span>
        <Badge
          variant="outline"
          className={cn(
            "cursor-pointer transition-all",
            !selectedLabelFilter && "bg-primary text-primary-foreground"
          )}
          onClick={() => setSelectedLabelFilter(null)}
        >
          All
        </Badge>
        {allLabels.map((label) => (
          <Badge
            key={label}
            className={cn(
              "cursor-pointer transition-all border-0",
              selectedLabelFilter === label 
                ? "ring-2 ring-primary ring-offset-2" 
                : "",
              getLabelColor(label)
            )}
            onClick={() => setSelectedLabelFilter(selectedLabelFilter === label ? null : label)}
          >
            {label}
          </Badge>
        ))}
        {!showLabelInput ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => setShowLabelInput(true)}
          >
            <Plus className="w-3 h-3 mr-1" /> New Label
          </Button>
        ) : (
          <div className="flex items-center gap-1">
            <Input
              value={newLabelInput}
              onChange={(e) => setNewLabelInput(e.target.value)}
              placeholder="Label name..."
              className="h-6 w-28 text-xs"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') addCustomLabel(newLabelInput);
                if (e.key === 'Escape') {
                  setShowLabelInput(false);
                  setNewLabelInput('');
                }
              }}
            />
            <Button size="sm" className="h-6 px-2" onClick={() => addCustomLabel(newLabelInput)}>
              Add
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-1"
              onClick={() => {
                setShowLabelInput(false);
                setNewLabelInput('');
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Add Note Input */}
      <motion.div
        layout
        className={cn(
          "rounded-xl border-2 transition-all duration-200",
          isAddingNote ? "border-primary shadow-lg" : "border-border hover:border-primary/50",
          newNote.color,
          getColorBorder(newNote.color)
        )}
      >
        {!isAddingNote ? (
          <button
            onClick={() => setIsAddingNote(true)}
            className="w-full p-4 text-left text-muted-foreground flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Take a note...
          </button>
        ) : (
          <div className="p-4 space-y-3">
            <Input
              placeholder="Title"
              value={newNote.title}
              onChange={(e) => setNewNote(prev => ({ ...prev, title: e.target.value }))}
              className="border-0 text-lg font-medium bg-transparent focus-visible:ring-0 p-0"
              autoFocus
            />
            <Textarea
              placeholder="Take a note..."
              value={newNote.content}
              onChange={(e) => setNewNote(prev => ({ ...prev, content: e.target.value }))}
              className="border-0 bg-transparent focus-visible:ring-0 p-0 min-h-[100px] resize-none"
            />
            {/* Labels for new note */}
            <div className="flex flex-wrap gap-1">
              {allLabels.map((label) => (
                <Badge
                  key={label}
                  className={cn(
                    "cursor-pointer transition-all text-xs border-0",
                    newNote.labels.includes(label) 
                      ? "ring-2 ring-primary ring-offset-1" 
                      : "opacity-60",
                    getLabelColor(label)
                  )}
                  onClick={() => setNewNote(prev => ({
                    ...prev,
                    labels: prev.labels.includes(label)
                      ? prev.labels.filter(l => l !== label)
                      : [...prev.labels, label]
                  }))}
                >
                  <Hash className="w-3 h-3 mr-0.5" />
                  {label}
                </Badge>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1">
                {NOTE_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setNewNote(prev => ({ ...prev, color: color.value }))}
                    className={cn(
                      "w-6 h-6 rounded-full border-2 transition-all",
                      color.value,
                      color.border,
                      newNote.color === color.value && "ring-2 ring-primary ring-offset-2"
                    )}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAddingNote(false);
                    setNewNote({ title: '', content: '', color: 'bg-card', labels: [] });
                  }}
                >
                  Cancel
                </Button>
                <Button size="sm" onClick={addNote}>
                  Add
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Pinned Notes */}
      {pinnedNotes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Pin className="w-3 h-3" /> Pinned
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {pinnedNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={setEditingNote}
                  onDelete={deleteNote}
                  onTogglePin={togglePin}
                  onChangeColor={changeColor}
                  onToggleLabel={toggleNoteLabel}
                  showColorPicker={showColorPicker}
                  setShowColorPicker={setShowColorPicker}
                  getColorBorder={getColorBorder}
                  getLabelColor={getLabelColor}
                  allLabels={allLabels}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Other Notes */}
      {otherNotes.length > 0 && (
        <div className="space-y-3">
          {pinnedNotes.length > 0 && (
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Others
            </h2>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {otherNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onEdit={setEditingNote}
                  onDelete={deleteNote}
                  onTogglePin={togglePin}
                  onChangeColor={changeColor}
                  onToggleLabel={toggleNoteLabel}
                  showColorPicker={showColorPicker}
                  setShowColorPicker={setShowColorPicker}
                  getColorBorder={getColorBorder}
                  getLabelColor={getLabelColor}
                  allLabels={allLabels}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Empty State */}
      {notes.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No notes yet</p>
          <p className="text-sm">Click above to create your first note</p>
        </div>
      )}

      {/* No results */}
      {notes.length > 0 && filteredNotes.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No notes match your search</p>
        </div>
      )}

      {/* Edit Note Dialog */}
      <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
        <DialogContent className={cn("sm:max-w-lg", editingNote?.color)}>
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
          </DialogHeader>
          {editingNote && (
            <div className="space-y-4">
              <Input
                placeholder="Title"
                value={editingNote.title}
                onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                className="text-lg font-medium"
              />
              <Textarea
                placeholder="Note content..."
                value={editingNote.content}
                onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                className="min-h-[200px] resize-none"
              />
              {/* Labels in edit dialog */}
              <div className="space-y-2">
                <span className="text-sm font-medium flex items-center gap-1">
                  <Tag className="w-4 h-4" /> Labels
                </span>
                <div className="flex flex-wrap gap-1">
                  {allLabels.map((label) => (
                    <Badge
                      key={label}
                      className={cn(
                        "cursor-pointer transition-all text-xs border-0",
                        editingNote.labels.includes(label) 
                          ? "ring-2 ring-primary ring-offset-1" 
                          : "opacity-60",
                        getLabelColor(label)
                      )}
                      onClick={() => setEditingNote({
                        ...editingNote,
                        labels: editingNote.labels.includes(label)
                          ? editingNote.labels.filter(l => l !== label)
                          : [...editingNote.labels, label]
                      })}
                    >
                      <Hash className="w-3 h-3 mr-0.5" />
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {NOTE_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setEditingNote({ ...editingNote, color: color.value })}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-all",
                      color.value,
                      color.border,
                      editingNote.color === color.value && "ring-2 ring-primary ring-offset-2"
                    )}
                    title={color.name}
                  />
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingNote(null)}>
                  Cancel
                </Button>
                <Button onClick={() => updateNote(editingNote)}>
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Note Card Component
interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onChangeColor: (id: string, color: string) => void;
  onToggleLabel: (noteId: string, label: string) => void;
  showColorPicker: string | null;
  setShowColorPicker: (id: string | null) => void;
  getColorBorder: (color: string) => string;
  getLabelColor: (label: string) => string;
  allLabels: string[];
}

const NoteCard: React.FC<NoteCardProps> = ({
  note,
  onEdit,
  onDelete,
  onTogglePin,
  onChangeColor,
  onToggleLabel,
  showColorPicker,
  setShowColorPicker,
  getColorBorder,
  getLabelColor,
  allLabels,
}) => {
  const [showLabelPicker, setShowLabelPicker] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        "group rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-lg",
        note.color,
        getColorBorder(note.color)
      )}
      onClick={() => onEdit(note)}
    >
      {note.title && (
        <h3 className="font-semibold mb-2 line-clamp-2">{note.title}</h3>
      )}
      {note.content && (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-6">
          {note.content}
        </p>
      )}
      
      {/* Labels Display */}
      {note.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {note.labels.map((label) => (
            <Badge
              key={label}
              className={cn("text-xs border-0 py-0", getLabelColor(label))}
            >
              <Hash className="w-2.5 h-2.5 mr-0.5" />
              {label}
            </Badge>
          ))}
        </div>
      )}
      
      {/* Actions */}
      <div 
        className="flex items-center gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onTogglePin(note.id)}
        >
          <Pin className={cn("w-4 h-4", note.pinned && "fill-current text-primary")} />
        </Button>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setShowLabelPicker(!showLabelPicker);
              setShowColorPicker(null);
            }}
          >
            <Tag className="w-4 h-4" />
          </Button>
          {showLabelPicker && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-popover rounded-lg shadow-lg border flex flex-wrap gap-1 z-10 min-w-[200px]">
              {allLabels.map((label) => (
                <Badge
                  key={label}
                  className={cn(
                    "cursor-pointer transition-all text-xs border-0",
                    note.labels.includes(label) 
                      ? "ring-2 ring-primary ring-offset-1" 
                      : "opacity-60",
                    getLabelColor(label)
                  )}
                  onClick={() => onToggleLabel(note.id, label)}
                >
                  <Hash className="w-3 h-3 mr-0.5" />
                  {label}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setShowColorPicker(showColorPicker === note.id ? null : note.id);
              setShowLabelPicker(false);
            }}
          >
            <Palette className="w-4 h-4" />
          </Button>
          {showColorPicker === note.id && (
            <div className="absolute bottom-full left-0 mb-2 p-2 bg-popover rounded-lg shadow-lg border flex gap-1 z-10">
              {NOTE_COLORS.map((color) => (
                <button
                  key={color.name}
                  onClick={() => onChangeColor(note.id, color.value)}
                  className={cn(
                    "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                    color.value,
                    color.border
                  )}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onDelete(note.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

export default Notebook;

