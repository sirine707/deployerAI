
import { CodeEditor } from '@/components/code-editor';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12"> {/* Removed bg-background */}
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6 text-center font-mono text-primary">
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
