# Monedge: Sistema de Gestión de Finanzas Personales con Inteligencia Artificial
## Reporte Técnico de Proyecto — ATE2 Tecnologías Emergentes

**Universidad Autónoma de Baja California**
**Facultad de Ingeniería**
**Ingeniería en Software y Tecnologías Emergentes**

**Integrantes:** [Nombres del equipo]
**Materia:** ATE2 — Tecnologías Emergentes
**Semestre:** 2025-2
**Fecha de entrega:** Mayo 2026

---

## Resumen Ejecutivo

Monedge es un sistema web de gestión de finanzas personales que integra inteligencia artificial para brindar análisis, categorización automática y recomendaciones financieras contextuales. El proyecto fue desarrollado durante el semestre 2025-2 como proyecto integrador de la materia ATE2, aplicando las buenas prácticas del estándar PMBOK para su gestión y los principios de arquitectura de software moderno en su implementación técnica.

El sistema permite al usuario registrar ingresos y gastos, administrar múltiples cuentas bancarias, definir presupuestos con seguimiento por períodos, establecer metas de ahorro con flujos de aporte y retiro, programar transacciones recurrentes y consultar análisis de patrones financieros mediante lenguaje natural. La capa de inteligencia artificial está construida sobre Gemini 2.5 Flash de Google y ofrece desde autocategorización de transacciones hasta un laboratorio de análisis profundo con generación dinámica de gráficas.

La arquitectura adoptada sigue un esquema cliente-servidor en forma de T, con un frontend en Next.js 16 y un backend en FastAPI, comunicados mediante una API REST con autenticación JWT en cookies HttpOnly. El sistema fue desarrollado e integrado de forma funcional y se valida mediante datos de prueba representativos.

---

## Tabla de Contenidos

1. Introducción
2. Marco Teórico
3. Gestión del Proyecto bajo PMBOK
4. Análisis de Requisitos
5. Decisiones de Arquitectura
6. Diseño de la Base de Datos
7. Implementación del Backend
8. Implementación del Frontend
9. Integración con Inteligencia Artificial
10. Seguridad del Sistema
11. Pruebas y Validación
12. Resultados
13. Conclusiones y Trabajo Futuro
14. Referencias
15. Anexos

---

## 1. Introducción

### 1.1 Contexto y Problemática

La gestión de las finanzas personales es una habilidad fundamental en la vida adulta, sin embargo, la mayoría de las personas no lleva un control sistemático de sus ingresos, gastos y metas de ahorro. Según datos del Instituto Nacional de Estadística y Geografía (INEGI), apenas el 36% de la población adulta mexicana tiene algún tipo de registro de sus gastos, y de ese porcentaje, la gran mayoría lo hace de manera informal mediante hojas de papel o apuntes en el teléfono.

Las soluciones existentes en el mercado presentan problemas comunes: interfaces complejas que requieren una curva de aprendizaje elevada, modelos de suscripción con costos prohibitivos para el usuario promedio, o bien herramientas demasiado básicas que no ofrecen valor analítico real. Ninguna de las alternativas populares en el mercado hispanohablante combina de forma integrada el control de finanzas con inteligencia artificial accesible sin costo adicional.

Monedge surge como respuesta a esta brecha: una aplicación web que democratiza el análisis financiero inteligente mediante una interfaz clara, flujos de trabajo intuitivos y un motor de IA que responde preguntas financieras en lenguaje natural, todo dentro de un entorno privado y sin dependencia de servicios de terceros para el almacenamiento de datos sensibles.

### 1.2 Justificación

El proyecto se justifica desde tres dimensiones:

**Dimensión técnica.** El desarrollo de Monedge representa la integración de tecnologías emergentes relevantes en la industria actual: frameworks de desarrollo web de última generación (Next.js 16, React 19, FastAPI), modelos de lenguaje de gran escala (Gemini 2.5 Flash), bases de datos asíncronas con ORM moderno (SQLAlchemy async + PostgreSQL), y patrones de autenticación seguros (JWT en cookies HttpOnly). El proyecto permite aplicar y demostrar el dominio de estas tecnologías en un contexto real.

**Dimensión académica.** Como proyecto de la materia ATE2 (Tecnologías Emergentes), Monedge cumple con el objetivo de explorar e implementar tecnologías de frontera dentro de una aplicación funcional y completa. La integración de IA generativa como componente central, no decorativo, diferencia al proyecto de implementaciones superficiales.

**Dimensión social.** Una herramienta de gestión financiera personal accesible y con IA tiene el potencial real de impactar la calidad de vida del usuario. La posibilidad de hacer preguntas como "¿en qué mes gasté más?" o "¿cuánto podría ahorrar si reduzco comida un 20%?" en lenguaje natural democratiza el análisis financiero que antes requería contratar un asesor.

### 1.3 Objetivos

**Objetivo General**

Diseñar, desarrollar e implementar un sistema web de gestión de finanzas personales que integre inteligencia artificial para ofrecer categorización automática de transacciones, análisis de patrones de gasto, recomendaciones financieras personalizadas y consultas en lenguaje natural sobre los datos del usuario.

**Objetivos Específicos**

1. Implementar un módulo de autenticación seguro con JWT en cookies HttpOnly que proteja todos los recursos del usuario.
2. Desarrollar la gestión completa de cuentas bancarias contemplando cuentas líquidas (corriente, ahorro, efectivo) y cuentas de crédito con seguimiento de deuda.
3. Implementar el registro de transacciones con soporte para categorización manual y automática mediante IA.
4. Desarrollar un sistema de presupuestos con seguimiento por períodos (semanal, quincenal, mensual) y alertas visuales de progreso.
5. Implementar un módulo de metas de ahorro con flujos explícitos de aporte y retiro entre cuentas.
6. Desarrollar el módulo de transacciones recurrentes con desactivación automática por fecha de fin.
7. Integrar el modelo Gemini 2.5 Flash para cinco funcionalidades de IA: categorización, resumen mensual, recomendaciones, consultas rápidas y análisis profundo.
8. Diseñar una interfaz de usuario responsiva con soporte de modo oscuro, alto contraste y navegación por sidebar colapsable.
9. Aplicar las prácticas de gestión de proyectos del estándar PMBOK durante todo el ciclo de vida del proyecto.

### 1.4 Alcance

El sistema Monedge comprende los siguientes módulos funcionales:

- **Autenticación**: registro en tres pasos, inicio de sesión con cookie segura, cierre de sesión.
- **Billetera**: CRUD de cuentas con soporte para cuatro tipos y pago de crédito entre cuentas.
- **Movimientos**: registro de transacciones con filtros avanzados, autocategorización con IA y gestión de recurrentes.
- **Planificación**: presupuestos con períodos múltiples y metas con flujos de fondos.
- **Análisis**: estadísticas por período, patrones de comportamiento, laboratorio de IA conversacional.
- **Categorías**: CRUD de categorías personalizadas con generación de descripción asistida por IA.

Quedan fuera del alcance del proyecto: sincronización bancaria automática (Open Banking), notificaciones push, aplicación móvil nativa, soporte multiusuario/familiar, exportación de datos en formato contable y procesamiento de estados de cuenta en PDF.

### 1.5 Organización del Documento

Este reporte se organiza en catorce secciones principales. Las secciones 2 y 3 cubren el marco teórico y la gestión del proyecto bajo PMBOK. Las secciones 4 a 5 documentan el análisis de requisitos y las decisiones de arquitectura. Las secciones 6 a 10 detallan la implementación técnica por capa. Las secciones 11 y 12 presentan las pruebas realizadas y los resultados obtenidos. Finalmente, la sección 13 recoge las conclusiones y líneas de trabajo futuro.

---

## 2. Marco Teórico

### 2.1 Gestión de Proyectos con PMBOK

El Project Management Body of Knowledge (PMBOK) es una guía estándar publicada por el Project Management Institute (PMI) que sistematiza las buenas prácticas en gestión de proyectos. En su séptima edición, el PMBOK adopta un enfoque basado en principios y dominios de desempeño, lo que lo hace aplicable tanto a proyectos predictivos (cascada) como adaptativos (ágil).

Para el desarrollo de Monedge se adoptó un enfoque híbrido: la planificación inicial siguió el estándar PMBOK para estructurar el alcance, los riesgos y el cronograma de alto nivel, mientras que la ejecución se realizó de forma iterativa e incremental, priorizando la entrega de funcionalidades completas y verificables al final de cada ciclo de trabajo.

Los dominios de desempeño del PMBOK que se aplican en este proyecto son:

- **Interesados**: identificación y gestión de expectativas del equipo de desarrollo y del profesor evaluador.
- **Equipo**: definición de roles y responsabilidades dentro del equipo de estudiantes.
- **Ciclo de vida**: adopción del ciclo de vida adaptativo con iteraciones semanales.
- **Planificación**: elaboración del Acta de Constitución, EDT y Registro de Riesgos.
- **Trabajo del proyecto**: ejecución y monitoreo mediante compromisos por iteración.
- **Entrega**: criterios de aceptación definidos por módulo funcional.
- **Medición**: indicadores de avance basados en funcionalidades completadas.
- **Incertidumbre**: registro y respuesta a los riesgos técnicos identificados.

### 2.2 Arquitecturas Web Modernas

**Arquitectura cliente-servidor REST**

La arquitectura cliente-servidor basada en REST (Representational State Transfer) es el estándar predominante para aplicaciones web con separación clara entre frontend y backend. En este modelo, el cliente realiza peticiones HTTP a un servidor que expone recursos mediante URLs, verbos HTTP (GET, POST, PUT, DELETE) y códigos de estado estándar. La comunicación es stateless: cada petición contiene toda la información necesaria para ser procesada.

**Single Page Application (SPA) con Server Side Rendering (SSR)**

Next.js combina las ventajas de las Single Page Applications (navegación fluida sin recargas completas) con las del Server Side Rendering (mejor desempeño en la carga inicial y soporte SEO). El App Router de Next.js 16 introduce el paradigma de React Server Components, aunque Monedge utiliza componentes de cliente (`"use client"`) en todas las páginas del panel para mantener estado local reactivo.

**ORM Asíncrono**

SQLAlchemy es el ORM (Object-Relational Mapper) más maduro del ecosistema Python. Su extensión asíncrona (`AsyncSession`) permite ejecutar queries de base de datos sin bloquear el event loop de FastAPI, lo que resulta crítico para mantener alta concurrencia en el servidor.

### 2.3 Tecnologías del Stack

| Componente | Tecnología | Versión | Justificación |
|---|---|---|---|
| Frontend framework | Next.js | 16.2.3 | App Router, SSR, ecosistema React |
| Librería UI | React | 19.2.4 | Estado declarativo, componentes reutilizables |
| Lenguaje frontend | TypeScript | 5.x | Tipado estático, detección temprana de errores |
| Estilos | Tailwind CSS | v4 | Utilidades atómicas, sin configuración adicional |
| Íconos | lucide-react | ^1.8.0 | Librería moderna con >1000 íconos SVG |
| Gráficas | Recharts | ^3.8.1 | Integración nativa con React, composable |
| Backend framework | FastAPI | 0.110+ | Alto rendimiento, tipado automático, OpenAPI |
| ORM | SQLAlchemy async | 2.x | Queries asíncronas, soporte PostgreSQL |
| Base de datos | PostgreSQL | 15 | ACID, JSON nativo, extensible |
| Validación | Pydantic v2 | 2.x | Validación automática, serialización JSON |
| Contenerización | Docker | 24.x | Entorno reproducible, orquestación simple |
| IA | Gemini 2.5 Flash | — | Modelo multimodal con modo de pensamiento |

### 2.4 Inteligencia Artificial en Finanzas Personales

La aplicación de modelos de lenguaje de gran escala (LLM) en el dominio de las finanzas personales permite superar las limitaciones de los sistemas basados en reglas. Mientras que un sistema clásico categoriza transacciones mediante coincidencia de palabras clave, un LLM puede inferir la categoría de una transacción como "Restaurante La Fogata $320" asociándola con entretenimiento o alimentación según el contexto completo de la descripción.

**Gemini 2.5 Flash** es el modelo de Google AI Studio utilizado en Monedge. Sus características relevantes para este proyecto son:

- **Modo de pensamiento (Thinking)**: permite al modelo razonar paso a paso antes de responder, mejorando la calidad de análisis complejos. Monedge lo habilita con un presupuesto de 8,000 tokens para el endpoint de análisis profundo.
- **Velocidad**: Flash es optimizado para latencia baja, necesaria para la autocategorización en tiempo real mientras el usuario tipea.
- **Costo**: el modelo Flash tiene un costo significativamente menor que modelos como GPT-4 o Gemini Ultra, haciéndolo viable para un proyecto académico.
- **Contexto largo**: maneja hasta 1 millón de tokens de contexto, suficiente para incluir el historial completo de transacciones de seis meses en una sola solicitud.

El diseño de prompts en Monedge sigue el patrón de "instrucción + contexto + formato de salida", forzando respuestas en JSON válido para garantizar la parseable del resultado y evitar alucinaciones de formato.

### 2.5 Gestión de Estado en Frontend

Monedge adopta el patrón de **estado local por componente** en lugar de soluciones globales como Redux o Zustand. Esta decisión se justifica por la naturaleza de las páginas del panel: cada página es funcionalmente independiente y no comparte estado mutable con otras. La única información compartida entre páginas (el usuario autenticado) se obtiene mediante una llamada a `/auth/me` en el layout, sin necesidad de un store global.

El uso de `useState` y `useEffect` de React es suficiente para manejar la complejidad de cada página, y evita la sobrecarga cognitiva de un sistema de gestión de estado global en un proyecto de esta escala.

---

## 3. Gestión del Proyecto bajo PMBOK

### 3.1 Acta de Constitución del Proyecto

**Nombre del Proyecto:** Monedge — Sistema de Gestión de Finanzas Personales con IA

**Propósito:** Desarrollar un sistema web funcional que integre gestión de finanzas personales con inteligencia artificial como proyecto integrador de la materia ATE2.

**Descripción de alto nivel:** Aplicación web full-stack con backend en Python/FastAPI, frontend en Next.js/React y motor de IA basado en Gemini 2.5 Flash, desplegable mediante Docker Compose.

**Patrocinador:** Universidad Autónoma de Baja California, Facultad de Ingeniería.

**Gerente del Proyecto:** [Nombre del estudiante líder].

**Criterios de éxito:**
- Sistema funcional con todos los módulos del alcance operativos.
- Integración de IA en al menos cinco funcionalidades diferenciadas.
- Interfaz de usuario responsiva con soporte de modo oscuro.
- Código documentado y entregado con scripts de datos de prueba.
- Presentación y defensa técnica ante el profesor evaluador.

**Restricciones:**
- Presupuesto: recursos académicos sin costo (Google AI Studio free tier, Docker local).
- Tiempo: semestre 2025-2 (aproximadamente 16 semanas).
- Tecnología: stack definido al inicio del semestre, sin cambio de lenguaje o framework.

**Supuestos:**
- Los integrantes del equipo tienen acceso a una API key de Google AI Studio.
- El ambiente de desarrollo es Linux/macOS con Docker instalado.
- PostgreSQL corre en contenedor local, no se requiere servidor externo.

**Hitos principales:**

| Hito | Semana |
|---|---|
| Diseño de base de datos aprobado | 3 |
| Backend con autenticación y CRUD base funcional | 5 |
| Frontend con páginas de auth y billetera | 7 |
| Módulo de movimientos y planificación completo | 10 |
| Integración de IA completa | 12 |
| Módulo de análisis y laboratorio IA | 14 |
| Pruebas, seed data y ajustes finales | 15 |
| Entrega y presentación | 16 |

### 3.2 Registro de Interesados

| Interesado | Rol | Interés | Influencia | Estrategia |
|---|---|---|---|---|
| Profesor ATE2 | Evaluador | Alto | Alta | Entregables puntuales, demos funcionales |
| Equipo de desarrollo | Ejecutores | Alto | Alta | Reuniones de sincronización semanales |
| Usuarios finales (potenciales) | Beneficiarios | Medio | Baja | Diseño centrado en UX, feedback informal |
| Google (AI Studio) | Proveedor IA | Bajo | Media | Monitorear límites del free tier |

### 3.3 Gestión del Alcance

**Enunciado del Alcance**

El proyecto incluye el diseño, desarrollo y pruebas de un sistema web con los siguientes entregables:
1. Repositorio de código fuente con backend y frontend.
2. Archivo `docker-compose.yml` para despliegue local reproducible.
3. Scripts de datos de prueba (`seed_data.py`, `seed_demo.py`).
4. Documentación técnica en archivos `.md`.
5. Este reporte técnico.

**Estructura de Desglose del Trabajo (EDT)**

```
Monedge
├── 1. Gestión del Proyecto
│   ├── 1.1 Planificación inicial
│   ├── 1.2 Reuniones de seguimiento
│   ├── 1.3 Gestión de riesgos
│   └── 1.4 Cierre y entrega
├── 2. Infraestructura y Base
│   ├── 2.1 Configuración de Docker
│   ├── 2.2 Diseño de base de datos
│   ├── 2.3 Configuración de FastAPI
│   └── 2.4 Configuración de Next.js
├── 3. Módulo de Autenticación
│   ├── 3.1 Backend: register/login/logout
│   ├── 3.2 Frontend: páginas auth
│   └── 3.3 Middleware de protección
├── 4. Módulo de Billetera
│   ├── 4.1 Backend: CRUD cuentas + pago crédito
│   └── 4.2 Frontend: página billetera
├── 5. Módulo de Movimientos
│   ├── 5.1 Backend: CRUD transacciones
│   ├── 5.2 Backend: CRUD recurrentes
│   └── 5.3 Frontend: página movimientos
├── 6. Módulo de Planificación
│   ├── 6.1 Backend: CRUD presupuestos + renovar
│   ├── 6.2 Backend: CRUD metas + contribute/withdraw
│   └── 6.3 Frontend: página planificación
├── 7. Dashboard
│   ├── 7.1 Backend: endpoint dashboard
│   └── 7.2 Frontend: página inicio
├── 8. Módulo de Análisis
│   ├── 8.1 Frontend: estadísticas por período
│   ├── 8.2 Frontend: análisis de patrones
│   └── 8.3 Frontend: laboratorio IA
├── 9. Módulo de Categorías
│   ├── 9.1 Backend: CRUD + seed
│   └── 9.2 Frontend: página categorías
└── 10. Integración IA
    ├── 10.1 Autocategorización
    ├── 10.2 Resumen mensual
    ├── 10.3 Recomendaciones con acciones
    ├── 10.4 Consultas rápidas
    └── 10.5 Laboratorio de análisis profundo
```

### 3.4 Gestión del Cronograma

El cronograma fue gestionado de forma iterativa, asignando paquetes de trabajo completos (backend + frontend del mismo módulo) a cada semana de desarrollo. Este enfoque garantiza que al final de cada iteración existe un incremento funcional y demostrable, en lugar de tener un backend completo sin frontend por semanas.

**Cronograma de alto nivel:**

| Semana | Actividad principal | Entregable |
|---|---|---|
| 1-2 | Diseño de arquitectura y BD | Modelo ER, ADR |
| 3 | Infraestructura Docker + FastAPI base | docker-compose funcional |
| 4-5 | Autenticación completa | Login/register con JWT |
| 6-7 | Módulo Billetera | CRUD cuentas funcional |
| 8-9 | Módulo Movimientos | Transacciones + filtros |
| 10 | Recurrentes y Planificación | Presupuestos + metas |
| 11 | Dashboard y KPIs | Endpoint + página inicio |
| 12-13 | Integración IA (fases 1-4) | Categorización + summary |
| 14 | Módulo Análisis + Lab IA | Análisis profundo |
| 15 | Categorías + seed data + ajustes | Scripts listos |
| 16 | Pruebas finales + reporte | Entrega |

### 3.5 Registro de Riesgos

| ID | Riesgo | Probabilidad | Impacto | Severidad | Respuesta |
|---|---|---|---|---|---|
| R01 | Límites del free tier de Google AI Studio | Alta | Medio | Alta | Monitorear uso; implementar fallback sin IA |
| R02 | Respuestas de Gemini con JSON inválido | Alta | Medio | Alta | Múltiples estrategias de parseo + fallback |
| R03 | Cambios de API en Google Genai SDK | Baja | Alto | Media | Fijar versión del SDK en requirements.txt |
| R04 | Incompatibilidad entre versiones de Next.js | Media | Alto | Alta | Documentar versiones exactas; evitar upgrades |
| R05 | Pérdida de datos en contenedor DB | Baja | Alto | Media | Volumen Docker persistente; scripts de seed |
| R06 | Tiempo insuficiente para módulo de análisis | Media | Medio | Media | Priorizar funcionalidades; cards ocultas opcionales |
| R07 | Miembros del equipo sin experiencia en TS | Media | Medio | Media | Pair programming; documentación interna |
| R08 | CORS bloqueando peticiones frontend | Alta | Bajo | Media | Configurar origins exactos en FastAPI |

**Plan de respuesta a R02** (el de mayor frecuencia real):
Gemini ocasionalmente rompe el formato JSON requerido. Se implementaron tres estrategias de recuperación en cascada: (1) parseo directo del JSON, (2) limpieza de escapes inválidos con regex antes de parsear, (3) extracción del campo `text` por regex cuando el JSON está irreparablemente roto. En caso de falla total, se devuelve el texto en bruto truncado a 600 caracteres.

### 3.6 Gestión de la Calidad

**Criterios de calidad definidos:**

| Criterio | Métrica | Umbral aceptable |
|---|---|---|
| Funcionalidad | Módulos completados / módulos planificados | ≥ 90% |
| Usabilidad | Flujo completo de una transacción sin error | ≤ 4 pasos |
| Consistencia visual | Uso de sistema de diseño en todas las páginas | 100% |
| Seguridad | Endpoints protegidos con JWT | 100% de rutas /panel |
| Robustez IA | Tasa de respuestas parseables de Gemini | ≥ 95% |
| Rendimiento | Tiempo de carga inicial del dashboard | ≤ 3 segundos |

**Actividades de calidad implementadas:**

- **Revisión de código**: cada funcionalidad fue revisada por al menos un compañero antes de integrarse.
- **Pruebas manuales**: cada módulo fue probado con datos de prueba reales antes de considerarse completo.
- **Datos de seed**: se desarrollaron dos scripts de seed que permiten reproducir un estado completo y verificable del sistema en cualquier momento.
- **Documentación continua**: los archivos `BACKEND.md`, `FRONTEND.md` y `DESARROLLO.md` se mantuvieron actualizados como parte del proceso de desarrollo.

### 3.7 Gestión de las Comunicaciones

El equipo adoptó un modelo de comunicación ligero adaptado al contexto académico:

- **Canal principal**: grupo de WhatsApp para coordinación diaria.
- **Repositorio**: sistema de control de versiones con ramas por módulo.
- **Reuniones**: sesiones de sincronización dos veces por semana (30 minutos), con agenda centrada en bloqueos y compromisos.
- **Documentación**: archivos `.md` en el repositorio como única fuente de verdad técnica.
- **Retrospectivas**: al cierre de cada módulo, revisión breve de qué funcionó y qué mejorar.

---

## 4. Análisis de Requisitos

### 4.1 Historias de Usuario

Las historias de usuario se organizaron en épicas por módulo funcional:

**Épica: Autenticación**

- Como nuevo usuario, quiero registrarme en tres pasos (datos, categorías, primera cuenta) para comenzar a usar el sistema inmediatamente.
- Como usuario registrado, quiero iniciar sesión con mi correo y contraseña para acceder a mis datos de forma segura.
- Como usuario autenticado, quiero cerrar sesión para proteger mi cuenta en dispositivos compartidos.

**Épica: Billetera**

- Como usuario, quiero registrar mis cuentas bancarias (corriente, ahorro, efectivo, crédito) para tener un inventario completo de mis recursos.
- Como usuario con tarjeta de crédito, quiero ver cuánto crédito disponible tengo y cuánto debo para entender mi deuda real.
- Como usuario, quiero registrar abonos a mis tarjetas de crédito descontando el dinero de una cuenta líquida para mantener los saldos correctos.

**Épica: Movimientos**

- Como usuario, quiero registrar ingresos y gastos con descripción, monto, fecha, categoría y cuenta para tener un historial detallado.
- Como usuario, quiero que la IA sugiera la categoría correcta al escribir la descripción para agilizar el registro.
- Como usuario, quiero filtrar mis movimientos por tipo, categoría, período y rango de monto para encontrar transacciones específicas.
- Como usuario, quiero programar transacciones recurrentes (salario, Netflix, renta) con frecuencia semanal, quincenal o mensual para no olvidar registrarlas.

**Épica: Planificación**

- Como usuario, quiero crear presupuestos por categoría con límite mensual y ver qué porcentaje he consumido para controlar mis gastos.
- Como usuario, quiero definir metas de ahorro (vacaciones, laptop, fondo de emergencia) y aportar dinero desde mis cuentas para alcanzarlas.
- Como usuario, quiero poder retirar fondos de una meta de vuelta a mi cuenta en caso de emergencia.

**Épica: Análisis e IA**

- Como usuario, quiero ver estadísticas de mis gastos e ingresos en diferentes períodos para entender mis tendencias.
- Como usuario, quiero hacerle preguntas a la IA sobre mis finanzas en español para obtener respuestas contextuales basadas en mis datos reales.
- Como usuario, quiero recibir recomendaciones financieras personalizadas que pueda aplicar directamente desde la interfaz.

### 4.2 Requisitos No Funcionales

| Requisito | Descripción |
|---|---|
| **Seguridad** | Autenticación con JWT en cookie HttpOnly; CORS restringido al origen del frontend |
| **Privacidad** | Los datos del usuario nunca se comparten con terceros; la IA solo recibe agregados, no datos crudos completos |
| **Responsividad** | La interfaz funciona correctamente en pantallas desde 768px de ancho |
| **Accesibilidad** | Modo oscuro y alto contraste activables desde la interfaz |
| **Rendimiento** | Las páginas cargan en menos de 3 segundos en conexión local; las peticiones a Gemini en menos de 8 segundos |
| **Consistencia** | El sistema de diseño (colores, tipografía, componentes) es uniforme en todas las páginas |
| **Mantenibilidad** | Código organizado en capas bien definidas; documentación técnica actualizada |
| **Reproducibilidad** | El sistema puede levantarse en cualquier máquina con Docker con un solo `docker-compose up` |

### 4.3 Casos de Uso Principales

**CU-01: Registrar transacción con autocategorización**

- **Actor**: Usuario autenticado
- **Precondición**: Usuario con al menos una cuenta y una categoría registradas
- **Flujo principal**: (1) Usuario abre el formulario de nuevo movimiento → (2) Ingresa descripción y monto → (3) Hace clic en ✨ → (4) El sistema envía a `/ai/categorize` → (5) Gemini responde con categoría sugerida → (6) El sistema preselecciona la categoría → (7) Usuario confirma y guarda → (8) El backend crea la transacción y actualiza el balance de la cuenta
- **Flujo alternativo**: Si Gemini falla, el campo categoría queda vacío y el usuario selecciona manualmente.

**CU-02: Registrar abono a tarjeta de crédito**

- **Actor**: Usuario autenticado
- **Precondición**: Al menos una cuenta de crédito y una cuenta líquida registradas
- **Flujo principal**: (1) Usuario va a Billetera → (2) Hace clic en el botón Abonar de su tarjeta → (3) El modal muestra la deuda actual y un preview de la deuda post-abono → (4) Usuario ingresa monto y selecciona cuenta origen → (5) Confirma → (6) Backend deduce de la cuenta líquida y suma al crédito disponible

**CU-03: Consulta en Laboratorio IA**

- **Actor**: Usuario autenticado
- **Precondición**: Al menos 10 transacciones registradas en los últimos 6 meses
- **Flujo principal**: (1) Usuario va a Análisis → Laboratorio IA → (2) Escribe una pregunta en lenguaje natural → (3) El backend ejecuta aggregaciones SQL reales sobre los datos del usuario → (4) Envía el contexto numérico + la pregunta a Gemini → (5) Gemini devuelve texto + gráfica + métricas → (6) El frontend renderiza la gráfica dinámicamente con Recharts

---

## 5. Decisiones de Arquitectura

### 5.1 Arquitectura en T: Justificación y Diseño

La decisión arquitectónica central de Monedge es la adopción de una **arquitectura cliente-servidor en forma de T**. Este nombre describe visualmente la estructura del sistema cuando se proyecta en un diagrama de capas:

- **La barra horizontal (ancho)** representa la capa de presentación: el frontend de Next.js con sus seis módulos funcionales (Inicio, Billetera, Movimientos, Planificación, Análisis, Categorías), cada uno con su propio conjunto de componentes, estado y flujos de usuario. Esta barra es "ancha" porque cubre mucha superficie funcional visible al usuario.

- **La barra vertical (profundidad)** representa el backend: un único punto de entrada (FastAPI en el puerto 8000) que desciende por capas hacia el núcleo del sistema: routers → servicios → modelos ORM → base de datos PostgreSQL → servicio de IA Gemini. Esta barra es "profunda" porque cada petición puede atravesar cuatro o cinco capas de lógica antes de devolver una respuesta.

**¿Por qué esta arquitectura y no un monolito full-stack?**

La alternativa habría sido un monolito con Next.js haciendo Server Side Rendering con acceso directo a la base de datos (patrón utilizado por herramientas como Next.js con Prisma). Se eligió la separación cliente-servidor explícita por las siguientes razones:

1. **Independencia tecnológica**: el frontend puede evolucionar a React Native o una PWA sin tocar el backend, y viceversa.
2. **API reutilizable**: el backend expone una API REST documentada en `/docs` que puede ser consumida por herramientas externas, scripts o una futura aplicación móvil.
3. **Separación de responsabilidades**: la lógica de negocio vive exclusivamente en el backend; el frontend solo es responsable de la presentación y la captura de datos.
4. **Seguridad**: las credenciales de base de datos y la API key de Gemini nunca se exponen al navegador; toda la comunicación sensible ocurre en el servidor.
5. **Escalabilidad independiente**: si la carga de IA crece, el backend puede escalarse sin afectar el frontend.

**Diagrama de la arquitectura en T:**

```
┌─────────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js 16)  ←── barra horizontal de la T            │
│  Inicio │ Billetera │ Movimientos │ Plan. │ Análisis │ Categ.    │
└─────────────────────────────┬───────────────────────────────────┘
                              │ HTTP REST + JSON
                              │ (cookie JWT en cada petición)
                              │
                 ┌────────────▼────────────┐
                 │   FastAPI (puerto 8000)  │  ← barra vertical
                 │   Routers: /auth        │
                 │           /accounts     │
                 │           /transactions │
                 │           /budgets      │
                 │           /goals        │
                 │           /recurring    │
                 │           /dashboard    │
                 │           /ai           │
                 └────────────┬────────────┘
                              │
                 ┌────────────▼────────────┐
                 │   Capa de Servicios      │
                 │  (lógica de negocio)     │
                 └────────────┬────────────┘
                              │
              ┌───────────────┴──────────────┐
              │                              │
┌─────────────▼──────────┐   ┌──────────────▼──────────┐
│  PostgreSQL 15          │   │  Google Gemini 2.5 Flash │
│  (Docker, puerto 5433)  │   │  (Google AI Studio API)  │
└────────────────────────┘   └─────────────────────────┘
```

### 5.2 Por Qué Modales en Lugar de Páginas Completas

Una de las decisiones de UX/arquitectura más visibles en Monedge es el uso consistente de modales (popups) para todas las operaciones CRUD, en lugar de navegar a páginas completas de detalle/formulario. Esta decisión merece justificación explícita.

**Contexto de la decisión**

En el diseño inicial, se evaluaron dos enfoques para las operaciones CRUD:
- **Opción A**: Navegación a página dedicada (e.g., `/panel/movimientos/nueva`)
- **Opción B**: Modal sobre la página actual

Se eligió la Opción B para todas las operaciones de creación, edición y eliminación.

**Razones técnicas**

1. **Sin pérdida de estado**: al usar un modal, el estado de la página (lista de items, filtros activos, posición de scroll) se conserva completamente. Con navegación a página dedicada, al regresar se dispararía un re-fetch completo.

2. **Menos rutas**: la aplicación mantiene solo seis rutas del panel (`/panel`, `/movimientos`, `/billetera`, `/planificacion`, `/analisis`, `/categorias`). Agregar rutas de detalle (e.g., `/movimientos/[id]/editar`) multiplicaría la complejidad del router sin añadir valor real.

3. **Estado local suficiente**: las operaciones CRUD no requieren compartir estado complejo con otras páginas. El modal puede manejar todo su ciclo de vida con `useState` local.

4. **Middleware simplificado**: el middleware de Next.js solo necesita proteger `/panel/:path*`, sin casos especiales para sub-rutas de CRUD.

**Razones de UX**

1. **Contexto visible**: el usuario puede ver la lista de transacciones mientras edita una, lo que reduce errores de confusión.
2. **Flujo más rápido**: abrir un modal y cerrarlo es perceptualmente más rápido que navegar a una página y regresar.
3. **Consistencia mental**: el usuario siempre sabe dónde está en la aplicación; el modal es una "capa extra" que no cambia la URL ni el estado de navegación.
4. **Patrón familiar**: los modales son el patrón estándar en aplicaciones financieras de referencia (Fintonic, Flink, etc.).

**Trade-offs asumidos**

- Los formularios en modal no son "bookmarkables" (no tienen URL propia). Esto es aceptable porque los formularios CRUD no necesitan ser compartidos ni marcados.
- En pantallas muy pequeñas (<375px), los modales requieren scroll interno. Se mitigó con `overflow-y-auto` y un `max-w-md` que se adapta al viewport.
- El botón de eliminación en Billetera usa `confirm()` nativo como excepción conocida (deuda técnica identificada).

### 5.3 Patrón de Capas en el Backend

El backend sigue una arquitectura de tres capas bien definidas:

**Capa de Presentación (routers FastAPI)**
Cada archivo en `api/` es responsable únicamente de: recibir la petición HTTP, validar el cuerpo con Pydantic, invocar el servicio correspondiente y devolver la respuesta. No contiene lógica de negocio.

**Capa de Servicios (services/)**
Contiene toda la lógica de negocio: cálculos de saldo, actualización en cascada de balances, cálculo dinámico de `spent` en presupuestos, construcción de prompts para Gemini. Los servicios reciben siempre `db: AsyncSession` y `user_id: UUID` como primeros argumentos.

**Capa de Datos (models/ + schemas/)**
Los modelos SQLAlchemy definen la estructura de las tablas. Los schemas Pydantic definen los contratos de la API (qué se acepta como entrada y qué se devuelve como salida). Esta separación evita la exposición accidental de campos internos (e.g., `hashed_password`) en las respuestas.

### 5.4 Decisiones de Diseño Visual

**Sistema de colores**

Se definió una paleta mínima de marca:
- Azul principal: `#165BC5` (hover: `#0B3EA1`)
- Verde positivo: `#34d399` (emerald-400)
- Rojo negativo: `#ef4444`
- Ámbar advertencia: `#f59e0b`

**Dark mode**

El modo oscuro se implementa mediante la clase CSS `dark` en el elemento `<html>`, siguiendo el patrón estándar de Tailwind v4. La clase se agrega/remueve desde el panel de Settings del sidebar y se persiste en `localStorage`. Los componentes de Recharts requieren detección dinámica vía `MutationObserver` porque no tienen acceso directo al DOM cuando se renderizan.

**Tipografía y escala**

El root layout aplica `font-size: 115%` al `<body>` para mejorar la legibilidad general sin alterar las unidades relativas de Tailwind.

---

## 6. Diseño de la Base de Datos

### 6.1 Modelo Entidad-Relación

El esquema de base de datos está compuesto por siete entidades principales con las siguientes relaciones:

- **User** `1 —— N` **Account**: un usuario puede tener múltiples cuentas.
- **User** `1 —— N` **Category**: un usuario puede tener múltiples categorías (además de las globales con `user_id = NULL`).
- **User** `1 —— N` **Transaction**: un usuario tiene múltiples transacciones.
- **User** `1 —— N` **Budget**: un usuario tiene múltiples presupuestos.
- **User** `1 —— N` **Goal**: un usuario tiene múltiples metas.
- **User** `1 —— N` **RecurringTransaction**: un usuario tiene múltiples recurrentes.
- **Transaction** `N —— 1` **Account**: una transacción puede estar asociada a una cuenta.
- **Transaction** `N —— 1` **Category**: una transacción puede tener una categoría.
- **Transaction** `N —— 1` **Budget**: una transacción puede estar vinculada a un presupuesto.
- **Transaction** `N —— 1` **Goal**: una transacción puede estar vinculada a una meta.
- **RecurringTransaction** `N —— 1` **Account**, **Category**, **Budget**, **Goal**: mismo patrón.

### 6.2 Descripción de Entidades

**Tabla: users**

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | UUID | PK | Identificador único |
| email | VARCHAR | UNIQUE, NOT NULL | Correo electrónico |
| full_name | VARCHAR | NOT NULL | Nombre completo |
| hashed_password | VARCHAR | NOT NULL | Hash bcrypt de la contraseña |
| is_active | BOOLEAN | DEFAULT TRUE | Estado de la cuenta |

**Tabla: accounts**

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | UUID | PK | Identificador único |
| user_id | UUID | FK users.id | Propietario |
| name | VARCHAR | NOT NULL | Nombre de la cuenta |
| bank | VARCHAR | NULLABLE | Banco o institución |
| balance | DECIMAL(14,2) | DEFAULT 0 | Saldo disponible |
| credit_limit | DECIMAL(14,2) | NULLABLE | Límite de crédito (solo tipo credit) |
| type | VARCHAR | NOT NULL | checking \| savings \| cash \| credit |

> **Nota sobre crédito**: para cuentas de tipo `credit`, `balance` representa el crédito disponible restante (no el saldo), y la deuda se calcula como `credit_limit - balance`. Esta convención es contraintuitiva pero facilita la lógica: sumar al balance siempre significa "más dinero disponible".

**Tabla: categories**

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | UUID | PK | Identificador único |
| user_id | UUID | FK, NULLABLE | NULL = categoría global |
| name | VARCHAR | NOT NULL | Nombre |
| emoji | VARCHAR | NULLABLE | Emoji representativo |
| color | VARCHAR | NULLABLE | Color hex |
| is_default | BOOLEAN | DEFAULT FALSE | Categoría del seed |
| type | VARCHAR | NOT NULL | income \| expense |
| description | VARCHAR | NULLABLE | Descripción generada por IA o manual |

**Tabla: transactions**

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | UUID | PK | Identificador único |
| user_id | UUID | FK | Propietario |
| account_id | UUID | FK, NULLABLE | Cuenta afectada |
| category_id | UUID | FK, NULLABLE | Categoría |
| budget_id | UUID | FK ON DELETE SET NULL | Presupuesto vinculado |
| goal_id | UUID | FK ON DELETE SET NULL | Meta vinculada |
| amount | DECIMAL(14,2) | NOT NULL | Monto (siempre positivo) |
| type | VARCHAR | NOT NULL | income \| expense \| transfer |
| description | VARCHAR | NOT NULL | Descripción |
| date | DATE | NOT NULL | Fecha de la transacción |
| created_at | DATETIME | DEFAULT NOW | Timestamp de registro |

**Tabla: budgets**

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | UUID | PK | Identificador único |
| user_id | UUID | FK | Propietario |
| category_id | UUID | FK, NULLABLE | Categoría decorativa |
| name | VARCHAR | NOT NULL | Nombre del presupuesto |
| amount | DECIMAL(14,2) | NOT NULL | Monto límite por período |
| start_date | DATE | NOT NULL | Inicio del presupuesto |
| end_date | DATE | NOT NULL | Fin del presupuesto |
| is_recurring | BOOLEAN | DEFAULT FALSE | Si se puede renovar automáticamente |
| frequency | VARCHAR | NULLABLE | weekly \| biweekly \| monthly |

> **Campo `spent` no almacenado**: el gasto acumulado de un presupuesto no se guarda en la base de datos para evitar inconsistencias. Se calcula en tiempo real sumando las transacciones que tienen `budget_id = este_presupuesto` y `type = 'expense'`.

**Tabla: goals**

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | UUID | PK | Identificador único |
| user_id | UUID | FK | Propietario |
| name | VARCHAR | NOT NULL | Nombre de la meta |
| emoji | VARCHAR | DEFAULT '🎯' | Emoji representativo |
| target_amount | DECIMAL(14,2) | NOT NULL | Monto objetivo |
| saved_amount | DECIMAL(14,2) | DEFAULT 0 | Monto ahorrado acumulado |
| deadline | DATE | NULLABLE | Fecha límite opcional |

**Tabla: recurring_transactions**

| Columna | Tipo | Restricciones | Descripción |
|---|---|---|---|
| id | UUID | PK | Identificador único |
| user_id | UUID | FK | Propietario |
| account_id | UUID | FK, NULLABLE | Cuenta predeterminada |
| category_id | UUID | FK, NULLABLE | Categoría |
| budget_id | UUID | FK ON DELETE SET NULL | Presupuesto vinculado |
| goal_id | UUID | FK ON DELETE SET NULL | Meta vinculada |
| name | VARCHAR | NOT NULL | Nombre descriptivo |
| amount | DECIMAL(14,2) | NOT NULL | Monto de cada ocurrencia |
| type | VARCHAR | NOT NULL | income \| expense |
| frequency | VARCHAR | NOT NULL | weekly \| biweekly \| monthly |
| next_date | DATE | NULLABLE | Próxima fecha de aplicación |
| end_date | DATE | NULLABLE | Fecha de desactivación automática |
| is_active | BOOLEAN | DEFAULT TRUE | Estado activo/inactivo |

### 6.3 Decisiones de Diseño Clave

**Balance de cuentas en tiempo real**

Se optó por no usar triggers SQL para actualizar el balance de las cuentas. En su lugar, `transaction_service` actualiza explícitamente `account.balance` al crear, editar o eliminar una transacción. Esta decisión:
- Mantiene la lógica de negocio en Python, donde es testeable y legible.
- Evita dependencias ocultas en la base de datos que compliquen migraciones.
- Permite lógica condicional que los triggers SQL manejan con dificultad (e.g., no actualizar balance si `type == "transfer"`).

**Gestión de columnas con ALTER TABLE en startup**

Algunas columnas fueron añadidas en iteraciones posteriores al diseño inicial (e.g., `budget_id` en transactions, `is_recurring` en budgets). En lugar de un sistema de migraciones con Alembic, se implementaron sentencias `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` en el evento `startup` de FastAPI. Esta aproximación es pragmática para un proyecto académico: garantiza que la base de datos siempre tenga el esquema correcto sin gestionar archivos de migración.

**UUIDs como claves primarias**

Se eligió UUID sobre entero autoincremental por tres razones: evitar enumeración de recursos en la URL, facilitar potenciales fusiones de datos de múltiples fuentes, y alinearse con las mejores prácticas modernas de APIs REST.

---

## 7. Implementación del Backend

### 7.1 Estructura y Capas

El backend está organizado en el directorio `backend/app/` con la siguiente estructura de capas:

```
backend/app/
├── main.py           # Punto de entrada: registro de routers y startup
├── core/
│   ├── config.py     # Variables de entorno vía pydantic-settings
│   ├── database.py   # Engine async + sesión + Base
│   ├── security.py   # Hashing y JWT
│   └── deps.py       # Dependencias inyectables (get_current_user)
├── models/           # SQLAlchemy ORM
├── schemas/          # Pydantic contratos de API
├── services/         # Lógica de negocio
└── api/              # Routers FastAPI
```

**Inicialización de la aplicación**

```python
app = FastAPI(title="Monedge API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Columnas añadidas en iteraciones posteriores
        await conn.execute(text(
            "ALTER TABLE categories ADD COLUMN IF NOT EXISTS "
            "type VARCHAR NOT NULL DEFAULT 'expense'"
        ))
        # ... otros ALTER TABLE
```

El evento `startup` garantiza que todas las tablas existen antes de la primera petición, y que las columnas añadidas iterativamente están presentes aunque la tabla ya existiera.

### 7.2 Autenticación con JWT

La autenticación sigue el patrón de cookie HttpOnly, que es más seguro que almacenar el token en `localStorage` porque es inaccesible para JavaScript del lado del cliente.

**Flujo de login:**

1. El frontend envía `{email, password}` a `POST /auth/login`.
2. El backend verifica las credenciales con `verify_password` (bcrypt).
3. Si son válidas, genera un JWT con `sub: user_id` y expiración de 30 minutos.
4. Devuelve el token en una cookie con `httponly=True, samesite="lax"`.

**Flujo de autenticación en cada petición:**

```python
async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db)
) -> User:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(401, "No autenticado")
    payload = decode_token(token)
    user = await get_user_by_id(db, payload["sub"])
    if not user:
        raise HTTPException(401, "Usuario no encontrado")
    return user
```

La función `get_current_user` se inyecta como dependencia en todos los endpoints protegidos mediante `Depends(get_current_user)`.

### 7.3 Gestión de Cuentas y Transacciones

**Actualización de balance en cascada**

Cuando se registra una transacción, el balance de la cuenta asociada se actualiza en el mismo commit de base de datos:

```python
if data.account_id and data.type != "transfer":
    acc = await get_account(db, data.account_id)
    delta = data.amount if data.type == "income" else -data.amount
    acc.balance = Decimal(str(acc.balance)) + delta
```

La operación inversa ocurre al eliminar una transacción. Al editar, se revierte el efecto anterior antes de aplicar el nuevo:

```python
# Revertir efecto anterior
revert = -old_amount if old_type == "income" else old_amount
old_acc.balance += revert

# Aplicar nuevo efecto
delta = new_amount if new_type == "income" else -new_amount
new_acc.balance += delta
```

Esta lógica garantiza que `account.balance` siempre refleja la suma real de todas las transacciones sin necesidad de recalcular desde cero.

**Endpoint de pago de crédito**

El endpoint `POST /accounts/{credit_id}/pay` implementa la operación de abonar a una tarjeta de crédito desde una cuenta líquida:

```python
liquid.balance -= amount      # Se descuenta de la cuenta líquida
credit.balance += amount      # Aumenta el crédito disponible (disminuye deuda)
```

### 7.4 Presupuestos con Períodos

El sistema de presupuestos es uno de los componentes más elaborados del backend. Un presupuesto puede cubrir un período largo (e.g., un mes) pero dividirse internamente en sub-períodos según su `frequency`. Esto permite ver tanto el gasto del período actual como el total histórico.

**Cálculo de períodos:**

```python
def _build_periods(budget):
    if not budget.frequency:
        return [(budget.start_date, budget.end_date, "Total")]
    days = {"weekly": 7, "biweekly": 14, "monthly": 28}[budget.frequency]
    periods, current, i = [], budget.start_date, 1
    while current <= budget.end_date:
        end = min(current + timedelta(days=days-1), budget.end_date)
        periods.append((current, end, f"Período {i}"))
        current = end + timedelta(days=1)
        i += 1
    return periods
```

Para cada período se calcula el gasto real consultando las transacciones con `budget_id = este_budget`:

```python
spent_in_period = sum(
    tx.amount for tx in tx_rows
    if period.start <= tx.date <= period.end
)
```

El `BudgetOut` devuelve `spent` (gasto total), `total_budget` (límite × número de períodos) y `periods` (lista de períodos con su gasto individual), permitiendo visualizaciones tanto macro como granulares.

### 7.5 Metas de Ahorro con Flujos Explícitos

La versión final del módulo de metas abandona la actualización directa de `saved_amount` vía `PUT /goals/{id}` para los flujos de dinero, reemplazándola por endpoints dedicados con trazabilidad completa:

**Aporte a meta (`POST /goals/{id}/contribute`):**
1. Valida que la cuenta líquida tiene saldo suficiente.
2. Incrementa `goal.saved_amount`.
3. Reduce `account.balance`.
4. Crea una `Transaction` de tipo `"transfer"` con descripción `"Aporte → {meta}"` para mantener trazabilidad.

**Retiro de meta (`POST /goals/{id}/withdraw`):**
1. Valida que el monto no supere `goal.saved_amount`.
2. Reduce `goal.saved_amount`.
3. Incrementa `account.balance`.
4. Crea una `Transaction` de tipo `"transfer"` con descripción `"Retiro ← {meta}"`.

Las transacciones de tipo `"transfer"` no afectan el balance de cuenta en `transaction_service` (la lógica ya está en `goal_service`), evitando doble conteo.

### 7.6 Transacciones Recurrentes

El endpoint `POST /recurring/{id}/apply` implementa la lógica más compleja del módulo de recurrentes:

```
1. Crear Transaction con datos del recurrente
   → account_id = payment_account_id ?? rec.account_id

2. Si se pagó desde cuenta distinta a crédito:
   → create_transaction descuenta del líquido
   → Se abona adicionalmente al crédito: credit.balance += amount

3. Si es ingreso con goal_id (auto-contribución):
   → goal.saved_amount += amount
   → account.balance -= amount

4. Avanzar next_date:
   → weekly: +7 días
   → biweekly: +14 días
   → monthly: mismo día del mes siguiente

5. Si next_date > end_date:
   → is_active = False
```

El parámetro `payment_account_id` permite indicar una cuenta de pago diferente a la cuenta vinculada al recurrente. Esto es útil para cuotas de tarjeta de crédito: el recurrente está asociado a la tarjeta de crédito (la que acumula la deuda), pero el pago real sale de la cuenta corriente.

### 7.7 Dashboard y Métricas

El endpoint `GET /dashboard` construye un conjunto de métricas clave en una sola petición:

**Cálculo de `safe_daily_budget`:**

```python
# Promedio mensual histórico (últimos 3 meses, excluyendo el actual)
avg_monthly_income = hist_inc_total / 3

# Proyectar el ingreso del mes actual
projected_income = max(income_mes_actual, avg_monthly_income)

# Reservar 20% para ahorro
savings_target = projected_income * 0.20

# Disponible para gastar en los días restantes
available = max(projected_income - gastos_mes - savings_target, 0)
safe_daily = available / días_restantes_del_mes
```

Este indicador es más sofisticado que un simple "ingresos minus gastos", porque proyecta el ingreso completo del mes (evitando que a mitad del mes el número sea artificialmente bajo) y reserva explícitamente el 20% para ahorro.

---

## 8. Implementación del Frontend

### 8.1 Sistema de Diseño y Layout

**App Router de Next.js**

El frontend usa el App Router de Next.js 16, que organiza las rutas mediante el sistema de carpetas. Todas las páginas del panel tienen `"use client"` al inicio porque requieren estado local reactivo (useState, useEffect). El layout raíz aplica la fuente Inter de Google Fonts con un tamaño base de 115%.

**Panel Layout**

El layout del panel (`/panel/layout.tsx`) es el componente padre de todas las páginas del panel y provee:

- **Sidebar colapsable**: con `localStorage` para persistir el estado. Usa la variable CSS `--sb-w` para que el contenido ajuste su margen automáticamente.
- **Header**: muestra la fecha actual y un botón de Settings.
- **Settings dropdown**: contiene el perfil del usuario, toggles de dark mode y alto contraste, enlace a Categorías y botón de logout.
- **Dark mode**: clase `dark` en `<html>` + localStorage. Alto contraste adicional con clase `contrast`.

**Middleware de protección**

```typescript
export function middleware(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  if (request.nextUrl.pathname.startsWith("/panel") && !token)
    return NextResponse.redirect(new URL("/login", request.url));
  if (["/login","/register"].includes(request.nextUrl.pathname) && token)
    return NextResponse.redirect(new URL("/panel", request.url));
  return NextResponse.next();
}
```

### 8.2 Módulo de Inicio (Dashboard)

La página de inicio (`/panel/page.tsx`) carga `getDashboard()` al montar y condicionalmenteuna `aiSummary()` si hay actividad en el mes. Presenta:

**Cuatro KPIs principales:**
- Ingresos del Mes
- Gastos del Mes
- Balance del Mes (ingresos − gastos, con badge Ahorrando/Déficit en verde/rojo)
- Puedes gastar hoy (con comparativo ▲/▼ vs promedio histórico)

**Alertas contextuales condicionales:**
Debajo de los KPIs aparecen hasta dos tarjetas de alerta:
- Presupuesto en riesgo: si algún presupuesto supera el 70% de su límite.
- Meta más cercana: muestra la meta con mayor porcentaje de progreso.

**Layout de tres columnas:**
Últimos 30 movimientos | Cuentas (top 5 + total) | Presupuestos + Metas (stack)

### 8.3 Módulo de Billetera

La página de Billetera (`/panel/billetera/page.tsx`) ofrece gestión completa de cuentas. Las tarjetas de cada cuenta se muestran en un grid responsivo (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).

Para cuentas de crédito se muestra:
- Crédito disponible (en grande)
- Límite total
- Barra de deuda con color dinámico (azul < 50%, ámbar 50-80%, rojo > 80%)
- Deuda en pesos y porcentaje

El modal de Abonar incluye un preview en tiempo real de la deuda post-abono:
```typescript
const afterPay = Math.max(0, debt - (parseFloat(payAmount) || 0));
// Se renderiza en el modal mientras el usuario escribe el monto
```

### 8.4 Módulo de Movimientos

Es la página más compleja del frontend (1,200 líneas). Su arquitectura de componentes:

**Estado principal:**
- `transactions[]`: transacciones regulares cargadas
- `recurring[]`: recurrentes activos del usuario
- `budgets[]`, `goals[]`, `categories[]`, `accounts[]`: datos de apoyo para formularios

**Paginación incremental:**
La carga inicial trae los últimos 30 días. El botón "Ver 30 días más" carga el bloque previo:
```typescript
const endDate = subtractDays(loadedStart, 1);
const newStart = subtractDays(loadedStart, 31);
const more = await getTransactions({ start_date: newStart, end_date: endDate, limit: 300 });
```

**Tabla unificada:**
Las transacciones regulares y los recurrentes activos se muestran en la misma tabla. Los recurrentes tienen un badge con la frecuencia (`Semanal`, `Quincenal`, `Mensual`). Las transacciones de tipo `transfer` se destacan en morado.

**Autopreselección de presupuesto:**
Al seleccionar una categoría en el formulario de gasto, el sistema busca automáticamente el presupuesto activo vinculado a esa categoría:
```typescript
const match = budgets.find(
  b => b.category_id === catId
    && b.start_date <= txDate
    && b.end_date >= txDate
);
if (match) update.budget_id = match.id;
```

### 8.5 Módulo de Planificación

La página de Planificación tiene dos tabs: **Presupuestos** y **Metas**.

**Presupuestos:**
Cada tarjeta de presupuesto muestra:
- Barra de progreso total (azul < 70%, ámbar 70-99%, rojo ≥ 100%)
- Si tiene `frequency`, también muestra la barra del período actual
- Botón "Historial" si hay presupuestos vencidos
- Botón "Renovar" que crea un nuevo presupuesto con fechas corridas

```typescript
const totalPct = pct(b.spent, b.total_budget);
const curPct = currentPeriod ? pct(currentPeriod.spent, currentPeriod.amount) : 0;
```

**Metas:**
El botón "Mover fondos" abre un modal con un toggle Aportar/Retirar. Dependiendo de la selección, llama a `contributeGoal` o `withdrawGoal`. El modal muestra el saldo actual de la cuenta seleccionada para facilitar la decisión.

### 8.6 Módulo de Análisis

Es la página más extensa del frontend (1,881 líneas). Carga al inicio: `getTransactions({limit:500})`, `getDashboard()`, `getBudgets()`, `getGoals()`, `getRecurring()`.

**Resumen del mes actual (siempre visible):**
- Balance neto del mes con variación vs mes anterior
- Tasa de ahorro
- Día de la semana con mayor gasto promedio
- Categoría de mayor gasto
- El presupuesto más cerca de su límite

**Selector de período temporal:**
Un componente `ChipPills` permite cambiar el rango de análisis: 15d, 1m, 3m, 6m, 1y, personalizado (mínimo 15 días). Todos los cálculos de Estadísticas y Patrones son reactivos a este selector.

**Tres modales:**

*Modal Estadísticas*: KPIs del período (ingresos, gastos, ahorro neto, comparativa vs período anterior), desglose mensual en BarChart agrupado, distribución por categoría en PieChart.

*Modal Patrones*: distribución de gastos por categoría (barras horizontales), patrón por día de la semana (heatmap), comparativa ingresos vs gastos en BarChart.

*Modal Laboratorio IA*: chat conversacional con múltiples sesiones. Las sesiones se guardan en `localStorage` por día y se reinician a medianoche. Tiene un botón "✨ Recomendaciones" que llama a `aiRecommendations()` y puede mostrar acciones inline para crear presupuestos o metas directamente desde el chat.

### 8.7 Módulo de Categorías

Además del CRUD estándar, la página de Categorías integra la función de sugerencia de descripción con IA. Al hacer clic en el botón ✨ junto al campo descripción, el sistema llama a `POST /ai/suggest-category-description` con el nombre, emoji y tipo de la categoría para obtener una descripción de ≤10 palabras que explica qué tipo de transacciones pertenecen a esa categoría.

---

## 9. Integración con Inteligencia Artificial

### 9.1 Diseño General de la Integración

La integración de IA en Monedge sigue el principio de **IA como capa de servicio, no como núcleo**. Esto significa que el sistema es completamente funcional sin IA: si la API key no está configurada, todas las funciones de IA devuelven respuestas de fallback y el resto del sistema opera normalmente.

El cliente de Gemini se instancia de forma lazy (singleton) en `ai_service.py`:
```python
_client: genai.Client | None = None

def _get_client() -> genai.Client:
    global _client
    if _client is None:
        _client = genai.Client(api_key=settings.GOOGLE_AI_API_KEY)
    return _client
```

### 9.2 Funcionalidad 1: Autocategorización

`POST /ai/categorize` recibe descripción y monto de una transacción y devuelve la categoría más apropiada de la lista del usuario.

**Diseño del prompt:**
```
Eres un asistente de finanzas personales. 
Descripción: {descripción}
Monto: ${monto}
Categorías disponibles:
- Alimentación 🍽️: Comida diaria por necesidad...
- Transporte 🚗: Moverse de un lugar a otro...
...
Responde SOLO con JSON: {"category_name": "nombre", "emoji": "emoji"}
```

La lista de categorías se incluye dinámicamente con las descripciones completas de cada categoría, lo que mejora significativamente la precisión de la clasificación.

**Manejo de errores:**
Si Gemini devuelve texto no parseabledcomo JSON, se usa regex para extraer el bloque `{...}`. Si falla, se devuelve `"Otros gastos"` como fallback.

### 9.3 Funcionalidad 2: Resumen Mensual

`GET /ai/summary` genera un resumen en 1-2 oraciones del estado financiero del mes actual. El prompt incluye: balance total, ingresos, gastos, top 3 presupuestos con su porcentaje, top 3 metas con su progreso.

Ejemplo de salida: *"Este mes has ingresado $18,500 y gastado $12,300, manteniendo una tasa de ahorro del 33%. Tu presupuesto de Entretenimiento ya está al 78%, considera moderar los gastos en esa categoría."*

### 9.4 Funcionalidad 3: Recomendaciones con Acciones

`GET /ai/recommendations` es la funcionalidad de IA más sofisticada del dashboard. Devuelve un JSON con:
- `text`: dos recomendaciones concretas con números
- `actions`: hasta una acción sugerida (crear presupuesto o meta) con los datos prellenados

El laboratorio de IA puede renderizar estas acciones como formularios inline que el usuario confirma para crear el presupuesto o meta directamente desde el chat.

### 9.5 Funcionalidad 4: Consultas Rápidas

`POST /ai/query` responde preguntas en lenguaje natural sobre los últimos 30 días del usuario. El contexto incluye: totales de ingresos y gastos, desglose por categoría, y una muestra de las 20 transacciones más recientes. La respuesta se limita a 2-3 oraciones para mantener la interfaz limpia.

### 9.6 Funcionalidad 5: Laboratorio de Análisis Profundo

`POST /ai/analyze` es la funcionalidad más poderosa. Antes de llamar a Gemini, el backend ejecuta un conjunto de aggregaciones SQL reales sobre los datos del usuario:

**Aggregaciones precalculadas:**
- Totales globales (ingresos, gastos, tasa de ahorro)
- Desglose mensual (income, expense, savings por mes)
- Tendencia de gastos (regresión lineal simple)
- Top 8 categorías de gasto
- Patrones por día de la semana (promedio de gasto por día)
- Gastos recurrentes detectados (misma descripción > 1 vez)
- Estado de presupuestos y metas

Todos estos datos se serializan como JSON y se incluyen en el prompt a Gemini:
```
DATOS REALES DEL USUARIO (últimos 6 meses):
Totales: ingresos $X | gastos $Y | tasa ahorro Z%
Tendencia de gastos: en aumento / estable / en descenso
Día con mayor gasto promedio: Viernes
...
```

Gemini devuelve:
```json
{
  "text": "análisis directo con hallazgo principal",
  "chart": {"type": "bar", "title": "...", "data": [...]},
  "metrics": [{"label": "Gasto diario promedio", "value": "$450"}]
}
```

El frontend renderiza el chart dinámicamente con Recharts según el tipo devuelto (`bar`, `line`, `pie`).

**Modo de pensamiento:**
Para el análisis profundo, se habilita el modo de pensamiento de Gemini con 8,000 tokens de presupuesto, lo que permite al modelo razonar antes de responder. Si el modelo no soporta este modo, hay un fallback automático:
```python
try:
    response = await client.generate_content(
        model=settings.GEMMA_MODEL,
        contents=prompt,
        config=thinking_cfg
    )
except Exception as e:
    if "thinking" in str(e).lower():
        response = await client.generate_content(...)  # sin thinking
    else:
        raise
```

### 9.7 Funcionalidad 6: Sugerencia de Descripción para Categorías

`POST /ai/suggest-category-description` genera una descripción de ≤10 palabras para una categoría personalizada. Se usa en la página de Categorías para ayudar al usuario a definir qué transacciones pertenecen a cada categoría, lo que también mejora la precisión de la autocategorización.

### 9.8 Estrategias de Robustez ante Fallos de Parseo

Gemini ocasionalmente rompe el formato JSON por incluir comillas sin escapar dentro de strings, usar comillas simples en lugar de dobles, o agregar texto antes/después del JSON. Se implementaron tres estrategias en cascada:

**Estrategia 1**: Limpiar bloques markdown (```json ... ```) y parsear directamente.

**Estrategia 2**: Corregir escapes inválidos con regex antes de parsear:
```python
clean = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', json_str)
data = json.loads(clean)
```

**Estrategia 3**: Extraer el campo `text` por regex cuando el JSON está irrecuperable:
```python
text_match = re.search(
    r'"text"\s*:\s*"(.*?)"(?:\s*,\s*"(?:chart|metrics)"|\s*})',
    json_str, re.DOTALL
)
```

Si las tres fallan, se devuelve el texto en bruto truncado a 600 caracteres.

---

## 10. Seguridad del Sistema

### 10.1 Autenticación con JWT en Cookie HttpOnly

La decisión de almacenar el JWT en una cookie HttpOnly en lugar de `localStorage` o `sessionStorage` es la medida de seguridad más importante del sistema.

**¿Por qué no localStorage?**
`localStorage` es accesible desde JavaScript, lo que lo hace vulnerable a ataques XSS (Cross-Site Scripting). Si un atacante logra inyectar código JavaScript malicioso en la página, puede robar el token y suplantar al usuario. Una cookie HttpOnly es completamente inaccesible para JavaScript: el navegador la envía automáticamente en cada petición, pero ningún script puede leerla.

**Configuración de la cookie:**
```python
response.set_cookie(
    key="access_token",
    value=token,
    httponly=True,   # Inaccesible para JavaScript
    samesite="lax"   # Protección CSRF básica
)
```

`samesite="lax"` permite que la cookie se envíe en navegaciones normales entre páginas pero no en solicitudes cross-site de recursos (imágenes, iframes), proporcionando protección básica contra CSRF.

### 10.2 Configuración de CORS

El middleware CORS de FastAPI restringe los orígenes permitidos al valor de `FRONTEND_URL`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],  # Solo http://localhost:3000
    allow_credentials=True,  # Necesario para que el navegador envíe cookies
    allow_methods=["*"],
    allow_headers=["*"],
)
```

`allow_credentials=True` es necesario para que el navegador incluya la cookie en las peticiones cross-origin. Sin esto, las peticiones del frontend (puerto 3000) al backend (puerto 8000) no enviarían la cookie.

### 10.3 Protección de Rutas en Frontend

El middleware de Next.js intercepta todas las peticiones al servidor y redirige:
- `/panel/*` sin cookie → `/login`
- `/login` o `/register` con cookie → `/panel`

Esta protección opera en el servidor (Edge Runtime), no en el cliente, lo que la hace más robusta que verificaciones en componentes de React.

### 10.4 Aislamiento de Datos por Usuario

Todos los servicios del backend reciben `user_id` y lo incluyen en todas las queries:

```python
select(Transaction).where(
    Transaction.user_id == user_id,  # Siempre filtrado por usuario
    ...
)
```

Esto garantiza que un usuario autenticado nunca puede acceder a los datos de otro usuario, incluso si conoce el UUID de sus recursos.

### 10.5 Validación de Entrada

Pydantic valida automáticamente todos los cuerpos de petición. Campos no declarados en el schema son ignorados. Tipos incorrectos generan un error 422 automático. Esto previene inyección de campos inesperados y errores de tipo que podrían causar comportamientos inesperados en la lógica de negocio.

---

## 11. Pruebas y Validación

### 11.1 Estrategia de Pruebas

Dada la naturaleza académica y el tamaño del equipo, se adoptó una estrategia de **pruebas manuales estructuradas** complementadas con scripts de seed reproducibles.

Los criterios de aceptación para cada módulo fueron:

| Módulo | Criterios de aceptación |
|---|---|
| Autenticación | Registro completo en 3 pasos; login genera cookie; rutas protegidas redirigen |
| Billetera | CRUD completo; balance actualiza al agregar tx; abono a crédito correcto |
| Movimientos | Filtros funcionan combinados; autocategorización responde en < 3s; recurrentes aplican correctamente |
| Planificación | Presupuesto muestra spent correcto; renovar crea nuevo período; contribute/withdraw mueve fondos |
| Análisis | Estadísticas calculan correctamente; Gemini responde; chart se renderiza dinámicamente |
| Categorías | CRUD; seed no duplica; sugerencia IA rellena descripción |

### 11.2 Scripts de Seed

Se desarrollaron dos scripts de seed complementarios para facilitar las pruebas:

**`seed_data.py` (raíz del proyecto):**
Crea un usuario de prueba `demo@monedge.dev` vía la API REST, elimina datos previos y genera datos aleatorios realistas:
- 2 cuentas líquidas (BBVA Débito + Nu Ahorro)
- Ingresos quincenales fijos mayores a los gastos
- Gastos aleatorios distribuidos entre categorías con un cap del 60% del ingreso mensual
- Presupuestos y metas relacionados con los gastos
- Recurrentes (Netflix, gimnasio, etc.)

```bash
python seed_data.py                             # demo@monedge.dev / demo1234
python seed_data.py --email tu@email.com -p pw  # credenciales custom
python seed_data.py --months 6                  # 6 meses de historia
```

**`backend/seed_demo.py`:**
Inserta directamente en la base de datos un escenario narrativo completo:
- 4 cuentas: BBVA Corriente, Efectivo, CETES (ahorro), Amex Oro (crédito con $50,000 límite)
- 4 meses de transacciones reales (febrero-mayo 2026)
- Cuotas de iPhone y MacBook como recurrentes activos con end_date definida
- Presupuestos por categoría con historial de gastos consistente

### 11.3 Validación de la Lógica de IA

Para validar la robustez de la integración con Gemini se probaron los siguientes casos:

| Caso de prueba | Resultado esperado | Resultado obtenido |
|---|---|---|
| Prompt con JSON bien formado | Parseo directo | ✅ Correcto |
| Respuesta con comillas sin escapar | Estrategia 2 (regex) activa | ✅ Recuperado |
| Respuesta con texto antes del JSON | Estrategia 1 limpia el texto | ✅ Correcto |
| JSON completamente roto | Estrategia 3 extrae `text` | ✅ Texto recuperado |
| API key inválida | Fallback sin IA | ✅ Mensaje de fallback |
| Timeout de Gemini (>30s) | Exception manejada | ✅ Error controlado |

### 11.4 Pruebas de Consistencia de Datos

Se verificó manualmente que las invariantes del sistema se mantienen:

1. **Balance de cuentas**: después de registrar y eliminar una transacción, el balance debe regresar al valor original. ✅
2. **Spent de presupuesto**: el `spent` mostrado debe coincidir con la suma de transacciones con `budget_id` asignado. ✅
3. **Saved amount de meta**: después de un aporte y un retiro del mismo monto, `saved_amount` debe ser igual al valor inicial. ✅
4. **Balance de crédito**: después de un abono, el crédito disponible debe incrementar en el monto abonado y la cuenta líquida debe decrementar. ✅

---

## 12. Resultados

### 12.1 Funcionalidades Implementadas

Al cierre del proyecto, el sistema cuenta con:

| Módulo | Funcionalidades | Estado |
|---|---|---|
| Autenticación | Register 3 pasos, login, logout, me, OAuth Google (backend) | ✅ Completo |
| Billetera | CRUD cuentas 4 tipos, pago de crédito con preview | ✅ Completo |
| Movimientos | CRUD transacciones, paginación incremental, 6 filtros, recurrentes con end_date | ✅ Completo |
| Planificación | Presupuestos con períodos múltiples, renovar, metas con contribute/withdraw | ✅ Completo |
| Dashboard | 4 KPIs, alertas contextuales, top cuentas/presupuestos/metas, resumen IA | ✅ Completo |
| Análisis | Estadísticas por período, patrones por día, Laboratorio IA con sesiones | ✅ Completo |
| Categorías | CRUD, seed de 14 categorías con descriptions, sugerencia IA | ✅ Completo |
| IA | Autocategorización, resumen, recomendaciones+acciones, query rápida, análisis profundo, suggest-description | ✅ Completo (6 endpoints) |

### 12.2 Métricas del Proyecto

| Métrica | Valor |
|---|---|
| Líneas de código (backend) | ~2,700 líneas Python |
| Líneas de código (frontend) | ~6,500 líneas TypeScript/TSX |
| Endpoints de API | 35 endpoints REST |
| Tablas de base de datos | 7 tablas + relaciones |
| Funcionalidades IA | 6 endpoints de IA distintos |
| Semanas de desarrollo | 16 semanas |

### 12.3 Demostraciones de Casos de Uso

**Caso 1: Flujo completo de nuevo usuario**
Un nuevo usuario se registra en 3 pasos (sus datos, elige categorías por defecto, crea su primera cuenta). Al llegar al dashboard, el sistema muestra sus KPIs en cero pero ya tiene 14 categorías listas para usar. Al registrar su primera transacción y escribir "Starbucks" en la descripción, el botón ✨ sugiere automáticamente la categoría "Alimentación". El dashboard actualiza en tiempo real.

**Caso 2: Análisis con IA**
Después de 2 meses de uso, el usuario abre el Laboratorio IA y escribe: "¿En qué categoría gasto más los viernes?". El sistema ejecuta las aggregaciones SQL, construye el contexto con los datos reales y Gemini responde con el análisis específico, generando una gráfica de barras por día de la semana y métricas como el gasto promedio por viernes.

**Caso 3: Gestión de crédito**
El usuario tiene una Amex Oro con $50,000 de límite y $32,000 disponible ($18,000 de deuda). Hace un abono de $5,000 desde su cuenta BBVA. El sistema actualiza: BBVA queda en $43,000 y Amex queda con $37,000 disponible. El dashboard refleja la deuda actualizada como $13,000.

---

## 13. Conclusiones y Trabajo Futuro

### 13.1 Conclusiones

**Sobre el desarrollo del sistema:**

El proyecto Monedge demuestra que es posible construir una aplicación financiera funcional, completa y con IA en un semestre académico, siempre que las decisiones de arquitectura sean adecuadas desde el inicio. La separación cliente-servidor en arquitectura T, la adopción de un stack tecnológico moderno (FastAPI + Next.js 16 + PostgreSQL async) y la integración de Gemini 2.5 Flash como capa de servicio permitieron iterar con velocidad sin sacrificar calidad.

Las decisiones más impactantes en términos de productividad fueron: el uso de modales en lugar de páginas dedicadas para CRUD (eliminó docenas de rutas y estados de navegación), la actualización de balance en tiempo real en el servicio de transacciones (eliminó la necesidad de recalcular desde la base de datos), y el diseño de prompts con formato JSON forzado + estrategias de fallback en cascada (eliminó la fragilidad de la integración IA).

**Sobre la aplicación de PMBOK:**

La adopción del estándar PMBOK aportó estructura y visibilidad al proyecto. El Acta de Constitución formalizó el alcance y los criterios de éxito desde el principio, evitando el crecimiento no controlado de funcionalidades (scope creep). El Registro de Riesgos identificó anticipadamente los problemas más frecuentes (JSON inválido de Gemini, límites del free tier), permitiendo diseñar soluciones antes de que ocurrieran.

La gestión del cronograma iterativa, asignando módulos completos (backend + frontend) a cada semana, garantizó que el sistema siempre tuviera un estado funcional y demostrable, reduciendo el riesgo de integración al final del proyecto.

**Sobre la integración de IA:**

La integración de Gemini 2.5 Flash validó la hipótesis central del proyecto: la IA generativa puede democratizar el análisis financiero. Funcionalidades que antes requerían un analista financiero (identificar patrones de gasto, calcular proyecciones, recomendar ajustes presupuestales) ahora están disponibles para cualquier usuario mediante una conversación en lenguaje natural.

El diseño de la función `analyze_query` —que ejecuta aggregaciones SQL reales antes de llamar a Gemini— es el aporte técnico más significativo del proyecto. Este patrón garantiza que las respuestas de la IA estén ancladas en datos reales del usuario, eliminando la posibilidad de alucinaciones numéricas.

### 13.2 Trabajo Futuro

**Corto plazo (mejoras inmediatas):**

- Reemplazar `confirm()` nativo en la página de Billetera por el patrón de modal propio usado en el resto del sistema.
- Activar el modal `payTarget` en Movimientos para recurrentes de crédito que actualmente aplican sin confirmación.
- Implementar el campo `goal_id` en el formulario de transacciones regulares para permitir contribuciones a metas sin pasar por la página de Planificación.
- Activar las cards ocultas en Análisis: Calendario Financiero y Seguimiento.

**Mediano plazo (extensiones funcionales):**

- **Sincronización bancaria**: integración con APIs de Open Banking o scrapers para importar transacciones automáticamente.
- **Exportación de datos**: generación de reportes en PDF o CSV para compartir con el contador o para archivos personales.
- **Notificaciones**: alertas por correo o push cuando un presupuesto supera el 80% o cuando se acerca la fecha de una meta.
- **Soporte multimoneda**: permitir cuentas en diferentes divisas con conversión automática.
- **App móvil**: una Progressive Web App (PWA) o aplicación React Native que comparta el mismo backend.

**Largo plazo (visión de producto):**

- **Modo familiar**: múltiples usuarios en una misma instancia con presupuestos compartidos.
- **Proyecciones financieras**: modelos predictivos de gastos futuros basados en el historial.
- **Integración con instrumentos de inversión**: conexión con APIs de CETES, fondos de inversión o criptomonedas para incluir el portafolio completo.

---

## 14. Referencias

1. Project Management Institute. (2021). *A Guide to the Project Management Body of Knowledge (PMBOK® Guide) – Seventh Edition*. PMI.

2. Porcello, E., & Banks, A. (2023). *Learning React: Modern Patterns for Developing React Apps* (2nd ed.). O'Reilly Media.

3. Tiangolo, S. (2023). *FastAPI Documentation*. Recuperado de https://fastapi.tiangolo.com

4. Next.js Team. (2024). *Next.js 14 App Router Documentation*. Vercel. Recuperado de https://nextjs.org/docs

5. SQLAlchemy Authors. (2023). *SQLAlchemy 2.0 Documentation*. Recuperado de https://docs.sqlalchemy.org

6. Google. (2024). *Gemini API Documentation*. Google AI for Developers. Recuperado de https://ai.google.dev

7. Fielding, R. T. (2000). *Architectural Styles and the Design of Network-based Software Architectures* [Doctoral dissertation]. University of California, Irvine.

8. Richardson, L., & Amundsen, M. (2013). *RESTful Web APIs*. O'Reilly Media.

9. Fowler, M. (2002). *Patterns of Enterprise Application Architecture*. Addison-Wesley.

10. Brown, S. (2023). *The C4 Model for Visualising Software Architecture*. Recuperado de https://c4model.com

11. OWASP Foundation. (2023). *OWASP Top Ten*. Recuperado de https://owasp.org/www-project-top-ten/

12. Pydantic Authors. (2023). *Pydantic V2 Documentation*. Recuperado de https://docs.pydantic.dev

13. Tailwind CSS Authors. (2024). *Tailwind CSS v4 Documentation*. Recuperado de https://tailwindcss.com

14. Docker Inc. (2023). *Docker Compose Documentation*. Recuperado de https://docs.docker.com/compose/

15. Recharts Authors. (2023). *Recharts Documentation*. Recuperado de https://recharts.org

---

## 15. Anexos

### Anexo A: Tabla Completa de Endpoints API

| Método | Ruta | Body / Params | Respuesta |
|---|---|---|---|
| POST | /auth/register | {email, full_name, password, use_default_categories?} | UserOut |
| POST | /auth/login | {email, password} | {message} + cookie |
| POST | /auth/logout | — | {message} |
| GET | /auth/me | — | UserOut |
| GET | /auth/google | — | {url} |
| GET | /auth/google/callback | ?code= | {message} + cookie |
| GET | /dashboard | — | DashboardOut |
| GET | /accounts | — | Account[] |
| POST | /accounts | {name, bank?, balance, type, credit_limit?} | Account |
| PUT | /accounts/{id} | campos parciales | Account |
| DELETE | /accounts/{id} | — | 204 |
| POST | /accounts/{id}/pay | {from_account_id, amount} | Account[] |
| GET | /categories | ?type=income\|expense | Category[] |
| POST | /categories | {name, emoji?, color?, type, description?} | Category |
| PUT | /categories/{id} | {name?, emoji?, color?, description?} | Category |
| DELETE | /categories/{id} | — | 204 |
| POST | /categories/seed | — | 204 |
| GET | /transactions | ?start_date&end_date&limit(≤500) | Transaction[] |
| POST | /transactions | {description, amount, type, date, category_id?, account_id?, budget_id?, goal_id?} | Transaction |
| PUT | /transactions/{id} | campos parciales | Transaction |
| DELETE | /transactions/{id} | — | 204 |
| GET | /budgets | — | BudgetOut[] |
| POST | /budgets | {name, amount, start_date, end_date, category_id?, is_recurring?, frequency?} | BudgetOut |
| PUT | /budgets/{id} | campos parciales | BudgetOut |
| DELETE | /budgets/{id} | — | 204 |
| POST | /budgets/{id}/renew | — | BudgetOut |
| GET | /goals | — | Goal[] |
| POST | /goals | {name, emoji?, target_amount, saved_amount?, deadline?} | Goal |
| PUT | /goals/{id} | campos parciales | Goal |
| DELETE | /goals/{id} | — | 204 |
| POST | /goals/{id}/contribute | {account_id, amount} | Goal |
| POST | /goals/{id}/withdraw | {account_id, amount} | Goal |
| GET | /recurring | — | RecurringTransaction[] |
| POST | /recurring | {name, amount, type, frequency, next_date?, end_date?, category_id?, account_id?, budget_id?, goal_id?, is_active} | RecurringTransaction |
| PUT | /recurring/{id} | campos parciales | RecurringTransaction |
| DELETE | /recurring/{id} | — | 204 |
| POST | /recurring/{id}/apply | {payment_account_id?} | Transaction |
| POST | /ai/categorize | {description, amount} | {category_name, emoji, category_id} |
| GET | /ai/summary | — | {text} |
| GET | /ai/recommendations | — | {text, actions} |
| POST | /ai/query | {query} | {text} |
| POST | /ai/analyze | {query, history?} | {text, chart, metrics} |
| POST | /ai/suggest-category-description | {name, emoji?, type} | {description} |

### Anexo B: Estructura de Archivos del Proyecto

```
Monedge/
├── docker-compose.yml
├── seed_data.py
├── REPORTE.md
├── CLAUDE.md
├── .docs/
│   ├── BACKEND.md
│   ├── FRONTEND.md
│   └── DESARROLLO.md
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── .env
│   ├── seed_demo.py
│   └── app/
│       ├── main.py
│       ├── core/
│       │   ├── config.py
│       │   ├── database.py
│       │   ├── security.py
│       │   └── deps.py
│       ├── models/
│       │   ├── user.py
│       │   ├── account.py
│       │   ├── category.py
│       │   ├── transaction.py
│       │   ├── budget.py
│       │   ├── goal.py
│       │   └── recurring_transaction.py
│       ├── schemas/
│       │   ├── user.py
│       │   ├── account.py
│       │   ├── category.py
│       │   ├── transaction.py
│       │   ├── budget.py
│       │   ├── goal.py
│       │   ├── recurring_transaction.py
│       │   └── dashboard.py
│       ├── services/
│       │   ├── user_service.py
│       │   ├── account_service.py
│       │   ├── category_service.py
│       │   ├── transaction_service.py
│       │   ├── budget_service.py
│       │   ├── goal_service.py
│       │   ├── recurring_service.py
│       │   └── ai_service.py
│       └── api/
│           ├── auth.py
│           ├── accounts.py
│           ├── categories.py
│           ├── transactions.py
│           ├── budgets.py
│           ├── goals.py
│           ├── recurring.py
│           ├── dashboard.py
│           └── ai.py
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── tsconfig.json
    └── app/
        ├── layout.tsx
        ├── globals.css
        ├── middleware.ts
        ├── page.tsx
        ├── (auth)/
        │   ├── login/page.tsx
        │   └── register/page.tsx
        ├── panel/
        │   ├── layout.tsx
        │   ├── page.tsx
        │   ├── billetera/page.tsx
        │   ├── movimientos/page.tsx
        │   ├── planificacion/page.tsx
        │   ├── analisis/page.tsx
        │   └── categorias/page.tsx
        └── lib/
            ├── types.ts
            ├── api.ts
            └── toast.tsx
```

### Anexo C: Variables de Entorno

```env
# backend/.env
DATABASE_URL=postgresql+asyncpg://admin:adminpassword@db:5432/monedge_app
SECRET_KEY=clave_secreta_larga_y_aleatoria
FRONTEND_URL=http://localhost:3000
GOOGLE_AI_API_KEY=          # Obtener en aistudio.google.com
GEMMA_MODEL=gemini-2.5-flash
ANALYZE_THINKING_BUDGET=8000  # Tokens de pensamiento para /ai/analyze (0 = desactivado)
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### Anexo D: DashboardOut — Forma Completa del Objeto

```typescript
interface DashboardData {
  total_balance: number;         // Suma de cuentas líquidas
  credit_debt: number;           // Suma de (credit_limit - balance) por tarjeta
  monthly_income: number;        // Ingresos del mes actual
  monthly_expenses: number;      // Gastos del mes actual
  safe_daily_budget: number;     // Presupuesto diario recomendado
  avg_daily_expense: number;     // Promedio diario de los últimos 3 meses
  recent_transactions: Transaction[]; // Últimas 30 transacciones
  accounts: Account[];           // Top 5 por ingreso histórico total
  budgets: BudgetOut[];          // Top 5 más cerca de agotarse
  goals: GoalOut[];              // Top 5 más cerca de completarse
}
```

---

*Documento generado como parte del proyecto integrador de la materia ATE2, Universidad Autónoma de Baja California, 2025-2.*
