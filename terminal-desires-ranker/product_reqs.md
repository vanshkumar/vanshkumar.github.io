# **Terminal Desires Comparator: Final Product Requirements**

## 1. Overview

**Name/Working Title**: _Terminal Desires Comparator_  
**Purpose**:  
A fully static, client-side web application for users to:

1. View and manage (add/remove) a list of “terminal desires” (core motivations).
2. Compare them pairwise (via a slightly randomized bubble sort process).
3. Get a ranked list from “most important” to “least important.”

---

## 2. Major Features & Flow

### 2.1. Page 1: Terminal Desires List

4. **Header Text**
    
    > “Terminal desires are the true underlying reasons why you do everything. Edit the list of potential terminal desires below and press Start once you're ready to pairwise compare them to see what might be pulling you.”
    
5. **Start Button (Green)**
    
    - **Enabled** only if there are **at least 2 items** in the list.
    - Otherwise, **disabled** (grayed out or not clickable).
    - On click, navigates to **Page 2** (pairwise comparison).
6. **Add Custom Desire**
    
    - A row with two input fields:
        1. **Name** (required)
        2. **Description** (optional)
    - A small green checkmark icon or button to confirm adding the new desire.
    - On click:
        - Insert the new desire at the **front** of the list.
        - Clear the input fields for immediate further addition if needed.
7. **Seed (Pre-populated) Desires**
    
    - The app **initially** has these 14 items, each with a name and a description:
        
        1. **curiosity**
            - _Description_: “The desire to know things as an end in itself. If someone asked me _why_ I want to resolve "why's there something rather than nothing?", when it almost certainly has no practical implications on my life, I'd be hard-pressed to answer. I just do."
        2. **autonomy, liberty, freedom**
            - _Description_: “The desire to be unconstrained by the whims of others. The desire to be unconstrained by economic/material necessity. The desire to be unconstrained."
        3. **the spirit of mischief**
            - _Description_: “Pranks. Trolling. A desire to find things you shouldn't be able to do. A desire to do things you aren't supposed to do (whether social norms or some other intent being defied). Finding humor in fucking with things larger than yourself."
        4. **competitive drive**
            - _Description_: “The desire to be _the best_, not second place. The desire to win, often regardless of what game it is."
        5. **hedonism**
            - _Description_: “The desire to directly experience pleasure, in its most immediate dopaminergic form. Food. Sex. Drink."
        6. **dominance, megalothymia**
            - _Description_: “The desire to be seen by others as greater than them. The desire to be seen by others as more powerful than them, often to the point of fear."
        7. **prestige**
            - _Description_: “The desire to be seen by others as giving, altruistic, something to be aspired to."
        8. **isothymia**
            - _Description_: “The desire to be seen as equal to others. Fellow members of the same religion. Fellow countrymen of the same nationality. Fellow members of humanity, worthy of dignity and rights."
        9. **the denial of death**
            - _Description_: “Reaching for the forms of immortality that humans can reach. Longevity: personally living as long as you can. Glory: achieving things, such that your name or your ideas might outlast your mortal coil. Lineage: creating more beings in your image."
        10. **a psychologically rich life**
            - _Description_: “Variety is the spice of life. The desire and enjoyment of exploring > exploiting, even when exploiting might be the most productive for fulfilling your other desires."
        11. **contentment, aesceticsim**
            - _Description_: “The desire to relax. To enjoy what you have already got. Habits and routine. To exploit > explore. Sustaining yourself comfortably."
        12. **telos**
            - _Description_: “The desire to fulfil your potential/purpose. Often mixed with the notion of teleology, intelligent design."
        13. **craftsmanship**
            - _Description_: “Perfectionism, attention to detail. The desire to hone your craft and improve your skills. A direct enjoyment of the craft itself."
        14. **beauty**
            - _Description_: “The desire to engage with and curate beautiful art. Sometimes, even the desire to create beautiful things.”
    - Presented in stylized “cards,” arranged in rows of up to 4 per row (responsive layout).
        
    - **Hovering** over a card shows its description in a **tooltip**.
        
8. **Remove Desire**
    
    - Each card has a small red “X” in the top-right corner.
    - Clicking that “X” removes the item from the list immediately.
9. **Item Limit (25)**
    
    - The user can never exceed **25 total items** in the list at any time.
    - If the list is at 25 items, the “add” checkmark is disabled or blocked, and a message appears:
        
        > “You’ve reached the 25-item limit. Remove an item to add another.”
        
10. **Edge Cases**
    
    - If only 0 or 1 items remain, the **Start** button is disabled.
    - The user must remove items (if over 25) or add items (if <2) to proceed.

### 2.2. Page 2: Pairwise Comparison

1. **Header Text**
    
    > “Pay attention to how you feel and select which of the two matters more to you.”
    
2. **Bubble Sort with Randomization**
    
    - The application receives the updated list (2 to 25 items) from Page 1.
    - Uses **standard iterative bubble sort**:
        1. Compare pairs in _passes_ over the list.
        2. The user will pick one of the two cards as more important, you swap those two appropriately in the underlying array.
        3. Continue until a pass completes with no swaps (fully sorted).
    - **Randomize** each pass so the user doesn’t always compare items in a fixed sequence (e.g., shuffle the list or shuffle pair indices for the pass).
    - This ensures the user sees pairs in a less predictable order but still converges to a sorted list.
3. **Comparison UI**
    
    - Two “cards” side-by-side, each with the item’s name.
    - On **hover**, show the description tooltip.
    - **User Click**: The user clicks whichever card is “more important.” Sorting logic acts accordingly (swap or not).
4. **Buttons at Bottom**
    
    - **Restart** (yellow):
        - Returns to **Page 1**.
        - **Resets** to the original 14-seed list only (clears any custom items).
    - **End** (red):
        - Immediately proceeds to **Page 3**, showing a **partial** sort (whatever the current order is at the time of click).
5. **No Progress Indicator**
    
    - There is no explicit progress bar or “Comparison X of Y.” The user simply continues until done or chooses to End.
6. **No Mid-Process Editing**
    
    - Once on Page 2, the user cannot modify the item set unless they press **Restart** (which discards all changes and goes back to seeds).

### 2.3. Page 3: Results

7. **Ranked List**
    
    - Displays the **current** order of items from most important (top) to least important (bottom).
    - If the user completed all comparisons, it’s a fully sorted list.
    - If the user clicked **End** early, it is a **partially** sorted list (reflecting the bubble sort state at that moment).
    - Each item is shown with **both name and description**.
8. **Restart Button** (Yellow)
    
    - Returns the user to Page 1, resetting to the original 14-seed items (removing any custom items).

---

## 3. Technical Implementation Details

9. **Fully Static App**
    
    - Delivered as HTML, CSS, JS (e.g., can be hosted on GitHub Pages or any static hosting).
    - No server-side or database required.
10. **State Management**
    
    - Track items in JavaScript arrays or objects.
    - Pass the data from Page 1 → Page 2.
    - After sorting (or partial sorting), pass the final/partial order to Page 3.
11. **Data Persistence**
    
    - Not required. The app can reset on browser refresh (unless you decide to use `localStorage`—this is optional and not mandated by the requirements).
12. **Bubble Sort + Randomization**
    
    - Implement in JavaScript.
    - Shuffle pairs or the array each pass so the user sees pairs in a variable sequence.
    - When a comparison is made and the user picks the “right” item as more important, swap them in the array if necessary.
13. **UI/UX & Accessibility**
    
    - **Black background**, **white text**.
    - Stylized “cards” for each desire, ideally with some border or shadow effect.
    - Tooltips for hover descriptions should be accessible (e.g., `aria-label` or equivalent).
    - Icons (red “X,” green checkmark) should have text alternatives.
14. **Edge Cases**
    
    - **Minimum 2 items** to start.
    - **Maximum 25 items** at any time.
    - If user tries to add the 26th item, block and show a warning.
    - Sorting with 25 items is allowed (though potentially more comparisons).

---

## 4. Non-Functional Requirements

15. **Performance**
    
    - Must run smoothly for up to 25 items (bubble sort is O(N^2), but 25^2 is acceptable).
16. **Reliability**
    
    - Must function offline once loaded (no external calls required).
17. **Security**
    
    - No sensitive data. Minimal risk.
18. **Accessibility**
    
    - Provide tooltips, text alternatives for icons, and consider keyboard navigation if feasible.
19. **Maintainability**
    
    - The code should be modular to allow easy changes to the sorting method or UI.

---

### **Final Summary**

With the above **complete product requirements**, you have a clear specification for a static, black-background/white-text web application that:

20. Shows a list of 14 seed desires (cards).
21. Lets the user add up to 25 total items, each with a name and optional description.
22. Disables “Start” if fewer than 2 items remain; enforces a 25-item max.
23. Once started, shows pairwise comparisons in a _randomized bubble sort_ flow.
24. Concludes with a final/partial ranking page.
25. Provides a Restart option to clear custom items and revert to the seed list.