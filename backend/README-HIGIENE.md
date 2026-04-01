# ROADIX Backend - Higiene de repositorio

## Regla principal
La fuente de verdad del backend es:
- `src/`
- configuración oficial
- migraciones
- seeds oficiales
- documentación

## No debe considerarse fuente de verdad
- `dist/`
- artefactos compilados
- caches locales
- dependencias instaladas localmente

## Convención aplicada
- se agregó `.gitignore` para excluir `dist/`, `node_modules/`, logs y temporales
- el backend debe compilarse localmente o en CI, no versionarse compilado

## Objetivo
Mantener ROADIX más limpio, predecible y gobernado técnicamente.