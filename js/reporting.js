/**
 * Custom Reporting Periods Logic
 */

/**
 * Configuration for standard reporting periods.
 * @type {Array<Object>}
 */
const standardPeriods = [
    {
        "id": "2026-01",
        "label": "Ciclo Janeiro/26",
        "startDate": "2026-01-11",
        "endDate": "2026-02-07"
    },
    {
        "id": "2026-02",
        "label": "Ciclo Fevereiro/26",
        "startDate": "2026-02-08",
        "endDate": "2026-03-07"
    },
    {
        "id": "2026-03",
        "label": "Ciclo Março/26",
        "startDate": "2026-03-08",
        "endDate": "2026-04-11"
    },
    {
        "id": "2026-04",
        "label": "Ciclo Abril/26",
        "startDate": "2026-04-12",
        "endDate": "2026-05-09"
    },
    {
        "id": "2026-05",
        "label": "Ciclo Maio/26",
        "startDate": "2026-05-10",
        "endDate": "2026-06-13"
    },
    {
        "id": "2026-06",
        "label": "Ciclo Junho/26",
        "startDate": "2026-06-14",
        "endDate": "2026-07-11"
    },
    {
        "id": "2026-07",
        "label": "Ciclo Julho/26",
        "startDate": "2026-07-12",
        "endDate": "2026-08-08"
    },
    {
        "id": "2026-08",
        "label": "Ciclo Agosto/26",
        "startDate": "2026-08-09",
        "endDate": "2026-09-12"
    },
    {
        "id": "2026-09",
        "label": "Ciclo Setembro/26",
        "startDate": "2026-09-13",
        "endDate": "2026-10-10"
    },
    {
        "id": "2026-10",
        "label": "Ciclo Outubro/26",
        "startDate": "2026-10-11",
        "endDate": "2026-11-07"
    },
    {
        "id": "2026-11",
        "label": "Ciclo Novembro/26",
        "startDate": "2026-11-08",
        "endDate": "2026-12-12"
    },
    {
        "id": "2026-12",
        "label": "Ciclo Dezembro/26",
        "startDate": "2026-12-13",
        "endDate": "2026-12-31"
    }
];

/**
 * Retrieves a period object by its ID.
 * @param {string} periodId - The ID of the period to retrieve.
 * @returns {Object|undefined} The period object or undefined if not found.
 */
function getPeriodById(periodId) {
    return standardPeriods.find(p => p.id === periodId);
}

/**
 * Retrieves all configured standard periods, sorted by start date (newest first).
 * @returns {Array<Object>} A sorted array of period objects.
 */
function getStandardPeriods() {
    return [...standardPeriods].sort((a, b) => {
        // Simple string comparison is sufficient for YYYY-MM-DD
        if (b.startDate > a.startDate) return 1;
        if (b.startDate < a.startDate) return -1;
        return 0;
    });
}

/**
 * Generates a report for a specific date range.
 * @param {string} startDate - The start date in YYYY-MM-DD format.
 * @param {string} endDate - The end date in YYYY-MM-DD format.
 * @param {Object} data - The application data object contaning daily records.
 * @returns {Object} The generated report object containing totals, daily breakdown, and missing days.
 */
function getReportForRange(startDate, endDate, data) {
    const report = {
        period: {
            id: 'custom-range',
            label: `Personalizado (${DateUtils.formatDisplay(startDate)} a ${DateUtils.formatDisplay(endDate)})`,
            startDate: startDate,
            endDate: endDate
        },
        totalPoints: 0,
        days: [],
        missingDays: []
    };

    // Use DateUtils to get today's key in BRT
    const todayStr = DateUtils.getTodayKey();

    // Iterate safely from start to end
    // We start with the parsed Date (noon BRT)
    let current = DateUtils.parseDateKey(startDate);
    const end = DateUtils.parseDateKey(endDate);

    while (current <= end) {
        // Format back to string for key lookup
        const dateKey = DateUtils.formatDate(current);
        const points = (data[dateKey] && data[dateKey].points) || 0;

        if (points > 0) {
            report.totalPoints += points;
            report.days.push({
                dateKey: dateKey, // Keep string for consistent sorting/display
                points: points
            });
        } else {
            // Only count as missing if it's in the past or today
            if (dateKey <= todayStr) {
                report.missingDays.push({
                    dateKey: dateKey
                });
            }
        }

        // Add 1 day
        current.setDate(current.getDate() + 1);
    }

    // Sort by date key descending
    report.days.sort((a, b) => b.dateKey.localeCompare(a.dateKey));
    report.missingDays.sort((a, b) => b.dateKey.localeCompare(a.dateKey));

    return report;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { standardPeriods, getPeriodById, getStandardPeriods, getReportForRange };
}

