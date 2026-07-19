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

## Dados e sincronização

A aplicação usa Supabase para autenticação e para sincronizar o progresso entre dispositivos. Na primeira entrada, os dados existentes no `localStorage` são enviados para a conta do utilizador. O `localStorage` continua a funcionar como cópia local para uma abertura mais rápida e para proteger o progresso durante falhas temporárias de rede.

Cada utilizador só pode ler e alterar a sua própria linha na tabela `study_data`, através das políticas de segurança da base de dados.
