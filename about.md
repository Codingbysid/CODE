# CODE — Cognitive Dissonance Engine

**Version:** 2.0.0 (Feature Complete)  
**Date:** December 2024  
**Status:** Production Ready  
**Category:** GPT-OSS Hackathon Project

## Overview

CODE (Cognitive Dissonance Engine) is an offline-first, desktop "adversarial sparring partner" designed to challenge users' ideas, strengthen their arguments, and break creative blocks by introducing targeted intellectual friction. Unlike traditional AI assistants that aim to help and agree, CODE's goal is to challenge and provoke critical thinking.

This project targets the **Wildcard**, **Best Local Agent**, and **For Humanity** categories in the GPT-OSS Hackathon.

## 🎯 What Makes CODE Special

CODE is more than just another AI chat application. It's a **cognitive training partner** that:

- **Challenges** rather than assists
- **Questions** rather than affirms  
- **Provokes** rather than comforts
- **Strengthens** ideas through intellectual resistance
- **Runs 100% offline** for complete privacy
- **Offers multiple adversarial perspectives** through specialized personas
- **Provides structured counterarguments** via Devil's Advocate mode
- **Manages conversation history** with powerful session tools
- **Exports in multiple formats** for sharing and documentation

## Core Philosophy

We live in an age of digital echo chambers and AI assistants designed for frictionless agreement. This environment stifles true innovation and critical thinking. CODE subverts this paradigm by being an AI-powered "adversarial sparring partner" that:

- **Challenges** rather than assists
- **Questions** rather than affirms  
- **Provokes** rather than comforts
- **Strengthens** ideas through intellectual resistance

## 🚀 Complete Feature Set (Fully Implemented)

### 1. **Local AI Inference Engine**
- **100% Offline Operation**: No internet connection required for core functionality
- **Ollama Integration**: Uses locally installed models via Ollama's HTTP API
- **Model Flexibility**: Supports any Ollama-compatible model (default: `llama3:8b`)
- **Model Management**: Inline model detection with pull functionality
- **Model Presets**: Quick switching between common models (llama3:8b, gpt-oss-20b, gpt-oss-120b)
- **Parameter Tuning**: Configurable temperature and max tokens
- **Privacy First**: Your ideas and AI responses never leave your machine

### 2. **Adversarial Personas & Devil's Advocate Mode**

#### **Four Built-in Personas**
Each persona has been carefully crafted with specific system prompts to provide different types of intellectual challenge:

#### **The Logician** 🔍
- **Focus**: Logical fallacies, unstated assumptions, reasoning gaps
- **Style**: Precise, analytical, grounded in formal logic
- **System Prompt**: "You are The Logician. Identify logical fallacies, unstated assumptions, and reasoning gaps. Be precise and grounded. Challenge, do not agree."
- **Best For**: Academic arguments, research proposals, logical reasoning

#### **The Market Cynic** 💼
- **Focus**: Market viability, competition, distribution, margins, willingness-to-pay
- **Style**: Ruthless, unsentimental, business-focused
- **System Prompt**: "You are The Market Cynic. Provide ruthless market-based criticism: viability, competition, distribution, margins, and willingness-to-pay. Be terse and unsentimental."
- **Best For**: Business ideas, startup concepts, product development

#### **The Lateral Thinker** 🌀
- **Focus**: Unexpected scenarios, contrarian angles, adjacent possibilities
- **Style**: Creative, disruptive, assumption-challenging
- **System Prompt**: "You are The Lateral Thinker. Derail assumptions with unexpected 'What if...?' scenarios, contrarian angles, and adjacent possibilities. Prioritize novelty that forces reconsideration."
- **Best For**: Creative projects, innovative solutions, paradigm shifts

#### **The "Five Whys" Toddler** 🧒
- **Focus**: First principles, iterative questioning, root cause analysis
- **Style**: Relentless, concise, systematically probing
- **System Prompt**: "You are The 'Five Whys' Toddler. Ask iterative whys to push towards first principles. Be relentless yet concise. Prefer numbered sequences of why-questions with brief rationales."
- **Best For**: Problem-solving, strategic planning, fundamental assumptions

#### **Devil's Advocate Mode** 👹
- **One-Click Access**: Instant strongest counterargument
- **Structured Output**: Steelman → Vulnerabilities → Counterevidence → Next Probes
- **Maximum Challenge**: Designed to find the most compelling opposing view
- **Professional Format**: Bullet points and clear sections for easy reading

#### **Custom Personas** 🎭
- **Unlimited Creation**: Build your own adversarial personas
- **Import/Export**: Share persona collections as JSON files
- **Domain-Specific**: Create personas for legal, scientific, creative, or any field
- **Management Interface**: Easy creation, editing, and deletion of custom personas

### 3. **Advanced User Experience Features**

#### **Real-Time Streaming Responses**
- **Token-by-Token Generation**: See AI responses build in real-time
- **Progressive Display**: Responses appear as they're generated, not all at once
- **Performance Metrics**: Time-to-first-token (TTFT) and token count display
- **Auto-Scroll**: Automatically scrolls to show new content
- **Visual Feedback**: Pulsing border animation during generation
- **Fallback Support**: Gracefully degrades to non-streaming if needed

#### **Conversation History & Context**
- **Session Memory**: AI remembers the full conversation context
- **Multi-Turn Dialogues**: Build complex arguments through iterative challenge
- **Context Preservation**: Each persona maintains conversation state
- **Automatic Persistence**: Sessions automatically save to local database
- **Conversation Memory**: Advanced memory management with statistics

#### **Dashboard & Session Management**
- **Session Browser**: View all past sparring sessions with search and filtering
- **Metadata Display**: Persona, model, timestamp, and preview for each session
- **Session Analytics**: Insights into conversation patterns and usage
- **Full History Access**: Click any session to view complete conversation
- **Session Actions**: Save, export, delete, and fork sessions
- **Local SQLite Storage**: Persistent, private session database
- **Virtual Scrolling**: Efficient rendering of large session lists

#### **Export & Sharing**
- **Multiple Formats**: Markdown, PDF, JSON, and HTML export
- **Professional PDFs**: Styled documents with metadata and formatting
- **Session Forking**: Duplicate sessions for branching conversations
- **Batch Operations**: Export multiple sessions at once

### 4. **User Interface & Experience**

#### **Modern UI/UX Features**
- **Dark/Light Theme**: Toggle between themes with system preference detection
- **Responsive Design**: Adapts to different window sizes and screen resolutions
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Onboarding Tour**: Interactive 3-step welcome guide for new users
- **Toast Notifications**: Non-intrusive feedback for all actions
- **Loading States**: Visual feedback during operations
- **Error Handling**: Graceful error messages and recovery

#### **Code & Diff View**
- **Syntax Highlighting**: Prism.js integration with intelligent language detection
- **Language Detection**: Automatically detects JavaScript, Python, JSON, HTML, CSS, SQL, Bash
- **Diff Comparison**: Word-level diff between input and output
- **Toggle Views**: Switch between text, code, and diff modes
- **Professional Formatting**: Clean, readable code blocks

#### **Keyboard Shortcuts & Command Palette**
- **Comprehensive Shortcuts**: 15+ keyboard shortcuts for all major functions
- **Command Palette**: Searchable command interface (⌘+K)
- **Quick Access**: One-key access to personas, export, save, and more
- **Cross-Platform**: Works on Mac (⌘) and Windows/Linux (Ctrl)

### 5. **Technical Architecture**

#### **Electron Application Structure**
```
main.js              - Main process, IPC handlers, Ollama integration
preload.js           - Secure bridge between main and renderer
common.js            - Shared constants and configuration
renderer/
├── index.html       - Main UI (input, personas, output, modals)
├── dashboard.html   - Session management interface
├── renderer.js      - Main UI logic, streaming, and interactions
├── dashboard.js     - Dashboard functionality and session management
├── constants.js     - Renderer-specific constants
└── styles.css       - Comprehensive styling with utility classes
```

#### **Data Flow Architecture**
1. **User Input** → Text area + persona selection + parameters
2. **IPC Request** → Main process via secure preload bridge
3. **Ollama API Call** → Local model with persona-specific system prompt
4. **Streaming Response** → Real-time token delivery to UI with metrics
5. **Session Storage** → Local SQLite database for persistence
6. **Dashboard Access** → Browse, search, and manage past sessions
7. **Export Options** → Multiple format generation (PDF, Markdown, JSON, HTML)

#### **Security & Privacy Features**
- **Context Isolation**: Renderer process cannot access Node.js APIs directly
- **Sandboxed Windows**: Each window operates in isolated context
- **Local-Only Storage**: SQLite database stored in app's user data directory
- **No Network Calls**: Except to localhost:11434 (Ollama)
- **Input Validation**: All IPC payloads validated and sanitized
- **Error Handling**: Comprehensive error management with user feedback

#### **Performance & Optimization**
- **Streaming Responses**: Real-time token delivery for immediate feedback
- **Response Caching**: Avoid duplicate API calls for identical inputs
- **Virtual Scrolling**: Efficient rendering of large session lists
- **Memory Management**: Proper cleanup and resource management
- **Native Module Optimization**: Electron-rebuilt for compatibility
- **Database Optimization**: Efficient SQLite queries and indexing

## User Workflow

### **Starting a Session**
1. Launch the app (`npm start`)
2. Ensure Ollama is running (`brew services start ollama`)
3. Select your preferred adversarial persona
4. Optionally change the local model (default: `llama3:8b`)

### **Engaging with CODE**
1. **Input Your Idea**: Paste or type your concept, argument, or text
2. **Choose Your Challenger**: Select from the four personas
3. **Generate Response**: Click Generate or use Cmd/Ctrl + Enter
4. **Watch the Challenge**: See the adversarial response build in real-time
5. **Iterate**: Use the response to refine your thinking
6. **Continue**: Build a multi-turn dialogue with your chosen persona

### **Managing Sessions**
1. **Save Current Session**: Click "New Session" to save and start fresh
2. **Access Dashboard**: Click "Dashboard" button in header
3. **Browse History**: View all past sessions with metadata
4. **Review Conversations**: Click any session to see full dialogue
5. **Start New**: Begin fresh challenges with different personas

## Technical Requirements

### **System Requirements**
- **OS**: macOS 10.15+, Windows 10+, or Linux (Ubuntu 18.04+)
- **Node.js**: 18.0.0 or higher
- **RAM**: 8GB minimum, 16GB recommended for larger models
- **Storage**: 5GB+ for models and session database

### **Dependencies**
- **Electron**: 30.0.0+ (cross-platform desktop framework)
- **Ollama**: 0.11.4+ (local LLM server)
- **better-sqlite3**: Local database for session persistence
- **Native Modules**: Electron-rebuilt for compatibility

### **Installation & Setup**
```bash
# Clone and install
git clone <repository>
cd cognitive-dissonance-engine
npm install

# Start Ollama service
brew services start ollama

# Pull default model
ollama pull llama3:8b

# Launch app
npm start
```

## Advanced Features

### **Model Management**
- **Custom Models**: Use any Ollama-compatible model
- **Model Switching**: Change models without restarting
- **Performance Tuning**: Adjust for your hardware capabilities
- **Fallback Support**: Graceful degradation if model unavailable

### **Session Export & Management**
- **Local Database**: SQLite storage in user data directory
- **Session Metadata**: Persona, model, timestamp tracking
- **Conversation History**: Full multi-turn dialogue preservation
- **Dashboard Interface**: Intuitive session browsing

### **Complete Keyboard Shortcuts**
- **⌘+Enter**: Generate response
- **⌘+Shift+Enter**: Devil's Advocate mode
- **⌘+1-4**: Switch between personas (Logician, Market Cynic, Lateral Thinker, Five Whys)
- **⌘+K**: Open command palette
- **⌘+C**: Copy current response
- **⌘+M**: Toggle code view
- **⌘+F**: Focus input field
- **⌘+P**: Manage personas
- **⌘+G**: Toggle diff view
- **⌘+S**: Save session
- **⌘+E**: Export session (Markdown)
- **⌘+D**: Open dashboard
- **⌘+T**: Toggle theme
- **⌘+N**: New session
- **Esc**: Clear session or cancel generation
- **Arrow Keys**: Navigate between personas

## Design Principles

### **Offline-First Architecture**
- **No Internet Dependency**: Core functionality works without connection
- **Local Data Storage**: All sessions stored on your machine
- **Privacy Preservation**: No data transmitted to external services
- **Reliability**: Works in any network environment

### **Minimalist User Interface**
- **Single-View Design**: No complex navigation or menus
- **Focus on Content**: Clean, distraction-free interface
- **Consistent Theming**: Dark mode with high contrast
- **Responsive Layout**: Adapts to different window sizes

### **Performance Optimization**
- **Streaming Responses**: Real-time token delivery
- **Efficient Database**: SQLite with optimized queries
- **Memory Management**: Proper cleanup of resources
- **Native Module Optimization**: Electron-rebuilt for compatibility

## Hackathon Success Criteria Alignment

### **Wildcard Category** 🎯
- **Unique Concept**: First "adversarial AI partner" in hackathon
- **Innovative Approach**: Challenges rather than assists
- **Creative Implementation**: Four distinct intellectual personas
- **Novel User Experience**: Real-time adversarial dialogue

### **Best Local Agent** 🏠
- **100% Local Operation**: No cloud dependencies
- **Ollama Integration**: Industry-standard local LLM framework
- **Offline Capability**: Full functionality without internet
- **Privacy Focus**: No data leaves user's machine

### **For Humanity** 🌍
- **Critical Thinking**: Promotes intellectual rigor
- **Innovation Support**: Strengthens ideas through challenge
- **Educational Value**: Teaches logical reasoning
- **Creative Development**: Breaks through creative blocks

## 🎯 Use Cases & Applications

### **Business & Entrepreneurship**
- **Startup Pitch Validation**: Test your pitch against market cynicism
- **Business Plan Critique**: Identify weaknesses before investors do
- **Strategic Decision Testing**: Challenge assumptions in business strategy
- **Product Development**: Get adversarial feedback on new features

### **Academic & Research**
- **Research Paper Review**: Strengthen arguments before publication
- **Thesis Defense Preparation**: Practice defending your research
- **Hypothesis Testing**: Challenge your assumptions rigorously
- **Grant Proposal Review**: Identify potential weaknesses early

### **Creative & Design**
- **Product Design Critique**: Find usability and design flaws
- **Creative Concept Validation**: Test creative ideas against reality
- **Content Creation**: Challenge your writing and storytelling
- **UX/UI Design**: Get critical feedback on user experience

### **Personal Development**
- **Critical Thinking Practice**: Develop stronger reasoning skills
- **Decision Making**: Test important decisions from multiple angles
- **Problem Solving**: Break through mental blocks and assumptions
- **Learning & Education**: Challenge your understanding of complex topics

## 🚀 Future Roadmap

### **Already Implemented (v2.0)**
- ✅ **Export Functionality**: Markdown, PDF, JSON, HTML export
- ✅ **Custom Personas**: User-defined adversarial styles with import/export
- ✅ **Model Profiles**: Temperature, max tokens configuration
- ✅ **Session Management**: Advanced dashboard with search and analytics
- ✅ **UI/UX Polish**: Onboarding, themes, keyboard shortcuts, accessibility
- ✅ **Advanced Features**: Code highlighting, diff view, command palette

### **Short Term (v2.1)**
- **Session Templates**: Pre-configured templates for common use cases
- **Advanced Analytics**: Deeper insights into conversation patterns
- **Plugin System**: Extensible architecture for custom features
- **Performance Monitoring**: Detailed metrics and optimization

### **Medium Term (v3.0)**
- **Collaborative Mode**: Multi-user sparring sessions
- **Integration APIs**: Connect with other productivity tools
- **Mobile Companion**: iOS/Android app for on-the-go challenges
- **Team Features**: Shared personas and session libraries

### **Long Term (v4.0)**
- **Cloud Sync Option**: Optional cloud backup and sync
- **Enterprise Features**: Team collaboration and admin tools
- **AI Training**: Persona optimization through usage patterns
- **Research Platform**: Academic study of adversarial AI effectiveness

## Troubleshooting

### **Common Issues**

#### **App Won't Launch**
- **Solution**: Ensure `npm install` completed successfully
- **Check**: Node.js version compatibility (18+ required)
- **Fix**: Run `npx electron-rebuild` if native module errors occur

#### **Ollama Connection Failed**
- **Solution**: Start Ollama service (`brew services start ollama`)
- **Check**: Port 11434 availability
- **Verify**: `curl http://127.0.0.1:11434/api/version`

#### **Model Not Found**
- **Solution**: Pull the requested model (`ollama pull llama3:8b`)
- **Check**: Model name spelling in UI
- **Alternative**: Use a different available model

#### **Database Errors**
- **Solution**: App gracefully degrades if SQLite unavailable
- **Check**: User data directory permissions
- **Fallback**: Sessions stored in memory only

### **Performance Optimization**
- **Streaming**: Enable for real-time experience
- **Model Selection**: Choose appropriate model for your hardware
- **Session Management**: Clear old sessions if database grows large
- **Memory Usage**: Monitor Electron process memory consumption

## Contributing & Development

### **Development Setup**
```bash
# Install dependencies
npm install

# Start development mode
npm run dev

# Build for distribution
npm run build

# Run tests (when implemented)
npm test
```

### **Code Structure**
- **Main Process**: Database, IPC, Ollama integration
- **Renderer Process**: UI logic, streaming, session management
- **Preload Bridge**: Secure API exposure
- **Database Layer**: SQLite operations and session persistence

### **Architecture Decisions**
- **Electron**: Cross-platform compatibility and native integration
- **SQLite**: Lightweight, reliable local storage
- **Ollama**: Industry-standard local LLM framework
- **Streaming**: Real-time user experience enhancement

## 🏆 Success Metrics & Impact

### **Hackathon Criteria Alignment**

#### **Wildcard Category** 🎯
- **Unique Concept**: First "adversarial AI partner" in hackathon
- **Innovative Approach**: Challenges rather than assists
- **Creative Implementation**: Four distinct intellectual personas + Devil's Advocate
- **Novel User Experience**: Real-time adversarial dialogue with streaming

#### **Best Local Agent** 🏠
- **100% Local Operation**: No cloud dependencies
- **Ollama Integration**: Industry-standard local LLM framework
- **Offline Capability**: Full functionality without internet
- **Privacy Focus**: No data leaves user's machine

#### **For Humanity** 🌍
- **Critical Thinking**: Promotes intellectual rigor and reasoning
- **Innovation Support**: Strengthens ideas through challenge
- **Educational Value**: Teaches logical reasoning and argumentation
- **Creative Development**: Breaks through creative blocks and assumptions

### **Technical Excellence**
- **Professional Code Quality**: Clean, maintainable, well-documented code
- **Modern Architecture**: Electron + SQLite + Ollama integration
- **Performance Optimized**: Streaming responses, caching, virtual scrolling
- **User Experience**: Onboarding, themes, accessibility, keyboard shortcuts
- **Feature Complete**: All MVP + stretch goals implemented

## 🎉 Conclusion

CODE represents a fundamental shift in how we interact with AI systems. By embracing the role of an adversarial partner rather than a helpful assistant, it creates a unique environment for intellectual growth and creative development.

The application successfully demonstrates:
- **Offline-first architecture** with local AI inference and complete privacy
- **Four distinct adversarial personas** plus Devil's Advocate mode for comprehensive challenge
- **Real-time streaming responses** with performance metrics for engaging user experience
- **Advanced session management** with search, export, and analytics
- **Professional-grade UI/UX** with onboarding, themes, and accessibility
- **Comprehensive feature set** including custom personas, code highlighting, and command palette
- **Production-ready application** with robust error handling and optimization

This project not only meets all hackathon criteria but also introduces a novel paradigm for AI-human interaction that could fundamentally change how we approach critical thinking, creative problem-solving, and intellectual development.

**CODE - Where your ideas meet their toughest critic, and emerge stronger.**

---

**Version**: 2.0.0 (Feature Complete)  
**Architecture**: Offline-first, privacy-focused, adversarial AI  
**Philosophy**: Challenge, don't assist; provoke, don't comfort; strengthen through resistance
