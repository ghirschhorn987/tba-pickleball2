# Project Backlog

This document tracks feature requests, bugs, and other development tasks for the TBA Pickleball Lottery project.

```markdown
## Feature Requests
- [ ] Implement weekly time-driven trigger to email Accepted players and notify cancellations.
- [ ] Create clear user documentation that explains how to use the system and what it does. This documentation should include a clear, simple (non-technical) explanation of lottery. It should also include explanation of player statuses in history and explanation of reason in lottery.
- [ ] After history is updated, the list should be re-sorted alphabetically by name for easy lookup.

## Bugs
- [ ] List any known bugs here.

## Tech Debt & Chores
- [ ] List tech debt, refactoring tasks, or deployment chores here.
- [ ] Verify that lottery prioritization is working as expected. Brand new players should get top priority.

## 3. Waitlist Automation (The Check-in Phase)
- [ ] **`onEdit` Trigger:** An `onEdit(e)` trigger will be attached to the spreadsheet. It will monitor precisely the "Player Action" column of the active signup month.
- [ ] **Bumping Up Players:** When a player changes their action from `Pending/Accept` to `Decline`, the script fires:
    1. It finds the next-highest ranked person on the Waitlist for that specific time slot.
    2. It updates their Lottery Status to `Selected`.
    3. It applies the drop-down (Pending/Accept/Decline) data validation rule to their "Player Action" column.
    4. *(Optional future enhancement)*: Automatically send an email to that waitlist player telling them they're in.
```
