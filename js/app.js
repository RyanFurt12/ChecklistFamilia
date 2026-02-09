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
 * Formats a Date object into a YYYY-MM-DD string.
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date string.
 */
function formatKey(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Parses a YYYY-MM-DD string into a Date object.
 * @param {string} key - The date string to parse.
 * @returns {Date} The parsed Date object.
 */
function parseDate(key) {
    const parts = key.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

/**
 * Sets the current date in the picker and reloads the checklist.
 * Uses local time to avoid timezone issues.
 */
function setToday() {
    const now = new Date();
    const localDate = now.toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
    datePicker.value = localDate;
    updateDateDisplay(localDate);
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
    const date = parseDate(dateKey);
    const weight = (date.getDay() === 0 || date.getDay() === 6) ? 5 : 1;

    document.getElementById("activeDateText").innerText =
        `${weight === 5 ? 'Fim de Semana (5x Pontos)' : 'Dia de Semana (1x Ponto)'}`;

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
    const count = ITEMS.filter(item => data[dateKey].checks[item]).length;
    data[dateKey].points = count * (weight || 1);
    document.getElementById("dailyPoints").innerText = `⭐ ${data[dateKey].points} Pontos`;
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
        const today = new Date().toISOString().split('T')[0];
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
    list.innerHTML = "";

    const existingWarning = document.getElementById("missingDaysWarning");
    if (existingWarning) existingWarning.remove();

    if (!report) {
        document.getElementById("cycleRange").innerText = "Selecione um período";
        document.getElementById("cyclePoints").innerText = "0";
        return;
    }

    const startStr = report.period.startDate.split('-').reverse().join('/');
    const endStr = report.period.endDate.split('-').reverse().join('/');

    let displayLabel = report.period.label;
    if (report.period.id !== 'custom-range') {
        displayLabel += ` (${startStr} a ${endStr})`;
    } else {
        displayLabel = `Personalizado (${startStr} a ${endStr})`;
    }

    document.getElementById("cycleRange").innerText = displayLabel;
    document.getElementById("cyclePoints").innerText = report.totalPoints;

    if (report.missingDays && report.missingDays.length > 0) {
        const warningDiv = document.createElement("div");
        warningDiv.id = "missingDaysWarning";
        warningDiv.style.background = "#fff3cd";
        warningDiv.style.color = "#856404";
        warningDiv.style.padding = "10px";
        warningDiv.style.borderRadius = "12px";
        warningDiv.style.marginBottom = "15px";
        warningDiv.style.fontSize = "13px";
        warningDiv.style.border = "1px solid #ffeeba";

        const title = document.createElement("div");
        title.innerHTML = "<strong>⚠️ Dias sem pontuação:</strong>";
        title.style.marginBottom = "5px";
        warningDiv.appendChild(title);

        const daysList = document.createElement("div");
        const dateStrings = report.missingDays.map(d => d.dateKey.split('-').reverse().join('/').slice(0, 5));
        daysList.innerText = dateStrings.join(", ");
        warningDiv.appendChild(daysList);

        const footer = document.createElement("div");
        footer.innerText = "Tem certeza que preencheu certo?";
        footer.style.marginTop = "5px";
        footer.style.fontStyle = "italic";
        footer.style.fontSize = "11px";
        warningDiv.appendChild(footer);

        list.parentElement.insertBefore(warningDiv, list);
    }

    if (report.days.length === 0) {
        list.innerHTML = "<li style='justify-content:center; color:var(--text-muted); padding: 15px;'>Nenhum registro no período</li>";
        return;
    }

    report.days.forEach(day => {
        const li = document.createElement("li");
        const dateStr = day.dateKey.split('-').reverse().join('/');
        li.innerHTML = `<span>${dateStr}</span> <strong>${day.points} pts</strong>`;
        list.appendChild(li);
    });
}

const initialDate = new Date().toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-');
datePicker.value = initialDate;

/**
 * Updates the custom date display element to show the formatted date.
 * @param {string} [val] - Optional date value to display.
 */
function updateDateDisplay(val) {
    const dateVal = val || datePicker.value;
    if (dateVal) {
        document.getElementById("dateDisplay").innerText = dateVal.split('-').reverse().join('/');
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
