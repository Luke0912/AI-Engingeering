import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// 1. Initialize the MCP Server
// We give it a name and version. Clients can see this when they connect.
const server = new Server(
  {
    name: "Stock-Market-MCP-Server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {}, // This tells the client "I have tools you can use!"
    },
  }
);

// 2. Define the tools this server exposes
// This is exactly like what we did in Module 3, but now it's standardized!
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "fetch_stock_price",
        description: "Fetches the current stock price for a given ticker symbol.",
        inputSchema: {
          type: "object",
          properties: {
            ticker: {
              type: "string",
              description: "The stock ticker symbol (e.g., AAPL, TSLA, MSFT).",
            },
          },
          required: ["ticker"],
        },
      },
    ],
  };
});

// 3. Define the actual execution logic for the tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "fetch_stock_price") {
    const ticker = String(args?.ticker || "").toUpperCase();
    
    // In a real app, you would call a Finance API here (like AlphaVantage).
    // For this tutorial, we will return dummy data!
    let price = 0;
    if (ticker === "AAPL") price = 150.25;
    else if (ticker === "TSLA") price = 205.10;
    else if (ticker === "MSFT") price = 310.50;
    else price = Math.floor(Math.random() * 500) + 10; // Random price for unknown tickers

    // MCP Tools MUST return an array of "content" objects
    return {
      content: [
        {
          type: "text",
          text: `The current stock price of ${ticker} is $${price.toFixed(2)}`,
        },
      ],
    };
  }

  throw new Error(`Tool not found: ${name}`);
});

// 4. Start the server using STDIO (Standard Input/Output)
// This means the server communicates over terminal pipes, not HTTP!
async function run() {
  console.error("Starting Stock-Market-MCP-Server...");
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("Stock-Market-MCP-Server is running and listening on stdio.");
}

run().catch((error) => {
  console.error("Fatal error starting server:", error);
  process.exit(1);
});
