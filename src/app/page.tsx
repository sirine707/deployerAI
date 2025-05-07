// src/app/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { CodeEditor } from '@/components/code-editor';
import { Card, CardContent } from '@/components/ui/card';
import { LanguageSelector } from '@/components/language-selector';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Rocket, Dock, BotMessageSquare } from 'lucide-react'; // Changed Docker to Dock
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [codeContent, setCodeContent] = useState('');
  const [showPushPopup, setShowPushPopup] = useState(false);
  const [targetRegistry, setTargetRegistry] = useState(''); // Keep this for now if needed later, but will use selectedRegistryType for push logic
  const [showDeployK8sButton, setShowDeployK8sButton] = useState(false);
  const [selectedRegistryType, setSelectedRegistryType] = useState<'dockerhub' | 'gcr' | 'ecr' | null>(null); // New state for selected registry type

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Clear interval on component unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const startProgressSimulation = () => {
    setProgress(10);
    progressIntervalRef.current = setInterval(() => {
      setProgress((currentProgress) => {
        const newProgress = currentProgress + 5; // Slower increment
        // Stop simulating before 100, backend response will finalize
        if (newProgress >= 95) { // Cap at 95%
          clearInterval(progressIntervalRef.current!);
          return 95;
        }
        return newProgress;
      });
    }, 200); // Faster interval for smoother simulation
  };

  const stopProgressSimulation = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };

  const handleDeploy = async () => {
    setIsBuilding(true);
    setShowDeployK8sButton(false); // Hide K8s button on new deploy attempt
    setShowPushPopup(false); // Hide push popup on new deploy attempt
    startProgressSimulation();
    setSelectedRegistryType(null); // Reset selected registry

    console.log('Starting deploy fetch...'); // Added log
    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: codeContent }),
      });

      console.log('Deploy fetch finished, response.ok:', response.ok); // Added log

      // Stop simulation once response is received
      stopProgressSimulation();
      setIsBuilding(false); // Building finished

      if (response.ok) {
        console.log('Build triggered successfully');
        setProgress(100); // Finalize progress bar
        console.log("Attempting to show push popup"); // Added log
        setShowPushPopup(true); // Show push popup after successful build
        console.log("showPushPopup state after setting:", true); // Added log
        toast({
          title: "Build Successful",
          description: "Docker image built successfully.",
        });
      } else {
        const errorText = await response.text();
        console.error('Failed to trigger build:', errorText);
        setProgress(0); // Reset progress on failure
        toast({
          title: "Build Failed",
          description: `Failed to build Docker image: ${errorText}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error during build:', error);
      stopProgressSimulation();
      setProgress(0); // Reset progress on error
      setIsBuilding(false);
      toast({
        title: "Build Error",
        description: `An error occurred during build: ${error.message || error}`,
        variant: "destructive",
      });
    }
  };

  // Modify handlePushImage to use selectedRegistryType
  const handlePushImage = async () => {
    if (!selectedRegistryType) {
        toast({
          title: "Selection Required",
          description: "Please select a target registry type.",
          variant: "destructive",
        });
        return;
    }
    // Determine the actual registry path based on selection (this might need further input or configuration)
    let registryPath = '';
    switch(selectedRegistryType) {
        case 'dockerhub': registryPath = 'docker.io/yourusername'; break; // Placeholder
        case 'gcr': registryPath = 'gcr.io/your-project'; break; // Placeholder
        case 'ecr': registryPath = 'aws_account_id.dkr.ecr.region.amazonaws.com'; break; // Placeholder
        default: registryPath = '';
    }

    if (!registryPath || registryPath.includes('yourusername') || registryPath.includes('your-project') || registryPath.includes('aws_account_id')) {
         toast({
           title: "Configuration Needed",
           description: `Please configure the actual path for ${selectedRegistryType.toUpperCase()}. (This is a placeholder).`,
           variant: "destructive",
         });
         // For now, we'll stop here if not configured, but ideally, this would prompt for input
         return;
    }

    setIsPushing(true);
    setShowPushPopup(false); // Hide popup
    setProgress(0); // Reset progress for next step

    try {
        // Assuming the image name is 'my-app' as used in backend example
        const imageName = 'my-app';
        // Use the determined registryPath
        const response = await fetch('/api/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageName, targetRegistry: registryPath }),
        });

        setIsPushing(false); // Pushing finished

        if (response.ok) {
            console.log('Image pushed successfully');
            setProgress(100); // Finalize progress bar for push (optional, can be removed if push is fast)
            setShowDeployK8sButton(true); // Show K8s deploy button
             toast({
               title: "Push Successful",
               description: `Image pushed to ${registryPath}.`,
             });
        } else {
            const errorText = await response.text();
            console.error('Failed to push image:', errorText);
            setProgress(0); // Reset progress on failure
             toast({
               title: "Push Failed",
               description: `Failed to push image: ${errorText}`,
               variant: "destructive",
             });
        }
    } catch (error: any) {
        console.error('Error during image push:', error);
        setIsPushing(false);
        setProgress(0); // Reset progress on error
         toast({
            title: "Push Error",
            description: `An error occurred during push: ${error.message || error}`,
            variant: "destructive",
         });
    }
  };

  const handleDeployToKubernetes = () => {
      console.log('Deploying to Kubernetes...');
      // TODO: Implement the API call to /api/deploy-k8s
       toast({
         title: "Kubernetes Deploy",
         description: "Simulating Kubernetes deployment. Backend not implemented yet.",
       });
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-12">
      <div className="w-full max-w-4xl relative">
        <div className="absolute top-0 right-0 z-10 flex flex-col items-end space-y-2 mb-4">
          <LanguageSelector />
           <Button
             variant="outline"
             size="sm"
             onClick={handleDeploy}
             disabled={isBuilding || isPushing}
           >
             <Rocket className="mr-2 h-4 w-4" /> {isBuilding ? 'Building...' : isPushing ? 'Pushing...' : 'Deploy'}
           </Button>
        </div>

        <h1 className="text-3xl font-bold mb-6 pt-12 text-center font-mono text-primary">
          Code Weaver <span className="text-foreground">::</span> AI Editor
        </h1>
        <Card className={`w-full border-accent bg-card/80 backdrop-blur-sm ${showPushPopup ? 'shadow-2xl' : 'shadow-lg'}`}>
           <CardContent className="p-0">
              <CodeEditor value={codeContent} onValueChange={setCodeContent} />
           </CardContent>
        </Card>

        {/* Progress Bar */}
        {(isBuilding || isPushing) && (
          <div className="w-full mt-4">
             <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Push Image Dialog */}
        <Dialog open={showPushPopup} onOpenChange={setShowPushPopup}>
            <DialogContent className="flex flex-col items-center justify-center text-center">
                <DialogHeader>
                    <DialogTitle>Push Docker Image</DialogTitle>
                    <DialogDescription>
                        Your Docker image has been built. Select a target registry to push the image.
                    </DialogDescription>
                </DialogHeader>
                {/* Registry Selection with Icons */}
                <div className="flex justify-center gap-8 py-8">
                    {/* Docker Hub */}
                    <div
                        className={`flex flex-col items-center cursor-pointer ${selectedRegistryType === 'dockerhub' ? 'text-blue-600' : 'text-muted-foreground'}`}
                        onClick={() => setSelectedRegistryType('dockerhub')}
                    >
                        <Dock size={48} /> {/* Changed Docker to Dock */}
                        <span className="mt-2 text-sm">Docker Hub</span>
                    </div>
                    {/* GCR (Google Container Registry) */}
                    <div
                         className={`flex flex-col items-center cursor-pointer ${selectedRegistryType === 'gcr' ? 'text-blue-400' : 'text-muted-foreground'}`}
                         onClick={() => setSelectedRegistryType('gcr')}
                    >
                         <BotMessageSquare size={48} /> {/* Using a placeholder icon */} 
                         <span className="mt-2 text-sm">GCR</span>
                    </div>
                     {/* ECR (Elastic Container Registry) */}
                     <div
                         className={`flex flex-col items-center cursor-pointer ${selectedRegistryType === 'ecr' ? 'text-orange-500' : 'text-muted-foreground'}`}
                         onClick={() => setSelectedRegistryType('ecr')}
                     >
                         <BotMessageSquare size={48} /> {/* Using a placeholder icon */} 
                         <span className="mt-2 text-sm">ECR</span>
                     </div>
                </div>
                <DialogFooter className="w-full flex justify-end">
                    {/* Changed button text to Next */}
                    <Button onClick={handlePushImage} disabled={!selectedRegistryType}>Next</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Deploy to Kubernetes Button */}
        {showDeployK8sButton && (
            <div className="w-full mt-4 text-center">
                <Button onClick={handleDeployToKubernetes} className="px-8 py-2">
                    Deploy to Kubernetes
                </Button>
            </div>
        )}

        <footer className="mt-8 text-center text-muted-foreground text-sm">
          Powered by Generative AI
        </footer>
      </div>
    </main>
  );
}
