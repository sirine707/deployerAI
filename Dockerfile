# Generated Dockerfile

# Use a base image with Python and Node.js, or install Node.js separately
# Using a base image with both simplifies things if both are needed in the final image
FROM python:3.9-slim

# Install Node.js and npm
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Poetry
RUN pip install poetry

# Copy Python dependency files and install dependencies using Poetry
# Make sure you have run 'poetry install' locally to generate poetry.lock
COPY pyproject.toml poetry.lock ./
RUN poetry install --no-root

# Copy the rest of the application code
COPY . .

# Build the Next.js frontend
RUN npm ci
RUN npm run build

# Expose the port your application runs on (default Next.js port is 3000)
EXPOSE 3000

# Command to run the application
# This NEEDS to be replaced with the actual command to start BOTH your Next.js frontend
# and your Python application (if it runs as a separate process).
# If your Python code is triggered by the Next.js app (e.g., via API calls),
# the CMD should likely just start the Next.js production server.
# If your Python script is the main entry point, you might use something like:
# CMD ["poetry", "run", "python", "src/ai/agents/agent_orchestrator.py"]
# Example to start Next.js production server:
# CMD ["npm", "start"]

CMD ["echo", "Replace this CMD with your actual application start command(s)"]
