const ITEMS = ["Alimentação saudável", "Comer salada", "Comer fruta", "Sem doces", "Sem fast food", "Beber 2L de água", "Dormir 7h+"];
const STORAGE = "habitData";
const GOALS_STORAGE = "habitCustomGoals";
const THEME_STORAGE = "habitTheme";

const data = JSON.parse(localStorage.getItem(STORAGE) || "{}");
let customGoals = JSON.parse(localStorage.getItem(GOALS_STORAGE) || "[]");

/**
 * Toggles the application theme between light and dark modes.
 */
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem(THEME_STORAGE, isDark ? 'dark' : 'light');
    document.getElementById("themeToggle").innerText = isDark ? "☀️" : "🌙";
}

if (localStorage.getItem(THEME_STORAGE) === 'dark' ||
    (!localStorage.getItem(THEME_STORAGE) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add('dark-mode');
    document.getElementById("themeToggle").innerText = "☀️";
}

const datePicker = document.getElementById("datePicker");

/**
 * Sets the current date in the picker and reloads the checklist.
 * Uses local time to avoid timezone issues.
 */
function setToday() {
    const today = DateUtils.getTodayKey();
    datePicker.value = today;
    updateDateDisplay(today);
    loadChecklist(datePicker.value);
}

/**
 * Saves current data and goals to localStorage.
 * Updates the report view if active.
 */
function save() {
    try {
        localStorage.setItem(STORAGE, JSON.stringify(data));
        localStorage.setItem(GOALS_STORAGE, JSON.stringify(customGoals));
        if (document.getElementById("cycleSelect").value !== 'custom') {
            renderReportDetails();
        }
    } catch (e) {
        console.error("Erro ao salvar no localStorage:", e);

        if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
            alert("Espaço de armazenamento cheio ou você está em Navegação Privada!");
        }
    }
}

/**
 * Adds a new custom goal from the input field.
 */
function addNewGoal() {
    const input = document.getElementById("newGoalInput");
    const val = input.value.trim();
    if (val && !customGoals.includes(val)) {
        customGoals.push(val);
        input.value = "";
        save();
        loadChecklist(datePicker.value);
    }
}

/**
 * Removes a custom goal.
 * @param {Event} e - The click event.
 * @param {string} goal - The goal text to remove.
 */
function deleteGoal(e, goal) {
    e.stopPropagation();
    if (confirm(`Remover "${goal}" de todos os dias?`)) {
        customGoals = customGoals.filter(g => g !== goal);
        save();
        loadChecklist(datePicker.value);
    }
}

/**
 * Loads the checklist and points for a specific date.
 * @param {string} dateKey - The date key (YYYY-MM-DD).
 */
function loadChecklist(dateKey) {
    if (!data[dateKey]) data[dateKey] = { checks: {}, points: 0 };

    // 0 = Sunday, 6 = Saturday
    const dayOfWeek = DateUtils.getDayOfWeek(dateKey);
    const weight = (dayOfWeek === 0 || dayOfWeek === 6) ? 5 : 1;

    const activeDateText = document.getElementById("activeDateText");
    if (weight === 5) {
        activeDateText.innerHTML = '<span class="badge badge-weekend">Fim de Semana (5x)</span>';
    } else {
        activeDateText.innerHTML = '<span class="badge badge-weekday">Dia de Semana (1x)</span>';
    }

    const checklistEl = document.getElementById("checklist");
    const extraGoalsEl = document.getElementById("extraGoalsList");

    checklistEl.innerHTML = "";
    ITEMS.forEach(item => checklistEl.appendChild(createItemRow(item, dateKey, weight, true)));

    extraGoalsEl.innerHTML = "";
    customGoals.forEach(goal => extraGoalsEl.appendChild(createItemRow(goal, dateKey, 0, false)));

    updatePoints(dateKey, weight);
}

/**
 * Creates a DOM element for a checklist item.
 * @param {string} text - The item text.
 * @param {string} dateKey - The current date key.
 * @param {number} weight - The point weight for the item.
 * @param {boolean} isFixed - Whether the item is a fixed system habit.
 * @returns {HTMLElement} The created item element.
 */
function createItemRow(text, dateKey, weight, isFixed) {
    const container = document.createElement("div");
    const isChecked = !!data[dateKey].checks[text];
    container.className = `habit-item ${isChecked ? 'checked' : ''}`;

    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = isChecked;

    const span = document.createElement("span");
    span.className = "habit-text";
    span.innerText = text;

    container.appendChild(cb);
    container.appendChild(span);

    if (!isFixed) {
        const btn = document.createElement("button");
        btn.className = "btn-delete";
        btn.innerText = "Sair";
        btn.onclick = (e) => deleteGoal(e, text);
        container.appendChild(btn);
    }

    container.onclick = (e) => {
        if (e.target.tagName === 'BUTTON') return;

        let isNowChecked;
        if (e.target.type === 'checkbox') {
            isNowChecked = cb.checked;
        } else {
            isNowChecked = !cb.checked;
            cb.checked = isNowChecked;
        }

        data[dateKey].checks[text] = isNowChecked;
        container.classList.toggle('checked', isNowChecked);
        if (isNowChecked) {
            container.style.animation = 'none';
            container.offsetHeight;
            container.style.animation = null;
        }

        updatePoints(dateKey, weight);
        save();
    };

    return container;
}

/**
 * Updates the total points display for the current day.
 * @param {string} dateKey - The date key.
 * @param {number} weight - The point multiplier.
 */
function updatePoints(dateKey, weight) {
    const allItems = [...ITEMS, ...customGoals];
    const totalItems = allItems.length;

    let checkedCount = 0;
    allItems.forEach(item => {
        if (data[dateKey].checks[item]) checkedCount++;
    });

    data[dateKey].points = checkedCount * (weight || 1);

    document.getElementById("dailyPoints").innerText = `⭐ ${data[dateKey].points} Pontos`;

    const percentage = totalItems === 0 ? 0 : Math.round((checkedCount / totalItems) * 100);
    const progressBar = document.getElementById("progressBar");
    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }

    updateCycleReport();
}

/**
 * Refreshes the cycle report if currently active.
 */
function updateCycleReport() {
    if (document.getElementById("cycleSelect").value !== 'custom') {
        renderReportDetails();
    }
}

/**
 * Initializes the cycle report dropdown.
 * Filters periods based on data presence or if it matches the current date.
 */
function initCycleReport() {
    const select = document.getElementById("cycleSelect");
    select.innerHTML = "";

    const customOpt = document.createElement("option");
    customOpt.value = "custom";
    customOpt.text = "🔧 Personalizado...";
    select.appendChild(customOpt);

    if (typeof getStandardPeriods !== 'undefined') {
        const allPeriods = getStandardPeriods();
        const today = DateUtils.getTodayKey();
        let currentPeriodId = null;

        const visiblePeriods = allPeriods.filter(p => {
            const isCurrent = today >= p.startDate && today <= p.endDate;
            if (isCurrent) currentPeriodId = p.id;

            const hasPoints = Object.keys(data).some(k => {
                return k >= p.startDate && k <= p.endDate && (data[k].points || 0) > 0;
            });

            return hasPoints || isCurrent;
        });

        visiblePeriods.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.text = p.label;
            select.appendChild(opt);
        });

        if (currentPeriodId && visiblePeriods.find(p => p.id === currentPeriodId)) {
            select.value = currentPeriodId;
        } else if (visiblePeriods.length > 0) {
            select.value = visiblePeriods[0].id;
        } else {
            select.value = "custom";
        }
    }

    handleCycleChange();
}

/**
 * Handles changes in the cycle selection dropdown.
 * Toggles between standard report view and custom date range UI.
 */
function handleCycleChange() {
    const select = document.getElementById("cycleSelect");
    const customUI = document.getElementById("customRangeUI");

    if (select.value === 'custom') {
        customUI.style.display = 'block';
        updateReportView(null);
    } else {
        customUI.style.display = 'none';
        renderReportDetails();
    }
}

/**
 * Renders report details for a selected standard period.
 */
function renderReportDetails() {
    const periodId = document.getElementById("cycleSelect").value;
    if (periodId === 'custom') return;

    if (typeof standardPeriods !== 'undefined') {
        const period = standardPeriods.find(p => p.id === periodId);
        if (period) {
            const report = getReportForRange(period.startDate, period.endDate, data);
            report.period.label = period.label;
            report.period.id = period.id;
            updateReportView(report);
        }
    }
}

/**
 * Generates and displays a report based on the custom date inputs.
 */
function generateCustomReport() {
    const start = document.getElementById("startDateInput").value;
    const end = document.getElementById("endDateInput").value;

    if (!start || !end) {
        alert("Selecione data de início e fim");
        return;
    }

    if (start > end) {
        alert("A data de início deve ser anterior ao fim");
        return;
    }

    if (typeof getReportForRange !== 'undefined') {
        const report = getReportForRange(start, end, data);
        updateReportView(report);
    }
}

/**
 * Updates the report UI with the provided report data.
 * @param {Object} report - The report object to display.
 */
function updateReportView(report) {
    const list = document.getElementById("cycleDays");
    const dashboard = document.getElementById("reportDashboard");
    const activityList = document.getElementById("activityReportList");

    const periodDisplay = document.getElementById("reportPeriodDisplay");

    list.innerHTML = "";
    activityList.innerHTML = "";

    const existingWarning = document.getElementById("missingDaysWarning");
    if (existingWarning) existingWarning.remove();

    if (!report) {
        dashboard.style.display = 'none';
        return;
    }

    dashboard.style.display = 'block';

    const startStr = DateUtils.formatDisplay(report.period.startDate);
    const endStr = DateUtils.formatDisplay(report.period.endDate);
    if (periodDisplay) {
        periodDisplay.innerText = `📅 ${startStr} a ${endStr}`;
    }

    const totalPoints = report.totalPoints;
    const daysWithPoints = report.days.length;

    let totalPossiblePoints = 0;
    let totalDaysInCycle = 0;

    const startObj = DateUtils.parseDateKey(report.period.startDate);
    const endObj = DateUtils.parseDateKey(report.period.endDate);
    const currentIter = new Date(startObj);

    const habitCount = ITEMS.length + customGoals.length;

    while (currentIter <= endObj) {
        totalDaysInCycle++;
        const dayKey = DateUtils.formatDate(currentIter);
        const dayOfWeek = DateUtils.getDayOfWeek(dayKey);
        const weight = (dayOfWeek === 0 || dayOfWeek === 6) ? 5 : 1;
        totalPossiblePoints += (habitCount * weight);
        currentIter.setDate(currentIter.getDate() + 1);
    }


    const habitCounts = {};
    const allItems = [...ITEMS, ...customGoals];
    allItems.forEach(h => habitCounts[h] = 0);

    report.days.forEach(day => {
        const dayData = data[day.dateKey];
        if (dayData && dayData.checks) {
            Object.keys(dayData.checks).forEach(habit => {
                if (dayData.checks[habit]) {
                    habitCounts[habit] = (habitCounts[habit] || 0) + 1;
                }
            });
        }
    });

    const sortedHabits = Object.entries(habitCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    let bestHabit = "-";
    let worstHabit = "-";

    if (sortedHabits.length > 0) {
        const max = sortedHabits[0].count;
        const min = sortedHabits[sortedHabits.length - 1].count;

        if (max > 0) bestHabit = sortedHabits[0].name;
        if (min < max && daysWithPoints > 0) worstHabit = sortedHabits[sortedHabits.length - 1].name;
    }


    document.getElementById("statTotalPoints").innerHTML = `${totalPoints} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">/ ${totalPossiblePoints}</span>`;
    document.getElementById("statDaysCount").innerHTML = `${daysWithPoints} <span style="font-size:0.75rem; color:var(--text-muted); font-weight:normal;">/ ${totalDaysInCycle} dias</span>`;

    document.getElementById("statBestHabit").innerText = bestHabit;
    document.getElementById("statBestHabit").style.fontSize = bestHabit.length > 15 ? "0.8rem" : "1.0rem";

    document.getElementById("statWorstHabit").innerText = worstHabit;
    document.getElementById("statWorstHabit").style.fontSize = worstHabit.length > 15 ? "0.8rem" : "1.0rem";


    sortedHabits.forEach(habit => {
        const row = document.createElement("div");
        row.className = "activity-row";

        const nameSpan = document.createElement("span");
        nameSpan.className = "activity-name";
        nameSpan.innerText = habit.name;

        const countSpan = document.createElement("span");
        countSpan.className = "activity-count";
        countSpan.innerText = `${habit.count}x`;

        row.appendChild(nameSpan);
        row.appendChild(countSpan);
        activityList.appendChild(row);
    });


    const reportAlerts = document.getElementById("reportAlerts");
    reportAlerts.innerHTML = "";

    if (report.missingDays && report.missingDays.length > 0) {
        const warningDiv = document.createElement("div");
        warningDiv.id = "missingDaysWarning";
        warningDiv.style.background = "#fff3cd";
        warningDiv.style.color = "#856404";
        warningDiv.style.padding = "10px";
        warningDiv.style.borderRadius = "12px";
        warningDiv.style.marginBottom = "0";
        warningDiv.style.fontSize = "13px";
        warningDiv.style.border = "1px solid #ffeeba";

        const title = document.createElement("div");
        title.innerHTML = "<strong>⚠️ Dias sem pontuação:</strong>";
        title.style.marginBottom = "5px";
        warningDiv.appendChild(title);

        const daysList = document.createElement("div");
        const dateStrings = report.missingDays.map(d => DateUtils.formatDisplay(d.dateKey).slice(0, 5));
        daysList.innerText = dateStrings.join(", ");
        warningDiv.appendChild(daysList);

        const footer = document.createElement("div");
        footer.innerText = "Tem certeza que preencheu certo?";
        footer.style.marginTop = "5px";
        footer.style.fontStyle = "italic";
        footer.style.fontSize = "11px";
        warningDiv.appendChild(footer);

        reportAlerts.appendChild(warningDiv);
    }

    if (report.days.length === 0) {
        list.innerHTML = "<li style='justify-content:center; color:var(--text-muted); padding: 15px;'>Nenhum registro no período</li>";
        return;
    }

    report.days.forEach(day => {
        const li = document.createElement("li");
        const dateStr = DateUtils.formatDisplay(day.dateKey);
        li.innerHTML = `<span>${dateStr}</span> <strong>${day.points} pts</strong>`;
        list.appendChild(li);
    });
}

const initialDate = DateUtils.getTodayKey();
datePicker.value = initialDate;

/**
 * Updates the custom date display element to show the formatted date.
 * @param {string} [val] - Optional date value to display.
 */
function updateDateDisplay(val) {
    const dateVal = val || datePicker.value;
    if (dateVal) {
        document.getElementById("dateDisplay").innerText = DateUtils.formatDisplay(dateVal);
    } else {
        document.getElementById("dateDisplay").innerText = '--/--/----';
    }
}

datePicker.onchange = () => {
    updateDateDisplay();
    loadChecklist(datePicker.value);
};

updateDateDisplay();
loadChecklist(datePicker.value);
initCycleReport();
