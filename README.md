# meetgowhere

## Introduction

### Stack

- NextJS (bootstrapped with `create-next-app`)
- Typescript
- PostgreSQL
- Sequelize as the ORM
- TailwindCSS as CSS framework
- Jest as the testing framework

## Table of Contents

- [Project Structure](#project-structure)
- [Local Project Setup](#local-project-setup)
	- [Pre-Requisites](#pre-requisites)
	- [Running the Application](#running-the-application)
	- [Running the Tests](#running-the-tests)
	- [Working with Sequelize ORM](#working-with-sequelize-orm)
- [Requirements](#requirements)
	- [Assumptions](#assumptions)
- [User Flow](#user-flow)
- [Technical Specs](#technical-specs)
	- [Technical Considerations](#technical-considerations)
	  - [User Authentication](#user-authentication)
  - [API Endpoints](#api-endpoints)
    - [GET /sessions/:id](#get-sessionsid)
    - [POST /sessions](#post-sessions)
    - [POST /sessions/:id/join](#post-sessionsidjoin)
    - [POST /sessions/:id/compute](#post-sessionsidcompute)
    - [PATCH /sessions/:id/location](#patch-sessionsidlocation)
    - [PATCH /sessions/:id/end](#patch-sessionsidend)
    - [GET /sessions/:id/validate](#get-sessionsidvalidate)
    - [GET /auth](#get-auth)
- [Future Improvements](#future-improvements)
  - [Tech Debt](#tech-debt)
  - [Features](#features)

## Project Structure

## Local Project Setup

### Pre-Requisites

#### 1. Get a version manager

This project runs on **Node v22.18.0**.

#### 2. Docker & Container Runtime

We recommend `colima` over Docker Desktop.

```shell
brew_install "colima"
brew_install "docker"
brew_install "docker-compose"
brew_install "qemu"  # Ensures Colima can run x86 containers on Apple Silicon
```

#### 3. Setup the Repository

```shell
npm install
npx sequelize-cli db:migrate # Run the migration files
```

### Running the Application

```shell
./scripts/run-local.sh
```

This will bring up all the Docker containers in development mode. This includes:

- The client/server at `http://localhost:3000/`
- The database at `postgres://admin:admin@localhost:5432/meetapp`
- The test database at `postgres://admin:admin@localhost:5433/meetapp_test`

### Running the Tests

```shell
npm run test
```

### Working with Sequelize ORM

We use the Sequelize CLI, the official command-line interface tool designed to work with Sequelize.

Some useful commands includes:

```shell
# Creating a new table (model)
npx sequelize-cli model:generate --name <ModelName> --attributes <attribute1>:<type>,<attribute2>:<type>...

# Running the migration files
npx sequelize-cli db:migrate

# Undo-ing the previous migration
npx sequelize-cli db:migrate:undo
```

Configurations for the Sequelize CLI are stored in [.sequelizerc](./.sequelizerc).

## Requirements

### Assumptions

- The application will ALWAYS be able to obtain the user's location.
- A user is tied to the browser they are using. Therefore:
  - They are unable to view information about the session they have joined from another browser on the same device; and
  - They are unable to join more than 1 session at a time.
- Computing of the meeting location can only be done ONCE.
- An initiator can only manually change the meeting location AFTER computing the location.
  - This can only be done ONCE.
  - After overriding the computed location, the meeting location can no longer be changed. This means that:
    - It cannot be changed back to the computed location; and
    - It cannot be manually changed again.

## User Flow

View the user flow [here](./public/user_auth.png).

## Technical Specs

### Technical Considerations

#### User Authentication

This project uses JWT (JSON Web Tokens) stored in cookies.

![User Auth Flow](./public/user_auth.png)

Session-based authentication was considered, but this approach was chosen in the end because it is more straightforward to implement, with some protection against common web vulnerabilities.


|     | JWT in Cookies | Session-based Authentication |
|------------|----------------|------------------------------|
| **Pros**   | - Simple to implement  <br> - Stateless authentication; no need for server-side storage  <br> - Some security against client-side attacks (XSS/CSRF) when configured | - Better control over issued tokens  <br> --- Easier tracking and revocation of sessions  <br> - Generally more secure |
| **Cons**   | - No tracking of issued tokens  <br> --- Difficult to revoke tokens  <br> --- Hard to refresh tokens after expiry | - Requires more setup  <br> - Needs server-side storage and session management logic |
| **Chosen** | ✅ | ❌ |


### API Endpoints

| Endpoint                     | Description                              | Link                                   |
| ---------------------------- | ---------------------------------------- | -------------------------------------- |
| POST /sessions               | Create a new session                     | [More Info](#post-sessions)            |
| GET /sessions/:id            | Retrieve session info                    | [More Info](#get-sessionsid)           |
| POST /sessions/:id/join      | Join a session as a participant          | [More Info](#post-sessionsidjoin)      |
| POST /sessions/:id/compute   | Compute a meeting location for a session | [More Info](#post-sessionsidcompute)   |
| PATCH /sessions/:id/location | Manually update the meeting location     | [More Info](#patch-sessionsidlocation) |
| PATCH /sessions/:id/end      | End a session                            | [More Info](#patch-sessionsidend)      |
| GET /sessions/:id/validate   | Validates a session                      | [More Info](#get-sessionsidvalidate)   |
| GET /auth                    | Retrieve user info                       | [More Info](#get-auth)                 |

---

#### GET /sessions/:id

Retrieve session info

| Info         | Description                                                                       |
| ------------ | --------------------------------------------------------------------------------- |
| Auth         | User token in browser's cookie                                                    |
| Query Params | `id: string`                                                                      |
| Errors       | - 400: Invalid Session <br> - 401: Unauthorized <br> - 500: Internal Server Error |

**Response**

```typescript
session: {
	id: string,
	status: 'active' | 'ended',
	created_by: string,
	created_at: Date,
	updated_at: Date,
	ended_at: Date | null,
	invite_token: string,
	computed_location: {

	},
	override_location: {
		lat: number,
		lng: number,
		source: 'automatic' | 'manual',
		updated_at: string,
	},
	participants: [
		{
			username: string,
			role: 'initiator', 'participants',
			location: {
				lat: number,
				lng: numer,
			},
		},
	]
}
```

---

#### POST /sessions

Create a new session

| Info   | Description                                                     |
| ------ | --------------------------------------------------------------- |
| Auth   | -                                                               |
| Body   | `username: string`,<br>`location: { lat: number, lng: number }` |
| Errors | - 500: Internal Server Error                                    |

**Response**

```typescript
session: {
	id: string,
	invite_token: string
}
```

---

#### POST /sessions/:id/join

Join a session as a participant

| Info          | Description                                                                               |
| ------------- | ----------------------------------------------------------------------------------------- |
| Query Params  | `id: string`                                                                              |
| Search Params | `token: string`                                                                           |
| Auth          | -                                                                                         |
| Errors        | - 400: Missing Invite Token <br> - 400: Invalid Session <br> - 500: Internal Server Error |

**Response**

```typescript
message: 'ok';
```

---

#### POST /sessions/:id/compute

Compute a meeting location for a session

| Info         | Description                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| Query Params | `id: string`                                                                                              |
| Auth         | User must be a session initiator                                                                          |
| Errors       | - 400: Invalid Session <br> - 401: Unauthorized <br> - 400: Bad Request <br> - 500: Internal Server Error |

**Response**

```typescript
computed_location: {
	lat: number,
	lng: number,
	source: 'automatic' | 'manual',
	updated_at: string,
}
```

---

#### PATCH /sessions/:id/location

Manually update the meeting location

| Info         | Description                                                                       |
| ------------ | --------------------------------------------------------------------------------- |
| Query Params | `id: string`                                                                      |
| Auth         | User must be a session initiator                                                  |
| Body         | `lat: number`,<br>`lng: number`                                                   |
| Errors       | - 400: Invalid Session <br> - 401: Unauthorized <br> - 500: Internal Server Error |

**Response**

```typescript
session: {
	id: string,
	status: 'active' | 'ended',
	created_by: string,
	created_at: Date,
	updated_at: Date,
	ended_at: Date | null,
	invite_token: string,
	computed_location: { },
	override_location: {
		lat: number,
		lng: number,
		source: 'automatic' | 'manual',
		updated_at: string,
	},
}
```

---

#### PATCH /sessions/:id/end

End a session

| Info         | Description                                                                       |
| ------------ | --------------------------------------------------------------------------------- |
| Query Params | `id: string`                                                                      |
| Auth         | User must be a session initiator                                                  |
| Errors       | - 400: Invalid Session <br> - 401: Unauthorized <br> - 500: Internal Server Error |

**Response**

```typescript
session: {
	id: string,
	status: 'active' | 'ended',
	created_by: string,
	created_at: Date,
	updated_at: Date,
	ended_at: Date | null,
	invite_token: string,
	computed_location: { },
	override_location: {
		lat: number,
		lng: number,
		source: 'automatic' | 'manual',
		updated_at: string,
	},
}
```

---

#### GET /sessions/:id/validate

Validates a session

| Info   | Description                                                                               |
| ------ | ----------------------------------------------------------------------------------------- |
| Auth   | -                                                                                         |
| Errors | - 400: Invalid Session <br> - 400: Missing Invite Token <br> - 500: Internal Server Error |

**Response**

```typescript
message: 'ok';
```

---

#### GET /auth

Retrieve user info

| Info   | Description                                           |
| ------ | ----------------------------------------------------- |
| Auth   | User token in browser's cookie                        |
| Errors | - 401: Unauthorized <br> - 500: Internal Server Error |

**Response**

```typescript
user: {
	username: string,
	role: 'initiator' | 'participant',
	sessionId: string
}
```

### Future Improvements

#### Tech Debt

| Ticket | Priority | Description |
|--------|----------|-------------|
| Refresh user tokens | Very High | - Currently, the user tokens in the cookies expires after 7 days<br>- Since there is no refresh implemented, the user will no longer have access to the session, even if the session has yet to end |
| Add loading icon/page for slow queries | Very High | - There are some slow queries in the `/s/join` page and the Update Location modal.<br>- To improve user experience, we should add a loading icon/page to assure user that the buttons have been clicked. |
| Tests | High | - Backend unit tests<br>- Frontend tests |
| Create a validation middleware | High | - Currently, all API endpoints do not have validations on the params<br>- Should look into creating a validation middleware for ease of management |
| Create an auth middleware | Medium | - Currently, the auth code is copied+pasted across multiple files<br>- Should look into creating an auth middleware for better management of:<br>  --- Checking if a user is authenticated<br>  --- Checking if a user holds a particular role |
| Refactor frontend pages | Medium | - There are some code that has been copied+pasted in multiple places<br>- Possibly create a separate file for all API calls for better management |
| Have better environment variables management | Low | - Validate and manage the environment variables across all environments<br>- Should consider using a library (e.g. `dotenv`) |
| Pre-Commit Hooks | Low | - Setup the linter configuration such that there are no warnings<br>- Setup pre-commit hooks such that prettier/linter/tests run before all commits |

#### Features

| Ticket | Priority | Problem Statement | Solution |
|--------|----------|-------------------|----------|
| Map / Location Name | High | Displaying corrdinates is not intuitive for the users. | Display the location name and/or map of the location. |
| Users can manually input their own location | High | The browser may fail to obtain the user's location. | Users can fallback to selecting their own location should their browser be unable to obtain their location. |
| Live updates | Medium | Users have to refresh the page to get updates of the session. If they do not refresh the page, they would not be updated of a session's changes. | - Allow live updates of the session without having the refresh the page (using websocket/sse/polling). <br> - Have browser notifications should there be an important change in the session (i.e. session has ended, meeting point has been computed). |
| Login (Username/Password) | Low | Once a session is created/joined from a particular browser on a particular device, the session info can only be viewed from that particular device/browser. | With a username/password tied to each user, users can: <br> - View session information from any device/browser; and <br> - Create/Join more than 1 session at any given time. |
| More flexibility for session meeting point | Low | The initiator is unable to: <br> - Change the meeting location back to the computed location after overriding the computed location; and <br> - Update the manual meeting location. | Allow the initiator to: <br> - Switch between the computed location and the manually-input meeting location; and <br> - Update the manually-input meeting location. |