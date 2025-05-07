// src/app/api/push/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function POST(request: NextRequest) {
    try {
        const { imageName, targetRegistry } = await request.json();

        if (!imageName || !targetRegistry) {
            return new NextResponse('Missing imageName or targetRegistry in request body', { status: 400 });
        }

        const fullImageName = `${targetRegistry}/${imageName}:latest`; // Using latest tag, adjust if needed

        console.log(`Attempting to push Docker image: ${fullImageName}`);

        const dockerPushProcess = spawn('docker', ['push', fullImageName], { cwd: process.cwd() });

        let pushStdout = '';
        let pushStderr = '';

        dockerPushProcess.stdout.on('data', (data) => {
            pushStdout += data.toString();
            console.log(`Docker push stdout: ${data}`);
        });

        dockerPushProcess.stderr.on('data', (data) => {
            pushStderr += data.toString();
            console.error(`Docker push stderr: ${data}`);
        });

        const pushExitCode = await new Promise<number>((resolve, reject) => {
            dockerPushProcess.on('close', resolve);
            dockerPushProcess.on('error', reject);
        });

        if (pushExitCode !== 0) {
            console.error(`Docker push failed with code ${pushExitCode}`);
            console.error(`Docker push stderr: ${pushStderr}`);
            return new NextResponse(`Image push failed: ${pushStderr || 'Unknown error'}`, { status: 500 });
        }

        console.log('Docker image pushed successfully.');
        console.log('Docker push output:', pushStdout);

        return new NextResponse('Image pushed successfully.', { status: 200 });

    } catch (error) {
        console.error('Error in push API route:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
