# Code Weaver

Code Weaver is an AI-powered code editor built with Next.js. It provides a simple interface for writing and editing code with advanced AI assistance and seamless integration for deployment.

## Features

*   **AI Coding Assistance:** Leverages advanced AI models (unified with Gemini in Firebase and enhanced for task-specific model selection) to provide intelligent code completion and suggestions.
*   **Multimodal Prompting & App Prototyping:** Supports natural language, images, and drawing tools, featuring an App Prototyping agent capable of generating full-stack applications (initially Next.js).
*   **Enhanced Firebase Integration:** Deep integration with Firebase services, including publishing web apps to Firebase App Hosting and building AI flows/RAG with Genkit.
*   **Integration with Docker and Container Registries:** Supports deployment to various container registries (Docker Hub, GCR, ECR).
*   **Improved Performance:** Optimized for faster load and build times.
*   **More Customization Options:** Provides enhanced customization for the development environment.
*   Code Editor with syntax highlighting.

## Technologies

*   Next.js
*   React
*   TypeScript
*   shadcn/ui (for UI components)
*   react-icons (for icons)
*   Python (for the backend AI agents)
*   Docker
*   Firebase
*   Genkit
*   Gemini API

## Getting Started

To get a local copy up and running, follow these steps:

1.  Clone the repository:
    ```bash
    git clone <repository_url>
    ```
2.  Navigate to the project directory:
    ```bash
    cd deployerAI
    ```
3.  Install frontend dependencies:
    ```bash
    npm install
    ```
4.  Install backend dependencies (assuming you have Python and Poetry installed):
    ```bash
    cd backend
    poetry install
    cd ..
    ```
5.  Build the Next.js application:
    ```bash
    npm run build
    ```
6.  Start the development server:
    ```bash
    npm start
    ```

Open your browser to `http://localhost:3000` to see the application.

## CI/CD Pipeline

This project is configured with a CI/CD pipeline to automate the build, test, and deployment process. (Details of the pipeline configuration can be found in the CI/CD configuration files, e.g., `.github/workflows/...`)
