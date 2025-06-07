# **App Name**: Elint Heist TOD

## Core Features:

- Scrolling UI: Horizontal Scrolling UI: Implement a seamless, looping horizontal scrolling interface for the Tactical Overlay Device (TOD).
- Holographic Styling: Holographic UI Elements: Style UI elements (buttons, panels, text) with a translucent, glowing, wireframe effect for a holographic appearance.
- AI Welcome Messages: AI-Generated Welcome Messages: Implement an AI-powered system to generate dynamic, spy-themed welcome messages from HQ for returning users. The tool will intelligently include calls to action and relevant updates about the game.
- Team Theme: Team-Based Theming: Dynamically change the TOD's color scheme based on the player's selected faction (red for Shadows, blue for Cyphers).
- Daily Team Codes: Daily Team Code: Provide daily team codes in the Command Center's Comms. These codes are needed to claim "Dropped Items" on the Scanner page, ensuring only team members can access them.

## Gameplay:

Spi vs Spi: ELINT Heist is a massive multiplayer online strategy game exclusive to Pi Network. Players choose to join one of two factions: The Cyphers (themed blue, focused on data analysis and intelligence gathering) or The Shadows (themed red, focused on infiltration and sabotage). Players can also choose to be an "Observer" with limited functionality before committing with Pi Authentication.

The primary objective is to gather, defend, and transfer ELINT (Electronic Intelligence), the in-game currency, to their team's HQ. The team with the most ELINT at the end of a weekly cycle wins.

Key Gameplay Loops:
- **ELINT Generation:** Players generate ELINT using the "Network Tap" feature in the Control Center (activated hourly).
- **Item Acquisition:** Players can acquire locks and gadgets through the "Check In with HQ" feature (activated every 6 hours) or by claiming "Dropped Items" using the daily team code in the Scanner section.
- **ELINT Transfer:** ELINT can only be transferred to HQ during a specific "Transfer Window" period.
- **Infiltration/Raiding:** Players can raid rival vaults found in the Scanner section. This involves mini-games.
- **Defense:** Players defend their own ELINT in their Vault by equipping locks and lock fortifiers.
- **Spy Shop:** Players can purchase items to aid in offense and defense from the in-game "Quantum Industries" Spy Shop.

Mini-games are central to infiltration, with difficulty determined by the type and level of the lock and its fortifiers. Each of the 8 lock types corresponds to a different mini-game.

## Your TOD (Tactical Overlay Device):

The TOD is the player's personal command console. It features a continuous, looping horizontal holographic display that the player navigates by sliding left and right.

Sections within the TOD:

- **Agent Section:** Provides an overview of Agent stats, Level, progress, and ELINT transferred. Includes access to the Agent Dossier, Intel Files, and Settings.
- **The Control Center:** Contains core operational features:
    - "Network Tap": Generates and stores ELINT in the Vault (hourly).
    - "Check In with HQ": Rewards players with locks and gadgets (every 6 hours).
    - Transfer Window Timer: Indicates the period when ELINT can be transferred to HQ.
    - Weekly Cycle Timer: Shows time remaining in the current game cycle.
    - The Comms: Displays messages from HQ, Alerts, System Notifications, and the daily Team Code.
- **The Scanner:** Where players find targets and opportunities:
    - Vaults to raid.
    - Enemy ELINT transfers to intercept.
    - Dropped Items to claim using the daily team code.
- **The Equipment Locker:** The player's Inventory. Also provides access to the Spy Shop.
- **The Spy Shop:** The in-game store ("Quantum Industries") where players can browse and purchase items including:
    - Locks
    - Lock Fortifiers
    - Nexus Upgrades
    - Infiltration Gear
    - Assault Tech
    - Aesthetic Schemes
- **The Vault:** The player's ELINT wallet. Contains 8 slots: 4 for vault-wide upgrades and 4 for equipping locks. Locks can be strengthened with Lock Fortifiers.

## Style Guidelines:

- Primary faction color: Dynamic switching between team-based colors with a cool color palette using a dominant electric blue for The Cyphers and a deep intense red for The Shadows.
- Secondary colors: Pale turquoise and Light salmon to complement and offset the faction primary.
- Accent color: Glowing White (#FFFFFF) for key holographic elements to create a glowing high-tech feel and use black only where higher contrast is required, like yellows.
- Typography: Orbitron for titles and main UI. Rajdhani for Message feed to simulate communication and display longer character chains of data.
- Custom designed, glowing icons representing spy tools, actions, and factions.
- Mobile-first responsive design to be easily enjoyed across different form factors, with a horizontally scrolling main interface, split into logical sections, accessible from every other.
- Use subtle, high-tech animations for transitions, data updates, and feedback to enhance immersion.
- Parallax scrolling, subtle 3D effect across the scrolling axis to enhance depth.
- Glowing red indicator for disabled tap state in command center
