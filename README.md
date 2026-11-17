🛒 GroceryOS: Network Checker & AI Chatbot Builder

An enterprise-grade, full-stack platform featuring a high-performance Network Checker (bulk processing) and a visual drag-and-drop AI Chatbot Builder (similar to n8n/Flowise) built on node-based workflows.

🚀 Key Features
1. AI Chatbot Builder (Visual Workflow)
Drag and Drop Interface: Built with React Flow for a seamless node-based experience.
Multi-Connection Agent: Connect LLMs (Gemini, OpenAI, Mistral), Tools, and Memory directly to the Agent.
Live Testing: Test workflows directly in the builder using an integrated Chat Widget.
Webhook Integration: Trigger bots externally via custom Webhook URLs.
Flow Management: Save, edit, and delete workflows from a centralized "My Chatbots" dashboard.
2. High-Performance Network Checker
Instant Detection: Identifies telecom networks (Jazz, Zong, Telenor, Ufone, Warid) using 4-digit prefixes.
Bulk Excel Processing: Upload millions of numbers via Excel. Uses batch processing (10,000 per batch) to prevent database crashes.
Smart Column Detection: Automatically finds the "Number/Phone/Mobile" column in any Excel sheet.
Redis Caching: Ultra-fast dashboard counts and network lookups.
3. Security & Authentication
JWT Authentication: Secure login system with role-based access control (RBAC).
Guards: Custom JwtAuthGuard, AdminGuard, and ActiveUserGuard for endpoint security.
Rate Limiting Ready: Architected to handle heavy loads safely.
4. DevOps & Scalability
Dockerized: Complete environment (Frontend, Backend, Kafka, Redis) runs via docker-compose.
Nginx Load Balancer: Distributes traffic across 3 backend replicas (Round Robin algorithm).
Apache Kafka: Event-driven architecture for asynchronous background processing.
🛠️ Tech Stack
Layer	Technology
Frontend	React.js, Tailwind CSS, React Flow (Node-based UI)
Backend	NestJS, Node.js, TypeScript
Database	MongoDB (Mongoose)
Caching & Messaging	Redis, Apache Kafka
DevOps	Docker, Docker Compose, Nginx (Load Balancer)
AI Integration	LangChain concepts, OpenAI, Gemini, Mistral APIs
🏗️ System Architecture
text
[ React Frontend ]
       ⬇
[ Nginx Load Balancer ] (Port 3000)
       ⬇
[ 3x NestJS Backend Containers ] ⬅➡ [ Redis Cache ]
       ⬇                                     ⬇
[ MongoDB Database ]                   [ Apache Kafka ]
⚙️ Getting Started



The app will be available at http://localhost:3000.

📄 License

This project is licensed under the MIT License.
