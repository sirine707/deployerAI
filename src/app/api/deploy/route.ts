
import { spawn } from 'child_process';
import path from 'path';
import * as fs from 'fs/promises'; // Import fs.promises for async file operations

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return new Response('No code provided', { status: 400 });
    }

    console.log(`Attempting to spawn Python orchestrator: python3 -m src.ai.agents.agent_orchestrator`);

    const pythonProcess = spawn('python3', ['-m', 'src.ai.agents.agent_orchestrator', code], { cwd: process.cwd() });

    let pythonStdout = '';
    let pythonStderr = '';

    pythonProcess.stdout.on('data', (data) => {
      pythonStdout += data.toString();
      console.log(`Python stdout: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
      pythonStderr += data.toString();
      console.error(`Python stderr: ${data}`);
    });

    const pythonExitCode = await new Promise<number>((resolve, reject) => {
      pythonProcess.on('close', resolve);
      pythonProcess.on('error', reject);
    });

    if (pythonExitCode !== 0) {
      console.error(`Python script exited with code ${pythonExitCode}`);
      console.error(`Stderr: ${pythonStderr}`);
      return new Response(`Deployment failed during orchestration: ${pythonStderr || 'Unknown error'}`, { status: 500 });
    }

    console.log('Python script finished successfully.');

    let orchestratorResult;
    try {
      orchestratorResult = JSON.parse(pythonStdout);
      console.log('Successfully parsed JSON from Python script.');
    } catch (parseError) {
      console.error('Failed to parse JSON from Python script output:', parseError);
      console.error('Python stdout was:', pythonStdout);
      return new Response('Failed to process Python script output', { status: 500 });
    }

    const dockerfileContent = orchestratorResult?.dockerfile;

    if (!dockerfileContent) {
        console.error('No dockerfile content received from orchestrator.');
        return new Response('Deployment failed: No Dockerfile generated.', { status: 500 });
    }

    console.log('Dockerfile content received. Attempting to write Dockerfile...');

    // Step 4: Save the generated Dockerfile using Node.js fs
    const dockerfilePath = path.join(process.cwd(), 'Dockerfile');
    try {
        await fs.writeFile(dockerfilePath, dockerfileContent);
        console.log(`Dockerfile saved successfully to ${dockerfilePath}`);
    } catch (writeError) {
        console.error('Failed to write Dockerfile:', writeError);
        return new Response('Deployment failed: Could not save Dockerfile.', { status: 500 });
    }

    console.log('Dockerfile saved successfully. Attempting to build Docker image...');

    // Step 5: Build the Docker image using Node.js child_process
    const buildCommand = 'docker build -t my-app .'; // Using a placeholder tag and building from current directory
    console.log(`Running command: ${buildCommand}`);

    const dockerBuildProcess = spawn('docker', ['build', '-t', 'my-app', '.'], { cwd: process.cwd() });

    let buildStdout = '';
    let buildStderr = '';

    dockerBuildProcess.stdout.on('data', (data) => {
        buildStdout += data.toString();
        console.log(`Docker build stdout: ${data}`);
    });

    dockerBuildProcess.stderr.on('data', (data) => {
        buildStderr += data.toString();
        console.error(`Docker build stderr: ${data}`);
    });

    const buildExitCode = await new Promise<number>((resolve, reject) => {
        dockerBuildProcess.on('close', resolve);
        dockerBuildProcess.on('error', reject); // Handle errors starting the process
    });

    if (buildExitCode !== 0) {
        console.error(`Docker build failed with code ${buildExitCode}`);
        console.error(`Docker build stderr: ${buildStderr}`);
        return new Response(`Deployment failed during Docker build: ${buildStderr || 'Unknown error'}`, { status: 500 });
    }

    console.log('Docker image built successfully.');
    console.log('Docker build output:', buildStdout);

    // Step 6: Optionally add steps for pushing and deploying the Docker image
    // For now, just return a success response after the build.

    return new Response('Deployment successful (Dockerfile generated and image built).', { status: 200 });

  } catch (error) {
    console.error('Error in deploy API route:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
