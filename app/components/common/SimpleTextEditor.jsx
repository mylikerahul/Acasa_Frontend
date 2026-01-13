"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

// ─────────────────────────────────────────────────────────────
// Constants & Configuration
// ─────────────────────────────────────────────────────────────
const EDITOR_CONFIG = {
  placeholder: "Start typing...",
  toolbar: {
    items: [
      'heading',
      '|',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      '|',
      'link',
      'bulletedList',
      'numberedList',
      '|',
      'outdent',
      'indent',
      '|',
      'blockQuote',
      'insertTable',
      '|',
      'undo',
      'redo'
    ],
    shouldNotGroupWhenFull: false
  },
  heading: {
    options: [
      { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
      { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
      { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
      { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
      { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' }
    ]
  },
  language: 'en',
  table: {
    contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
  },
  link: {
    addTargetToExternalLinks: true,
    defaultProtocol: 'https://'
  }
};

const AUTOSAVE_DELAY = 1000; // 1 second
const MIN_HEIGHT = 200;
const MAX_HEIGHT = 600;

// ─────────────────────────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────────────────────────
const stripHtml = (html) => {
  if (!html) return "";
  return html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
};

const countWords = (text) => {
  const cleanText = stripHtml(text);
  if (!cleanText) return 0;
  return cleanText.split(/\s+/).filter(word => word.length > 0).length;
};

const countCharacters = (text) => {
  return stripHtml(text).length;
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// ─────────────────────────────────────────────────────────────
// Custom Hooks
// ─────────────────────────────────────────────────────────────
const useAutoSave = (content, onSave, delay = AUTOSAVE_DELAY) => {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const previousContent = useRef(content);

  useEffect(() => {
    if (content === previousContent.current) return;

    const timeoutId = setTimeout(() => {
      setIsSaving(true);
      
      // Simulate save operation
      setTimeout(() => {
        if (onSave) {
          onSave(content);
        }
        previousContent.current = content;
        setLastSaved(new Date());
        setIsSaving(false);
      }, 300);
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [content, delay, onSave]);

  return { isSaving, lastSaved };
};

const useEditorStats = (content) => {
  return useMemo(() => ({
    wordCount: countWords(content),
    charCount: countCharacters(content),
    charCountWithSpaces: stripHtml(content).length,
    paragraphCount: (content.match(/<p>/g) || []).length,
    contentSize: formatBytes(new Blob([content]).size)
  }), [content]);
};

const useUndoRedo = (initialValue) => {
  const [history, setHistory] = useState([initialValue]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const addToHistory = useCallback((value) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(value);
      // Keep only last 50 states
      if (newHistory.length > 50) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setCurrentIndex(prev => Math.min(prev + 1, 49));
  }, [currentIndex]);

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [canUndo, currentIndex, history]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex(prev => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [canRedo, currentIndex, history]);

  return { addToHistory, undo, redo, canUndo, canRedo };
};

// ─────────────────────────────────────────────────────────────
// Sub Components
// ─────────────────────────────────────────────────────────────
const EditorStatusBar = React.memo(({ stats, isSaving, lastSaved, isFullscreen }) => (
  <div className={`flex flex-wrap items-center justify-between px-3 py-1.5 bg-gray-50 border-t border-gray-200 text-[10px] text-gray-500 ${isFullscreen ? 'fixed bottom-0 left-0 right-0 z-50' : ''}`}>
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {stats.wordCount} words
      </span>
      <span>{stats.charCount} characters</span>
      <span>{stats.paragraphCount} paragraphs</span>
      <span className="hidden sm:inline">{stats.contentSize}</span>
    </div>
    
    <div className="flex items-center gap-2">
      {isSaving && (
        <span className="flex items-center gap-1 text-blue-500">
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Saving...
        </span>
      )}
      {!isSaving && lastSaved && (
        <span className="text-green-600 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Saved {lastSaved.toLocaleTimeString()}
        </span>
      )}
    </div>
  </div>
));

EditorStatusBar.displayName = 'EditorStatusBar';

const EditorToolbarExtended = React.memo(({ 
  onClear, 
  onFullscreen, 
  isFullscreen, 
  onCopy,
  disabled 
}) => (
  <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 border-b border-gray-200">
    <button
      type="button"
      onClick={onCopy}
      disabled={disabled}
      className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Copy content"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    </button>
    
    <button
      type="button"
      onClick={onClear}
      disabled={disabled}
      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Clear content"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    </button>
    
    <div className="w-px h-4 bg-gray-300 mx-1" />
    
    <button
      type="button"
      onClick={onFullscreen}
      className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
      title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
    >
      {isFullscreen ? (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      )}
    </button>
  </div>
));

EditorToolbarExtended.displayName = 'EditorToolbarExtended';

// ─────────────────────────────────────────────────────────────
// Main Editor Component
// ─────────────────────────────────────────────────────────────
const CKEditorComponent = ({ 
  value = '', 
  onChange, 
  placeholder = "Start typing...",
  minHeight = MIN_HEIGHT,
  maxHeight = MAX_HEIGHT,
  autoSave = true,
  onAutoSave,
  disabled = false,
  className = ""
}) => {
  const [editorData, setEditorData] = useState(value);
  const [isReady, setIsReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const editorRef = useRef(null);
  const containerRef = useRef(null);

  // Custom hooks
  const stats = useEditorStats(editorData);
  const { isSaving, lastSaved } = useAutoSave(
    autoSave ? editorData : null, 
    onAutoSave, 
    AUTOSAVE_DELAY
  );

  // Editor configuration with dynamic placeholder
  const editorConfiguration = useMemo(() => ({
    ...EDITOR_CONFIG,
    placeholder
  }), [placeholder]);

  // Sync with external value
  useEffect(() => {
    if (value !== editorData && !isFocused) {
      setEditorData(value);
    }
  }, [value]);

  // Handle editor change
  const handleEditorChange = useCallback((event, editor) => {
    const data = editor.getData();
    setEditorData(data);
    if (onChange) {
      onChange(data);
    }
  }, [onChange]);

  // Handle editor ready
  const handleEditorReady = useCallback((editor) => {
    editorRef.current = editor;
    setIsReady(true);
    
    // Set min height
    const editorElement = editor.ui.view.editable.element;
    if (editorElement) {
      editorElement.style.minHeight = `${minHeight}px`;
      editorElement.style.maxHeight = `${maxHeight}px`;
      editorElement.style.overflowY = 'auto';
    }
  }, [minHeight, maxHeight]);

  // Handle focus/blur
  const handleFocus = useCallback(() => setIsFocused(true), []);
  const handleBlur = useCallback(() => setIsFocused(false), []);

  // Clear content
  const handleClear = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all content?')) {
      setEditorData('');
      if (onChange) {
        onChange('');
      }
      if (editorRef.current) {
        editorRef.current.setData('');
      }
    }
  }, [onChange]);

  // Copy content
  const handleCopy = useCallback(async () => {
    try {
      const plainText = stripHtml(editorData);
      await navigator.clipboard.writeText(plainText);
      // You can add toast notification here
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [editorData]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Handle escape key for fullscreen
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isFullscreen]);

  // Fullscreen body scroll lock
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isFullscreen]);

  const containerClasses = useMemo(() => {
    const base = "bg-white border border-gray-300 rounded-lg shadow-sm overflow-hidden transition-all duration-200";
    const focus = isFocused ? "ring-2 ring-blue-500 ring-opacity-50 border-blue-400" : "";
    const fullscreen = isFullscreen ? "fixed inset-4 z-50 flex flex-col" : "";
    const custom = className;
    
    return `${base} ${focus} ${fullscreen} ${custom}`.trim();
  }, [isFocused, isFullscreen, className]);

  return (
    <>
      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleFullscreen}
        />
      )}
      
      <div 
        ref={containerRef}
        className={containerClasses}
      >
        {/* Extended toolbar */}
        <EditorToolbarExtended
          onClear={handleClear}
          onFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          onCopy={handleCopy}
          disabled={disabled || !isReady}
        />
        
        {/* Loading state */}
        {!isReady && (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <svg className="w-5 h-5 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Loading editor...
          </div>
        )}
        
        {/* CKEditor */}
        <div className={`${!isReady ? 'opacity-0 h-0 overflow-hidden' : ''} ${isFullscreen ? 'flex-1 overflow-auto' : ''}`}>
          <CKEditor
            editor={ClassicEditor}
            config={editorConfiguration}
            data={editorData}
            disabled={disabled}
            onChange={handleEditorChange}
            onReady={handleEditorReady}
            onBlur={handleBlur}
            onFocus={handleFocus}
          />
        </div>
        
        {/* Status bar */}
        {isReady && (
          <EditorStatusBar
            stats={stats}
            isSaving={isSaving}
            lastSaved={lastSaved}
            isFullscreen={isFullscreen}
          />
        )}
      </div>
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────
export default React.memo(CKEditorComponent);