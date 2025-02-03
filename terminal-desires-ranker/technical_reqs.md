## 1. **Project Setup**

1. **Project Structure** (suggested):
    
    ```
    ├─ public/                // Static files
    ├─ src/
    │  ├─ assets/             // Images/icons if needed
    │  ├─ components/         // Reusable components
    │  ├─ pages/              // Page-level components
    │  │  ├─ DesiresListPage.jsx
    │  │  ├─ PairwiseComparisonPage.jsx
    │  │  └─ ResultsPage.jsx
    │  ├─ context/            // (Optional) context providers if needed
    │  ├─ App.jsx             // Main App component
    │  ├─ main.jsx            // Vite entry point
    │  └─ router.jsx          // (Optional) if using react-router
    ├─ index.html
    ├─ package.json
    └─ vite.config.js
    ```
    
    This structure keeps pages and common components organized. Adjust as needed.
    
3. **Styling Options:**
    
    - You can use **CSS modules**, **Sass**, **styled-components**, or **plain CSS**.
    - Keep in mind the requirement: **black background** and **white text**.
    
    For example, in `App.css` (or a global CSS file):
    
    ```css
    body {
      background-color: #000;
      color: #fff;
      margin: 0;
      font-family: sans-serif;
    }
    ```
    

---

## 2. **Overall Application Flow**

The application consists of **three conceptual pages** but will be served as a single-page React app. You can manage navigation by:

- Using **React Router** (recommended for clarity), or
- Using a single `App.jsx` with conditional rendering based on an internal “step” state.

**High-level flow**:

4. **Desires List Page (Page 1)**
    - Shows the seed items (14 preloaded).
    - Allows adding/removing items (2–25 item constraints).
    - “Start” button is enabled only if there are at least 2 items.
5. **Pairwise Comparison Page (Page 2)**
    - Takes the array of items from Page 1.
    - Performs a **randomized bubble sort** by presenting pairwise comparisons.
    - “Restart” button → resets to seed data + returns to Page 1.
    - “End” button → jumps to Page 3, possibly a partial sort.
6. **Results Page (Page 3)**
    - Shows the final or partially sorted list.
    - “Restart” button → resets to seed data + returns to Page 1.

---

## 3. **Data & State Management**

### 3.1. **Data Structures**

Each “desire” can be represented as an object:

```js
{
  id: string,         // A unique identifier (UUID or incremental)
  name: string,       // Required
  description: string // Optional
}
```

Example seed data (14 items given in requirements). Store this in a file, e.g., `src/data/seedDesires.js`:

```js
export const seedDesires = [
  {
    id: "1",
    name: "curiosity",
    description: "The desire to know things..."
  },
  {
    id: "2",
    name: "autonomy, liberty, freedom",
    description: "The desire to be unconstrained..."
  },
  // ... (up to the 14 seeds)
];
```

### 3.2. **App-Level State**

You need to maintain:

7. **Current list of desires** (initially the 14 seeds).
8. **Sorted or partially sorted ordering** (if you want to store it separately from the main list).
9. **Which “page” or “view”** the user is currently on.

There are a few approaches:

- **React Router**:
    - Pass the list as state using navigation routes (e.g., `navigate("/compare", { state: { items } })`).
    - Or store it in a Context Provider so every page can access it easily.
- **Single global state** with a context.
    - For example, a `DesiresProvider` that manages the array, plus the current “step” in the UI.

**Example** using React Router + minimal context:

- `App.jsx` sets up `<BrowserRouter>` and routes:
    
    ```jsx
    import { BrowserRouter, Routes, Route } from 'react-router-dom';
    import DesiresListPage from './pages/DesiresListPage';
    import PairwiseComparisonPage from './pages/PairwiseComparisonPage';
    import ResultsPage from './pages/ResultsPage';
    
    function App() {
      return (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<DesiresListPage />} />
            <Route path="/compare" element={<PairwiseComparisonPage />} />
            <Route path="/results" element={<ResultsPage />} />
          </Routes>
        </BrowserRouter>
      );
    }
    
    export default App;
    ```
    
- In `DesiresListPage`, after user clicks Start, do:
    
    ```js
    navigate('/compare', { state: { items: currentDesires } });
    ```
    
- In `PairwiseComparisonPage`, retrieve items from `useLocation().state`.
    

**Alternatively**, you can store a global array in `DesiresContext` so you don’t need to pass it around via route state. Either approach is fine.

---

## 4. **Implementing Page 1: Desires List Page**

### 4.1. **UI Layout**

10. **Header Text** (static):
    
    > “Terminal desires are the true underlying reasons…”
    
11. **List of Desires**
    
    - Displayed in “cards,” up to 4 per row (use CSS grid or flex with wrap).
    - Each card shows:
        - **Name** (always visible)
        - **Description** on hover (implement as a tooltip or hover pop-up).
        - A **red 'X'** icon/button in the top-right corner to remove.
12. **Add Custom Desire Form**
    
    - Two input fields: “Name” (required) and “Description” (optional).
    - A small green checkmark icon to confirm adding.
    - On add:
        - Insert at the **front** of the list (`unshift()` in the array).
        - Clear inputs.
    - Validate:
        - If `name` is empty, do not add.
        - If total items = 25 already, disable or show message.
13. **Start Button** (green)
    
    - Disabled if fewer than 2 items.
    - On click, navigate to Page 2.
14. **Disable Add** if there are already 25 items:
    
    - Show a message: “You’ve reached the 25-item limit…”

### 4.2. **Logic**

- **Initial State**: Load the 14 seeds (from `seedDesires.js`) into `desires` state when component mounts (or from context).
- **Add Desire**:
    
    ```js
    // Pseudocode
    const [desires, setDesires] = useState(seedDesires);
    const [newName, setNewName] = useState('');
    const [newDescription, setNewDescription] = useState('');
    
    const handleAddDesire = () => {
      if (!newName.trim()) return; // Required name
      if (desires.length >= 25) return; // Enforce limit
    
      const newDesire = {
        id: uuidv4(), // or some unique method
        name: newName.trim(),
        description: newDescription.trim()
      };
    
      setDesires([newDesire, ...desires]); // front of the list
      setNewName('');
      setNewDescription('');
    };
    ```
    
- **Remove Desire**:
    
    ```js
    const handleRemove = (id) => {
      setDesires((prev) => prev.filter(item => item.id !== id));
    };
    ```
    
- **Start Button**:
    - Only enabled if `desires.length >= 2`.
    - Example check: `disabled={desires.length < 2}`
    - On click: `navigate("/compare", { state: { items: desires } })` or update context.

---

## 5. **Implementing Page 2: Pairwise Comparison Page**

### 5.1. **Randomized Bubble Sort** Concept

**Standard Bubble Sort**:

15. You iterate through the array in multiple passes.
16. Compare adjacent elements. If out of order, swap them.
17. Keep doing passes until no swaps occur.

**Randomization**:

- We still do bubble sort logic, but the order of comparisons in each pass is randomized.
- For instance, we can **shuffle** the array indices before each pass so that the comparisons come up in a non-deterministic sequence.

**Implementation Outline**:

- We can store:
    
    - `items`: the array to sort.
    - `currentIndex`: index of the current pair’s left item.
    - `passCounter`: how many passes we’ve completed.
    - `hasSwappedThisPass`: track if any swap happened during the pass.
- Alternatively, you can store a queue of pairwise indices for the current pass (shuffled).
    
    - On each user click, process that pair comparison (swap if needed).
    - Move on to the next pair in the queue.
    - When the queue is exhausted, check if a swap occurred at least once:
        - If yes, we shuffle again for the next pass.
        - If no, sorting is done.

A simpler approach is to just **shuffle the entire array** after each pass while continuing bubble sort logic. This keeps the user from seeing the same order each time.

### 5.2. **User Interaction Flow**

18. **Display Two Cards** side by side:
    
    - Each card has name, plus a tooltip for description on hover.
    - The user clicks on which one is “more important.”
        - If the “right” item is chosen over the “left” and the items are out of order for bubble sort, swap them. Or interpret “the chosen card should move towards the front.”
    - Move to the next pair comparison.
19. **Buttons:**
    
    - **Restart (yellow)**:
        - Resets everything back to the original seed data.
        - Navigates back to Page 1.
    - **End (red)**:
        - Immediately navigates to Page 3 with the **current** item order.
20. **No progress indicator** is required per specs.
    

### 5.3. **Key Pseudocode**

```js
// PairwiseComparisonPage.jsx

function PairwiseComparisonPage() {
  const location = useLocation();
  const [items, setItems] = useState(location.state?.items || []);
  const [currentPair, setCurrentPair] = useState([0, 1]); // indices of the pair being compared
  const [passCompleted, setPassCompleted] = useState(false);

  // Option 1: Keep track of bubble sort pass logic
  // Option 2: Or keep a "pairsQueue" that is shuffled each pass.

  // On user pick: (e.g., user picks the left card)
  const handleChoice = (choice) => {
    const [i, j] = currentPair;
    // Determine if we need to swap
    // For example, if user picks the left item as "more important" 
    // but left item is "less" in the array ordering, do a swap, etc.
    
    // Then proceed to next pair or start next pass if done.

    // If done or user clicks "End", navigate("/results", { state: { sortedItems: items } })
  };

  const handleRestart = () => {
    // Reset to seeds:
    navigate("/", { replace: true });
  };

  const handleEnd = () => {
    navigate("/results", { state: { finalItems: items } });
  };

  // Render UI with side-by-side cards:
  return (
    <div>
      <h1>Which of the two matters more to you?</h1>
      <div className="comparison-cards">
        <Card desire={items[currentPair[0]]} onClick={() => handleChoice("left")} />
        <Card desire={items[currentPair[1]]} onClick={() => handleChoice("right")} />
      </div>
      <button onClick={handleRestart}>Restart</button>
      <button onClick={handleEnd}>End</button>
    </div>
  );
}
```

**Note**: The actual bubble sort logic can be implemented in a variety of ways; just ensure each comparison eventually leads to a stable sort (if the user keeps clicking). The randomization can be done by shuffling the array or the index pairs for each pass.

---

## 6. **Implementing Page 3: Results Page**

21. **Receive** the final or partially sorted `items`.
22. **Display** them top-down:
    - **Most important** at the top.
    - Show **name** and **description** together.
23. **Restart Button**:
    - On click, reset to seeds and navigate back to Page 1.

```jsx
function ResultsPage() {
  const location = useLocation();
  const finalItems = location.state?.finalItems || [];

  const handleRestart = () => {
    navigate("/", { replace: true });
  };

  return (
    <div>
      <h1>Your Ranking</h1>
      <ol>
        {finalItems.map(item => (
          <li key={item.id}>
            <strong>{item.name}</strong> - <em>{item.description}</em>
          </li>
        ))}
      </ol>
      <button onClick={handleRestart}>Restart</button>
    </div>
  );
}
```

---

## 7. **Styling & UI/UX Considerations**

24. **Theme**:
    - Black background (`#000`) with white text (`#fff`).
    - Cards can have a border or subtle shadow to stand out.
25. **Card**:
    - A simple `.card` CSS class with padding, margin, border, etc.
26. **Tooltip**:
    - Can use a lightweight library (e.g., [React Tooltip](https://www.npmjs.com/package/react-tooltip)) or custom CSS-based tooltips.
    - Provide `aria-label` for accessibility.
27. **Icons**:
    - Red “X,” green checkmark. Ensure you have `alt` text or `aria-label`.
28. **Button States**:
    - Disabled states (grayed out) for “Start” if fewer than 2 items.
    - Disabled “add” if at 25 items.

---

## 8. **Edge Cases & Validation**

29. **Minimum 2 Items**:
    - “Start” button disabled if `desires.length < 2`.
30. **Maximum 25 Items**:
    - Prevent adding the 26th item; show message.
31. **Empty Input**:
    - If name is empty, do not add.
32. **Removing Items**:
    - Instantly remove from UI. If the user removes down to 1 or 0, “Start” re-disables.

---

## 9. **Non-Functional Requirements**

33. **Performance**:
    - Bubble sort on 25 items is `25^2 = 625` comparisons in the worst case, which is fine for a simple client-side operation.
34. **Offline Capability**:
    - No server calls. The entire React app can be hosted on static hosting like GitHub Pages, Netlify, or Vercel.
35. **Security**:
    - No sensitive data; purely client-side.
36. **Accessibility**:
    - Use semantic HTML, proper alt/aria, and consider keyboard navigation if possible.
37. **Maintainability**:
    - Keep the sorting logic in a separate helper if needed, to allow easy changes.

---

## 10. **Deployment**

38. **Build for Production**:
    
    ```bash
    npm run build
    ```
    
    This generates an optimized `dist/` folder.
39. **Static Hosting**:
    - Upload `dist/` to GitHub Pages, Netlify, Vercel, or any static server.
    - Vite’s build output is fully static (HTML/CSS/JS).

---

## 11. **Optional Enhancements**

- **Local Storage** to persist the user’s custom list across refreshes:
    - Save `desires` on changes: `localStorage.setItem("desires", JSON.stringify(desires));`
    - On mount, check if data exists in localStorage.
- **Keyboard Shortcuts** for picking the left or right card quickly.
- **Responsive** UI for mobile vs. desktop.

---

# **Summary**

By following this plan, you will create a **single-page React application** (using Vite) that satisfies:

40. **Desires List Page** with:
    
    - Seed items (14).
    - Add/remove (max 25).
    - Start button (enabled >= 2 items).
41. **Pairwise Comparison Page** with:
    
    - Randomized bubble sort pairwise comparisons.
    - Restart → revert to seeds + go to Page 1.
    - End → proceed to results.
42. **Results Page** showing the (partial or complete) sorted list, with a Restart button.
    

All done entirely on the client side, no server required, easily deployable to any static hosting platform.