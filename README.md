# 🧠 CODE - Cognitive Dissonance Engine

> **The world's first adversarial AI sparring partner** - Challenge your ideas, strengthen your arguments, and break creative blocks through intellectual friction.

[![Electron](https://img.shields.io/badge/Electron-30.0.0-blue.svg)](https://electronjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](https://github.com/yourusername/code/releases)

## 🎯 What is CODE?

CODE is an **offline-first, AI-powered desktop application** that serves as your intellectual sparring partner. Unlike traditional AI assistants that help you, CODE challenges you - exposing logical fallacies, questioning assumptions, and pushing your thinking to new levels.

**Perfect for:**
- 🚀 **Startup founders** validating business ideas
- 📚 **Researchers** strengthening academic arguments  
- 🎨 **Creatives** breaking through creative blocks
- 💼 **Professionals** stress-testing strategies
- 🧠 **Thinkers** developing critical reasoning

## ✨ Key Features

### 🎭 **Adversarial Personas**
- **The Logician**: Exposes logical fallacies and reasoning gaps
- **The Market Cynic**: Attacks market viability and business assumptions
- **The Lateral Thinker**: Upends assumptions with unexpected scenarios
- **The "Five Whys" Toddler**: Forces first-principles thinking

### 🚀 **Advanced Capabilities**
- **Session Templates**: 9 pre-built workflows for common use cases
- **Custom Personas**: Create your own adversarial personalities
- **Performance Analytics**: Track response times and token efficiency
- **Virtual Scrolling**: Handle thousands of sessions efficiently
- **Health Monitoring**: Automatic Ollama connection management

### 💾 **Session Management**
- **Smart Tagging**: Organize sessions by topic and purpose
- **Export Options**: Markdown, PDF, and JSON formats
- **Session Analytics**: Detailed insights into your thinking process
- **Dashboard**: Powerful session browser with search and filtering

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Electron UI   │◄──►│   Main Process  │◄──►│   Ollama API    │
│   (Renderer)    │    │   (IPC Bridge)  │    │   (Local LLM)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React-like    │    │   SQLite DB     │    │   Model Cache   │
│   State Mgmt    │    │   (Sessions)    │    │   (Performance) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ and **npm**
- **Ollama** installed and running locally
- **Supported models**: llama3:8b, gpt-oss-20b, gpt-oss-120b

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/code.git
cd code

# Install dependencies
npm install

# Start the application
npm start

# Build for distribution
npm run build
```

### First Run
1. **Launch CODE** - The app will automatically detect Ollama
2. **Install a model** - Click "Pull Model" if needed
3. **Choose a persona** - Select your adversarial partner
4. **Start sparring** - Paste your idea and get challenged!

## 🎭 Using Session Templates

CODE comes with **9 professional templates** for common use cases:

### 🏢 Business & Strategy
- **Startup Pitch Review**: Market viability analysis
- **Market Analysis**: Competitive landscape critique  
- **Business Plan**: Feasibility and risk assessment

### 🎓 Academic & Research
- **Research Paper**: Methodological rigor review
- **Thesis Defense**: Argument strength testing
- **Hypothesis**: Scientific validity critique

### 🎨 Creative & Design
- **Product Design**: User experience challenges
- **Creative Concept**: Innovation push boundaries
- **UX/UI Critique**: Accessibility and edge cases

## 🔧 Technical Features

### **Performance Optimizations**
- **Virtual Scrolling**: Efficient rendering of large datasets
- **Debounced Search**: Smooth real-time filtering
- **Connection Health**: Proactive Ollama monitoring
- **Automatic Retries**: Resilient error handling

### **User Experience**
- **Toast Notifications**: Professional feedback system
- **Loading States**: Visual progress indicators
- **Keyboard Shortcuts**: Power user navigation
- **Theme Support**: Light/dark mode switching

### **Data Management**
- **SQLite Database**: Local, encrypted session storage
- **Export Formats**: Multiple output options
- **Session Analytics**: Performance and usage insights
- **Backup/Restore**: Data portability

## 📊 Performance Metrics

CODE tracks and displays real-time performance data:

- **Time to First Token (TTFT)**: Response latency
- **Token Generation Speed**: Output efficiency
- **Session Analytics**: Turn counts and message lengths
- **Performance Trends**: Rolling averages and insights

## 🔒 Privacy & Security

- **100% Offline**: No data leaves your machine
- **Local Processing**: All AI inference happens locally
- **Encrypted Storage**: Session data is securely stored
- **No Telemetry**: Zero tracking or analytics collection

## 🛠️ Development

### Project Structure
```
code/
├── main.js              # Main Electron process
├── preload.js           # Secure IPC bridge
├── renderer/            # UI components
│   ├── index.html      # Main interface
│   ├── dashboard.html  # Session management
│   ├── renderer.js     # UI logic
│   ├── dashboard.js    # Dashboard logic
│   └── styles.css      # Styling
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

### Key Technologies
- **Electron**: Cross-platform desktop framework
- **SQLite**: Local database with better-sqlite3
- **Ollama**: Local LLM inference server
- **Vanilla JavaScript**: No framework dependencies

### Building
```bash
# Development
npm run dev

# Production build
npm run build

# Platform-specific builds
npm run build:mac
npm run build:win  
npm run build:linux
```

## 🎯 Hackathon Categories

CODE is designed for the **GPT-OSS Hackathon** and targets:

- 🎭 **Wildcard**: Unique adversarial AI concept
- 🤖 **Best Local Agent**: 100% offline operation
- 🌍 **For Humanity**: Critical thinking development

## 🚀 Future Roadmap

### **Short Term**
- [ ] Advanced model parameter tuning
- [ ] Session branching and comparison
- [ ] Collaborative session sharing (file-based)
- [ ] Enhanced export formats

### **Medium Term**
- [ ] Plugin system for custom personas
- [ ] Advanced analytics and insights
- [ ] Multi-language support
- [ ] Mobile companion app

### **Long Term**
- [ ] Enterprise features and deployment
- [ ] Advanced AI model integration
- [ ] Educational platform expansion
- [ ] Community-driven persona marketplace

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Fork and clone
git clone https://github.com/yourusername/code.git
cd code

# Install dependencies
npm install

# Start development
npm run dev

# Run tests
npm test

# Submit PR
git push origin feature/amazing-feature
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Ollama** for local LLM inference
- **Electron** for cross-platform desktop development
- **GPT-OSS** community for inspiration and support
- **Open source contributors** who made this possible

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/code/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/code/discussions)
- **Documentation**: [Wiki](https://github.com/yourusername/code/wiki)

---

**Made with ❤️ for the GPT-OSS Hackathon**

*Challenge your assumptions. Strengthen your thinking. Break through creative blocks.*
