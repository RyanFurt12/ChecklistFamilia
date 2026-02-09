/**
 * DateUtils: Centralized date handling for ChecklistFamilia.
 * Enforces consistency with 'America/Sao_Paulo' (BRT) timezone.
 */

const DateUtils = {
    /**
     * Returns the current date in BRT as a YYYY-MM-DD string.
     * @returns {string} Date string (e.g., "2026-02-08")
     */
    getTodayKey() {
        // Create a date object for "now"
        const now = new Date();
        // Format strictly to pt-BR Brazil timezone
        const parts = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).formatToParts(now);

        // Extract parts safely
        const day = parts.find(p => p.type === 'day').value;
        const month = parts.find(p => p.type === 'month').value;
        const year = parts.find(p => p.type === 'year').value;

        return `${year}-${month}-${day}`;
    },

    /**
     * Formats a Date object to YYYY-MM-DD using BRT.
     * @param {Date} date 
     * @returns {string}
     */
    formatDate(date) {
        const parts = new Intl.DateTimeFormat('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).formatToParts(date);

        const day = parts.find(p => p.type === 'day').value;
        const month = parts.find(p => p.type === 'month').value;
        const year = parts.find(p => p.type === 'year').value;

        return `${year}-${month}-${day}`;
    },

    /**
     * Parses a YYYY-MM-DD string into a Date object.
     * Returns a Date object set to 12:00:00 (Noon) to avoid timezone rollover issues
     * when calculating days or displaying.
     * @param {string} key 
     * @returns {Date}
     */
    parseDateKey(key) {
        if (!key) return new Date();
        const [year, month, day] = key.split('-').map(Number);
        // Note: Month is 0-indexed in Date constructor
        const date = new Date(year, month - 1, day, 12, 0, 0);
        return date;
    },

    /**
     * Returns the day of week index (0=Sunday, 6=Saturday) for a given YYYY-MM-DD key.
     * Uses the parsed date (Safe Noon time).
     * @param {string} key 
     * @returns {number} 0 (Sun) - 6 (Sat)
     */
    getDayOfWeek(key) {
        const date = this.parseDateKey(key);
        return date.getDay();
    },

    /**
     * Formats a YYYY-MM-DD key to DD/MM/YYYY for display.
     * @param {string} key 
     * @returns {string}
     */
    formatDisplay(key) {
        if (!key) return '--/--/----';
        const [year, month, day] = key.split('-');
        return `${day}/${month}/${year}`;
    }
};

// Export for Node.js environments (if needed) or global window object
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DateUtils;
} else {
    window.DateUtils = DateUtils;
}
