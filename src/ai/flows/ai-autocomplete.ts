'use server';

/**
 * @fileOverview Provides AI-powered code autocompletion suggestions.
 *
 * - aiAutocomplete - A function that suggests code completions based on the current code context.
 * - AIAutocompleteInput - The input type for the aiAutocomplete function.
 * - AIAutocompleteOutput - The return type for the aiAutocomplete function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIAutocompleteInputSchema = z.object({
  codePrefix: z
    .string()
    .describe('The current code snippet the user has typed.'),
});
export type AIAutocompleteInput = z.infer<typeof AIAutocompleteInputSchema>;

const AIAutocompleteOutputSchema = z.object({
  suggestion: z
    .string()
    .describe('The AI-powered code completion suggestion.'),
});
export type AIAutocompleteOutput = z.infer<typeof AIAutocompleteOutputSchema>;

export async function aiAutocomplete(input: AIAutocompleteInput): Promise<AIAutocompleteOutput> {
  return aiAutocompleteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiAutocompletePrompt',
  input: {schema: AIAutocompleteInputSchema},
  output: {schema: AIAutocompleteOutputSchema},
  prompt: `You are an AI code assistant that suggests the next line of code given the current code snippet.

  Current code:
  {{codePrefix}}

  Suggestion:`,
});

const aiAutocompleteFlow = ai.defineFlow(
  {
    name: 'aiAutocompleteFlow',
    inputSchema: AIAutocompleteInputSchema,
    outputSchema: AIAutocompleteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
