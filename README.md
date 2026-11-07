# React + Vite

## Supabase configuration

This application uses React and Vite. Configure the browser Supabase client in `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

Copy `.env.example` to `.env.local` and replace the example values with the project's URL and publishable key. Restart Vite after changing the file.

Vite exposes `VITE_*` values in the browser bundle. Only use Supabase's publishable/anon key here—never a `service_role` or secret key. Protect all tables with correctly configured Row Level Security policies. The new Supabase project must also have the tables, functions, and policies expected by the app; configuring these values alone does not migrate or create application data.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
# HayagSYNC_WebAdmin
