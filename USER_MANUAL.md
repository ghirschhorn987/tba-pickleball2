# Pickleball Manager - User Manual

Welcome to the Pickleball Manager! This system is a Google Sheets-based application designed to manage monthly pickleball signups, fairly assign play slots via an automated lottery, and handle waitlists and cancellations smoothly.

## How the System Works (Overview)

1. **New Month Creation:** The administrator creates a "Signup" sheet for the upcoming month.
2. **Player Signups:** Players enter their Name and Email next to the time slot they wish to play in. You can also request to be "paired" with the person signed up immediately above you.
3. **Lottery Selection:** The administrator runs an automated lottery that fairly selects players for the limited spots and places the rest on a waitlist.
4. **Publishing Results:** The lottery results are published to the Signup sheet, displaying who is "Selected" and who is on the "Waitlist". 
5. **Player Confirmation:** "Selected" players must change their action from 'Pending' to either 'Accept' or 'Decline'.
6. **Waitlist Automation:** If a selected player declines their spot, the next person on the waitlist is automatically promoted to 'Selected' and notified.
7. **Finalize Month:** The administrator finalizes the month. This locks the signups and officially records who played, who declined, and who was waitlisted into the "History" tab to ensure fairness in future lotteries.

---

## How the Lottery Works

The lottery is not purely random—it is designed to ensure that everyone gets a fair chance to play over time. Here is a simple explanation of how the system prioritizes players who sign up:

- **Past Rejections Come First:** If you were waitlisted (i.e., rejected) in recent months, you get the highest priority to be selected. The system gives tiebreakers to the people who were rejected most recently.
- **Past Declines Come Second:** If you were selected previously but had to decline the spot, you are given higher priority than regular players, but lower priority than those who were outright rejected.
- **Fair Rotation:** For everyone else, the lottery heavily favors people who haven't played recently, and it penalizes frequent players. The longer it has been since you last played, the better your chances of being selected.
- **Tie Breaker:** When players have similar past histories, the system assigns a slight random tiebreaker value.
- **Pairing Mechanics:** If you check the "Pair With Previous" box next to your name, the system will try to select both you and the person above you as a unit. It averages both of your "priorities" together. If there is only one spot remaining in the lottery, the system will waitlist *both* of you so you remain paired together.

---

## Player Statuses in History

The "History" tab accurately tracks every player's participation each month. At the end of every month, your engagement is recorded as one of the following statuses:

- **Selected:** You were selected by the lottery (or upgraded from the waitlist), and you accepted the spot to play.
- **Declined:** You were selected by the lottery (or upgraded from the waitlist), but you declined the spot. 
- **Waitlist:** You signed up to play, but you were not selected because the time slot was full. You remained on the waitlist. 

*Note: If you did not sign up for a month, your status is left blank.*

---

## Reason Codes in Lottery

When the lottery is run, a list of ranked players is generated in the "Lottery" tab. Next to each player's name is a "Reason" that intuitively explains why their priority was calculated that way:

- **High Rejections (X):** The player is given top priority because they were waitlisted (rejected) `X` times in the past. 
- **Previous Declines (X):** The player is given high priority because they declined `X` times in the past. 
- **New/Infrequent Player:** The player has not been selected to play in the last 10 months, so they are prioritized over players who have played recently.
- **Played X mo ago:** The player was selected to play `X` months ago. The higher the number, the higher priority they receive.
- **[Paired]:** Appears alongside other reasons if the player requested to be paired. This indicates their priority was averaged with their partner to keep them together.
