# 📝 IterAgent Chat Logging System

## 🎯 Overview

The IterAgent Chat Logging System allows your apps to send chat messages from Cursor AI agents to IterAgent for storage, analysis, and insights. This enables IterBot to learn from your development conversations and provide better suggestions.

## 🚀 Quick Start

### 1. Install IterAgent
```bash
npm install -g iteragent-cli@1.0.4
```

### 2. Start IterAgent API Server
```bash
# Start IterAgent with API server
iteragent run --api-server

# Or start API server separately
iteragent api-server --port 3001
```

### 3. Use in Your App
```javascript
import { IterAgentClient } from 'iteragent-cli';

const client = new IterAgentClient('http://localhost:3001');

// Log a Cursor AI question
await client.logMessage({
  message: 'How do I implement authentication in my React app?',
  source: 'cursor-ai',
  type: 'question',
  metadata: {
    projectId: 'my-react-app',
    filePath: 'src/components/Auth.js',
    language: 'javascript'
  }
});
```

## 📡 API Endpoints

### **POST /api/chat/log**
Log a chat message to IterAgent.

**Request Body:**
```json
{
  "message": "How do I implement authentication?",
  "source": "cursor-ai",
  "type": "question",
  "metadata": {
    "projectId": "my-app",
    "filePath": "src/auth.js",
    "language": "javascript",
    "userId": "user123",
    "sessionId": "session456"
  }
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "chat_1234567890_abc123def",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **GET /api/chat/messages**
Retrieve chat messages with optional filtering.

**Query Parameters:**
- `source`: Filter by source (cursor-ai, user, system, iterbot)
- `type`: Filter by type (question, answer, command, error, suggestion, feedback)
- `sentiment`: Filter by sentiment (positive, negative, neutral)
- `intent`: Filter by intent (question, request, complaint, praise, bug-report, feature-request)
- `topics`: Comma-separated list of topics
- `limit`: Maximum number of messages to return

**Example:**
```bash
GET /api/chat/messages?source=cursor-ai&type=question&limit=50
```

### **GET /api/chat/insights**
Get analytics and insights from all chat messages.

**Response:**
```json
{
  "success": true,
  "insights": {
    "totalMessages": 150,
    "averageResponseTime": 2500,
    "commonTopics": [
      {"topic": "javascript", "count": 45},
      {"topic": "react", "count": 32},
      {"topic": "authentication", "count": 28}
    ],
    "frequentErrors": [
      {"error": "Cannot read property of undefined", "count": 12},
      {"error": "Module not found", "count": 8}
    ],
    "userSatisfaction": 85.5,
    "improvementSuggestions": [
      "Improve documentation for authentication",
      "Add more examples for React components"
    ],
    "patterns": [
      {"pattern": "question-pattern", "frequency": 120},
      {"pattern": "error-related", "frequency": 45}
    ]
  }
}
```

### **GET /api/chat/stats**
Get comprehensive statistics about chat messages.

### **GET /api/chat/search**
Search chat messages by content.

**Query Parameters:**
- `q`: Search query (required)
- `source`: Filter by source
- `type`: Filter by type
- `limit`: Maximum results

### **GET /api/chat/export**
Export chat data in JSON or CSV format.

**Query Parameters:**
- `format`: Export format (json, csv)
- `source`: Filter by source
- `type`: Filter by type

### **POST /api/chat/cleanup**
Clean up old chat messages based on retention policy.

## 🔧 Client Libraries

### **JavaScript/TypeScript**
```javascript
import { IterAgentClient, logCursorQuestion, logCursorAnswer } from 'iteragent-cli';

const client = new IterAgentClient('http://localhost:3001');

// Log a question
await logCursorQuestion(
  'How do I implement JWT authentication?',
  { projectId: 'my-app', language: 'javascript' }
);

// Log an answer
await logCursorAnswer(
  'You can use jsonwebtoken library...',
  { projectId: 'my-app', confidence: 0.9 }
);
```

### **React Hook**
```jsx
import { useIterAgent } from 'iteragent-cli';

function MyComponent() {
  const { logMessage, getInsights } = useIterAgent('http://localhost:3001');

  const handleCursorQuestion = async (question) => {
    await logMessage({
      message: question,
      source: 'cursor-ai',
      type: 'question',
      metadata: { projectId: 'my-react-app' }
    });
  };

  return (
    <div>
      <button onClick={() => handleCursorQuestion('How do I use hooks?')}>
        Ask Cursor AI
      </button>
    </div>
  );
}
```

### **Vue Composable**
```vue
<template>
  <div>
    <button @click="askCursorAI">Ask Cursor AI</button>
  </div>
</template>

<script setup>
import { useIterAgentVue } from 'iteragent-cli';

const { logMessage } = useIterAgentVue('http://localhost:3001');

const askCursorAI = async () => {
  await logMessage({
    message: 'How do I use Vue composables?',
    source: 'cursor-ai',
    type: 'question',
    metadata: { projectId: 'my-vue-app' }
  });
};
</script>
```

### **Express Middleware**
```javascript
import express from 'express';
import { iterAgentMiddleware } from 'iteragent-cli';

const app = express();
app.use(iterAgentMiddleware('http://localhost:3001'));

app.post('/cursor-chat', async (req, res) => {
  const { message, type } = req.body;
  
  await req.iterAgent.logMessage({
    message,
    source: 'cursor-ai',
    type,
    metadata: { projectId: 'my-app' }
  });
  
  res.json({ success: true });
});
```

## 🧠 Message Analysis Features

### **Sentiment Analysis**
Automatically detects positive, negative, or neutral sentiment in messages.

### **Intent Detection**
Identifies the intent behind messages:
- `question`: Asking for help or information
- `request`: Making a request or asking for action
- `complaint`: Expressing dissatisfaction
- `praise`: Positive feedback
- `bug-report`: Reporting issues or bugs
- `feature-request`: Requesting new features

### **Topic Extraction**
Automatically extracts relevant topics from messages:
- `javascript`, `typescript`, `react`, `vue`, `angular`
- `python`, `nodejs`, `database`, `api`
- `testing`, `deployment`, `performance`, `security`
- `mobile`, `trading`, `ui`, `backend`

### **Complexity Analysis**
Analyzes message complexity:
- `simple`: Short, straightforward messages
- `moderate`: Medium complexity
- `complex`: Long, detailed messages

### **Urgency Detection**
Detects urgency level:
- `low`: General questions
- `medium`: Important but not urgent
- `high`: Important and urgent
- `critical`: Emergency or blocking issues

## 📊 Analytics and Insights

### **Common Topics**
Track which topics are discussed most frequently.

### **Frequent Errors**
Identify recurring error patterns and issues.

### **User Satisfaction**
Calculate satisfaction based on sentiment analysis.

### **Improvement Suggestions**
Generate suggestions for better user experience.

### **Pattern Detection**
Identify common patterns in conversations.

## 🔒 Security Features

### **Rate Limiting**
- 100 requests per 15 minutes per IP
- Configurable limits

### **CORS Support**
- Configurable CORS policies
- Credential support

### **Request Size Limits**
- 10MB maximum request size
- Configurable limits

## ⚙️ Configuration

### **API Server Configuration**
```javascript
const server = new IterAgentAPIServer({
  port: 3001,
  enableCORS: true,
  enableLogging: true,
  maxRequestSize: '10mb',
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // requests per window
  }
});
```

### **Chat Log Configuration**
```javascript
const chatLogManager = new ChatLogManager({
  storagePath: '.iteragent/chat-logs',
  maxMessages: 10000,
  enableAnalysis: true,
  enableInsights: true,
  analysisInterval: 300000, // 5 minutes
  retentionDays: 30,
  enableRealTimeAnalysis: true
});
```

## 🎯 Use Cases

### **1. Cursor AI Integration**
Log all Cursor AI conversations to improve IterBot suggestions.

### **2. Development Analytics**
Track common questions and issues in your development process.

### **3. Team Insights**
Understand team communication patterns and knowledge gaps.

### **4. Documentation Improvement**
Identify areas where documentation needs improvement.

### **5. Error Tracking**
Track and analyze recurring development errors.

## 🚀 Getting Started with Your App

### **Step 1: Install IterAgent**
```bash
npm install -g iteragent-cli@1.0.4
```

### **Step 2: Start API Server**
```bash
iteragent api-server --port 3001
```

### **Step 3: Integrate Client**
```bash
npm install iteragent-cli
```

### **Step 4: Log Messages**
```javascript
import { IterAgentClient } from 'iteragent-cli';

const client = new IterAgentClient('http://localhost:3001');

// Log Cursor AI interactions
await client.logMessage({
  message: 'How do I implement authentication?',
  source: 'cursor-ai',
  type: 'question',
  metadata: {
    projectId: 'my-app',
    filePath: 'src/auth.js',
    language: 'javascript'
  }
});
```

### **Step 5: Get Insights**
```javascript
const insights = await client.getInsights();
console.log('Common topics:', insights.commonTopics);
console.log('User satisfaction:', insights.userSatisfaction);
```

## 🔄 IterBot Enhancement

IterBot uses the logged chat messages to:

1. **Learn Common Patterns**: Understand frequently asked questions
2. **Improve Suggestions**: Provide better recommendations based on past conversations
3. **Identify Knowledge Gaps**: Find areas where documentation is lacking
4. **Track Error Patterns**: Identify recurring issues and their solutions
5. **Enhance Context**: Better understand project-specific needs

## 📈 Success Metrics

Track these metrics to measure the effectiveness of chat logging:

- **Message Volume**: Number of messages logged
- **Response Quality**: Sentiment analysis of responses
- **Topic Coverage**: Diversity of topics discussed
- **Error Resolution**: Success rate of error resolution
- **User Satisfaction**: Overall satisfaction scores

## 🛠️ Troubleshooting

### **API Server Not Starting**
```bash
# Check if port is available
lsof -i :3001

# Try different port
iteragent api-server --port 3002
```

### **Client Connection Issues**
```javascript
// Check if API is healthy
const isHealthy = await client.isHealthy();
console.log('API Health:', isHealthy);
```

### **Message Analysis Not Working**
```javascript
// Check if analysis is enabled
const config = chatLogManager.getConfig();
console.log('Analysis enabled:', config.enableAnalysis);
```

---

**IterAgent Chat Logging System transforms your development conversations into actionable insights! 🚀**
