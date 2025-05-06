
import { CodeEditor } from '@/components/code-editor';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LanguageSelector } from '@/components/language-selector'; // Import the new component
import { Button } from '@/components/ui/button'; // Import Button
import { Rocket } from 'lucide-react'; // Import Rocket icon

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12"> {/* Removed bg-background */}
      <div className="w-full max-w-4xl relative"> {/* Added relative positioning */}
        {/* Position the LanguageSelector and Deploy button in the top right */}
        <div className="absolute top-0 right-0 z-10 flex flex-col items-end space-y-2 mb-4">
          <LanguageSelector />
           <Button variant="outline" size="sm">
             <Rocket className="mr-2 h-4 w-4" /> Deploy
           </Button>
        </div>

        <h1 className="text-3xl font-bold mb-6 pt-12 text-center font-mono text-primary"> {/* Added padding-top to avoid overlap */}
          Code Weaver <span className="text-foreground">::</span> AI Editor
        </h1>
        <Card className="w-full shadow-lg border-accent bg-card/80 backdrop-blur-sm"> {/* Add slight transparency and blur to card */}
           <CardContent className="p-0"> {/* Remove default padding */}
              <CodeEditor />
           </CardContent>
        </Card>
        <footer className="mt-8 text-center text-muted-foreground text-sm">
          Powered by Generative AI
        </footer>
      </div>
    </main>
  );
}
