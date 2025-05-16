# Navify Server API

This repository contains the server-side code for the Navify application, which handles address management and user authentication.

## Installation

1. Install dependencies:

   ```
   yarn install
   ```

2. Create a `.env` file with the following contents:

   ```
   PORT=3000
   NODE_ENV=development
   DATABASE_URL="postgresql://postgres:password@localhost:5432/navify"
   JWT_SECRET="navify-secret-key-replace-in-production"
   JWT_EXPIRES_IN="7d"
   ```

3. Generate Prisma client:

   ```
   yarn prisma generate
   ```

4. Run migrations:
   ```
   yarn prisma migrate dev
   ```

## Usage

1. Start the development server:

   ```
   yarn dev
   ```

2. Test the API endpoints:

   ```
   # Health check
   curl http://localhost:3000/health

   # Get all addresses (requires user-id header)
   curl -H "user-id: user123" http://localhost:3000/api/addresses

   # Get address by ID (requires user-id header)
   curl -H "user-id: user123" http://localhost:3000/api/addresses/ADDRESS_ID

   # Create a new address (requires user-id header)
   curl -X POST -H "Content-Type: application/json" -H "user-id: user123" \
     -d '{"name":"Home","landmark":"Near the park","latitude":37.7749,"longitude":-122.4194}' \
     http://localhost:3000/api/addresses

   # Update an address (requires user-id header)
   curl -X PUT -H "Content-Type: application/json" -H "user-id: user123" \
     -d '{"name":"Work","landmark":"Office building","latitude":37.7749,"longitude":-122.4194}' \
     http://localhost:3000/api/addresses/ADDRESS_ID

   # Delete an address (requires user-id header)
   curl -X DELETE -H "user-id: user123" http://localhost:3000/api/addresses/ADDRESS_ID
   ```

## API Endpoints

### Address Routes

| Method | Endpoint           | Description                    | Auth           | Request Body                                     |
| ------ | ------------------ | ------------------------------ | -------------- | ------------------------------------------------ |
| GET    | /api/addresses     | Get all addresses for the user | user-id header | -                                                |
| GET    | /api/addresses/:id | Get address by ID              | user-id header | -                                                |
| POST   | /api/addresses     | Create a new address           | user-id header | name, landmark, notes, tags, latitude, longitude |
| PUT    | /api/addresses/:id | Update an address              | user-id header | name, landmark, notes, tags, latitude, longitude |
| DELETE | /api/addresses/:id | Delete an address              | user-id header | -                                                |

### Address Object

```json
{
  "id": "string",
  "userId": "string",
  "code": "string",
  "name": "string",
  "landmark": "string",
  "notes": "string",
  "tags": ["string"],
  "latitude": "number",
  "longitude": "number",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Development

### Project Structure

```
/apps/server
├── prisma/               # Prisma schema and migrations
├── src/
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── routes/           # Route definitions
│   ├── services/         # Business logic
│   ├── types/            # TypeScript type definitions
│   └── index.ts          # Main application entry point
├── .env                  # Environment variables
├── package.json          # Project dependencies
└── tsconfig.json         # TypeScript configuration
```

## License

This project is licensed under the MIT License.
