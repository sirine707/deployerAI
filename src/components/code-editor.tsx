
"use client";

import type { ChangeEvent } from 'react';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { aiAutocomplete } from '@/ai/flows/ai-autocomplete';
import { Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function CodeEditor() {
  const [code, setCode] = useState<string>('');
  const [lineNumbers, setLineNumbers] = useState<string>('1');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState<boolean>(false);
  const [isSuggestionApplied, setIsSuggestionApplied] = useState<boolean>(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const debouncedCode = useDebounce(code, 500); // Debounce API calls by 500ms

  const updateLineNumbers = useCallback((currentCode: string) => {
    const lines = currentCode.split('\n');
    const count = lines.length;
    setLineNumbers(Array.from({ length: count }, (_, i) => i + 1).join('\n'));
  }, []);

  const handleCodeChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const newCode = event.target.value;
    setCode(newCode);
    updateLineNumbers(newCode);
    setSuggestion(null); // Clear old suggestion on code change
    setIsSuggestionApplied(false); // Reset applied state
  };

  const fetchSuggestion = useCallback(async (currentCode: string) => {
    if (!currentCode.trim() || isSuggestionApplied) return; // Don't fetch if empty or suggestion already applied

    setIsLoadingSuggestion(true);
    setSuggestion(null); // Clear previous suggestion immediately

    try {
      const result = await aiAutocomplete({ codePrefix: currentCode });
      // Only set suggestion if the code hasn't changed since the request started
      // and the suggestion is different from the current code
      if (result.suggestion && result.suggestion.trim() && result.suggestion !== currentCode.split('\n').pop()?.trim()) {
         setCode(prevCode => {
            if(prevCode === currentCode) { // Check if code changed during fetch
               setSuggestion(result.suggestion);
               return prevCode;
            }
            return prevCode; // Code changed, discard suggestion
         });
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
      // Ensure loading state is reset only if code hasn't changed during fetch
       setCode(prevCode => {
          if (prevCode === currentCode) {
             setIsLoadingSuggestion(false);
          }
          return prevCode;
       });
    }
  }, [isSuggestionApplied, toast]);


  // Fetch suggestion when debounced code changes
  useEffect(() => {
    if (debouncedCode) {
      fetchSuggestion(debouncedCode);
    } else {
      setSuggestion(null); // Clear suggestion if code is empty
      setIsLoadingSuggestion(false);
    }
  }, [debouncedCode, fetchSuggestion]);

   const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
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
    } else if (event.key !== 'Tab') {
        // Allow fetching new suggestion if user types something else
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
        {/* Suggestion Overlay */}
        {suggestion && !isLoadingSuggestion && code.length > 0 && (
          <div className="absolute left-2 right-2 bottom-2 p-2 bg-muted/80 backdrop-blur-sm text-muted-foreground rounded-md text-xs flex items-center justify-between animate-in fade-in duration-300"> {/* Added backdrop-blur and slight transparency */}
             <span className="flex items-center">
              <Sparkles className="w-3 h-3 mr-1 text-primary" /> AI Suggestion: <code className="ml-1 font-mono bg-background/50 px-1 py-0.5 rounded">{suggestion}</code>
             </span>
            <span className="text-xs font-semibold">[Tab] to accept</span>
          </div>
        )}
        {/* Loading Indicator */}
        {isLoadingSuggestion && code.length > 0 && (
           <div className="absolute left-2 right-2 bottom-2 p-2 bg-muted/80 backdrop-blur-sm text-muted-foreground rounded-md text-xs flex items-center animate-in fade-in duration-300"> {/* Added backdrop-blur and slight transparency */}
            <Loader2 className="w-3 h-3 mr-1 animate-spin" /> Fetching suggestion...
           </div>
        )}
      </div>
    </div>
  );
}
