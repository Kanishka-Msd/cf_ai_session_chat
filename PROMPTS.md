# PROMPTS.md

This file contains a record of the prompts used to generate the code in this repository using AI‑assisted tools.  Keeping a log of prompts helps provide transparency and reproducibility when incorporating AI into development workflows.

1. **Worker creation:**
   
   > *“Create a Cloudflare Worker in TypeScript, using the Modules syntax, that calls Workers AI with the model `@cf/meta/llama‑3.3‑8b‑instruct`.  It should accept a JSON body with a `message` string, retrieve the last few turns of conversation from a Durable Object, assemble a prompt including a summary and the recent turns, call the model, and return the model’s reply as JSON.  Make sure to handle CORS and basic error cases.”*

2. **Durable Object implementation:**
   
   > *“Write a Durable Object class in TypeScript that persists an array of chat turns and a summary string.  Implement routes to append new turns, retrieve the history and summary, write a new summary, and clear the history.  Use JSON for request and response bodies.”*

3. **Workflow summarisation:**
   
   > *“Create a Cloudflare Workflow script that loads the latest chat history and existing summary from a Durable Object, then uses Workers AI to generate a concise rolling summary.  It should write the new summary back into the Durable Object.  Assume the workflow is executed periodically by a Cron trigger or manually.”*

4. **Pages UI:**
   
   > *“Produce a minimal HTML, CSS and JavaScript chat interface suitable for Cloudflare Pages.  It should collect user input, send it to a Worker endpoint via fetch, and render both user and assistant messages.  Include basic styling and a hint about the session being stored in a Durable Object.”*

5. **Wrangler configuration and scripts:**
   
   > *“Show a `wrangler.toml` file with an AI binding, a Durable Object binding and migration, and a Workflow binding.  Provide npm scripts in `package.json` for local development, deployment, and workflow execution.  Include a TypeScript configuration file with strict options.”*

6. **README composition:**

   > *“Write a detailed README for the project.  Explain how the application meets the assignment requirements, provide step‑by‑step deployment instructions, describe the API endpoints, and include a submission checklist.”*
