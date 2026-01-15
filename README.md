# My-CRM

A modern CRM application with Google Inbox integration, client management, and task tracking.

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Google Cloud Project (for Email integration)

### Local Setup
1. Clone the repository.
2. Configure environment variables (see [Google API Setup](#google-api-setup)).
3. Start the application:
   ```bash
   docker compose up --build
   ```
4. Access the application at `http://localhost`.

## Google API Setup

To enable email syncing and sending, you must configure a Google Cloud project.

### 1. Create a Project
- Go to the [Google Cloud Console](https://console.cloud.google.com/).
- Create a new project.

### 2. Enable APIs
- Navigate to **APIs & Services > Library**.
- Search for and enable the **Gmail API**.

### 3. Configure OAuth Consent Screen
- Go to **APIs & Services > OAuth consent screen**.
- Choose **External** (unless you have a Google Workspace org).
- Fill in required app information.
- **IMPORTANT**: Add the following scopes:
  - `https://www.googleapis.com/auth/gmail.readonly`
  - `https://www.googleapis.com/auth/gmail.send`
- Add your own email as a **Test User**.

### 4. Create Credentials
- Go to **APIs & Services > Credentials**.
- Click **Create Credentials > OAuth client ID**.
- Select **Web application**.
- Add **Authorized Redirect URIs**: `http://localhost:8000/api/crm/google/callback/`.
- Copy your **Client ID** and **Client Secret**.

### 5. Backend Configuration
- Open `backend/.env`.
- Paste your credentials:
  ```env
  GOOGLE_CLIENT_ID=your_client_id_here
  GOOGLE_CLIENT_SECRET=your_client_secret_here
  ```
- Restart the containers.

## Features
- **Client Management**: Track clients, metadata, and history.
- **Task System**: Create, assign, and monitor tasks.
- **Notes**: Quick annotations for client profiles.
- **Google Integration**: Connect your inbox, sync relevant threads, and send emails directly.
