# SnipeIT Asset Entry

A simple web application for quickly adding assets to SnipeIT inventory management system.

## Features

- **Company (Owner)**: Autocomplete search for existing companies; creates new if not found
- **Asset Tag**: Auto-populated with next available tag (read-only)
- **Asset Name**: Optional name field
- **Serial Number**: Optional serial number field
- **Model**: Autocomplete with auto-creation for new models
- **Manufacturer**: Shown only when creating a new model (with autocomplete)
- **Status**: Dropdown with existing status labels
- **Notes**: Text area for additional information
- **Default Location**: Autocomplete search for existing locations
- **Requestable**: Checkbox for requestable status
- **Image**: File upload or built-in camera capture

## Configuration

Create a `.env` file in the project root:

```env
SNIPEIT_API_URL=https://your-snipeit-instance.example.com/api/v1
SNIPEIT_API_KEY=your-api-key-here
```

See `.env.example` for reference.

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

The app will be available at `http://localhost:4321`.

## API Endpoints

- `/api/companies` - Search and create companies
- `/api/models` - Search and create models
- `/api/statuses` - List status labels
- `/api/locations` - Search locations
- `/api/next-asset-tag` - Get next auto-increment asset tag
- `/api/assets` - Create new asset

## 🧞 Commands

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
