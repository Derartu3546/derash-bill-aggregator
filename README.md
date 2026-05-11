<<<<<<< HEAD
   Derash Bill Aggregator Backend

This is the central backend system for the Derash Bill Aggregator project. It handles bill management, agent transactions, and administrative reporting.

 Getting Started (For Team Members)
Follow these steps exactly to set up your local development environment.

1. Prerequisites
Ensure you have the following installed:

Node.js (v18 or higher)

PostgreSQL (Running locally or via Docker)

npm (Comes with Node)

2. Installation
First, clone the repository and install the dependencies:

Bash
git clone https://github.com/Derartu3546/derash-bill-aggregator.git
cd derash-bill-aggregator
npm install

3. Environment Setup
Create a .env file in the root directory and add your database connection string:

Plaintext
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/derash_db?schema=public"
(Replace USER and PASSWORD with your local PostgreSQL credentials.)

4. Database Initialization

Run the following commands to sync the database schema and load the test data:

Bash
# Generate the Prisma Client
npx prisma generate

# Apply migrations to create tables
npx prisma migrate dev

# Seed the database with Billers, Agents, and Users
npx prisma db seed

 Team Roles & Workflow
To avoid code conflicts, please follow this workflow:

Never push directly to main.

Create a new branch for your feature: git checkout -b feat/your-feature-name

Commit your changes: git commit -m "Add feature description"

Push to your branch: git push origin feat/your-feature-name

Open a Pull Request (PR) on GitHub for review.

🛠 Tech Stack
Framework: Fastify (Node.js)

Database: PostgreSQL

ORM: Prisma

Language: TypeScript
=======
# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
>>>>>>> origin/frontend-dagi
