// src/app/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { CodeEditor } from '@/components/code-editor';
import { Card, CardContent } from '@/components/ui/card';
import { LanguageSelector } from '@/components/language-selector';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Rocket, Folder, FileX, Code2, Settings, LogOut } from 'lucide-react';
import { FaDocker, FaAws, FaGoogle } from "react-icons/fa";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
// Input and Label are not directly used in the final JSX but were in the original file, so kept for consistency unless cleanup is requested.
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
import { useToast } from "@/hooks/use-toast";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarRail,
} from '@/components/ui/sidebar';

export default function Home() {
  const [isBuilding, setIsBuilding] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [codeContent, setCodeContent] = useState("print('Hello, DeployerAI!')"); // Default code
  const [showPushPopup, setShowPushPopup] = useState(false);
  const [targetRegistry, setTargetRegistry] = useState('');
  const [showDeployK8sButton, setShowDeployK8sButton] = useState(false);
  const [selectedRegistryType, setSelectedRegistryType] = useState<'dockerhub' | 'gcr' | 'ecr' | null>(null);

  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

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
        const newProgress = currentProgress + 5;
        if (newProgress >= 95) {
          clearInterval(progressIntervalRef.current!);
          return 95;
        }
        return newProgress;
      });
    }, 200);
  };

  const stopProgressSimulation = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };

  const handleDeploy = async () => {
    setIsBuilding(true);
    setShowDeployK8sButton(false);
    setShowPushPopup(false);
    startProgressSimulation();
    setSelectedRegistryType(null);

    console.log('Starting deploy fetch...');
    try {
      const response = await fetch('/api/deploy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: codeContent }),
      });

      console.log('Deploy fetch finished, response.ok:', response.ok);

      stopProgressSimulation();
      setIsBuilding(false);

      if (response.ok) {
        console.log('Build triggered successfully');
        setProgress(100);
        console.log("Attempting to show push popup");
        setShowPushPopup(true);
        console.log("showPushPopup state after setting:", true);
        toast({
          title: "Build Successful",
          description: "Docker image built successfully.",
        });
      } else {
        const errorText = await response.text();
        console.error('Failed to trigger build:', errorText);
        setProgress(0);
        toast({
          title: "Build Failed",
          description: `Failed to build Docker image: ${errorText}`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error during build:', error);
      stopProgressSimulation();
      setProgress(0);
      setIsBuilding(false);
      toast({
        title: "Build Error",
        description: `An error occurred during build: ${error.message || error}`,
        variant: "destructive",
      });
    }
  };

  const handlePushImage = async () => {
    if (!selectedRegistryType) {
        toast({
          title: "Selection Required",
          description: "Please select a target registry type.",
          variant: "destructive",
        });
        return;
    }
    let registryPath = '';
    switch(selectedRegistryType) {
        case 'dockerhub': registryPath = 'docker.io/yourusername'; break;
        case 'gcr': registryPath = 'gcr.io/your-project'; break;
        case 'ecr': registryPath = 'aws_account_id.dkr.ecr.region.amazonaws.com'; break;
        default: registryPath = '';
    }

    if (!registryPath || registryPath.includes('yourusername') || registryPath.includes('your-project') || registryPath.includes('aws_account_id')) {
         toast({
           title: "Configuration Needed",
           description: `Please configure the actual path for ${selectedRegistryType.toUpperCase()}. (This is a placeholder).`,
           variant: "destructive",
         });
         return;
    }

    setIsPushing(true);
    setShowPushPopup(false);
    setProgress(0);

    try {
        const imageName = 'my-app';
        const response = await fetch('/api/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ imageName, targetRegistry: registryPath }),
        });

        setIsPushing(false);

        if (response.ok) {
            console.log('Image pushed successfully');
            setProgress(100);
            setShowDeployK8sButton(true);
             toast({
               title: "Push Successful",
               description: `Image pushed to ${registryPath}.`,
             });
        } else {
            const errorText = await response.text();
            console.error('Failed to push image:', errorText);
            setProgress(0);
             toast({
               title: "Push Failed",
               description: `Failed to push image: ${errorText}`,
               variant: "destructive",
             });
        }
    } catch (error: any) {
        console.error('Error during image push:', error);
        setIsPushing(false);
        setProgress(0);
         toast({
            title: "Push Error",
            description: `An error occurred during push: ${error.message || error}`,
            variant: "destructive",
         });
    }
  };

  const handleDeployToKubernetes = () => {
      console.log('Deploying to Kubernetes...');
       toast({
         title: "Kubernetes Deploy",
         description: "Simulating Kubernetes deployment. Backend not implemented yet.",
       });
  };

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen"> {/* Removed bg-background */}
        <Sidebar collapsible="icon" className="border-r" side="left">
          <SidebarRail />
          <SidebarHeader className="p-2 flex justify-center items-center group-data-[state=collapsed]:justify-center">
             <div className="flex items-center gap-2 group-data-[state=expanded]:opacity-100 opacity-0 transition-opacity duration-200 delay-100">
                <Code2 className="h-6 w-6 text-primary" />
                <span className="font-semibold text-lg">Explorer</span>
             </div>
             <Code2 className="h-6 w-6 text-primary group-data-[state=expanded]:hidden" />
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarMenu>
              <SidebarGroup>
                <SidebarGroupLabel className="group-data-[state=collapsed]:hidden">Workspace</SidebarGroupLabel>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip={{content: "Source Files", side: "right", align:"center"}}>
                    <Folder className="h-5 w-5" />
                    <span className="group-data-[state=collapsed]:hidden">src</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip={{content: "Application Pages", side: "right", align:"center"}}>
                    <Folder className="h-5 w-5" />
                    <span className="group-data-[state=collapsed]:hidden">app</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip={{content: "UI Components", side: "right", align:"center"}}>
                    <Folder className="h-5 w-5" />
                    <span className="group-data-[state=collapsed]:hidden">components</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton tooltip={{content: "AI Flows", side: "right", align:"center"}}>
                    <Folder className="h-5 w-5" />
                    <span className="group-data-[state=collapsed]:hidden">ai/flows</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip={{content: "Public Assets", side: "right", align:"center"}}>
                    <Folder className="h-5 w-5" />
                    <span className="group-data-[state=collapsed]:hidden">public</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip={{content: "Package Configuration", side: "right", align:"center"}}>
                    <FileX className="h-5 w-5" />
                    <span className="group-data-[state=collapsed]:hidden">package.json</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                  <SidebarMenuButton tooltip={{content: "Dockerfile", side: "right", align:"center"}}>
                    <FaDocker className="h-5 w-5" />
                    <span className="group-data-[state=collapsed]:hidden">Dockerfile</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarGroup>
            </SidebarMenu>
          </SidebarContent>
          <SidebarSeparator className="group-data-[state=collapsed]:mx-auto group-data-[state=collapsed]:my-2 group-data-[state=collapsed]:w-6" />
          <SidebarFooter className="p-2">
             <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip={{content: "Settings", side: "right", align:"center"}}>
                    <Settings className="h-5 w-5" />
                    <span className="group-data-[state=collapsed]:hidden">Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip={{content: "Log Out", side: "right", align:"center"}}>
                    <LogOut className="h-5 w-5" />
                    <span className="group-data-[state=collapsed]:hidden">Log Out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
             </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset>
          <main className="flex flex-col items-center w-full h-full overflow-auto"> {/* Removed padding */}
            <div className="w-full max-w-4xl relative mt-16 md:mt-12"> {/* Added margin-top for spacing */}
              <div className="absolute top-0 right-0 z-10 flex items-center space-x-2 mb-4">
                <SidebarTrigger className="md:hidden" /> {/* Mobile trigger */}
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

              <Card className={`w-full border-accent bg-card/80 backdrop-blur-sm ${showPushPopup ? 'shadow-2xl' : 'shadow-lg'}`}> {/* Removed mt-16 md:mt-12, handled by parent div */}
                 <CardContent className="p-0">
                    <CodeEditor value={codeContent} onValueChange={setCodeContent} />
                 </CardContent>
              </Card>

              {(isBuilding || isPushing) && (
                <div className="w-full mt-4">
                   <Progress value={progress} className="w-full" />
                </div>
              )}

              <Dialog open={showPushPopup} onOpenChange={setShowPushPopup}>
                  <DialogContent className="flex flex-col items-center justify-center text-center">
                      <DialogHeader>
                          <DialogTitle>Push Docker Image</DialogTitle>
                          <DialogDescription>
                              Your Docker image has been built. Select a target registry to push the image.
                          </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-center gap-8 py-8">
                          <div
                              className={`flex flex-col items-center cursor-pointer p-2 rounded-md hover:bg-accent ${selectedRegistryType === 'dockerhub' ? 'text-primary ring-2 ring-primary' : 'text-muted-foreground'}`}
                              onClick={() => setSelectedRegistryType('dockerhub')}
                          >
                              <FaDocker size={48} />
                              <span className="mt-2 text-sm">Docker Hub</span>
                          </div>
                          <div
                              className={`flex flex-col items-center cursor-pointer p-2 rounded-md hover:bg-accent ${selectedRegistryType === 'gcr' ? 'text-primary ring-2 ring-primary' : 'text-muted-foreground'}`}
                              onClick={() => setSelectedRegistryType('gcr')}
                          >
                              <FaGoogle size={48} />
                              <span className="mt-2 text-sm">GCR</span>
                          </div>
                          <div
                              className={`flex flex-col items-center cursor-pointer p-2 rounded-md hover:bg-accent ${selectedRegistryType === 'ecr' ? 'text-primary ring-2 ring-primary' : 'text-muted-foreground'}`}
                              onClick={() => setSelectedRegistryType('ecr')}
                          >
                              <FaAws size={48} />
                              <span className="mt-2 text-sm">ECR</span>
                          </div>
                      </div>
                      <DialogFooter className="w-full flex justify-end">
                          <Button onClick={handlePushImage} disabled={!selectedRegistryType}>Push Image</Button>
                      </DialogFooter>
                  </DialogContent>
              </Dialog>

              {showDeployK8sButton && (
                  <div className="w-full mt-4 text-center">
                      <Button onClick={handleDeployToKubernetes} className="px-8 py-2">
                          Deploy to Kubernetes
                      </Button>
                  </div>
              )}

              <footer className="mt-8 text-center text-muted-foreground text-sm">
                Powered by DeployerAI
              </footer>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
