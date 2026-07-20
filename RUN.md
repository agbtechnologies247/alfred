# How to Run A.L.F.R.E.D.

This project is a monorepo consisting of three main components. To run the full project, you need to start each component in a separate terminal.

## Prerequisites
- **Rust (`cargo`)**: Required for the backend API.
- **Node.js (`npm`)**: Required for the synthetic monitor agent.
- **`pnpm`**: Required for the frontend UI.

---

## Method 1: Using the Start Script (Windows Only)
Simply double-click the `start.bat` file in the root directory. It will automatically open three separate command prompt windows and start all the services simultaneously.

---

## Method 2: Step-by-Step Manual Commands

If you prefer to run them manually or are on macOS/Linux, follow these step-by-step commands. You will need to open **three separate terminals**.

### Step 1: Start the Backend API (Rust)
Open your first terminal, navigate to the root directory (`d:\A.L.F.R.E.D`), and run:
```bash
cd backend
cargo run --bin api-gateway
```
*The API will start listening on `http://127.0.0.1:3000`.*

### Step 2: Start the Synthetic Monitor Agent (Node.js)
Open your **second** terminal, navigate to the root directory, and run:
```bash
cd monitor-agent
npm install
npm start
```
*This agent will start emitting synthetic network traffic to the backend every 5 seconds.*

### Step 3: Start the Frontend UI (React)
Open your **third** terminal, navigate to the root directory, and run:
```bash
cd frontend
pnpm install
pnpm dev
```
*Open your browser to the URL provided in the console (usually `http://localhost:5173`) to view the application.*

---

## Method 3: Model Context Protocol (MCP) Server Setup

A.L.F.R.E.D. includes an **MCP Server** that exposes tools, resources, and playbooks directly to AI clients (e.g., Claude Desktop, Cursor, Gemini IDE extensions) to allow conversational system analysis, simulation, and incident resolution.

### Build the MCP Server
Open a terminal and run:
```bash
cd mcp_server
npm install
npm run build
```

### Stdio Configuration
Add this configuration snippet to your MCP client config file (e.g., `%APPDATA%\Claude\claude_desktop_config.json` for Claude Desktop):

```json
{
  "mcpServers": {
    "alfred-mcp": {
      "command": "node",
      "args": ["d:/A.L.F.R.E.D/mcp_server/dist/index.js"],
      "env": {
        "ALFRED_API_URL": "http://localhost:3000",
        "ALFRED_API_KEY": "sk_test_xxxxx"
      }
    }
  }
}
```

Once loaded, the AI client will have direct access to tools like `get_system_kpis`, `list_incidents`, `simulate_blast_radius`, and `execute_workflow` to orchestrate operations interactively.

