# Spark 2.0

Spark 2.0 is an internal performance review application with:

- ASP.NET Core 8 backend
- React + Vite frontend
- MySQL/MariaDB persistence
- Cookie-based authentication with CSRF protection

## Local Development

### Backend

Set the database connection string:

```bash
export SPARKDB_CONNECTION="Server=localhost;Port=3306;Database=sparkdb;User=spark;Password=spark123;"
```

Run the API:

```bash
dotnet run --launch-profile http
```

Backend default URL:

```text
http://localhost:5212
```

### Frontend

Start the Vite dev server:

```bash
npm run dev
```

Frontend default URL:

```text
http://localhost:3001
```

## Database Bootstrap

Initialize the schema and seed data:

```bash
mysql -u spark -p sparkdb < database/init.mysql.sql
```

Optional extra employee for manual evaluation testing:

```bash
mysql -u spark -p sparkdb < database/add-test-employee.mysql.sql
```

Default demo accounts:

- `admin` / `admin123`
- `manager` / `manager123`
- `employee` / `employee123`
- `employee2` / `employee123`

## Tests

Frontend:

```bash
npm test
```

Backend:

```bash
dotnet test spark.generated.sln
```

## Security Checks

Run these on a machine with internet access:

```bash
npm audit
dotnet list spark.csproj package --vulnerable
```

Recommended additional checks:

```bash
npm run lint
npm run build
dotnet build spark.generated.sln
```

## Notes

- Authentication uses cookie sessions plus antiforgery tokens.
- Role and session invalidation state are stored in the database.
- Schema bootstrap for legacy databases is handled at startup in `DatabaseBootstrap`.
