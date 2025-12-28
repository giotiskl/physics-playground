# 🎱 Physics Playground

A collection of interactive physics simulations built with **Three.js**, **Rapier**, and **TypeScript**. Each example explores a different physics concept with clean, beautiful visuals.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Three.js](https://img.shields.io/badge/Three.js-r160-black)

## ✨ Live Demo

👉 **[physics-playground.georgekal.com](https://physics-playground.georgekal.com)**

## 🎮 Examples

| #   | Example          | Description                                         | Status         |
| --- | ---------------- | --------------------------------------------------- | -------------- |
| 1   | Ball Pit Chaos   | Interactive balls that scatter as you move a paddle | 🚧 In Progress |
| 2   | Domino Chain     | Trigger satisfying chain reactions                  | 📋 Planned     |
| 3   | Soft Body Jelly  | Squishy, mesmerizing physics                        | 📋 Planned     |
| 4   | Cloth Simulation | Fabric reacting to wind                             | 📋 Planned     |
| 5   | Ragdoll Physics  | Hilarious tumbling characters                       | 📋 Planned     |

## 🛠️ Tech Stack

- **[Three.js](https://threejs.org/)** – 3D rendering
- **[Rapier](https://rapier.rs/)** – Fast, WASM-based physics engine
- **[TypeScript](https://www.typescriptlang.org/)** – Type safety
- **[Vite](https://vitejs.dev/)** – Lightning-fast dev server & build

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Clone the repo
git clone https://github.com/giotiskl/physics-playground.git

cd physics-playground

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

Output will be in the `dist/` folder, ready for deployment.

## 📁 Project Structure

```
physics-playground/
├── src/
│   ├── main.ts       # Entry point & scene setup
│   └── style.css     # Global styles
├── public/           # Static assets
├── index.html        # HTML template
├── vite.config.ts    # Vite configuration
├── tsconfig.json     # TypeScript config
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Feel free to:

1.  Fork the repo
2.  Create a feature branch (`git checkout -b feature/cool-physics`)
3.  Commit your changes (`git commit -m 'Add cool physics'`)
4.  Push to the branch (`git push origin feature/cool-physics`)
5.  Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙌 Acknowledgments

- [Rapier Physics](https://rapier.rs/) for the incredible WASM physics engine
- [Three.js](https://threejs.org/) community for amazing examples and docs

---

**Built in public by [@heygeorgekal](https://twitter.com/heygeorgekal) ✌️**
