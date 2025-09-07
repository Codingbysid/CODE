# CODE - Cognitive Dissonance Engine

**An offline-first AI adversarial sparring partner for critical thinking and idea challenging**

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/Codingbysid/CODE)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)](https://github.com/Codingbysid/CODE)

## 🎯 What is CODE?

CODE is a desktop application that serves as your **adversarial AI sparring partner**. Unlike traditional AI assistants that aim to help and agree, CODE challenges your ideas, arguments, and creative concepts to help you think more critically and strengthen your reasoning.

### Key Features
- 🤖 **4 Adversarial Personas** + Devil's Advocate mode
- 🎭 **Custom Personas** with import/export
- 🏠 **100% Offline** - No data leaves your machine
- 💾 **Session Management** with dashboard and search
- 📄 **Multiple Export Formats** (PDF, Markdown, JSON, HTML)
- ⌨️ **Comprehensive Keyboard Shortcuts**
- 🎨 **Modern UI/UX** with themes and accessibility
- 🔍 **Code Highlighting** and diff view

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.0.0 or higher ([Download](https://nodejs.org))
- **Ollama** for local AI models ([Download](https://ollama.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Codingbysid/CODE.git
   cd CODE
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install and start Ollama**
   ```bash
   # macOS
   brew install ollama
   brew services start ollama
   
   # Windows/Linux - Download from ollama.com
   ```

4. **Pull a model**
   ```bash
   ollama pull llama3:8b
   # or try: ollama pull gpt-oss-20b
   ```

5. **Launch the app**
   ```bash
   npm start
   ```

## 🎮 How to Use

### First Time Setup
1. Launch the app - you'll see an onboarding tour
2. Complete the 3-step welcome guide
3. Start challenging your ideas!

### Basic Workflow
1. **Type your idea** in the left panel
2. **Choose a persona** (Logician, Market Cynic, Lateral Thinker, Five Whys)
3. **Click "Challenge"** or press `⌘+Enter`
4. **Watch the adversarial response** build in real-time
5. **Save interesting sessions** for later review

### Advanced Features
- **Devil's Advocate**: Press `⌘+Shift+Enter` for strongest counterargument
- **Custom Personas**: Create your own adversarial styles
- **Session Management**: Use the Dashboard to browse past conversations
- **Export Options**: Save sessions as PDF, Markdown, JSON, or HTML

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `⌘+Enter` | Generate response |
| `⌘+Shift+Enter` | Devil's Advocate mode |
| `⌘+1-4` | Switch personas |
| `⌘+K` | Open command palette |
| `⌘+C` | Copy response |
| `⌘+S` | Save session |
| `⌘+D` | Open dashboard |
| `⌘+T` | Toggle theme |
| `Esc` | Clear session |

## 🎭 Adversarial Personas

### The Logician 🔍
- **Focus**: Logical fallacies, reasoning gaps
- **Best for**: Academic arguments, research proposals

### The Market Cynic 💼
- **Focus**: Market viability, competition, business reality
- **Best for**: Startup ideas, business plans

### The Lateral Thinker 🌀
- **Focus**: Unexpected scenarios, contrarian angles
- **Best for**: Creative projects, innovative solutions

### The "Five Whys" Toddler 🧒
- **Focus**: First principles, iterative questioning
- **Best for**: Problem-solving, strategic planning

### Devil's Advocate 👹
- **Focus**: Strongest possible counterargument
- **Format**: Steelman → Vulnerabilities → Counterevidence → Next Probes

## 🛠️ Development

### Project Structure
```
CODE/
├── main.js              # Electron main process
├── preload.js           # Secure bridge
├── common.js            # Shared constants
├── renderer/            # UI components
│   ├── index.html       # Main interface
│   ├── dashboard.html   # Session management
│   ├── renderer.js      # UI logic
│   └── styles.css       # Styling
└── utils/               # Utility modules
```

### Available Scripts
```bash
npm start          # Start development server
npm run dev        # Development mode with hot reload
npm run build      # Build for production
npm run dist       # Create distribution packages
```

### Building for Distribution
```bash
npm run build
npm run dist
```

This creates installers for:
- macOS: `.dmg` file
- Windows: `.exe` installer
- Linux: `.AppImage` and `.deb` packages

## 🔧 Troubleshooting

### Common Issues

**App won't start**
- Ensure Node.js 18+ is installed
- Run `npm install` to install dependencies
- Check that Ollama is running: `ollama list`

**"Model not found" error**
- Pull the required model: `ollama pull llama3:8b`
- Check model name in the app matches what you have installed

**Database errors**
- The app will work without database (sessions stored in memory)
- Check file permissions in the app's data directory

**Performance issues**
- Try a smaller model like `llama3:8b`
- Close other applications to free up RAM
- Adjust temperature and max tokens in the app

### Getting Help
- 📖 Read the [comprehensive documentation](about.md)
- 🐛 [Report issues](https://github.com/Codingbysid/CODE/issues)
- 💬 [Join discussions](https://github.com/Codingbysid/CODE/discussions)

## 🎯 Use Cases

### Business & Entrepreneurship
- **Startup Pitch Validation**: Test your pitch against market cynicism
- **Business Plan Critique**: Identify weaknesses before investors do
- **Strategic Decision Testing**: Challenge assumptions in business strategy

### Academic & Research
- **Research Paper Review**: Strengthen arguments before publication
- **Thesis Defense Preparation**: Practice defending your research
- **Hypothesis Testing**: Challenge your assumptions rigorously

### Creative & Design
- **Product Design Critique**: Find usability and design flaws
- **Creative Concept Validation**: Test creative ideas against reality
- **Content Creation**: Challenge your writing and storytelling

### Personal Development
- **Critical Thinking Practice**: Develop stronger reasoning skills
- **Decision Making**: Test important decisions from multiple angles
- **Problem Solving**: Break through mental blocks and assumptions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built for the GPT-OSS Hackathon
- Powered by [Ollama](https://ollama.com) for local AI inference
- Built with [Electron](https://electronjs.org) for cross-platform desktop apps

## 📞 Contact

- **GitHub**: [@Codingbysid](https://github.com/Codingbysid)
- **Project**: [CODE Repository](https://github.com/Codingbysid/CODE)

---

**CODE - Where your ideas meet their toughest critic, and emerge stronger.**

*Challenge, don't assist; provoke, don't comfort; strengthen through resistance.*