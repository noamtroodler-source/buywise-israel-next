 const GUEST_ID_KEY = 'buywise_guest_id';
 
 /**
  * Get or create a durable guest ID stored in localStorage.
  * This ID persists across sessions and is used to track guest saves.
  */
 export function getOrCreateGuestId(): string {
   try {
     let guestId = localStorage.getItem(GUEST_ID_KEY);
     if (!guestId) {
       guestId = crypto.randomUUID();
       localStorage.setItem(GUEST_ID_KEY, guestId);
     }
     return guestId;
   } catch {
     // Fallback for environments where localStorage is unavailable
     return crypto.randomUUID();
   }
 }
 
 /**
  * Get the current guest ID without creating one.
  * Returns null if no guest ID exists.
  */
 export function getGuestId(): string | null {
   try {
     return localStorage.getItem(GUEST_ID_KEY);
   } catch {
     return null;
   }
 }