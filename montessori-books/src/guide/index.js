import { createGuideStore } from './store.js';
import approved from './approved.json';

// Explicit reviewed public input; private authoring and reviews stay offline.
export const guide = createGuideStore(approved);
