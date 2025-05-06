
"use client";

import type { ChangeEvent } from 'react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { aiAutocomplete } from '@/ai/flows/ai-autocomplete';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

// Debounce hook - Removed as automatic suggestions are disabled
/*
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
*/

export function CodeEditor() {
  const [code, setCode] = useState<string>('');
  const [lineNumbers, setLineNumbers] = useState<string>('1');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState<boolean>(false);
  const [isSuggestionApplied, setIsSuggestionApplied] = useState<boolean>(false); // Keep track if the last suggestion was applied via Tab
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Debounced code is removed as automatic suggestions are disabled
  // const debouncedCode = useDebounce(code, 500);

  const updateLineNumbers = useCallback((currentCode: string) => {
    const lines = currentCode.split('\n');
    const count = lines.length;
    setLineNumbers(Array.from({ length: count }, (_, i) => i + 1).join('\n'));
  }, []);

  const handleCodeChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = event.target.value;
    setCode(newCode);
    updateLineNumbers(newCode);
    // Clear suggestion and reset applied state if user types something
    // (In case a suggestion was manually triggered and is now stale)
    if (!isSuggestionApplied) {
        setSuggestion(null);
    }
    setIsSuggestionApplied(false);
  };

  // Manual suggestion fetching function (could be triggered by a button in the future)
  // Kept the core logic but it's not called automatically anymore.
  const fetchSuggestion = useCallback(async (currentCode: string) => {
    if (!currentCode.trim()) return;

    setIsLoadingSuggestion(true);
    setSuggestion(null); // Clear previous suggestion

    try {
      const result = await aiAutocomplete({ codePrefix: currentCode });
      if (result.suggestion && result.suggestion.trim() && result.suggestion !== currentCode.split('\n').pop()?.trim()) {
        // Set suggestion only if it's valid and different from the last typed part
        setSuggestion(result.suggestion);
      } else {
        setSuggestion(null); // No valid suggestion
      }
    } catch (error) {
      console.error('Error fetching AI suggestion:', error);
      toast({
        title: "Error",
        description: "Failed to fetch AI suggestion.",
        variant: "destructive",
      });
      setSuggestion(null); // Clear suggestion on error
    } finally {
      setIsLoadingSuggestion(false);
    }
  }, [toast]); // Removed dependency on isSuggestionApplied as fetch is not automatic

  // Remove the useEffect that automatically fetched suggestions based on debouncedCode
  /*
  useEffect(() => {
    if (debouncedCode && !isSuggestionApplied) { // Check isSuggestionApplied here
      fetchSuggestion(debouncedCode);
    } else {
      setSuggestion(null); // Clear suggestion if code is empty or suggestion applied
      setIsLoadingSuggestion(false);
    }
  }, [debouncedCode, fetchSuggestion, isSuggestionApplied]);
  */

   const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow applying suggestion with Tab if a suggestion exists (e.g., manually triggered)
    if (event.key === 'Tab' && suggestion && !isLoadingSuggestion) {
      event.preventDefault(); // Prevent default tab behavior
      const currentCode = code;
      const lastLine = currentCode.split('\n').pop() || '';
      const indent = lastLine.match(/^\s*/)?.[0] || ''; // Preserve indentation
      const newCode = currentCode + '\n' + indent + suggestion;
      setCode(newCode);
      updateLineNumbers(newCode);
      setSuggestion(null); // Clear suggestion after applying
      setIsSuggestionApplied(true); // Mark suggestion as applied

      // Move cursor to the end of the newly added line
       requestAnimationFrame(() => {
         if (textAreaRef.current) {
             textAreaRef.current.selectionStart = textAreaRef.current.selectionEnd = newCode.length;
             textAreaRef.current.focus(); // Refocus
             syncScroll(); // Ensure scroll sync after update
         }
       });
    } else {
        // Any other key press resets the 'applied' state, allowing manual fetch/display again
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

   // Adjust textarea height dynamically
   useEffect(() => {
     if (textAreaRef.current) {
       textAreaRef.current.style.height = 'auto'; // Reset height
       textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
       syncScroll(); // Sync scroll after height adjustment
     }
   }, [code]); // Re-run when code changes

  return (
    // Use bg-inherit to make the container transparent, relying on Card's background
    <div className="flex h-full w-full rounded-md border border-transparent bg-inherit text-card-foreground shadow-sm overflow-hidden">
      <div
        ref={lineNumbersRef}
        className="line-numbers bg-inherit p-2 border-r w-16 overflow-y-hidden" // Match padding-top/bottom roughly with textarea, inherit background
        style={{ paddingTop: '10px', paddingBottom: '10px' }} // Explicit padding
      >
        {lineNumbers}
      </div>
      <div className="relative flex-1 p-2 bg-inherit"> {/* Added padding to match line numbers, inherit background */}
        <Textarea
          ref={textAreaRef}
          value={code}
          onChange={handleCodeChange}
          onKeyDown={handleKeyDown}
          placeholder="Start typing your code here..."
          className="code-editor-textarea w-full h-full block bg-inherit" // Ensure block display, inherit background
          spellCheck="false" // Disable spellcheck for code
          rows={10} // Initial rows, will adjust
          style={{ minHeight: '200px' }} // Ensure minimum height
        />
        {/* Suggestion Overlay - Will only show if suggestion state is populated manually */}
        {suggestion && !isLoadingSuggestion && code.length > 0 && (
          <div className="absolute left-2 right-2 bottom-2 p-2 bg-muted/80 backdrop-blur-sm text-muted-foreground rounded-md text-xs flex items-center justify-between animate-in fade-in duration-300"> {/* Added backdrop-blur and slight transparency */}
             <span className="flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-primary" /> AI Suggestion: <code className="ml-1 font-mono bg-background/50 px-1 py-0.5 rounded">{suggestion}</code>
             </span>
            <span className="text-xs font-semibold">[Tab] to accept</span>
          </div>
        )}
        {/* Loading Indicator - Will only show if isLoadingSuggestion is true (manual trigger) */}
        {isLoadingSuggestion && code.length > 0 && (
           <div className="absolute left-2 right-2 bottom-2 p-2 bg-muted/80 backdrop-blur-sm text-muted-foreground rounded-md text-xs flex items-center animate-in fade-in duration-300"> {/* Added backdrop-blur and slight transparency */}
            <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Fetching suggestion...
           </div>
        )}
      </div>
    </div>
  );
}
