# Deployment Guide - TBA Pickleball Manager

## Prerequisites
- Node.js & npm (Installed)
- Clasp (Installed globally via `npm install -g @google/clasp`)

## Setup Steps

**1. Login to Google (One-time)**
   Run the following command in your terminal and follow the browser instructions to authorize `clasp`.
   ```bash
   clasp login
   ```

**2. Initialize the Project**
   **Option A: Create a NEW Script Project**
   ```bash
   clasp create --type sheets --title "TBA Pickleball Manager" --rootDir .
   ```
   *This will create a new standalone script or sheet-bound script depending on selection. For Sheets bound, it's often easier to create the Sheet in UI then `clasp clone`.*

   **Option B: Clone an EXISTING Script (Recommended)**
   1. Open your Spreadsheet.
   2. Go to **Extensions > Apps Script**.
   3. Copy the **Script ID** from the Project Settings (Gear icon) or URL (`/d/<SCRIPT_ID>/edit`).
   4. Run:
   ```bash
   clasp clone <SCRIPT_ID> --rootDir .
   ```

**3. Push Code**
   Upload your local files to the Google Apps Script project.
   ```bash
   clasp push
   ```

**4. Watch for Changes (Optional)**
   Automatically push changes as you edit files.
   ```bash
   clasp push --watch
   ```

## Post-Deployment
- Refresh your Google Sheet.
- You should see the "Pickleball Menu" and be able to use the Sidebar.
