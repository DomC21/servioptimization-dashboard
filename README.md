# Service Optimization Dashboard

A comprehensive dashboard for analyzing and optimizing service performance with AI-powered recommendations.

## Features

- Service performance analysis and categorization
- Real-time profit margin calculations
- AI-powered optimization recommendations
- Interactive ChatBox assistant
- Performance threshold customization
- Seasonal trend analysis
- Service simulation capabilities

## Project Structure

```
app/
├── frontend/         # React + Vite frontend application
│   ├── src/         # Source code
│   └── public/      # Static assets
└── backend/         # FastAPI backend application
    ├── app/         # Application code
    └── tests/       # Test suite
```

## Technology Stack

### Frontend
- React + Vite
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Recharts for data visualization
- Lucide React icons

### Backend
- FastAPI
- SQLAlchemy
- Prophet for forecasting
- scikit-learn for ML
- PostgreSQL database

## Development

### Prerequisites
- Python 3.12+
- Node.js 18+
- pnpm or npm
- PostgreSQL

### Setup Instructions
1. Clone the repository
2. Set up the backend:
   ```bash
   cd app/backend
   poetry install
   poetry run uvicorn app.main:app --reload
   ```
3. Set up the frontend:
   ```bash
   cd app/frontend
   pnpm install
   pnpm dev
   ```

## API Documentation
The API documentation is available at `/docs` when running the backend server.

## License
MIT License
