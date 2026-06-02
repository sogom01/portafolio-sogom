# Portafolio — Juan Sebastián Osorio Gómez

[![CI](https://github.com/sogom01/portafolio-jso/actions/workflows/ci.yml/badge.svg)](https://github.com/sogom01/portafolio-jso/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Astro](https://img.shields.io/badge/Astro-6.x-FF5D01?logo=astro&logoColor=white)](https://astro.build)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](./tsconfig.json)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.x-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Code style: Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)

Portafolio personal de **Juan Sebastián Osorio Gómez**, desarrollador web y
estudiante de seguridad de la información. Construido con foco en
**performance**, **accesibilidad** y **estándares de seguridad** (OWASP ASVS L1).

> 🛡️ Si encuentras una vulnerabilidad, por favor revisa [SECURITY.md](./SECURITY.md)
> antes de abrir un issue público.

---

## 🚀 Stack

| Capa               | Tecnología           | Por qué                                                   |
| ------------------ | -------------------- | --------------------------------------------------------- |
| Framework          | Astro 6              | Render estático por defecto → mínima superficie de ataque |
| Estilos            | Tailwind CSS 4       | Utility-first, sin CSS no usado en bundle                 |
| Lenguaje           | TypeScript (strict)  | Validación de tipos en compile-time                       |
| Validación runtime | Zod (pendiente)      | Esquemas declarativos para inputs                         |
| Despliegue         | Vercel               | CDN global + funciones serverless                         |
| Antispam           | Cloudflare Turnstile | CAPTCHA invisible, gratuito                               |
| Emails             | Resend               | Tier gratuito 3000/mes, API moderna                       |

---

## 📁 Estructura

```
src/
├── pages/                # Rutas (URL ↔ archivo). Solo orquestación.
├── presentation/
│   ├── layouts/          # Plantillas (Header, Footer, meta tags)
│   └── components/       # Componentes UI reutilizables
├── logic/
│   └── schemas/          # Validación Zod (inputs del formulario, etc.)
├── services/             # Adapters a servicios externos (Repository pattern)
├── lib/                  # Utilidades puras y helpers
└── styles/               # CSS global + Tailwind directives
tests/
├── unit/                 # Vitest — funciones puras y lógica
└── e2e/                  # Playwright — flujos de usuario
```

Separación inspirada en **arquitectura por capas**: presentación, lógica y
servicios sin dependencias circulares.

---

## 🧰 Scripts

```bash
npm run dev            # Servidor local en http://localhost:4321
npm run build          # Build de producción a /dist
npm run preview        # Preview del build local
npm run typecheck      # astro check (valida TS y .astro)
npm run lint           # ESLint con plugin de seguridad
npm run lint:fix       # ESLint con auto-fix
npm run format         # Formatea con Prettier
npm run format:check   # Verifica formato (lo usa CI)
```

---

## ✅ Estándares de calidad

- **TypeScript strict** — `noImplicitAny`, `strictNullChecks`, etc.
- **ESLint** con `eslint-plugin-security` y `eslint-plugin-no-secrets`.
- **Prettier** con plugin de Astro y Tailwind (ordena clases).
- **GitHub Actions** corre lint + typecheck + build en cada PR.
- **Dependabot** activo (configurar en GitHub settings tras el primer push).
- **Commits firmados** con GPG/SSH.

### Métricas objetivo

| Métrica                     | Objetivo     |
| --------------------------- | ------------ |
| Lighthouse Performance      | ≥ 95         |
| Lighthouse Accessibility    | 100          |
| Lighthouse Best Practices   | 100          |
| securityheaders.com         | A+           |
| Mozilla Observatory         | A o superior |
| Cobertura de tests (lógica) | ≥ 80%        |
| LCP                         | < 1.5 s      |

---

## 🔒 Modelo de amenazas

Documentado en `docs/threat-model.md` (pendiente, fase 2). Aplicamos STRIDE
simplificado sobre el único flujo dinámico: formulario de contacto.

---

## 📜 Licencia

[MIT](./LICENSE) © 2026 Juan Sebastián Osorio Gómez
