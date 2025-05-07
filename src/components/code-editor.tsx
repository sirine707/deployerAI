
"use client";

import type { ChangeEvent } from 'react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { aiAutocomplete } from '@/ai/flows/ai-autocomplete';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

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
    const lines = currentCode.split('');
    const count = lines.length;
    setLineNumbers(Array.from({ length: count }, (_, i) => i + 1).join('')); }, []);

  useEffect(() => {
      // Update line numbers when the external value changes
      updateLineNumbers(value);
  }, [value, updateLineNumbers]);

  const handleCodeChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = event.target.value;
    onValueChange(newCode); // Use onValueChange prop
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
      if (result.suggestion && result.suggestion.trim() && result.suggestion !== currentCode.split('').pop()?.trim()) {
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
      const currentCode = value; // Use value prop
      const lastLine = currentCode.split('').pop() || '';
      const indent = lastLine.match(/^\s*/)?.[0] || '';
      const newCode = currentCode + '' + indent + suggestion;
      onValueChange(newCode); // Use onValueChange prop
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
   }, [value]); // Re-run when value changes

  return (
    <div className="flex h-full w-full rounded-md border border-transparent bg-inherit text-card-foreground shadow-sm overflow-hidden">
      <div
        ref={lineNumbersRef}
        className="line-numbers bg-inherit p-2 border-r w-16 overflow-y-hidden"
        style={{ paddingTop: '10px', paddingBottom: '10px' }}
      >
        {lineNumbers}
      </div>
      <div className="relative flex-1 p-2 bg-inherit">
        <Textarea
          ref={textAreaRef}
          value={value} // Use value prop
          onChange={handleCodeChange}
          onKeyDown={handleKeyDown}
          placeholder="Start typing your code here..."
          className="code-editor-textarea w-full h-full block bg-inherit"
          spellCheck="false"
          rows={10}
          style={{ minHeight: '200px' }}
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
