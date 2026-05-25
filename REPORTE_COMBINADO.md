# UNIVERSIDAD AUTÓNOMA DE BAJA CALIFORNIA
## FACULTAD DE CIENCIAS QUÍMICAS E INGENIERÍA
### INGENIERÍA EN SOFTWARE Y TECNOLOGÍAS EMERGENTES

---

**Tecnologías Emergentes para el Desarrollo de Soluciones — Clave 40014**

**Reporte Final: Monedge — Gestor de Finanzas Personales con Inteligencia Artificial Generativa**

**López Camal Diego Andrey — 1298580**

Fecha de realización: 08 de febrero de 2026 — 15 de mayo de 2026

Fecha de entrega: 21 de mayo de 2026

---

## Resumen

Este reporte documenta el proceso completo de diseño, gestión y desarrollo de Monedge, una aplicación web de gestión de finanzas personales con inteligencia artificial, desarrollada como proyecto final de la materia Tecnologías Emergentes para el Desarrollo de Soluciones.

El proceso comenzó con una entrevista a profundidad con un usuario real que cambió la dirección del proyecto: el problema no era que la gente careciera de herramientas para registrar sus gastos, sino que ninguna herramienta les quitaba la carga cognitiva de organizarlos. A partir de ese hallazgo se diseñó la arquitectura de información del sistema, se definieron los módulos y flujos de usuario, y se tomaron las decisiones de interfaz bajo principios del Diseño Centrado en el Usuario.

El desarrollo siguió una metodología iterativa con planificación formal del alcance, los hitos y los riesgos desde el inicio. El sistema resultante integra seis módulos funcionales —autenticación, billetera, movimientos, planificación, análisis y categorías— sobre una arquitectura cliente-servidor en forma de T con backend FastAPI, frontend Next.js 16 y base de datos PostgreSQL 15 en Docker. La tecnología emergente central es Gemini 2.5 Flash de Google, integrada en seis funcionalidades distintas de IA.

A lo largo del semestre se enfrentaron problemas técnicos reales —deprecación del modelo de IA original, rediseño completo del sistema de presupuestos, migraciones de esquema sin herramienta dedicada— que se documentan junto con sus soluciones. El sistema es funcional, cubre todas las funcionalidades del MVP y está empaquetado para reproducibilidad en Docker Compose.

---

## Índice

1. Objetivos
2. Introducción Teórica
   - 2.1 Investigación de Usuarios en Ingeniería de Software
   - 2.2 Métodos de Investigación: Cualitativo y Cuantitativo
   - 2.3 Arquitectura de la Información
   - 2.4 Sistemas de la Arquitectura de Información
   - 2.5 Diseño Centrado en el Usuario y Experiencia de Usuario
   - 2.6 Wireframing y Niveles de Prototipado
   - 2.7 Heurísticas de Usabilidad de Nielsen
   - 2.8 Inteligencia Artificial Generativa como Tecnología Emergente
   - 2.9 Arquitecturas de Software para Aplicaciones Web
   - 2.10 Gestión de Proyectos de Software
3. Desarrollo
   - 3.1 Contexto del Problema
   - 3.2 Definición Formal del Proyecto
   - 3.3 Investigación de Usuarios
   - 3.4 Arquitectura de la Información del Sistema
   - 3.5 Análisis de Requisitos
   - 3.6 Decisiones de Arquitectura Técnica
   - 3.7 Diseño de Interfaz de Usuario
   - 3.8 Wireframing y Prototipado
   - 3.9 Stack Tecnológico
   - 3.10 Diseño de la Base de Datos
   - 3.11 Implementación del Backend
   - 3.12 Implementación del Frontend
   - 3.13 Integración de la Tecnología Emergente: IA Generativa
   - 3.14 Seguridad del Sistema
   - 3.15 Proceso de Desarrollo Asistido por Agente de IA
   - 3.16 Problemas Encontrados y Soluciones
4. Resultados
5. Conclusiones
6. Referencias Bibliográficas
7. Anexos

---

## 1. Objetivos

- Identificar las necesidades reales del usuario en el dominio de las finanzas personales mediante investigación cualitativa, validando el problema antes de escribir una sola línea de código.
- Diseñar la arquitectura de información del sistema a partir de los hallazgos de la investigación, definiendo la estructura de navegación, la jerarquía de contenidos y los flujos principales bajo principios teóricos formales.
- Elaborar el diseño de interfaz de usuario mediante wireframes progresivos, estableciendo los patrones visuales, el sistema de componentes y las decisiones de interacción que guiaron la implementación.
- Planificar el proyecto de forma estructurada, definiendo alcance, hitos, riesgos y criterios de calidad desde el inicio del semestre.
- Diseñar una arquitectura de software en forma de T que separe claramente la capa de presentación del backend y justifique las decisiones de interacción clave, como el uso de modales en lugar de páginas completas.
- Implementar un prototipo funcional de aplicación web con seis módulos operativos que integre inteligencia artificial generativa como componente diferenciador central frente a soluciones existentes.
- Documentar las decisiones de diseño técnico, los problemas encontrados y las soluciones aplicadas, generando evidencia del proceso de ingeniería a lo largo del semestre.

---

## 2. Introducción Teórica

### 2.1 Investigación de Usuarios en Ingeniería de Software

La investigación de usuarios es una disciplina sistemática que busca entender cómo las personas realmente se comportan, qué necesitan y en qué contexto van a usar el sistema que se está construyendo. No se trata de preguntarle a la gente qué quiere —porque las personas suelen describir una versión idealizada de su comportamiento, no la real— sino de descubrir los mecanismos detrás de sus acciones [1].

Su relevancia en ingeniería de software viene del problema de proyección: el desarrollador tiende a diseñar para alguien que piensa como él, con su mismo nivel técnico y su misma tolerancia a la complejidad. El usuario final opera desde un modelo mental completamente distinto. Ignorar esa brecha es la causa más frecuente de que un sistema técnicamente correcto sea abandonado en las primeras dos semanas [2].

Nielsen estableció el principio clave de la investigación conductual: observar lo que la gente hace, no solo escuchar lo que dice. Las personas describen un comportamiento ideal cuando se les pregunta sobre sus hábitos, pero actúan diferente en la práctica. Esa diferencia —la brecha actitudinal-conductual— es especialmente clara en el dominio de las finanzas personales, donde casi todo el mundo dice que le gustaría llevar un registro de sus gastos, pero en la práctica abandona cualquier herramienta que tome más de dos minutos por sesión [4].

El resultado más valioso de una buena investigación es el *insight*: una comprensión que no es evidente a partir de los datos en bruto, sino que emerge al interpretar por qué el usuario se comporta como se comporta. Un dato es que el usuario usa Excel para sus finanzas; el insight es que Excel le genera ansiedad porque lo obliga a inventar su propio sistema de organización desde cero [3].

### 2.2 Métodos de Investigación: Cualitativo y Cuantitativo

Rohrer propone un marco para elegir el método de investigación según el tipo de pregunta que se quiere responder [2]. Los dos ejes principales son la dimensión **cualitativa vs cuantitativa** y la dimensión **actitudinal vs conductual**.

La **investigación cualitativa** responde preguntas de "por qué" y "cómo". Analiza motivaciones y modelos mentales a través de entrevistas, observaciones directas y sesiones de *think-aloud*. Su limitación es que no es estadísticamente representativa; su fortaleza es que produce requisitos funcionales basados en problemas reales.

La **investigación cuantitativa** responde preguntas de "cuánto" y "con qué frecuencia". Usa analítica web, encuestas masivas y pruebas A/B para identificar patrones estadísticos. No explica el porqué, pero permite priorizar el trabajo.

**Tabla 1. Comparativo de métodos de investigación de usuarios**

| Característica | Investigación Cualitativa | Investigación Cuantitativa |
|---|---|---|
| Pregunta que responde | ¿Por qué? ¿Cómo? | ¿Cuánto? ¿Con qué frecuencia? |
| Tipo de datos | Transcripciones, observaciones | Estadísticas, tasas |
| Técnicas principales | Entrevista a profundidad, think-aloud | Encuestas, analítica web, A/B |
| Tamaño de muestra | Pequeño (5–10 participantes) | Grande (cientos o miles) |
| Valor para ingeniería | Define requisitos basados en problemas reales | Prioriza el backlog por frecuencia y severidad |
| Riesgo | No representativo estadísticamente | No explica el "por qué" |

### 2.3 Arquitectura de la Información

La Arquitectura de la Información (AI) es la práctica de organizar y estructurar el contenido de un sistema para que el usuario pueda encontrar lo que busca y entender dónde está en todo momento. Rosenfeld, Morville y Arango la definen como el diseño estructural de ambientes de información: cómo se organiza, etiqueta, busca y navega el contenido de una aplicación [6].

El concepto central es la **ontología**: antes de diseñar menús o pantallas, hay que definir qué categorías de información existen y cómo se relacionan. En finanzas personales, existe una diferencia fundamental entre una *categoría* (etiqueta genérica como "Alimentación") y un *presupuesto* (límite específico definido por el usuario). Confundir estos conceptos produce una arquitectura que el usuario no puede entender, aunque sea técnicamente funcional.

Wodtke y Govella señalan que las aplicaciones digitales no tienen las señales físicas del mundo real —muros, pasillos, letreros— que dicen al usuario dónde está. Una buena arquitectura de información crea esas señales artificialmente respondiendo tres preguntas en cualquier punto: *¿Dónde estoy?, ¿De dónde vengo? y ¿A dónde puedo ir?* [7].

### 2.4 Sistemas de la Arquitectura de Información

Rosenfeld et al. identifican cuatro sistemas interdependientes en toda arquitectura de información [6]:

**Sistemas de Organización (Taxonomías):** Determinan cómo se agrupa el contenido. En Monedge, las categorías financieras son el sistema de organización primario que permiten clasificar y después analizar cada transacción.

**Sistemas de Etiquetado:** Los términos usados para nombrar secciones y acciones impactan directamente la comprensión. Elegir "Movimientos" en lugar de "Transacciones" fue una decisión de etiquetado: "transacción" es terminología bancaria formal; "movimiento" es cómo la gente habla de sus gastos en la vida cotidiana.

**Sistemas de Navegación:** Proporcionan contexto espacial. Para Monedge, esto significó que desde cualquier módulo el usuario puede volver al Dashboard con un clic, garantizando orientación permanente.

**Sistemas de Búsqueda y Metadatos:** Los filtros de Movimientos —por fecha, categoría, tipo y rango de monto— son el sistema de búsqueda sobre los metadatos de cada transacción.

### 2.5 Diseño Centrado en el Usuario y Experiencia de Usuario

El Diseño Centrado en el Usuario (DCU) es un enfoque que pone las necesidades, capacidades y limitaciones del usuario final en el centro de todas las decisiones de diseño. Norman establece el principio fundamental: la tecnología debe adaptarse al usuario, no al contrario [5]. Ese principio contradice el impulso natural del ingeniero, que tiende a diseñar para un usuario que comparte su nivel técnico.

Garrett propone un modelo de cinco planos para describir la experiencia de usuario, de lo abstracto a lo concreto [11]: Estrategia → Alcance → Estructura → Esqueleto → Superficie. Este modelo es útil porque expone el error más común en el desarrollo: empezar por la superficie (¿de qué color ponemos el botón?) sin haber resuelto los planos inferiores (¿qué problema resuelve ese botón?). En Monedge el proceso siguió el modelo de abajo hacia arriba: investigación → arquitectura de información → wireframing → implementación.

### 2.6 Wireframing y Niveles de Prototipado

El prototipado es el proceso de crear representaciones del producto con diferentes grados de completitud antes de invertir recursos en el desarrollo final. Su valor es que hace baratos de corregir los errores de diseño: cambiar un wireframe toma minutos; cambiar el mismo elemento después de implementado puede tomar horas [8].

El prototipado progresivo sigue tres niveles:

**Baja fidelidad:** Bocetos en papel o esquemas digitales simples, sin colores. El usuario se enfoca en la lógica de navegación, produciendo retroalimentación sobre la arquitectura antes que sobre los detalles visuales.

**Media fidelidad:** Wireframes digitales con estructura visual definida y navegación *click-through*. Permite validar flujos de tarea y detectar problemas de jerarquía visual antes de tocar código.

**Alta fidelidad:** Prototipos que reproducen con exactitud la apariencia y el comportamiento del producto final, incluyendo el sistema de colores, tipografía y microinteracciones.

### 2.7 Heurísticas de Usabilidad de Nielsen

Nielsen formuló diez principios de diseño que funcionan como criterios de evaluación objetivos [4]:

1. **Visibilidad del estado del sistema:** Informar siempre al usuario qué está ocurriendo.
2. **Correspondencia con el mundo real:** Usar el lenguaje del usuario, no terminología técnica.
3. **Control y libertad:** Permitir deshacer acciones sin pasar por diálogos complejos.
4. **Consistencia y estándares:** Las mismas palabras y acciones significan lo mismo en toda la aplicación.
5. **Prevención de errores:** Un buen diseño evita que el error ocurra.
6. **Reconocimiento antes que recuerdo:** Todo lo necesario debe estar visible; el usuario no debería tener que recordar.
7. **Flexibilidad y eficiencia:** Accesos rápidos para usuarios expertos sin complicar la experiencia del nuevo.
8. **Diseño minimalista:** Cada elemento que no aporta genera ruido visual.
9. **Ayuda para reconocer y recuperarse de errores:** Mensajes de error claros con sugerencia de solución.
10. **Ayuda y documentación:** Documentación contextual cuando el sistema no es autoexplicativo.

### 2.8 Inteligencia Artificial Generativa como Tecnología Emergente

Las tecnologías emergentes son aquellas que, por su reciente maduración, representan un diferenciador de valor significativo cuando se integran correctamente. Brenner y Uebernickel señalan que el valor no está en la tecnología en sí sino en la capacidad del equipo para identificar qué problemas del usuario esa tecnología resuelve de forma única [10]. Una tecnología emergente mal aplicada agrega complejidad sin valor; bien aplicada, crea productos que no podrían existir sin ella.

La **Inteligencia Artificial Generativa** se basa en Modelos de Lenguaje de Gran Escala (LLM). Son redes neuronales entrenadas sobre corpus masivos de texto que les permiten generar respuestas contextuales en lenguaje natural. A diferencia de los sistemas basados en reglas, los LLMs pueden inferir la intención del usuario a partir de descripciones ambiguas [22].

**Google Gemini 2.5 Flash** es el modelo utilizado en este proyecto. Ofrece un buen equilibrio entre velocidad de respuesta y capacidad de razonamiento para aplicaciones que necesitan responder en menos de tres segundos. Un aspecto crítico aprendido en el desarrollo: el modelo no tiene acceso a los datos del usuario a menos que el backend se los pase explícitamente en el prompt. La calidad de las respuestas depende directamente de la calidad del contexto que el servidor construye antes de invocar al modelo. El patrón correcto es: calcular las métricas relevantes en SQL, incluirlas en el prompt junto con la pregunta del usuario, y dejar que el modelo solo interprete y formatee los resultados [22].

### 2.9 Arquitecturas de Software para Aplicaciones Web

**REST (Representational State Transfer)** define cómo debe diseñarse una API web para que sea escalable e independiente del cliente que la consume. Una API REST separa completamente el frontend del backend: ambas partes pueden evolucionar de forma independiente mientras respeten el contrato de la API [19].

**FastAPI** es un framework de Python para construir APIs REST de alto rendimiento con validación automática de datos mediante Pydantic y soporte nativo para operaciones asíncronas (`async/await`), permitiendo manejar múltiples solicitudes concurrentes sin bloquear el servidor [25].

La autenticación mediante **JWT (JSON Web Tokens) en cookies HttpOnly** es el mecanismo estándar para aplicaciones web con frontend y backend separados. El token se firma con una clave secreta y contiene el ID del usuario. La cookie HttpOnly impide que JavaScript en el navegador pueda leer el token, mitigando ataques XSS. La combinación con `SameSite=Lax` protege contra ataques CSRF [24].

**Next.js** agrega funcionalidades sobre React relevantes para este proyecto. La más importante es el *middleware* del lado del servidor, que verifica la cookie JWT antes de renderizar cualquier ruta protegida. Esto evita el parpadeo de contenido no autenticado que ocurre en SPAs donde la verificación ocurre en el cliente después de que la página ya se renderizó [26].

### 2.10 Gestión de Proyectos de Software

La gestión estructurada de un proyecto de software implica definir formalmente el alcance, los entregables, los riesgos y los criterios de éxito antes de iniciar el desarrollo. Sin esta definición, los proyectos tienden a expandir su alcance de forma no planificada (*scope creep*), acumular deuda técnica por decisiones improvisadas, y entregar sistemas que no responden a las necesidades reales del usuario.

La metodología adoptada en este proyecto combina planificación formal inicial —acta de constitución, estructura de desglose de trabajo, registro de riesgos— con ejecución iterativa e incremental, donde al final de cada ciclo de trabajo existe un módulo funcional y demostrable. Esta combinación permite tener visibilidad del alcance desde el inicio sin sacrificar la flexibilidad necesaria para responder a los cambios que inevitablemente surgen en el desarrollo real.

---

## 3. Desarrollo

### 3.1 Contexto del Problema

El mercado de aplicaciones de finanzas personales es amplio: desde hojas de cálculo en Excel hasta aplicaciones especializadas como YNAB, Mint o Fintonic. Sin embargo, la tasa de abandono de estas herramientas entre usuarios jóvenes es consistentemente alta. El problema no es la ausencia de opciones, sino la inadecuación de las opciones existentes al modelo mental y estilo de vida del usuario objetivo.

Las aplicaciones más sofisticadas tienen una curva de entrada alta: requieren conectar cuentas bancarias, configurar categorías, establecer presupuestos y entender conceptos contables antes de registrar la primera transacción. Las más simples no ofrecen valor diferencial frente al esfuerzo que exigen. Esta observación planteó la hipótesis de diseño: existe una brecha entre la complejidad de las herramientas existentes y las necesidades reales del usuario universitario joven, brecha que podría cerrarse con automatización por IA y una arquitectura diseñada para minimizar la fricción del uso diario.

#### 3.1.1 Asunciones

| # | Asunción |
|---|---|
| A-01 | Los usuarios acceden desde navegador web moderno (Chrome, Firefox, Edge, Safari — última versión). |
| A-02 | Se requiere conexión a internet permanente; no se soporta modo sin conexión. |
| A-03 | Los usuarios son responsables de la veracidad de los datos que registran. |
| A-04 | La API de Google AI Studio (Gemini) está disponible en el plan gratuito con cuotas suficientes para uso educativo. |
| A-05 | El entorno de ejecución es Docker Compose en máquina local; no se contempla despliegue en la nube. |
| A-06 | Las 14 categorías predefinidas cubren la mayoría de los casos de uso de un estudiante universitario o profesional joven. |

#### 3.1.2 Restricciones

| # | Restricción | Impacto |
|---|---|---|
| R-01 | Desarrollo individual en el tiempo acotado de un semestre. | Limita el alcance funcional y la profundidad de pruebas. |
| R-02 | API de Gemini en nivel gratuito con límites de solicitudes por minuto. | Los prompts se diseñaron para no exceder el límite en uso normal. |
| R-03 | Infraestructura local (Docker Compose); sin servidor en la nube. | No se puede evaluar con usuarios externos sin configuración adicional. |
| R-04 | Stack limitado a herramientas de código abierto o uso gratuito. | No es posible usar Open Banking (Plaid), Vercel Pro u otros servicios de pago. |
| R-05 | Periodo de entrega fijado por el calendario académico. | El alcance está acotado al prototipo funcional documentado. |

#### 3.1.3 Fuera de Alcance

Las siguientes funcionalidades fueron evaluadas y excluidas deliberadamente: integración bancaria directa (Open Banking/Plaid), aplicación móvil nativa, notificaciones push, soporte multimoneda, exportación a formatos contables formales, autenticación con terceros (OAuth Google en frontend), y funcionamiento sin conexión.

---

### 3.2 Definición Formal del Proyecto

#### 3.2.1 Alcance y Entregables

El sistema Monedge comprende seis módulos funcionales: autenticación en tres pasos, billetera (CRUD de cuentas con cuatro tipos y pago de crédito), movimientos (registro de transacciones con filtros avanzados y recurrentes), planificación (presupuestos con períodos múltiples y metas con flujos de fondos), análisis (estadísticas por período, patrones, laboratorio de IA conversacional) y categorías (CRUD con generación de descripción asistida por IA).

Los entregables formales son: repositorio de código fuente, archivo `docker-compose.yml` para despliegue local reproducible, scripts de datos de prueba, documentación técnica y este reporte.

#### 3.2.2 Estructura de Desglose del Trabajo

```
Monedge
├── 1. Planificación y diseño
│   ├── 1.1 Investigación de usuarios (entrevista + análisis)
│   ├── 1.2 Arquitectura de información y flujos
│   ├── 1.3 Wireframing (baja y media fidelidad)
│   └── 1.4 Definición de alcance y registro de riesgos
├── 2. Infraestructura base
│   ├── 2.1 Configuración de Docker Compose
│   ├── 2.2 Diseño de base de datos
│   ├── 2.3 Configuración de FastAPI + PostgreSQL
│   └── 2.4 Configuración de Next.js + middleware
├── 3. Módulo de Autenticación
├── 4. Módulo de Billetera
├── 5. Módulo de Movimientos (transacciones + recurrentes)
├── 6. Módulo de Planificación (presupuestos + metas)
├── 7. Dashboard y KPIs
├── 8. Módulo de Análisis + Laboratorio IA
├── 9. Módulo de Categorías
└── 10. Integración completa de IA (6 endpoints)
```

#### 3.2.3 Hitos del Proyecto

| # | Hito | Fecha |
|---|---|---|
| H-01 | Investigación completada. Insights documentados. | 11/02/2026 |
| H-02 | Arquitectura de información y wireframes finalizados. | 07/03/2026 |
| H-03 | Infraestructura Docker + autenticación funcional. | 14/03/2026 |
| H-04 | Backend MVP (transacciones, cuentas, categorías). | 24/03/2026 |
| H-05 | Frontend MVP con todas las páginas integradas. | 07/04/2026 |
| H-06 | Módulo de IA completo (6 endpoints funcionales). | 10/04/2026 |
| H-07 | Análisis, correcciones y seed data listos. | 30/04/2026 |
| H-08 | Reporte final entregado. | 21/05/2026 |

#### 3.2.4 Registro de Riesgos

**Tabla 2. Registro de riesgos del proyecto Monedge.** (P: Probabilidad, I: Impacto; escala 1-3)

| Código | Factor de Riesgo | P | I | Severidad | Plan de Respuesta | ¿Ocurrió? |
|---|---|---|---|---|---|---|
| RT-01 | Deprecación del modelo de IA durante el desarrollo | 2 | 3 | 6 | Parametrizar `GEMMA_MODEL` en `.env`; lista de modelos alternativos | **Sí** |
| RT-02 | Incompatibilidades entre versiones de dependencias | 2 | 2 | 4 | Fijar versiones exactas en `package.json` y `requirements.txt` | No |
| RT-03 | Fallos en esquema de BD sin herramienta de migración | 2 | 3 | 6 | `ALTER TABLE … ADD COLUMN IF NOT EXISTS` en startup | **Sí** |
| RT-04 | Límite de cuota gratuita de Gemini excedido | 1 | 2 | 2 | Manejar error 429 con mensaje descriptivo; evitar bucles automáticos | **Sí (parcial)** |
| RT-05 | Tiempo insuficiente por carga académica | 3 | 2 | 6 | Priorizar MVP; usar Claude Code para acelerar implementación | **Sí** |
| RT-06 | Expansión no planificada del alcance (*scope creep*) | 2 | 2 | 4 | Evaluar cada nueva funcionalidad contra objetivos del MVP antes de implementarla | **Sí (controlado)** |
| RT-07 | Problemas de usabilidad detectados tardíamente | 2 | 2 | 4 | Revisar con heurísticas de Nielsen al finalizar cada módulo | **Sí** |

#### 3.2.5 Criterios de Calidad

| Criterio | Métrica | Umbral |
|---|---|---|
| Funcionalidad | Módulos completados / planeados | ≥ 90% |
| Flujo principal | Registrar transacción sin error | ≤ 4 pasos desde pantalla principal |
| Consistencia visual | Sistema de diseño aplicado en todas las páginas | 100% |
| Seguridad | Endpoints del panel protegidos con JWT | 100% |
| Robustez IA | Tasa de respuestas de Gemini parseables | ≥ 95% |
| Rendimiento | Carga del dashboard en conexión local | ≤ 3 segundos |

---

### 3.3 Investigación de Usuarios

#### 3.3.1 Planteamiento y selección del método

Para validar la hipótesis de diseño se seleccionó la **entrevista a profundidad** como método de investigación principal. El objetivo era entender el modelo mental del usuario y los mecanismos detrás del abandono de herramientas de finanzas personales, no medir cuántos usuarios tienen ese problema. La investigación cualitativa es el método correcto cuando la pregunta comienza con "por qué" o "cómo" [2].

El perfil del entrevistado: estudiante universitario de 18 a 26 años, con ingresos variables, que había intentado llevar un registro de sus finanzas al menos una vez sin mantenerlo consistentemente.

#### 3.3.2 Guión de entrevista

Se diseñó un guión semiestructurado de diez preguntas en tres bloques:

**Bloque 1 — Comportamiento actual:** ¿Cómo llevas actualmente el registro de tus gastos? ¿Qué es lo más difícil al intentar hacerlo diariamente? ¿Solo ver datos te es suficiente o necesitas análisis? ¿Con qué frecuencia revisas tus datos financieros?

**Bloque 2 — Expectativas sobre IA:** ¿Qué esperas que haga un "asistente de IA para finanzas"? ¿Qué tipo de respuestas esperas? ¿Qué tan autónomo debería ser? ¿Qué funcionalidades mejorarían tu manejo de finanzas?

**Bloque 3 — Privacidad y adopción:** ¿Qué tan importante es para ti el control de tus datos? ¿En qué momento sentirías que el asistente realmente te está ayudando?

> **[IMAGEN 1]** — *Tipo: Captura de pantalla*
> Portada del video de la entrevista almacenado en Google Drive (thumbnail del video con nombre del archivo y fecha visible). Si no se tiene eso, poner una foto del setup de la entrevista (pantalla de Zoom/Meet, cuaderno de notas, etc.).
>
> Enlace de entrevista: https://drive.google.com/file/d/1iKuDm-hTwgfGLEDrqUbyXH84XCjtimbp/view?usp=drive_link

#### 3.3.3 Hallazgos: Insights

El análisis de la entrevista produjo tres insights que reorientaron el diseño completo del sistema:

**Insight 1 — Necesidad de estructura predefinida.** El entrevistado describió Excel como "una hoja en blanco donde tienes que inventar el formato tú mismo". Su problema no era falta de disciplina, sino la ausencia de un sistema predefinido. Este insight definió que Monedge debe proveer categorías, estructura y flujos de trabajo desde el primer uso sin pedir configuración inicial.

**Insight 2 — Categorización sin carga cognitiva.** Decidir a qué categoría pertenece cada gasto le generaba fatiga de decisión. Su modelo ideal era describir el gasto en lenguaje natural y que el sistema lo clasificara solo. Este insight justificó directamente la auto-categorización con IA como funcionalidad central.

**Insight 3 — Automatización como condición de adopción.** La fricción principal no era la dificultad de usar la app sino el esfuerzo de recordar abrirla. Este insight guió la decisión de minimizar los pasos necesarios para registrar una transacción y agregar recurrentes automáticos.

#### 3.3.4 User Personas

**Diego — Estudiante universitario (perfil primario)**
- Edad: 20 años. Carrera: Ingeniería o Administración, UABC Tijuana.
- Ingresos: Variables — beca + freelance ocasional. $4,000–$8,000/mes.
- Comportamiento actual: Intentó Excel dos veces; lo abandonó ambas. Actualmente no lleva registro.
- Frustración principal: Que lo primero que pidan sea configurar categorías y conectar cuentas.
- Expectativa de IA: Que le diga qué está mal y qué hacer, no que muestre más gráficas que él tendría que interpretar.
- Frase representativa: *"Si tengo que acordarme de abrir la app para registrar algo, ya perdí."*

**Andrés — Profesional junior (perfil secundario)**
- Edad: 27 años. Primer empleo formal en empresa de tecnología.
- Ingresos fijos ($18,000/mes) pero múltiples cuentas: débito BBVA, efectivo, Amex Oro.
- Necesidad: Saber si puede darse un gasto grande sin descuadrar el mes. El balance total dice cuánto tiene, pero no si puede gastarlo.

> **[IMAGEN 2]** — *Tipo: Infografía o tarjeta diseñada*
> Tarjeta visual del User Persona "Diego" con foto de stock de un joven universitario, los datos del perfil, la cita representativa y los íconos de sus herramientas actuales (Excel, Excel tachado). Se puede hacer en Canva o con cualquier herramienta de diseño. Mismo formato para "Andrés" como segundo card.

#### 3.3.5 Reflexión sobre la metodología

El reto más difícil durante la entrevista fue controlar el impulso de ofrecer soluciones técnicas al instante. Como desarrollador, la tendencia es detectar un problema e inmediatamente pensar en cómo programarlo.

Practicar el silencio activo —permitir que el entrevistado terminara sus narrativas sin interrumpir— fue la habilidad más difícil y la que produjo los datos más valiosos. Los tres insights que reorientaron el proyecto emergieron en momentos donde el entrevistado elaboró espontáneamente sobre aspectos que el guión no había anticipado. La lección es que la investigación de usuarios no es un formulario a rellenar, sino una conversación a escuchar.

---

### 3.4 Arquitectura de la Información del Sistema

#### 3.4.1 Decisión de plataforma

A partir de los insights de la investigación se tomó la primera decisión de arquitectura: desarrollar el software como **aplicación web** y no como aplicación móvil nativa. El análisis detallado de datos financieros es una actividad que el usuario realiza desde computadora cuando tiene tiempo disponible, no desde el teléfono en movimiento. La captura rápida de transacciones sí ocurre en contextos móviles, pero se puede satisfacer desde el navegador móvil con diseño responsivo.

#### 3.4.2 Modelo jerárquico hub-and-spoke

Se diseñó el sistema bajo una arquitectura de información **jerárquica con nodo central** (*hub-and-spoke*). El Dashboard funciona como nodo central de navegación: desde cualquier módulo, el usuario puede volver al inicio con un clic. Esta estructura garantiza que siempre se respondan las tres preguntas de orientación de Wodtke [7].

```
/ (Landing page)
├── /login
├── /register
└── /panel  ← protegido por autenticación JWT
    ├── /panel              → Inicio (Dashboard)
    ├── /panel/movimientos  → Registro de transacciones + recurrentes
    ├── /panel/billetera    → Gestión de cuentas
    ├── /panel/planificacion → Presupuestos y Metas
    ├── /panel/analisis     → Análisis financiero + Laboratorio IA
    └── /panel/categorias   → Configuración de categorías
```

> **[IMAGEN 3]** — *Tipo: Diagrama*
> Diagrama de árbol de la arquitectura de información de Monedge, con el Dashboard como nodo central destacado y flechas bidireccionales hacia los cinco módulos del panel. Se puede hacer con draw.io, Lucidchart o similar. Mostrar también que `/ (landing)` lleva a `/login` y `/register`, y que estos llevan a `/panel`.

#### 3.4.3 Definición de módulos y propósito único

Cada módulo responde una pregunta única que ningún otro responde. La duplicación de propósito entre secciones genera confusión arquitectónica:

| Módulo | Pregunta que responde |
|---|---|
| Dashboard | ¿Cómo estoy financieramente ahora mismo? |
| Movimientos | ¿Qué ha pasado con mi dinero? |
| Billetera | ¿Dónde está mi dinero? |
| Planificación | ¿Qué estoy planeando hacer con mi dinero? |
| Análisis | ¿Qué tendencias tienen mis finanzas? |
| Categorías | ¿Cómo clasifico mis transacciones? |

#### 3.4.4 Jerarquía de datos

La estructura de datos refleja directamente la arquitectura de información y las relaciones entre los conceptos del dominio:

```
Usuario
├── Cuentas → balance actualizado automáticamente con cada transacción
├── Categorías → 14 predeterminadas + personalizadas del usuario
├── Transacciones → vinculan Cuenta + Categoría + Presupuesto (opcional) + Meta (opcional)
├── Presupuestos → límite por período; el gasto se calcula por etiquetado explícito en transacciones
├── Metas → saved_amount se mueve con operaciones explícitas de aporte y retiro
└── Transacciones Recurrentes → plantillas que generan transacciones reales al ejecutar "apply"
```

---

### 3.5 Análisis de Requisitos

#### 3.5.1 Historias de Usuario

**Épica: Autenticación**
- Como nuevo usuario, quiero registrarme en tres pasos (datos, categorías, primera cuenta) para comenzar a usar el sistema de inmediato.
- Como usuario registrado, quiero iniciar sesión con correo y contraseña para acceder a mis datos de forma segura.

**Épica: Billetera**
- Como usuario, quiero registrar mis cuentas bancarias (corriente, ahorro, efectivo, crédito) para tener un inventario completo de mis recursos.
- Como usuario con tarjeta de crédito, quiero ver cuánto crédito disponible tengo y cuánto debo para entender mi deuda real.
- Como usuario, quiero registrar abonos a mis tarjetas de crédito descontando el dinero de una cuenta líquida para mantener los saldos correctos.

**Épica: Movimientos**
- Como usuario, quiero registrar ingresos y gastos con descripción, monto, fecha, categoría y cuenta para tener un historial detallado.
- Como usuario, quiero que la IA sugiera la categoría correcta al escribir la descripción para agilizar el registro.
- Como usuario, quiero filtrar mis movimientos por tipo, categoría, período y rango de monto para encontrar transacciones específicas.
- Como usuario, quiero programar transacciones recurrentes (salario, Netflix, renta) con frecuencia semanal, quincenal o mensual y una fecha de fin opcional.

**Épica: Planificación**
- Como usuario, quiero crear presupuestos con límite por período y ver qué porcentaje he consumido.
- Como usuario, quiero definir metas de ahorro y aportar dinero desde mis cuentas explícitamente para alcanzarlas.
- Como usuario, quiero poder retirar fondos de una meta de vuelta a mi cuenta en caso de emergencia.

**Épica: Análisis e IA**
- Como usuario, quiero ver estadísticas de mis gastos e ingresos en diferentes períodos temporales.
- Como usuario, quiero hacerle preguntas a la IA sobre mis finanzas en español para obtener respuestas con mis datos reales.
- Como usuario, quiero recibir recomendaciones financieras que pueda aplicar directamente desde la interfaz.

#### 3.5.2 Requisitos No Funcionales

| Requisito | Descripción |
|---|---|
| Seguridad | JWT en cookie HttpOnly; CORS restringido al origen del frontend |
| Privacidad | Los datos del usuario nunca se comparten; la IA solo recibe agregados calculados |
| Responsividad | Funciona correctamente desde 768px de ancho |
| Accesibilidad | Modo oscuro y alto contraste activables desde la interfaz |
| Rendimiento | Dashboard carga en ≤3s local; respuestas de Gemini en ≤8s |
| Reproducibilidad | Sistema levantable con `docker compose up` en cualquier máquina con Docker |

#### 3.5.3 Casos de Uso Principales

**CU-01: Registrar transacción con autocategorización**
(1) Abrir formulario en Movimientos → (2) Ingresar descripción y monto → (3) Clic en ✨ → (4) Sistema envía a `/ai/categorize` → (5) Gemini responde con categoría sugerida → (6) Sistema preselecciona categoría → (7) Usuario confirma y guarda → (8) Backend crea transacción y actualiza balance de cuenta.

**CU-02: Registrar abono a tarjeta de crédito**
(1) Ir a Billetera → (2) Clic en Abonar de la tarjeta → (3) Modal muestra deuda actual y preview post-abono → (4) Ingresar monto y seleccionar cuenta origen → (5) Confirmar → (6) Backend reduce balance líquido y aumenta crédito disponible.

**CU-03: Consulta en Laboratorio IA**
(1) Ir a Análisis → Laboratorio IA → (2) Escribir pregunta en lenguaje natural → (3) Backend ejecuta agregaciones SQL → (4) Envía contexto numérico + pregunta a Gemini → (5) Gemini devuelve texto + gráfica + métricas → (6) Frontend renderiza la gráfica dinámicamente con Recharts.

---

### 3.6 Decisiones de Arquitectura Técnica

#### 3.6.1 Arquitectura en T: Cliente-Servidor

La decisión arquitectónica central es la adopción de una **arquitectura cliente-servidor en forma de T**. Este nombre describe visualmente la estructura del sistema:

- **La barra horizontal (ancho)** representa la capa de presentación: el frontend de Next.js con sus seis módulos funcionales. Esta barra es "ancha" porque cubre mucha superficie funcional visible al usuario.

- **La barra vertical (profundidad)** representa el backend: un único punto de entrada (FastAPI en el puerto 8000) que desciende por capas hacia el núcleo del sistema — routers → servicios → modelos ORM → base de datos → IA. Esta barra es "profunda" porque cada petición puede atravesar cuatro o cinco capas antes de devolver respuesta.

> **[IMAGEN 4]** — *Tipo: Diagrama de arquitectura*
> Diagrama de la arquitectura en T. Arriba: barra horizontal con el nombre de los 6 módulos del frontend (Inicio | Billetera | Movimientos | Planificación | Análisis | Categorías), etiquetada "Next.js — Puerto 3000". Abajo de esa barra, una flecha vertical hacia abajo con la leyenda "HTTP REST + Cookie JWT". Luego la caja de FastAPI con los routers listados. Luego flecha hacia PostgreSQL (izquierda) y hacia Google Gemini API (derecha). El conjunto debe tener forma de T claramente reconocible.

La alternativa habría sido un monolito con Next.js accediendo directamente a la base de datos. Se eligió la separación por: independencia tecnológica (el frontend puede migrar sin tocar el backend), API reutilizable (documentada en `/docs` y consumible por scripts o una futura app móvil), seguridad (las credenciales de DB y la API key de Gemini nunca se exponen al navegador), y separación clara de responsabilidades.

#### 3.6.2 Por Qué Modales en Lugar de Páginas Completas

Una de las decisiones de UX/arquitectura más visibles es el uso de modales para todas las operaciones CRUD, en lugar de navegar a páginas dedicadas de formulario.

**Se evaluaron dos opciones:**
- **Opción A:** Navegación a página dedicada (e.g., `/panel/movimientos/nueva`)
- **Opción B:** Modal sobre la página actual (elegida)

**Razones técnicas para elegir Opción B:**
1. **Sin pérdida de estado:** el estado de la página (lista de items, filtros activos, posición de scroll) se conserva completamente.
2. **Menos rutas:** la aplicación mantiene solo seis rutas del panel; agregar rutas de detalle multiplicaría la complejidad sin añadir valor.
3. **Estado local suficiente:** las operaciones CRUD manejan su ciclo de vida completo con `useState` local.

**Razones de UX para elegir Opción B:**
1. El usuario puede ver la lista mientras edita un item, reduciendo errores de contexto.
2. Abrir un modal es perceptualmente más rápido que navegar a una página y regresar.
3. El usuario sabe siempre dónde está; el modal no cambia la URL ni el estado de navegación (heurística 6 de Nielsen: reconocimiento antes que recuerdo [4]).

**Trade-off asumido:** Los formularios en modal no son *bookmarkables*. Esto es aceptable porque los formularios CRUD no necesitan ser compartidos ni marcados como favoritos.

#### 3.6.3 Patrón de Capas del Backend

```
Capa de presentación  (api/)     → recibe petición HTTP, valida con Pydantic, invoca servicio
Capa de servicios     (services/) → toda la lógica de negocio; recibe (db, user_id, ...)
Capa de datos         (models/)  → SQLAlchemy ORM; define estructura de tablas
Capa de contratos     (schemas/) → Pydantic; define qué acepta y qué devuelve la API
```

Esta separación garantiza que ninguna lógica de negocio viva en los routers, que los schemas nunca expongan campos internos como `hashed_password`, y que los servicios sean reutilizables entre endpoints diferentes.

---

### 3.7 Diseño de Interfaz de Usuario

#### 3.7.1 Sistema de diseño

**Tabla 3. Tokens de color del sistema de diseño de Monedge**

| Token | Valor Hex | Uso |
|---|---|---|
| Azul brand | `#165BC5` | CTAs primarios, estados activos, KPIs |
| Azul hover | `#0B3EA1` | Estado hover del azul brand |
| Verde ingreso | `#34d399` | Ingresos, ahorro positivo, estados OK |
| Rojo gasto | `#ef4444` | Gastos, déficit, presupuestos excedidos |
| Ámbar alerta | `#f59e0b` | Presupuesto al 70–90% de su límite |
| Fondo app dark | `#111827` | Fondo general en modo oscuro |
| Fondo card dark | `#1e2433` | Cards y paneles en modo oscuro |
| Fondo input dark | `#252d3d` | Inputs y selects en modo oscuro |

El azul `#165BC5` se seleccionó por su asociación con confianza y estabilidad financiera. El verde y el rojo siguen la convención universal de positivo-negativo en contextos financieros, reduciendo la carga cognitiva de interpretación (heurística 2 de Nielsen: correspondencia con el mundo real [4]).

**Tipografía:** Fuente Inter de Google Fonts, escalada al 115% en el elemento `<html>`. Este enfoque escala todos los valores `rem` proporcionalmente, mejorando la legibilidad sin modificar clases individuales.

**Dark mode:** Se implementa agregando o quitando la clase `dark` en `<html>` desde el panel de Settings. Las gráficas usan detección dinámica con `MutationObserver` porque generan SVG que no responde a las clases de Tailwind.

> **[IMAGEN 5]** — *Tipo: Captura de pantalla compuesta*
> Dos capturas lado a lado: Dashboard en modo claro (izquierda) y Dashboard en modo oscuro (derecha). Deben mostrar los KPIs, las alertas contextuales y las tres columnas de la sección principal. Resolución suficiente para ver los colores con claridad.

#### 3.7.2 Flujos de usuario clave

**Flujo 1 — Registrar una transacción (más frecuente):**
```
Inicio → Movimientos → "Agregar movimiento" → Descripción + Monto + Tipo
→ [Botón ✨] → IA sugiere categoría → Usuario acepta o cambia
→ Seleccionar cuenta → Presupuesto se sugiere automáticamente
→ Guardar → Toast de confirmación → Volver a tabla
```

**Flujo 2 — Revisar estado financiero del mes:**
```
Inicio → Dashboard → KPI "Puedes gastar hoy"
→ Ver alerta de presupuesto en riesgo → Ir a Planificación
→ Ver períodos del presupuesto → Identificar gasto del período actual
```

**Flujo 3 — Aportar a una meta de ahorro:**
```
Inicio → Planificación → Tab "Metas" → "Mover fondos"
→ Toggle "Aportar" → Seleccionar cuenta origen → Ingresar monto
→ Confirmar → Meta actualiza saved_amount → Cuenta actualiza balance
```

#### 3.7.3 Patrones de componente

**Patrón de modal de formulario:**
```
fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4
  └── div.bg-white.dark:bg-[#1e2433].rounded-2xl.shadow-2xl.w-full.max-w-md
```

**Patrón de confirmación de eliminación:** Nunca `window.confirm()` nativo. Estado `deleteTarget: { id, label } | null` con modal propio y botones "Cancelar / Sí, eliminar". Esta decisión respeta la heurística 4 de Nielsen (consistencia) al mantener el lenguaje visual de la aplicación en todos los diálogos [4].

**Toast notifications:** Sistema de notificaciones transitorias implementado en `lib/toast.tsx`. Desaparecen automáticamente después de tres segundos. Responde a la heurística 1 de Nielsen (visibilidad del estado del sistema [4]).

---

### 3.8 Wireframing y Prototipado

#### 3.8.1 Nivel 1 — Baja fidelidad

El primer nivel resolvió las decisiones estructurales que si se dejan para después son costosas de cambiar: dónde vive la navegación principal, cuántas columnas tiene el layout y cómo se distribuyen los bloques en cada pantalla.

**Decisión de navegación lateral:** Se evaluaron tres opciones —barra superior fija, barra lateral izquierda, y navegación inferior— eligiendo la **barra lateral** porque la aplicación tiene seis secciones, el usuario la usa principalmente desde computadora, y facilita la heurística 6 de Nielsen: el usuario ve todas las secciones disponibles en todo momento sin necesidad de recordar cuáles existen [4].

**Decisión de layout del Dashboard:** Cuadrícula de cuatro KPIs en la parte superior (las métricas más importantes), seguida de secciones secundarias con scroll interno. El criterio fue que el elemento más importante —"¿Cuánto puedo gastar hoy?"— esté visible sin necesidad de hacer scroll.

> **[IMAGEN 6]** — *Tipo: Wireframe de baja fidelidad*
> Bocetos digitales simples (pueden hacerse en Balsamiq, Figma en modo sketch, o escaneados a mano) mostrando la distribución espacial de bloques del Dashboard (4 KPIs + 3 columnas) y de Movimientos (sidebar de filtros + tabla). Sin colores, solo cajas y texto indicativo. Si los wireframes de baja fidelidad se hicieron a mano en papel, escanearlos o fotografiarlos con buena iluminación.

#### 3.8.2 Nivel 2 — Media fidelidad

Con la estructura definida, el nivel de media fidelidad resolvió la jerarquía visual y los flujos de tarea.

El rediseño más significativo en este nivel ocurrió en la sección de Análisis. La primera versión usaba tabs para separar distintas vistas, pero al probar el wireframe clickeable los tabs fragmentaban la exploración: el usuario tenía que adivinar qué información había detrás de cada pestaña. La solución fue reestructurar la sección en **tarjetas de entrada que abren modales**, donde el título de cada tarjeta describe exactamente qué pregunta responde el modal. El usuario explora sin incertidumbre.

> **[IMAGEN 7]** — *Tipo: Wireframe de media fidelidad*
> Wireframes digitales con layout definido (columnas, proporciones, jerarquía visual) pero sin colores de marca. Mostrar como mínimo: (a) el Dashboard con los 4 KPIs y las alertas contextuales, (b) la página de Movimientos con el sidebar de filtros expandido, (c) la página de Análisis con las 3 tarjetas de entrada. Se recomienda Figma o Adobe XD; exportar como PNG o PDF.

#### 3.8.3 Nivel 3 — Alta fidelidad (prototipo en código)

El prototipo de alta fidelidad se desarrolló directamente en código en lugar de en Figma. La razón: dado que el sistema de diseño era Tailwind CSS con clases inline, construir el prototipo en código era más rápido que recrearlo en una herramienta de diseño y luego re-traducirlo. El prototipo funcional **es** el prototipo de alta fidelidad.

> **[IMAGEN 8]** — *Tipo: Captura de pantalla*
> Pantalla de Movimientos con el panel de filtros lateral expandido y varios filtros activos (el badge con número de filtros activos debe ser visible). Mostrar también algunas transacciones en la tabla con sus badges de presupuesto y meta.

> **[IMAGEN 9]** — *Tipo: Captura de pantalla*
> Modal de nueva transacción con el botón ✨ visible y, si es posible, con la categoría ya preseleccionada mostrando el estado de "autocategorización activa".

> **[IMAGEN 10]** — *Tipo: Captura de pantalla*
> Página de Planificación, pestaña Presupuestos, mostrando una tarjeta de presupuesto con la barra de progreso de múltiples períodos (una en azul para el total, otra para el período actual).

#### 3.8.4 Decisiones de diseño específicas por sección

**Categorías en dos columnas:** La versión original usaba un tab para alternar entre Gastos e Ingresos. Esta decisión violaba la heurística 8 de Nielsen (diseño minimalista) porque la mitad del espacio quedaba vacío en todo momento. La solución fue mostrar ambas listas simultáneamente en dos columnas, cada una con su propio botón de creación [4].

**Análisis con modales en lugar de página de scroll:** En las primeras pruebas con la versión de scroll continuo, los usuarios dejaban de bajar a la mitad de la página. Los modales resolvieron esto: cada uno responde una pregunta específica y el usuario elige qué explorar sin scrollear hasta encontrarlo.

---

### 3.9 Stack Tecnológico

La selección del stack respondió a tres criterios: velocidad de desarrollo para un proyecto individual de un semestre, adecuación técnica al dominio del problema, y facilidad de despliegue reproducible.

**Tabla 4. Stack tecnológico del sistema Monedge**

| Capa | Tecnología | Versión | Razón de selección |
|---|---|---|---|
| Frontend framework | Next.js + React + TS | 16.2 / 19.2 | Middleware SSR para proteger rutas en servidor sin parpadeo |
| Estilos | Tailwind CSS v4 | 4.x | Utilidades inline, dark mode declarativo, sin CSS personalizado |
| Íconos | lucide-react | ^1.8.0 | Biblioteca coherente, ligera, con tree-shaking automático |
| Gráficas | Recharts | ^3.8.1 | Declarativa para React; soporta bar, line, pie, area, radial |
| Backend framework | FastAPI | 0.115.x | Async nativo; validación automática; OpenAPI en `/docs` |
| ORM | SQLAlchemy async | 2.x | Queries no bloqueantes; soporte PostgreSQL vía asyncpg |
| Base de datos | PostgreSQL 15 | 15 | Tipo `Numeric(14,2)` para montos sin errores de punto flotante |
| Autenticación | JWT + cookie HttpOnly | HS256 | Cookie HttpOnly inaccesible para JS; mitiga XSS |
| IA | Google AI Studio (Gemini) | gemini-2.5-flash | Modelo con free tier suficiente; modo de pensamiento activable |
| Orquestación | Docker Compose | 3.x | Tres contenedores (db, backend, frontend) con red interna |

**¿Por qué FastAPI y no Django?** FastAPI tiene arquitectura más ligera y soporte async para manejar llamadas concurrentes a DB y API de IA sin bloquear el servidor. Django requiere más configuración para el mismo resultado.

**¿Por qué PostgreSQL y no SQLite?** El tipo `Numeric(14,2)` de PostgreSQL garantiza precisión aritmética exacta en montos financieros. SQLite tiene comportamientos impredecibles con decimales grandes. Además, el modelo de concurrencia de PostgreSQL es más robusto para producción futura.

**¿Por qué Next.js y no una SPA pura?** El middleware del servidor verifica la cookie JWT antes de renderizar `/panel/*`, evitando que el contenido protegido aparezca brevemente antes de la verificación. En una SPA, la verificación ocurre en el cliente después de que la página ya se renderizó.

---

### 3.10 Diseño de la Base de Datos

#### 3.10.1 Modelo Entidad-Relación

El esquema está compuesto por siete entidades principales. Las relaciones clave son:

- **Transaction** tiene FK optionales a **Budget** (`budget_id`) y **Goal** (`goal_id`) con `ON DELETE SET NULL`.
- **RecurringTransaction** también tiene FK a **Budget** y **Goal**, y puede tener `end_date` para desactivarse automáticamente.
- **Category** tiene un campo `description` generado opcionalmente con IA.
- **Budget** no almacena `spent`; se calcula dinámicamente.

> **[IMAGEN 11]** — *Tipo: Diagrama ERD*
> Diagrama de entidad-relación con las siete tablas (users, accounts, categories, transactions, budgets, goals, recurring_transactions). Mostrar todas las claves foráneas con su multiplicidad. Destacar visualmente que `budget_id` y `goal_id` en transactions son nullables (línea punteada o anotación). Se puede hacer con draw.io, dbdiagram.io, o directamente desde DBeaver/DataGrip.

#### 3.10.2 Decisiones de diseño clave

**Balance de cuentas en tiempo real (sin triggers SQL)**

Se optó por no usar triggers SQL. `transaction_service` actualiza explícitamente `account.balance` al crear, editar o eliminar transacciones. Esta decisión mantiene la lógica de negocio en Python donde es legible y testeable, y evita dependencias ocultas en la base de datos que compliquen el mantenimiento.

**`Budget.spent` calculado, no almacenado**

```python
spent = SUM(transaction.amount
            WHERE budget_id = este_presupuesto
            AND type = 'expense')
```

Al crear una transacción con `budget_id`, ese gasto queda vinculado directamente al presupuesto. El `category_id` del presupuesto no afecta el cálculo; solo sirve para mostrar emoji y nombre en la UI.

**Migraciones sin Alembic**

Las columnas añadidas en iteraciones posteriores se crean con sentencias `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` en el evento `startup` de FastAPI. Pragmático para un proyecto académico con datos de prueba. Ver sección 3.16.2 para el problema completo.

**Metas con flujos explícitos**

El campo `goal_id` en `Transaction` almacena la referencia pero **no actualiza automáticamente** `goal.saved_amount` en transacciones regulares. Los movimientos de fondos a metas se realizan exclusivamente mediante los endpoints `POST /goals/{id}/contribute` y `POST /goals/{id}/withdraw`, que crean transacciones de tipo `transfer` con trazabilidad completa.

---

### 3.11 Implementación del Backend

#### 3.11.1 Autenticación con JWT

El token se genera al hacer login con `sub: user_id` y se entrega en una cookie HttpOnly. En cada petición protegida, `get_current_user` (inyectado como dependencia) lee la cookie, decodifica el JWT y devuelve el usuario. Si la cookie no existe o el token expiró, devuelve 401.

#### 3.11.2 Presupuestos con períodos múltiples

Un presupuesto puede dividirse internamente en sub-períodos según su `frequency` (semanal, quincenal, mensual). Cada período tiene su propio gasto calculado independiente. El `BudgetOut` devuelve tres campos adicionales calculados: `spent` (gasto total de todos los períodos), `total_budget` (límite × número de períodos), y `periods` (lista con el gasto de cada sub-período y cuál es el período actual).

#### 3.11.3 Gestión de metas con aporte y retiro

`POST /goals/{id}/contribute` con `{account_id, amount}`:
1. Valida saldo suficiente en la cuenta líquida.
2. Incrementa `goal.saved_amount`.
3. Reduce `account.balance`.
4. Crea Transaction de tipo `"transfer"` con descripción `"Aporte → {meta}"`.

`POST /goals/{id}/withdraw` con `{account_id, amount}`:
1. Valida que el monto no supere `goal.saved_amount`.
2. Reduce `goal.saved_amount`.
3. Incrementa `account.balance`.
4. Crea Transaction de tipo `"transfer"` con descripción `"Retiro ← {meta}"`.

#### 3.11.4 Transacciones recurrentes con `apply`

`POST /recurring/{id}/apply` acepta un `payment_account_id` opcional para pagar desde una cuenta distinta a la vinculada al recurrente (útil para cuotas de tarjeta de crédito):

1. Crea Transaction; `account_id = payment_account_id ?? rec.account_id`
2. Si se pagó desde cuenta distinta a crédito: descuenta del líquido y abona al crédito
3. Si es ingreso con `goal_id`: auto-contribuye a la meta
4. Avanza `next_date` (+7d, +14d, o mismo día del mes siguiente)
5. Si `next_date > end_date` → `is_active = False`

#### 3.11.5 Dashboard y `safe_daily_budget`

```python
projected_income  = max(income_mes_actual, avg_monthly_income_3_meses)
savings_target    = projected_income × 0.20
available         = max(projected_income - gastos_mes - savings_target, 0)
safe_daily        = available / días_restantes_del_mes
```

Este indicador proyecta el ingreso completo del mes (evita que a mitad del mes el número sea artificialmente bajo) y reserva el 20% para ahorro antes de calcular el disponible diario.

---

### 3.12 Implementación del Frontend

#### 3.12.1 Dashboard — Página de Inicio

Cuatro KPIs principales: Ingresos del Mes, Gastos del Mes, Balance del Mes (ingresos − gastos del mes con badge Ahorrando/Déficit), y "Puedes gastar hoy" (con comparativo ▲/▼ vs promedio histórico).

Debajo de los KPIs: alertas contextuales condicionales — presupuesto en riesgo si alguno supera el 70% de su límite, y meta más cercana a completarse.

Layout de tres columnas: Últimos 30 movimientos | Cuentas (top 5 por ingreso histórico + total al fondo) | Presupuestos + Metas (stack vertical).

#### 3.12.2 Movimientos — El módulo más complejo

Carga inicial: últimos 30 días. Botón "Ver 30 días más" carga el bloque previo de 30 días hacia atrás. KPIs de la vista filtrada calculados en cliente (ingresos, gastos, balance de lo que se muestra).

Tabla unificada: transacciones regulares + recurrentes activos en la misma tabla. Las transacciones de tipo `transfer` se destacan en morado. Los recurrentes tienen un badge con su frecuencia.

Al seleccionar una categoría en el formulario, el sistema busca automáticamente el presupuesto activo vinculado a esa categoría y lo preselecciona con un badge "Sugerido".

#### 3.12.3 Planificación — Presupuestos y Metas

Dos tabs: **Presupuestos** y **Metas** (los recurrentes viven en la página de Movimientos).

Las tarjetas de presupuesto muestran progreso total y, si tiene `frequency`, también el progreso del período actual. Un botón "Historial" aparece cuando hay presupuestos vencidos.

Las metas tienen un botón "Mover fondos" que abre un modal con toggle Aportar/Retirar y selector de cuenta origen.

#### 3.12.4 Análisis — Estadísticas y Laboratorio IA

Chip selector de período temporal (15d, 1m, 3m, 6m, 1y, personalizado con mínimo de 15 días). El "Resumen del mes actual" es siempre visible mostrando: balance neto, tasa de ahorro, día de mayor gasto, categoría top y peor presupuesto.

Tres modales: **Estadísticas** (KPIs del período con desglose mensual en BarChart agrupado y donut de categorías), **Patrones** (distribución por categoría y por día de la semana), **Laboratorio IA** (chat con múltiples sesiones guardadas en localStorage por día, reinician a medianoche).

> **[IMAGEN 12]** — *Tipo: Captura de pantalla*
> Página de Análisis mostrando el "Resumen del mes actual" y las tres tarjetas de entrada (Estadísticas, Patrones, Laboratorio IA) con sus íconos. Si es posible, mostrar también el modal de Laboratorio IA abierto con una conversación de ejemplo.

---

### 3.13 Integración de la Tecnología Emergente: IA Generativa

El principio de diseño fue el mismo en todas las funcionalidades: **el backend calcula el contexto real mediante SQL, el modelo solo interpreta y formatea**. Esto garantiza que las respuestas contengan datos reales del usuario, no generalizaciones del modelo.

#### 3.13.1 Auto-categorización

`POST /ai/categorize`: recibe descripción, monto y la lista de categorías del usuario con sus `description`s. El modelo devuelve el `category_id` de la categoría más apropiada, que el frontend preselecciona en el formulario.

> **[IMAGEN 13]** — *Tipo: Captura de pantalla*
> Modal de nueva transacción con la descripción "Netflix" escrita, el botón ✨ visible, y la categoría "Servicios 💡" ya preseleccionada (o el proceso a punto de ejecutarse). Idealmente mostrar el estado de carga (botón con animación de pulso) y luego el estado con categoría seleccionada.

#### 3.13.2 Resumen mensual y recomendaciones

`GET /ai/summary`: el backend construye el contexto con balance, ingresos, gastos del mes y estado de presupuestos. El modelo genera 1-2 oraciones con datos concretos. Visible en el Dashboard siempre que haya actividad en el mes.

`GET /ai/recommendations`: devuelve `{text, actions}`. Las `actions` son acciones sugeridas (crear presupuesto o meta) con datos prellenados que el usuario puede ejecutar directamente desde el Laboratorio IA con un clic.

#### 3.13.3 Consulta rápida y análisis profundo

`POST /ai/query`: responde preguntas sobre los últimos 30 días con un contexto de totales, desglose por categoría y muestra de transacciones recientes. Respuesta en 2-3 oraciones.

`POST /ai/analyze`: el más completo. Antes de invocar al modelo, el backend calcula: desglose mensual completo, tendencia de gastos (regresión lineal simple), top 8 categorías, patrones por día de la semana, gastos recurrentes detectados por similitud de descripción, y estado de presupuestos y metas. El modelo devuelve `{text, chart: {type, title, data[]}, metrics[]}`. El frontend renderiza el chart dinámicamente con Recharts según el tipo devuelto (`bar`, `line`, `pie`).

El modo de pensamiento (*Thinking*) de Gemini se habilita con 8,000 tokens de presupuesto para este endpoint, permitiendo al modelo razonar antes de responder. Si el modelo no soporta el modo (como ocurrió durante el desarrollo), hay un fallback automático:

```python
try:
    response = await client.generate_content(model, prompt, config=thinking_cfg)
except Exception as e:
    if "thinking" in str(e).lower() or "INVALID_ARGUMENT" in str(e):
        response = await client.generate_content(model, prompt)  # sin thinking
    else:
        raise
```

#### 3.13.4 Sugerencia de descripción para categorías

`POST /ai/suggest-category-description`: genera una descripción de ≤10 palabras para una categoría personalizada. Estas descripciones se incluyen en el prompt de autocategorización, mejorando la precisión de clasificación porque el modelo sabe exactamente qué tipo de transacciones pertenecen a cada categoría del usuario.

> **[IMAGEN 14]** — *Tipo: Captura de pantalla*
> Laboratorio IA con una conversación real de ejemplo. Mostrar: la pregunta del usuario ("¿En qué categoría gasto más los viernes?"), la respuesta de la IA con texto y una gráfica de barras generada dinámicamente, y las métricas. Debe verse como una conversación natural, no como una interfaz técnica.

---

### 3.14 Seguridad del Sistema

**JWT en Cookie HttpOnly vs localStorage:** `localStorage` es accesible desde JavaScript, haciéndolo vulnerable a ataques XSS. Una cookie HttpOnly es completamente inaccesible para JavaScript: el navegador la envía automáticamente en cada petición, pero ningún script puede leerla. `samesite="lax"` proporciona protección básica contra CSRF [24].

**CORS configurado:** El middleware CORS de FastAPI restringe los orígenes permitidos al valor de `FRONTEND_URL`. `allow_credentials=True` es necesario para que el navegador incluya la cookie en peticiones cross-origin (del puerto 3000 al 8000).

**Aislamiento de datos por usuario:** Todos los servicios reciben `user_id` y lo incluyen en todas las queries. Un usuario autenticado nunca puede acceder a datos de otro usuario, incluso conociendo el UUID.

**Validación de entrada:** Pydantic valida automáticamente todos los cuerpos de petición. Campos no declarados en el schema son ignorados. Tipos incorrectos generan 422 automático.

**Protección de rutas en frontend:** El middleware de Next.js intercepta peticiones en el servidor (Edge Runtime), no en el cliente, haciendo la protección más robusta que verificaciones en componentes de React.

---

### 3.15 Proceso de Desarrollo Asistido por Agente de IA

#### 3.15.1 Claude Code como herramienta de desarrollo

El desarrollo utilizó **Claude Code** como agente autónomo de programación a lo largo de todo el proyecto. Claude Code es una interfaz de línea de comandos que conecta un modelo de lenguaje con el entorno de desarrollo local, otorgándole acceso al sistema de archivos y la terminal. A diferencia de los asistentes de código en chat, opera directamente sobre los archivos del repositorio, leyendo el código existente antes de cada modificación para mantener coherencia con los patrones ya establecidos.

> **[IMAGEN 15]** — *Tipo: Captura de pantalla*
> Sesión de trabajo con Claude Code en la terminal mostrando: (a) una instrucción en lenguaje natural del desarrollador describiendo una nueva funcionalidad, (b) la respuesta del agente listando qué archivos va a leer y modificar, y (c) si es posible, un diff de los cambios realizados. La terminal debe ser legible.

#### 3.15.2 Metodología de trabajo

El proceso siguió ciclos de cuatro fases:

1. **Definición:** Describir la funcionalidad en lenguaje natural, especificando restricciones y archivos relevantes.
2. **Implementación autónoma:** El agente lee el código existente, identifica los patrones establecidos y escribe código nuevo respetándolos.
3. **Revisión y prueba:** El desarrollador revisa el código en el editor y prueba la funcionalidad en el navegador. Esta fase es crítica: el agente verifica que el código compila y que la lógica es correcta en términos de tipos, pero no puede validar la experiencia visual.
4. **Iteración:** Si hay errores o ajustes, se describen en lenguaje natural y el agente los corrige sin reescribir lo que ya funciona.

#### 3.15.3 Ventajas observadas

**Coherencia de patrones:** El agente mantiene consistencia porque lee el código antes de cada modificación. El patrón de modal de eliminación sin `confirm()` nativo se respetó en todas las páginas nuevas sin necesidad de recordárselo explícitamente (con excepción de la página de Billetera, donde quedó como deuda técnica identificada).

**Detección sistemática de errores de TypeScript:** Al agregar campos nuevos a interfaces usadas en formularios, el agente busca todos los puntos del código que requieren actualización simultánea en lugar de descubrirlos uno a uno en tiempo de ejecución.

**Refactorizaciones coordinadas:** Cambios arquitectónicos como la migración del modelo de presupuestos requieren modificaciones en modelos, servicios, schemas y frontend simultáneamente. El agente busca todas las ocurrencias del patrón antes de hacer cambios.

#### 3.15.4 Limitaciones observadas

El agente no puede ver la interfaz del navegador. Algunos problemas de usabilidad —como el espacio desperdiciado con el sistema de tabs en Categorías o la longitud de la página de Análisis— solo fueron detectables al probar visualmente la aplicación.

Las instrucciones ambiguas producen implementaciones técnicamente correctas pero no necesariamente en la dirección deseada. La calidad del trabajo del agente es directamente proporcional a la precisión de las instrucciones.

---

### 3.16 Problemas Encontrados y Soluciones

#### 3.16.1 Deprecación del modelo de IA

**El problema:** El modelo `gemma-3-4b-it` original fue deprecado por Google durante el desarrollo, devolviendo `404 NOT_FOUND`. El error no era de autenticación sino de ruta no encontrada (`models/gemma-3-4b-it is not found for API version v1beta`), lo que dificultó el diagnóstico inicial.

**El proceso de resolución:** Varios candidatos del catálogo de Google AI Studio aparecían en la documentación pero respondían con el mismo `NOT_FOUND`. Con `gemma-3-27b-it`, el primer candidato alternativo probado, el servidor devolvía 429 antes de completar tres requests seguidas en la misma sesión de prueba. Lo mismo ocurrió con otros modelos del catálogo.

**La solución:** `gemini-2.5-flash` resultó ser lo suficientemente estable para el caso de uso. La decisión previa de parametrizar el nombre del modelo en la variable de entorno `GEMMA_MODEL` resultó ser correcta: la migración requirió solo cambiar una línea en el archivo `.env`. Sin esa parametrización, el cambio habría requerido buscar y reemplazar el nombre del modelo en múltiples archivos del código fuente.

**Lección aprendida:** El tier gratuito de la API está diseñado para experimentación, no para uso sostenido. En un entorno de producción con usuarios reales, migrar a un plan de pago sería necesario desde el primer día.

#### 3.16.2 Migraciones de base de datos sin Alembic

**El problema:** Al agregar columnas nuevas durante el desarrollo iterativo (`budget_id` y `goal_id` en transactions, `is_recurring` y `frequency` en budgets, `type` y `description` en categories), la base de datos ya tenía datos de prueba reales y no podía recrearse desde cero sin perderlos.

**La solución:** Sentencias `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` en el evento `startup` de FastAPI. La cláusula `IF NOT EXISTS` hace la operación idempotente: si la columna ya existe, no hace nada. El código se acumula en `main.py` y se ejecuta en cada inicio del servidor.

**Problema adicional:** Al actualizar `GEMMA_MODEL` en `.env`, `docker restart monedge_backend` no aplicó el cambio porque `restart` reutiliza el estado del contenedor existente. El comando correcto es `docker compose up -d --force-recreate backend`, que recrea el contenedor leyendo el archivo `.env` actualizado.

#### 3.16.3 Rediseño del modelo de presupuestos

**El problema:** En el diseño original, `Budget.spent` era la suma de todas las transacciones cuya `category_id` coincidiera con la del presupuesto. Este modelo fallaba cuando el usuario tenía dos presupuestos con la misma categoría: "Mandado semanal" y "Comida de trabajo" ambos con categoría "Alimentación" mostraban exactamente el mismo `spent` porque contaban las mismas transacciones.

> **[IMAGEN 16]** — *Tipo: Diagrama comparativo*
> Diagrama de dos columnas: izquierda muestra el modelo original donde ambos presupuestos apuntan a las mismas transacciones por category_id (con el bug visual obvio). Derecha muestra el modelo de etiquetado explícito donde cada transacción tiene un budget_id que la vincula a un presupuesto específico. Puede hacerse en draw.io o incluso como una tabla simple bien formateada.

**La solución:** Cambio a etiquetado explícito. Cada transacción tiene un campo `budget_id` opcional (UUID FK nullable con ON DELETE SET NULL). `Budget.spent = SUM(transaction.amount WHERE budget_id = este_presupuesto AND type = 'expense')`. El `category_id` del presupuesto pasó a ser solo decorativo.

El formulario de movimientos sugiere automáticamente el presupuesto activo de la categoría seleccionada con un badge "Sugerido", manteniendo la experiencia fluida para el usuario aunque internamente el sistema ya no calcule por categoría.

**Impacto del cambio:** Requirió modificaciones coordinadas en cuatro capas del sistema: modelo ORM (nueva columna), schema Pydantic (nuevo campo), servicio de presupuestos (nueva query), y frontend (nuevo campo en formulario y tipos TypeScript). Es el ejemplo más claro de por qué los problemas de diseño de datos son más costosos que los problemas de implementación.

#### 3.16.4 Errores de TypeScript al agregar campos nuevos

**El problema:** Al agregar `budget_id` y `goal_id` a la interfaz TypeScript `Transaction`, el compilador emitió errores en todos los lugares donde se construía un objeto de ese tipo: el estado inicial `EMPTY_FORM`, las funciones `openEdit()` y `openEditRec()`, y la función de actualización en `api.ts`.

**La solución:** Ejecutar `tsc --noEmit` antes de corregir, obteniendo la lista completa de errores de una sola vez, y actualizar todos los puntos de construcción sistemáticamente. Sin ese paso, los errores se habrían descubierto uno a uno en tiempo de ejecución.

#### 3.16.5 Comportamiento de crédito diferente al esperado

**El problema:** La primera implementación trataba todas las cuentas con la misma lógica: ingresos suman, gastos restan. Para cuentas de crédito, esto producía balances negativos que no correspondían con el modelo mental del usuario mexicano (donde la tarjeta de crédito tiene "crédito disponible" y "deuda", no un "balance").

**La solución:** Para cuentas tipo `credit`, el campo `balance` representa el **crédito disponible restante** (no el saldo). La cuenta empieza con `balance = credit_limit` (sin deuda). Cada gasto reduce el crédito disponible; cada pago lo restaura. La deuda se calcula como `credit_limit - balance`. La dirección de las operaciones en `transaction_service` es la contraria que para el resto de los tipos de cuenta.

#### 3.16.6 Respuestas JSON inválidas de Gemini

**El problema:** Gemini ocasionalmente produce JSON con comillas sin escapar dentro de strings, comillas simples en lugar de dobles, o texto antes/después del bloque JSON. En el módulo de análisis profundo esto era especialmente frecuente porque el modelo tenía que generar un JSON con campos de texto libre (el análisis narrativo).

**La solución:** Tres estrategias de recuperación en cascada implementadas en `ai_service.py`:

1. Limpiar bloques markdown (` ```json ... ``` `) y parsear directamente.
2. Corregir escapes inválidos con regex antes de parsear: `re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', json_str)`.
3. Extraer el campo `text` por regex cuando el JSON está irrecuperable, intentando recuperar `chart` y `metrics` por separado.

Si las tres fallan, se devuelve el texto en bruto truncado a 600 caracteres. La tasa de respuestas completamente irrecuperables en producción fue menor al 3%.

---

## 4. Resultados

**Tabla 5. Estado final de funcionalidades implementadas**

| Módulo | Funcionalidades | Estado |
|---|---|---|
| Autenticación | Registro 3 pasos, login, logout, `/auth/me` | ✓ Completo |
| Billetera | CRUD 4 tipos de cuenta, pago de crédito con preview | ✓ Completo |
| Movimientos | CRUD transacciones, paginación incremental, 6 filtros, recurrentes con end_date | ✓ Completo |
| Planificación | Presupuestos con períodos múltiples + renovar; metas con contribute/withdraw | ✓ Completo |
| Dashboard | 4 KPIs, alertas contextuales, top cuentas/presupuestos/metas, resumen IA | ✓ Completo |
| Análisis | Estadísticas por período, patrones, Laboratorio IA conversacional con sesiones | ✓ Completo |
| Categorías | CRUD, seed de 14 categorías con descriptions, sugerencia IA | ✓ Completo |
| IA | 6 endpoints distintos (categorizar, resumir, recomendar, consultar, analizar, sugerir-descripción) | ✓ Completo |

**Métricas del proyecto**

| Métrica | Valor |
|---|---|
| Líneas de código backend (Python) | ~2,700 |
| Líneas de código frontend (TypeScript/TSX) | ~6,500 |
| Endpoints de API | 41 endpoints REST |
| Tablas de base de datos | 7 tablas con relaciones |
| Funcionalidades de IA | 6 endpoints distintos |
| Módulos del panel | 6 páginas funcionales |
| Semanas de desarrollo | ~14 semanas activas |

**Validación de invariantes del sistema**

Se verificó que las siguientes propiedades del sistema se mantienen en todos los escenarios probados:

| Invariante | Validado |
|---|---|
| Registrar y eliminar una transacción devuelve el balance al valor original | ✓ |
| El `spent` del presupuesto coincide con la suma de transacciones etiquetadas | ✓ |
| Aportar y retirar el mismo monto de una meta devuelve `saved_amount` al original | ✓ |
| Un abono a crédito incrementa el disponible y reduce el balance de la cuenta líquida | ✓ |
| Las transacciones de un usuario no son accesibles por otro usuario autenticado | ✓ |

**Scripts de datos de prueba**

Se desarrollaron dos scripts de seed que permiten reproducir un estado completo y verificable del sistema:

- **`seed_data.py`** (raíz): crea usuario `demo@monedge.dev`, genera 3–6 meses de transacciones con ingresos > gastos y balance siempre positivo.
- **`backend/seed_demo.py`**: escenario narrativo completo con BBVA, Efectivo, CETES y Amex Oro, 4 meses de historia, recurrentes activos con `end_date` definida.

---

## 5. Conclusiones

**Sobre la investigación y el diseño**

La investigación de usuarios fue la etapa más impactante del proceso. Descubrir que el problema real no era la ausencia de herramientas de cálculo sino la carga cognitiva del registro y la organización reorientó completamente la estrategia. Sin esa investigación, el resultado probable habría sido una calculadora financiera visualmente atractiva pero irrelevante para el usuario objetivo.

El wireframing progresivo detectó problemas antes de que llegaran al código. El rediseño de la sección de Análisis —de página plana a modales con preguntas específicas— se identificó en la prueba del wireframe de media fidelidad. La lección es que el costo de cambiar un wireframe es casi cero comparado con el costo de cambiar código implementado.

**Sobre la arquitectura y las decisiones técnicas**

Los problemas técnicos más costosos fueron los de diseño, no los de implementación. Rediseñar el modelo de presupuestos de cálculo por categoría a etiquetado explícito por `budget_id` requirió cambios coordinados en cuatro capas del sistema. Los problemas de implementación (deprecación del modelo, comportamiento de Docker, JSON inválido de Gemini) tenían síntomas claros y soluciones puntuales; los de diseño arquitectónico, no.

La decisión de usar modales en lugar de páginas completas para CRUD se validó durante el desarrollo: ningún usuario preguntó durante las pruebas "¿cómo regreso a la lista?", que es exactamente el problema que los modales resuelven.

**Sobre la integración de IA**

La IA generativa se justificó funcionalmente, no solo tecnológicamente. La auto-categorización eliminó directamente el Insight 2 de la investigación (fatiga de decisión al clasificar gastos), y la consulta en lenguaje natural permite obtener análisis complejos sin configurar filtros manualmente.

El principio de calcular el contexto real en SQL antes de invocar al modelo fue determinante. Las respuestas son útiles porque trabajan con los datos reales del usuario, no con generalizaciones del modelo. Un LLM sin datos de contexto produce consejos genéricos que cualquier libro de finanzas daría; con datos de contexto, produce análisis accionables que solo ese usuario podría necesitar.

**Sobre el proceso de desarrollo**

Trabajar con Claude Code como agente de implementación introdujo una dinámica eficiente para funcionalidades bien definidas. Las decisiones de diseño de alto nivel, la validación visual y la detección de problemas de UX siguieron siendo responsabilidad del desarrollador humano. Esa combinación —agente de IA para implementación, humano para diseño y validación— permitió cubrir el alcance completo de un proyecto ambicioso en el tiempo de un semestre.

---

## 6. Referencias Bibliográficas

[1] "Unidad 1: Tecnologías Emergentes para el Desarrollo de Soluciones — Investigación de Usuarios," Diapositivas de clase, UABC, Tijuana, 2026.

[2] C. Rohrer, "When to Use Which User-Experience Research Methods," *Nielsen Norman Group*, Oct. 12, 2014. [En línea]. Disponible: https://www.nngroup.com/articles/which-ux-research-methods/. [Accedido: Feb. 11, 2026].

[3] S. Portigal, *Interviewing Users: How to Uncover Compelling Insights*. New York, NY, USA: Rosenfeld Media, 2013.

[4] J. Nielsen, "10 Usability Heuristics for User Interface Design," *Nielsen Norman Group*, Nov. 15, 1994. [En línea]. Disponible: https://www.nngroup.com/articles/ten-usability-heuristics/. [Accedido: Mar. 15, 2026].

[5] D. A. Norman, *The Design of Everyday Things*, edición revisada y ampliada. New York, NY, USA: Basic Books, 2013.

[6] L. Rosenfeld, P. Morville y J. Arango, *Information Architecture: For the Web and Beyond*, 4ta ed. Sebastopol, CA, USA: O'Reilly Media, 2015.

[7] C. Wodtke y A. Govella, *Information Architecture: Blueprints for the Web*, 2da ed. Berkeley, CA, USA: New Riders, 2009.

[8] S. Krug, *Don't Make Me Think, Revisited: A Common Sense Approach to Web Usability*, 3ra ed. San Francisco, CA, USA: New Riders, 2014.

[9] J. J. Garrett, *The Elements of User Experience: User-Centered Design for the Web and Beyond*, 2da ed. Berkeley, CA, USA: New Riders, 2011.

[10] W. Brenner y F. Uebernickel, *Design Thinking for Innovation: Research and Practice*. Cham, Suiza: Springer International Publishing, 2016.

[11] J. Nielsen y R. Budiu, *Mobile Usability*. Berkeley, CA, USA: New Riders, 2013.

[12] A. Hinton, *Understanding Context: Environment, Language, and Information Architecture*. Sebastopol, CA, USA: O'Reilly Media, 2014.

[13] P. H. Diamandis y S. Kotler, *The Future Is Faster Than You Think*. New York, NY, USA: Simon & Schuster, 2020.

[14] R. C. Martin, *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Upper Saddle River, NJ, USA: Prentice Hall, 2017.

[15] R. T. Fielding, "Architectural Styles and the Design of Network-based Software Architectures," Disertación doctoral, University of California, Irvine, 2000. [En línea]. Disponible: https://ics.uci.edu/~fielding/pubs/dissertation/top.htm. [Accedido: Abr. 02, 2026].

[16] OWASP Foundation, "Session Management Cheat Sheet," *OWASP Cheat Sheet Series*, 2023. [En línea]. Disponible: https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html. [Accedido: Mar. 20, 2026].

[17] R. C. Martin, *Clean Code: A Handbook of Agile Software Craftsmanship*. Upper Saddle River, NJ, USA: Prentice Hall, 2008.

[18] Google DeepMind, "Gemini: A Family of Highly Capable Multimodal Models," *Google AI*, 2024. [En línea]. Disponible: https://deepmind.google/technologies/gemini/. [Accedido: Mar. 10, 2026].

[19] S. Ramírez, "FastAPI," 2019. [En línea]. Disponible: https://fastapi.tiangolo.com. [Accedido: Feb. 20, 2026].

[20] Vercel, "Next.js Documentation," 2024. [En línea]. Disponible: https://nextjs.org/docs. [Accedido: Feb. 20, 2026].

[21] J. Sutherland, *Scrum: The Art of Doing Twice the Work in Half the Time*. New York, NY, USA: Crown Business, 2014.

[22] K. Beck et al., "Manifesto for Agile Software Development," 2001. [En línea]. Disponible: https://agilemanifesto.org. [Accedido: Abr. 10, 2026].

---

## 7. Anexos

### Anexo A — Tabla Completa de Endpoints de la API

> **Qué poner aquí:** La tabla completa de los 41 endpoints REST del sistema, organizada por recurso. Incluir Método, Ruta, Body/Params y Respuesta. Esta tabla ya existe en el `REPORTE.md` generado anteriormente (sección Anexo A) y puede copiarse directamente.

### Anexo B — Estructura de Archivos del Proyecto

> **Qué poner aquí:** El árbol de directorios completo del proyecto con anotaciones de qué hace cada archivo clave. Esta estructura ya existe en el `REPORTE.md` (sección Anexo B) y en `DESARROLLO.md`. Puede copiarse directamente.

### Anexo C — Variables de Entorno

> **Qué poner aquí:** El archivo `.env` documentado con el propósito de cada variable:
>
> ```
> DATABASE_URL      → Conexión a PostgreSQL en el contenedor Docker
> SECRET_KEY        → Clave para firmar los JWT (debe ser larga y aleatoria en producción)
> FRONTEND_URL      → Origen permitido en CORS (http://localhost:3000 en desarrollo)
> GOOGLE_AI_API_KEY → API key de Google AI Studio para Gemini
> GEMMA_MODEL       → Nombre del modelo de IA (gemini-2.5-flash)
> ANALYZE_THINKING_BUDGET → Tokens de pensamiento para /ai/analyze (8000 recomendado, 0 desactiva)
> ACCESS_TOKEN_EXPIRE_MINUTES → Expiración del JWT en minutos (30 por defecto)
> ```

### Anexo D — DashboardOut: Estructura Completa del Endpoint de Dashboard

> **Qué poner aquí:** El schema completo del objeto que devuelve `GET /dashboard`, con cada campo, su tipo y su descripción. Esto documenta el "contrato" entre el backend y el frontend para el endpoint más importante del sistema. Extraer de `REPORTE.md` sección Anexo D.

### Anexo E — Guión de Entrevista Completo

> **Qué poner aquí:** El guión de las 10 preguntas de la entrevista de investigación de usuarios, organizadas en los tres bloques (comportamiento actual, expectativas de IA, privacidad y adopción). Esto ya aparece en `reporte_processed.md` sección 3.2.2 y puede copiarse.

### Anexo F — Capturas de Pantalla del Sistema

> **Qué poner aquí:** Una galería de capturas de pantalla de todas las páginas del sistema en su estado final, incluyendo:
> - Landing page (/)
> - Registro — los tres pasos
> - Login
> - Dashboard en modo claro
> - Dashboard en modo oscuro
> - Billetera con cuentas de débito y crédito
> - Movimientos con filtros activos
> - Modal de nueva transacción
> - Planificación — tab Presupuestos
> - Planificación — tab Metas con modal "Mover fondos"
> - Análisis — vista principal
> - Modal Estadísticas
> - Modal Patrones
> - Laboratorio IA con conversación
> - Categorías (modo claro y oscuro)
>
> Si el sistema corre en Docker, las capturas se toman en `http://localhost:3000`.

---

## Guía de Imágenes — Resumen para el Autor

| # | Sección | Tipo | Descripción |
|---|---|---|---|
| 1 | 3.3.2 | Captura/Foto | Portada del video de la entrevista (Drive) o foto del setup |
| 2 | 3.3.4 | Infografía | Tarjetas de User Persona (Diego y Andrés) — hacer en Canva |
| 3 | 3.4.2 | Diagrama | Árbol hub-and-spoke de la AI del sistema — draw.io o Figma |
| 4 | 3.6.1 | Diagrama | Arquitectura en T completa (frontend + backend + DB + Gemini) |
| 5 | 3.7.1 | Captura compuesta | Dashboard modo claro / modo oscuro lado a lado |
| 6 | 3.8.1 | Wireframe BF | Bocetos de baja fidelidad del Dashboard y Movimientos |
| 7 | 3.8.2 | Wireframe MF | Wireframes de media fidelidad (Dashboard, Movimientos, Análisis) |
| 8 | 3.8.3 | Captura | Movimientos con filtros activos y badges de presupuesto/meta |
| 9 | 3.8.3 | Captura | Modal de nueva transacción con autocategorización visible |
| 10 | 3.8.3 | Captura | Planificación — tab Presupuestos con barras de progreso |
| 11 | 3.10.1 | Diagrama ERD | Entidad-relación con las 7 tablas y FKs nullables destacadas |
| 12 | 3.12.4 | Captura | Análisis — las 3 tarjetas de entrada + modal Laboratorio IA |
| 13 | 3.13.1 | Captura | Modal de transacción con categoría preseleccionada por IA |
| 14 | 3.13.3 | Captura | Laboratorio IA con una conversación y gráfica generada |
| 15 | 3.15.1 | Captura terminal | Sesión de trabajo con Claude Code en la terminal |
| 16 | 3.16.3 | Diagrama comparativo | Modelo de presupuestos antes y después del rediseño |
