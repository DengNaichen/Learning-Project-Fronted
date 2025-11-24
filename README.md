# Learning Platform Frontend

A modern learning platform frontend built with React, TypeScript, and Vite. Features include knowledge graph visualization, note-taking with rich text editing, and quiz functionality.

## Features

- **Authentication** - User registration and login
- **Knowledge Graph** - Interactive 2D/3D visualization of learning concepts and their relationships
- **Notes** - Rich text note-taking with BlockNote editor, supporting code blocks, math equations (KaTeX), and YAML/Markdown export
- **Questions** - Quiz and assessment system

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Rich Text Editor**: BlockNote + TipTap
- **Graph Visualization**: react-force-graph-2d/3d, XY Flow
- **Math Rendering**: KaTeX
- **Code Highlighting**: highlight.js + lowlight

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/     # Shared components
├── features/
│   ├── auth/       # Authentication
│   ├── graphs/     # Knowledge graph visualization
│   ├── notes/      # Note-taking
│   └── questions/  # Quiz system
├── lib/            # Utilities and helpers
└── styles/         # Global styles
```

## License

Private
