/**
 * Custom Reporting Periods Logic
 */

// 1. Defined Standard Periods (Strict)
// Only these periods will be available in the strict selection.
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
    },
    // Add more standard periods here as needed
];

/**
 * Get the period object for a given ID.
 * @param {string} periodId 
 */
function getPeriodById(periodId) {
    return standardPeriods.find(p => p.id === periodId);
}

/**
 * Get ALL configured standard periods.
 */
function getStandardPeriods() {
    // Return sorted array (Newest Start Date first)
    return [...standardPeriods].sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
}


/**
 * Generate a report for a specific date range (Ad-hoc)
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @param {Object} data - The main storage object
 */
/**
 * Generate a report for a specific date range (Ad-hoc)
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @param {Object} data - The main storage object
 */
function getReportForRange(startDate, endDate, data) {
    const report = {
        period: {
            id: 'custom-range',
            label: `Personalizado (${startDate} a ${endDate})`,
            startDate: startDate,
            endDate: endDate
        },
        totalPoints: 0,
        days: [],
        missingDays: [] // Days with 0 points (up to today)
    };

    const start = new Date(startDate);
    const end = new Date(endDate);
    const todayStr = new Date().toISOString().split('T')[0];

    // Iterate through every day in the range
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split('T')[0];
        const points = (data[dateKey] && data[dateKey].points) || 0;

        // Add to report if it has points OR if it's within the range (we want to show all days? 
        // User asked for "warning for zero points", but report usually shows days with points.
        // Let's keep "days" as the list of days WITH points for the main list, 
        // and "missingDays" for the warning.

        if (points > 0) {
            report.totalPoints += points;
            report.days.push({
                date: new Date(dateKey),
                dateKey: dateKey,
                points: points
            });
        } else {
            // Check for missing day warning
            // Only if date <= today
            if (dateKey <= todayStr) {
                report.missingDays.push({
                    date: new Date(dateKey),
                    dateKey: dateKey
                });
            }
        }
    }

    // Sort days (Newest first)
    report.days.sort((a, b) => b.date - a.date);
    report.missingDays.sort((a, b) => b.date - a.date);

    return report;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { standardPeriods, getPeriodById, getStandardPeriods, getReportForRange };
}
