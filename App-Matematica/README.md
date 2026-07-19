# Plano A — Matemática A

Aplicação responsiva de acompanhamento de estudo para o exame nacional de Matemática A, criada com Next.js, TypeScript e Tailwind CSS.

## Executar localmente

É necessário ter Node.js 20.9 ou superior e pnpm instalados.

```bash
pnpm install
pnpm dev
```

Depois, abre [http://localhost:3000](http://localhost:3000) no navegador.

## Verificações

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## Dados

Os dados ficam guardados apenas no `localStorage` do navegador. A interface `StudyStorage`, em `src/lib/storage.ts`, isola a persistência da interface; uma futura integração com Supabase pode implementar o mesmo contrato sem alterar os ecrãs.
