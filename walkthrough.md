# Walkthrough - TBA Pickleball Manager

This document guides you through verifying the Pickleball Manager system.

## Prerequisites

1.  **Open the Google Sheet** associated with this script.
2.  **Refresh the page** to ensure the Apps Script loads.
3.  You should see a new menu item called **"Pickleball Menu"** in the toolbar (it may take a few seconds to appear).

## Verification Steps

### 1. Initial Setup
- Click **Pickleball Menu** > **Open Sidebar**.
- The sidebar should open on the right side of the screen.

### 2. Create a Month
- In the Sidebar, select a month (e.g., "October 2023").
- Ensure "Sundays" is set to 4 or 5.
- Click **"Create Month"**.
- **Verify**: A new tab named "October 2023" (or selected month) appears. It should have:
    - Color-coded sections for 4 time slots.
    - Thick borders separating slots.
    - Headers including "Name", "Email", "Time Slot", "Pairing".

### 3. Generate Test Data
- With the month selected in the dropdown, click **"Create Test Data"**.
- **Verify**: The sheet populates with dummy data.
    - Names like "A_Player_1", "B_Player_1".
    - Some rows should be "Available" (Yellow background).
    - Some rows should have "With Above" in the Pairing column.

### 4. Run Lottery
- Click **"Run Lottery"**.
- **Verify**:
    - A new tab named **"Lottery"** is created (if not exists).
    - The tab contains a list of "Winners" for each slot.
    - Verify that the count of winners matches the limit (12 per slot).

### 5. Clear Month (Cleanup)
- Click **"Clear Month"**.
- Confirm the dialog.
- **Verify**: The month tab is deleted.

## Troubleshooting

- **"Script function not found"**: If you see this, try reloading the sheet again.
- **"Sheet with this name already exists"**: Delete the tab manually or use the "Clear Month" button before creating it again.
- **Config IDs**: If functions fail with ID errors, ensure `Config.gs` has `REPLACE_WITH_PUBLIC_SHEET_ID` replaced with the actual ID, or rely on the fallback which uses the active sheet.
