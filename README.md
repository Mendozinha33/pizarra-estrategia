# Pizarra Táctica — Club Manager

Pizarra táctica para diseñar jugadas, reproducirlas y planificar sesiones de entrenamiento.

Antes era un único HTML de 180 KB con React minificado incrustado y los datos en
`localStorage`. Ahora es una aplicación de dos piezas: una API en **Python/FastAPI** sobre
**PostgreSQL**, y un frontend en **React + Vite** con código fuente modular.

```
PIZARRA/
├── backend/            API FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/routes/ Endpoints HTTP (finos)
│   │   ├── core/       Configuración por entorno
│   │   ├── db/         Motor, sesión y base declarativa
│   │   ├── models/     Tablas SQLAlchemy
│   │   ├── schemas/    Contratos Pydantic (incluida la validación del tablero)
│   │   └── services/   Lógica de negocio, sin dependencias de FastAPI
│   ├── scripts/        SQL de inicialización (base de tests)
│   └── tests/          20 tests de API contra PostgreSQL
├── frontend/           React 18 + Vite
│   └── src/
│       ├── api/        Cliente HTTP y endpoints
│       ├── components/ Piezas reutilizables (lienzo SVG, UI)
│       ├── features/   Vistas: pizarra, jugadas, sesión
│       ├── hooks/      Estado: tablero, reproducción, datos
│       └── lib/        Geometría, formaciones, constantes
├── legacy/             El HTML original, como referencia
├── docker-compose.dev.yml  Sólo PostgreSQL, para desarrollar en local
└── docker-compose.yml      Stack completo: PostgreSQL + API + nginx
```

## Arrancar en local

Necesitas Python 3.11+, Node 18+ y Docker (para la base de datos).

**Base de datos** — crea `pizarra` y `pizarra_test`:

```bash
docker compose -f docker-compose.dev.yml up -d
```

Si prefieres tu propio PostgreSQL, apunta `PIZARRA_DATABASE_URL` donde quieras; sólo
necesita una base vacía y otra para los tests.

**Backend** (puerto 8000):

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate          # Linux/macOS: source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

La documentación interactiva queda en <http://127.0.0.1:8000/docs>.

**Frontend** (puerto 5173):

```bash
cd frontend
npm install
npm run dev
```

Abre <http://localhost:5173>. Vite hace de proxy de `/api` hacia el backend, así que en
desarrollo no hace falta ni CORS ni URLs absolutas. Si tu API vive en otro sitio:
`VITE_API_TARGET=http://otro-host:8000 npm run dev`.

## Contra el backend desplegado

La API está en <https://pizarra-estrategia.onrender.com>. Hay dos formas de apuntar el
frontend hacia ella, según si el navegador ve un origen o dos.

**En desarrollo**, dejando que el proxy de Vite haga de intermediario (no hay petición
entre orígenes, así que no interviene CORS):

```bash
cd frontend
VITE_API_TARGET=https://pizarra-estrategia.onrender.com npm run dev
# PowerShell: $env:VITE_API_TARGET='https://pizarra-estrategia.onrender.com'; npm run dev
```

**En Vercel** (`frontend/vercel.json`), donde el propio Vercel reenvía `/api/*` a Render.
El navegador sigue viendo un único origen, así que tampoco interviene CORS. Al importar el
repo, pon **Root Directory = `frontend`**; el resto lo lee del `vercel.json`.

Se apoya en el build normal (rutas relativas), y por eso funciona igual en producción que
en cada *preview deployment*, aunque su URL cambie en cada push. Con URLs absolutas habría
que ir añadiendo cada dominio de preview a la lista de CORS del backend.

**Build estático** para cualquier otro hosting, con la URL de la API incrustada
(`frontend/.env.render`):

```bash
cd frontend
npm run build:render      # sirve dist/ donde quieras
```

Aquí el navegador sí habla directamente con Render, así que el backend tiene que aceptar
el origen del frontend: en Render, `PIZARRA_CORS_ORIGINS=https://tu-frontend.example`
(separa por comas si son varios). Sin eso las peticiones se caen en el preflight y la app
muestra «No se ha podido contactar con el servidor».

`npm run build` a secas no lleva ninguna URL absoluta: sigue usando rutas relativas, que
es lo que necesitan tanto el nginx del stack de Docker como el reenvío de Vercel.

## Con Docker

```bash
docker compose up --build
```

- Aplicación: <http://localhost:8180>
- API: <http://localhost:8100/docs>

Levanta PostgreSQL 16, la API y nginx sirviendo el build de producción (nginx hace de
proxy de `/api` hacia la API, así que el navegador ve un único origen).

Los puertos son 8180/8100 y no 8080/8000 porque esos suelen estar ocupados; cámbialos en
`docker-compose.yml` si te viene mejor.

## Configuración

Variables de entorno con prefijo `PIZARRA_` (ver `backend/.env.example`):

| Variable                     | Por defecto                                | Para qué                                 |
| ---------------------------- | ------------------------------------------ | ---------------------------------------- |
| `PIZARRA_DATABASE_URL`       | `postgresql+psycopg://pizarra:pizarra@localhost:5432/pizarra` | Conexión a PostgreSQL |
| `PIZARRA_TEST_DATABASE_URL`  | `...:5432/pizarra_test`                    | Base que usan los tests                  |
| `PIZARRA_CORS_ORIGINS`       | `http://localhost:5173,...`                | Orígenes permitidos, separados por comas |
| `PIZARRA_DEBUG`              | `false`                                    | Logs SQL y nivel de log                  |
| `PIZARRA_API_PREFIX`         | `/api`                                     | Prefijo de todas las rutas               |
| `PIZARRA_DB_POOL_SIZE`       | `5`                                        | Conexiones fijas del pool                |
| `PIZARRA_DB_MAX_OVERFLOW`    | `10`                                       | Conexiones extra bajo carga              |

## API

| Método   | Ruta                                     | Qué hace                                    |
| -------- | ---------------------------------------- | ------------------------------------------- |
| `GET`    | `/api/health`, `/api/health/ready`       | Liveness y readiness (esta comprueba la BD) |
| `GET`    | `/api/plays`                             | Lista jugadas (`category`, `search`, paginación) |
| `POST`   | `/api/plays`                             | Crea una jugada                             |
| `GET`    | `/api/plays/{id}`                        | Detalle                                     |
| `PATCH`  | `/api/plays/{id}`                        | Actualización parcial                       |
| `DELETE` | `/api/plays/{id}`                        | Borra la jugada                             |
| `GET`    | `/api/sessions/current`                  | Sesión activa (la crea si no existe)        |
| `GET`    | `/api/sessions`, `POST /api/sessions`    | Listar y crear sesiones                     |
| `PATCH`  | `/api/sessions/{id}`                     | Editar cabecera de la sesión                |
| `POST`   | `/api/sessions/{id}/blocks`              | Añadir bloque                               |
| `PATCH`  | `/api/sessions/{id}/blocks/{block_id}`   | Editar bloque                               |
| `DELETE` | `/api/sessions/{id}/blocks/{block_id}`   | Quitar bloque                               |
| `PUT`    | `/api/sessions/{id}/blocks/order`        | Reordenar bloques                           |

### Modelo de datos

- **Play**: nombre, categoría (`Ataque`, `Defensa`, `ABP`, `Entrenamiento`), superficie
  (`full`, `half`, `grid`), modalidad (`f11`, `f7`), formación de cada equipo, consignas y
  el `board`.
- **Board** (documento `JSONB` validado): `players`, `items` (conos y balones), `shapes`
  (`run`, `pass`, `dribble`, `free`, `zone`, `text`) y `ball`. Coordenadas en unidades de
  pizarra sobre un campo de 1050×680.
- **TrainingSession** → **SessionBlock**: título, minutos, consignas y jugada asociada.
  Borrar una jugada deja el bloque en pie, sin diagrama (`ON DELETE SET NULL`); borrar una
  sesión arrastra sus bloques.

El tablero se valida en el backend (rangos de coordenadas, tipos de trazo, color en
hexadecimal, límites de tamaño), así que la base de datos no puede acabar con un diagrama
que el frontend no sepa pintar.

## Calidad

```bash
docker compose -f docker-compose.dev.yml up -d     # la BD debe estar arriba
cd backend  && .venv/Scripts/python -m pytest      # 20 tests contra PostgreSQL
cd backend  && .venv/Scripts/python -m ruff check .
cd frontend && npm run lint
cd frontend && npm run build
```

Los tests corren contra PostgreSQL de verdad, en la base `pizarra_test`: el esquema se
crea una vez y las tablas se vacían entre test y test. Probar sobre otro motor dejaría
sin cubrir justo lo que puede fallar en producción (`JSONB`, los `ON DELETE`, los tipos).

## Notas de diseño

- **El tablero como documento.** Un diagrama siempre se lee y se escribe entero, así que
  se guarda en una columna `JSONB` en vez de repartirlo en cinco tablas. Sigue siendo
  consultable desde SQL cuando hace falta:

  ```sql
  SELECT name, jsonb_array_length(board->'players') AS jugadores FROM plays;
  ```

- **Integridad en la base, no sólo en el ORM.** Las claves ajenas llevan `ON DELETE
  CASCADE` y `ON DELETE SET NULL` reales, y las relaciones usan `passive_deletes`:
  PostgreSQL lo resuelve en una sentencia y el dato queda íntegro aunque alguien toque la
  base a mano.
- **Esquema al arrancar.** `Base.metadata.create_all` es suficiente mientras el esquema
  esté quieto. En cuanto empiece a cambiar en producción, mete Alembic: los modelos ya
  están aislados para eso.
- **Guardado con debounce.** Los campos de la sesión se escriben en local al instante y se
  envían tras 600 ms, acumulando los cambios pendientes del bloque para que editar el
  título y acto seguido los minutos no descarte lo primero.
- **Historial en un reducer.** Tablero e historial de deshacer viven en la misma
  transición de estado, de modo que no pueden desincronizarse.
- **Atajos de teclado.** `V` mover, `D` desplazamiento, `P` pase, `C` conducción, `L`
  trazo libre, `Z` zona, `T` etiqueta, `O` cono, `B` balón, `E` borrar, `Ctrl/Cmd+Z`
  deshacer.
