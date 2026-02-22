# Pickleball Manager Workflow Refactoring Plan

This plan details the full end-to-end workflow, combining the waitlist automation with your specific tab management and formatting ideas.

## 1. Month Creation (The Initial State)
- **Single Tab Entry:** The `createMonth` function will only create one tab, for example, `[Month Name] Signup`. It will no longer create a separate main month tab immediately.
- **Copying Formatting:** `createMonth` will be updated to fetch and clone from the template "MANUAL March 2026" tab, as mentioned in your backlog changes. We will programmatically insert the new dates, names, slots, etc., on top of this standardized format.
- **Player Action:** Players sign up by entering their Name, Email, and Pairing (just like before).

## 2. Running The Lottery & Publishing
- **Decoupling Lottery from History:** The `runLottery` script will run exactly as it currently does (ranking players and allocating slots) on the backend "Lottery" tab, but it will **NOT** immediately update the History tab.
- **Publish Results Button:** We will add a new "Publish Results" action in the `index.html` sidebar.
- **Publish Action Behavior:**
  - The script reads the Lottery tab's results.
  - Two columns are appended to the far right of the signup list in the `[Month Name] Signup` tab: **"Lottery Status"** and **"Player Action"**.
  - **"Lottery Status"**: Pre-fills with `Selected` or `Waitlist #1`, `Waitlist #2`, etc. This column will be protected so general users cannot edit it.
  - **"Player Action"**: Gives only `Selected` players a dropdown (Data Validation rule) with fixed choices: `Pending`, `Accept`, `Decline`. It defaults to `Pending`.

## 3. Waitlist Automation (The Check-in Phase)
- **`onEdit` Trigger:** An `onEdit(e)` trigger will be attached to the spreadsheet. It will monitor precisely the "Player Action" column of the active signup month.
- **Bumping Up Players:** When a player changes their action from `Pending/Accept` to `Decline`, the script fires:
  1. It finds the next-highest ranked person on the Waitlist for that specific time slot.
  2. It updates their Lottery Status to `Selected`.
  3. It applies the drop-down (Pending/Accept/Decline) data validation rule to their "Player Action" column.
  4. *(Optional future enhancement)*: If you want, this function. could automatically send an email to that waitlist player telling them they're in.

## 4. Finalization (Locking It In)
- **Finalize Month Button:** A final "Finalize Month" action will be added for the administrator when check-ins are closed.
- **Finalize Action Behavior:**
  1. **Enforce Defaults:** The script converts any `Pending` responses from Selected players into `Decline`.
  2. **Update History:** The History tab is finally updated. 
     - "Accepted" = Logged as `Selected` (so they played).
     - "Declined" or "Pending" = Logged as `Declined` (triggers the penalty).
     - "Waitlisted" = Logged as `Waitlist`.
  3. **Delete Rows:** The script permanently deletes rows for people who Declined or remained on the Waitlist.
  4. **Trim Rows:** The script checks each timeslot block. If there are extra empty rows keeping it above exactly 12 total spaces, those extra rows are deleted to clean up the table.
  5. **Data Protection:** The "Player Action" dropdowns are removed, and the entire `[Month Name] Signup` tab is renamed to just `[Month Name]`. The sheet is locked for editing.

## 5. Cancellations & Communication Features
These will build on top of the finalized system:
- **Weekly Emails:** We can create a time-driven trigger that runs every week. It reads the current, finalized month tab to see who is Accepted for the upcoming Sunday and sends them a confirmation email.
- **Game Cancellations:**
  - We will develop a specific scheme for a cancelled week. For instance, an admin could right-click the specific Sunday date header and select a custom script menu "Cancel This Week's Game".
  - The script will change the background color of that column to indicate cancellation (e.g., Gray or Red).
  - The column will be protected to visually and functionally disable it.
  - The weekly email script will detect this marker and send a "Game Cancelled" notice instead.
