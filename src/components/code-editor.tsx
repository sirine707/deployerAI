"use client";

import type { ChangeEvent } from 'react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { aiAutocomplete } from '@/ai/flows/ai-autocomplete';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { FaDocker, FaAws, FaGoogle } from "react-icons/fa";

interface CodeEditorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function CodeEditor({ value, onValueChange }: CodeEditorProps) {
  const [lineNumbers, setLineNumbers] = useState<string>('1');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState<boolean>(false);
  const [isSuggestionApplied, setIsSuggestionApplied] = useState<boolean>(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const updateLineNumbers = useCallback((currentCode: string) => {
    // Split code by newlines, filter out trailing empty lines
    const lines = currentCode.split('\n');
    // Count non-empty lines or lines before a trailing newline
    let lineCount = lines.length;
    if (lines.length > 1 && lines[lines.length - 1] === '') {
      lineCount--; // Ignore trailing empty line
    }
    if (lineCount === 0) {
      lineCount = 1; // Always show at least one line
    }
    // Generate line numbers (1, 2, 3, ...)
    const lineNumbersArray = Array.from({ length: lineCount }, (_, i) => i + 1);
    setLineNumbers(lineNumbersArray.join('\n'));
  }, []);

  useEffect(() => {
    // Update line numbers when the external value changes
    updateLineNumbers(value);
  }, [value, updateLineNumbers]);

  const handleCodeChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = event.target.value;
    onValueChange(newCode);
    updateLineNumbers(newCode); // Update line numbers on every change
    // Clear suggestion and reset applied state if user types something
    if (!isSuggestionApplied) {
      setSuggestion(null);
    }
    setIsSuggestionApplied(false);
  };

  // Manual suggestion fetching function
  const fetchSuggestion = useCallback(async (currentCode: string) => {
    if (!currentCode.trim()) return;

    setIsLoadingSuggestion(true);
    setSuggestion(null);

    try {
      const result = await aiAutocomplete({ codePrefix: currentCode });
      if (result.suggestion && result.suggestion.trim() && !result.suggestion.trimStart().startsWith(currentCode.split('\n').pop()?.trimStart() || '')) {
        setSuggestion(result.suggestion);
      } else {
        setSuggestion(null);
      }
    } catch (error) {
      console.error('Error fetching AI suggestion:', error);
      toast({
        title: "Error",
        description: "Failed to fetch AI suggestion.",
        variant: "destructive",
      });
      setSuggestion(null);
    } finally {
      setIsLoadingSuggestion(false);
    }
  }, [toast]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Tab' && suggestion && !isLoadingSuggestion) {
      event.preventDefault();
      const currentCode = value;
      const lines = currentCode.split('\n');
      const lastLine = lines[lines.length - 1] || '';
      const indentMatch = lastLine.match(/^\s*/);
      const indent = indentMatch ? indentMatch[0] : '';

      // Find the common prefix between the last line and the suggestion
      let commonPrefix = '';
      for (let i = 0; i < Math.min(lastLine.length, suggestion.length); i++) {
        if (lastLine[lastLine.length - 1 - i] === suggestion[suggestion.length - 1 - i]) {
          commonPrefix = suggestion[suggestion.length - 1 - i] + commonPrefix;
        } else {
          break;
        }
      }

      // Remove the common prefix from the suggestion
      const suggestionWithoutPrefix = suggestion.substring(0, suggestion.length - commonPrefix.length);

      const newCode = currentCode + suggestionWithoutPrefix;
      onValueChange(newCode);
      setSuggestion(null);
      setIsSuggestionApplied(true);

      requestAnimationFrame(() => {
        if (textAreaRef.current) {
          textAreaRef.current.selectionStart = textAreaRef.current.selectionEnd = newCode.length;
          textAreaRef.current.focus();
          syncScroll();
        }
      });
    } else {
      setIsSuggestionApplied(false);
    }
  };

  const syncScroll = () => {
    if (textAreaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textAreaRef.current.scrollTop;
    }
  };

  useEffect(() => {
    const editor = textAreaRef.current;
    if (editor) {
      editor.addEventListener('scroll', syncScroll);
      return () => editor.removeEventListener('scroll', syncScroll);
    }
  }, []);

  // Adjust textarea height dynamically based on the external value
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
      syncScroll();
    }
  }, [value]);

  return (
    <div className="flex h-full w-full rounded-md border border-transparent bg-inherit text-card-foreground shadow-sm overflow-hidden">
      <div
        ref={lineNumbersRef}
        className="line-numbers bg-inherit p-1 border-r w-12 overflow-y-hidden text-right pr-2"
        style={{ paddingTop: '15px', paddingBottom: '10px', fontSize: '0.9rem', lineHeight: '2.0' }}
      >
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '0.77rem', lineHeight: '1.8' }}>{lineNumbers}</pre>
      </div>
      <div className="relative flex-1 p-2 bg-inherit">
        <Textarea
          ref={textAreaRef}
          value={value}
          onChange={handleCodeChange}
          onKeyDown={handleKeyDown}
          placeholder="Start typing your code here..."
          className="code-editor-textarea w-full h-full block bg-inherit"
          spellCheck="false"
          rows={10}
          style={{ minHeight: '200px', fontSize: '0.9rem', lineHeight: '1.5' }}
        />
        {suggestion && !isLoadingSuggestion && value.length > 0 && (
          <div className="absolute left-2 right-2 bottom-2 p-2 bg-muted/80 backdrop-blur-sm text-muted-foreground rounded-md text-xs flex items-center justify-between animate-in fade-in duration-300">
            <span className="flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-primary" /> AI Suggestion: <code className="ml-1 font-mono bg-background/50 px-1 py-0.5 rounded">{suggestion}</code>
            </span>
            <span className="text-xs font-semibold">[Tab] to accept</span>
          </div>
        )}
        {isLoadingSuggestion && value.length > 0 && (
          <div className="absolute left-2 right-2 bottom-2 p-2 bg-muted/80 backdrop-blur-sm text-muted-foreground rounded-md text-xs flex items-center animate-in fade-in duration-300">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Fetching suggestion...
          </div>
        )}
      </div>
    </div>
  );
}