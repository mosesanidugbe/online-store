# Online Store

An online store application with a React client and an Express/PostgreSQL
server. The project provides a storefront experience, user registration and
login, JWT-based authentication, and a protected account page.

## Features

- Browse the online store from the React home page
- Register an account with username, email, and password validation
- Log in with an existing account
- Secure passwords with bcrypt
- Authenticate requests with JSON Web Tokens
- Protect account pages and API routes
- Store users and roles in PostgreSQL
- Run automated authentication tests with Jest and Supertest

## Project structure

```text
Online-store/
├── client/                 # React and Vite frontend
│   ├── src/
│   │   ├── components/     # Navigation, products, and route protection
│   │   ├── context/        # Authentication state
│   │   └── pages/          # Home, login, and account pages
│   └── package.json
└── server/                 # Express API
    ├── db/
    │   └── schema.sql      # PostgreSQL database schema
    ├── routes/             # Authentication and account routes
    ├── tests/              # API tests and test setup
    └── package.json
```

## Technologies

### Client

- React
- React Router
- Vite
- JavaScript

### Server

- Node.js
- Express
- PostgreSQL
- `pg`
- JSON Web Tokens
- bcrypt
- Jest
- Supertest

## Getting started

### Prerequisites

- Node.js
- npm
- PostgreSQL

### 1. Set up the database

Create a PostgreSQL database, then apply the schema:

```bash
psql -d online_store -f server/db/schema.sql
```

The server supports either a `DATABASE_URL` connection string or these
individual database variables:

```text
DB_USER=
DB_HOST=
DB_NAME=
DB_PASSWORD=
DB_PORT=
```

Add `JWT_SECRET` to the server environment as well:

```text
JWT_SECRET=replace-with-a-long-random-secret
```

For the test suite, create a separate database whose name ends in `_test` and
place its settings in `server/.env.test`.

### 2. Install dependencies

Install dependencies for both applications:

```bash
cd server
npm install

cd ../client
npm install
```

### 3. Run the application

Start the API from the `server` directory:

```bash
npm start
```

The API listens on port `3000` by default. To use another port, set `PORT`.

In a second terminal, start the client from the `client` directory:

```bash
npm run dev
```

The client uses `http://localhost:3000` as its default API URL. Set
`VITE_API_URL` when the API is running elsewhere.

## API routes

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/` | Check that the API is running |
| `POST` | `/auth/register` | Create a customer account |
| `POST` | `/auth/login` | Authenticate a user |
| `GET` | `/account` | Get the authenticated user's account details |

The `/account` route requires a valid bearer token.

## Available scripts

### Client

From `client`:

```bash
npm run dev       # Start the Vite development server
npm run build     # Create a production build
npm run lint      # Run ESLint
npm run preview   # Preview the production build
```

### Server

From `server`:

```bash
npm start         # Start the Express server
npm test          # Run the Jest test suite
```

## Authentication

When a user registers or logs in successfully, the server returns a JWT and
basic user details. The client uses the token to access protected routes such
as the account page. Passwords are never stored directly; they are hashed with
bcrypt before being saved to PostgreSQL.
