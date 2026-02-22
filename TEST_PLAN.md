# TBA Pickleball Manager - Test Plan

The application relies entirely on manual testing workflows within the Google Sheets environment. Here is a step-by-step checklist to verify everything is working perfectly:

### Step 1: Open the Application
1. Open your test Google Sheet where this script is attached.
2. At the very top (next to "Help"), click on the custom **"Pickleball Menu"**.
3. Click **"Open Sidebar"** to launch the React interface.

### Step 2: Test Month Creation & Duplicate Checking (Phase 4)
1. On the "Setup Manager" tab, enter a new month (e.g., "April 2026") into the "Month to Create" box and click **"Create Month"**.
   - **Verification:** Check the Google Sheet tabs to make sure both "April 2026" and "April 2026_Signup" have been created successfully, with identical formatting.
2. Try to type "April 2026" into the box again and click **"Create Month"**.
   - **Verification:** An error alert should pop up immediately telling you the month already exists (testing the duplicate prevention feature).
3. On the "April 2026_Signup" tab, try typing the same name manually into two different time slots.
   - **Verification:** An error alert should pop up immediately telling you "Duplicate Signup Detected" and preventing the second entry.

### Step 3: Test Real Data Simulation
1. Rather than typing out 60 fake signups manually, switch to the **Developer Tools** tab in your sidebar.
2. Select the "April 2026_Signup" sheet from the dropdown menu.
3. Click **"Generate Test Data"**. 
   - **Verification:** Look at your "April 2026_Signup" tab in the Google Sheet. It should instantly populate with dozens of fake names and partner requests. Ensure the generated names follow the A, B, C realistic name format (e.g. Alice_1) and do not repeat within a given time slot.

### Step 4: Test the Lottery Logic
1. Switch to the **Lottery Controls** tab.
2. Select "April 2026" from the target month dropdown.
3. Click **"Run Lottery"**.
   - **Verification:** Look at the "Lottery" tab on the Admin sheet. You should see days of the week successfully generated with players each, split into pairs by weight matching or randomized if not specified, and waitlists populated appropriately below the top names.

### Step 5: Test the Pruning/Cleanup Logic (Phase 3)
1. Go back to the **Setup Manager** tab in the sidebar.
2. Click **"Finalize Month"** (ensure "April 2026" is selected).
   - **Verification:** The "April 2026_Signup" tab should be completely deleted from the Google Sheet (this prevents players from modifying their inputs after the draw is published). All the final, post-lottery data should be populated into "April 2026", overwriting the manual entries, and the remaining slots should be cleared.
