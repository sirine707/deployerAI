# src/ai/agents/agent_orchestrator.py

# This file will orchestrate the chain of agents using Langgraph or Langchain.
# It will define the workflow:
# 1. Receive initial input (code content).
# 2. Pass code to CodeCheckerAgent.
# 3. If code is valid, pass code to DockerfileGeneratorAgent.
# 4. If Dockerfile is generated successfully, pass Dockerfile to DockerfileVerifierAgent.
# 5. Return the final result (success/failure and any relevant outputs).

# It will also need to handle potential errors or failures at each step.

import sys
import json
import os

# Add the project root to sys.path to allow absolute imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..', '..'))

from src.ai.agents.code_checker import CodeCheckerAgent
from src.ai.agents.dockerfile_generator import DockerfileGeneratorAgent
from src.ai.agents.dockerfile_verifier import DockerfileVerifierAgent

class AgentOrchestrator:
    def __init__(self):
        self.code_checker = CodeCheckerAgent()
        self.dockerfile_generator = DockerfileGeneratorAgent()
        self.dockerfile_verifier = DockerfileVerifierAgent()
        # Initialize Langgraph or Langchain chain here
        pass

    def run_deployment_chain(self, code: str) -> dict:
        print("AgentOrchestrator: Starting deployment chain...", file=sys.stderr)

        # Step 1: Code Checking
        print("Orchestrator: Running code checker...", file=sys.stderr)
        # In a real application, you might send progress updates here.
        check_result = self.code_checker.run(code)
        if check_result.get("status") == "failed":
            print(f"Orchestrator: Code checking failed - {check_result.get('message')}", file=sys.stderr)
            return {"status": "failed", "step": "code_checking", "message": check_result.get("message")}
        print("Orchestrator: Code checking succeeded.", file=sys.stderr)

        # Step 2: Dockerfile Generation
        print("Orchestrator: Running Dockerfile generator...", file=sys.stderr)
        # Send progress update
        generate_result = self.dockerfile_generator.run(code)
        if generate_result.get("status") == "failed":
            print(f"Orchestrator: Dockerfile generation failed - {generate_result.get('message')}", file=sys.stderr)
            return {"status": "failed", "step": "dockerfile_generation", "message": generate_result.get("message")}
        print("Orchestrator: Dockerfile generation succeeded.", file=sys.stderr)
        dockerfile_content = generate_result.get("dockerfile")

        # Step 3: Dockerfile Verification
        print("Orchestrator: Running Dockerfile verifier...", file=sys.stderr)
        # Send progress update
        verify_result = self.dockerfile_verifier.run(dockerfile_content)
        if verify_result.get("status") == "failed":
            print(f"Orchestrator: Dockerfile verification failed - {verify_result.get('message')}", file=sys.stderr)
            return {"status": "failed", "step": "dockerfile_verification", "message": verify_result.get("message")}
        print("Orchestrator: Dockerfile verification succeeded.", file=sys.stderr)

        print("AgentOrchestrator: Deployment chain completed successfully.", file=sys.stderr)
        return {"status": "success", "message": "Deployment process completed.", "dockerfile": dockerfile_content}

# This block allows the script to be run directly from the command line
if __name__ == "__main__":
    # Expecting code content as a command-line argument
    if len(sys.argv) > 1:
        code_to_process = sys.argv[1]
        orchestrator = AgentOrchestrator()
        final_result = orchestrator.run_deployment_chain(code_to_process)
        # Print the result as a JSON string to standard output
        print(json.dumps(final_result))
    else:
        print(json.dumps({"status": "failed", "message": "No code provided via command line argument."}))
        sys.exit(1)
