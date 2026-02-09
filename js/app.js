const ITEMS = ["Alimentação saudável", "Comer salada", "Comer fruta", "Sem doces", "Sem fast food", "Beber 2L de água", "Dormir 7h+"];
const STORAGE = "habitData";
const GOALS_STORAGE = "habitCustomGoals";
const THEME_STORAGE = "habitTheme";

const data = JSON.parse(localStorage.getItem(STORAGE) || "{}");
let customGoals = JSON.parse(localStorage.getItem(GOALS_STORAGE) || "[]");

// --- Lógica de Tema ---
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem(THEME_STORAGE, isDark ? 'dark' : 'light');
    document.getElementById("themeToggle").innerText = isDark ? "☀️" : "🌙";
}

// Carregar tema salvo ou preferência do sistema
if (localStorage.getItem(THEME_STORAGE) === 'dark' ||
    (!localStorage.getItem(THEME_STORAGE) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.body.classList.add('dark-mode');
    document.getElementById("themeToggle").innerText = "☀️";
}

// --- Funções do Checklist ---
const datePicker = document.getElementById("datePicker");

function formatKey(date) { return date.toISOString().split('T')[0]; }


function parseDate(key) {
    const parts = key.split("-").map(Number);
    return new Date(parts[0], parts[1] - 1, parts[2]);
}

function setToday() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const dateNow = new Date(now.getTime() - (offset * 60 * 1000));
    datePicker.value = dateNow.toISOString().split('T')[0];
    loadChecklist(datePicker.value);
}

function save() {
    try {
        localStorage.setItem(STORAGE, JSON.stringify(data));
        localStorage.setItem(GOALS_STORAGE, JSON.stringify(customGoals));
        // Auto-update report if we are viewing one
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

function deleteGoal(e, goal) {
    e.stopPropagation();
    if (confirm(`Remover "${goal}" de todos os dias?`)) {
        customGoals = customGoals.filter(g => g !== goal);
        save();
        loadChecklist(datePicker.value);
    }
}

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

function updatePoints(dateKey, weight) {
    const count = ITEMS.filter(item => data[dateKey].checks[item]).length;
    data[dateKey].points = count * (weight || 1);
    document.getElementById("dailyPoints").innerText = `⭐ ${data[dateKey].points} Pontos`;
    updateCycleReport(); // Refresh view
}

function updateCycleReport() {
    if (document.getElementById("cycleSelect").value !== 'custom') {
        renderReportDetails();
    }
}

// --- Reporting Logic ---

function initCycleReport() {
    const select = document.getElementById("cycleSelect");
    select.innerHTML = "";

    // 1. Add Custom Option
    const customOpt = document.createElement("option");
    customOpt.value = "custom";
    customOpt.text = "🔧 Personalizado...";
    select.appendChild(customOpt);

    // 2. Add Standard Configured Periods (Filtered)
    if (typeof getStandardPeriods !== 'undefined') {
        const allPeriods = getStandardPeriods();
        const today = new Date().toISOString().split('T')[0];
        let currentPeriodId = null;

        // Filter: Show if (Has Points > 0) OR (Is Current Period)
        const visiblePeriods = allPeriods.filter(p => {
            // Check if is current period
            const isCurrent = today >= p.startDate && today <= p.endDate;
            if (isCurrent) currentPeriodId = p.id;

            // Check if has points
            // Optimization: just need one day with points > 0 in range
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

        // Default logic:
        // 1. If today is in a valid period, select it (even if filtered out? logic above ensures it's visible)
        // 2. Else if filtered list has items, select first (newest)
        // 3. Else custom

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

function renderReportDetails() {
    const periodId = document.getElementById("cycleSelect").value;
    if (periodId === 'custom') return;

    if (typeof standardPeriods !== 'undefined') {
        const period = standardPeriods.find(p => p.id === periodId);
        if (period) {
            const report = getReportForRange(period.startDate, period.endDate, data);
            report.period.label = period.label;
            updateReportView(report);
        }
    }
}

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

function updateReportView(report) {
    const list = document.getElementById("cycleDays");
    list.innerHTML = "";

    // Remove existing warning if any
    const existingWarning = document.getElementById("missingDaysWarning");
    if (existingWarning) existingWarning.remove();

    // Clear totals if null report
    if (!report) {
        document.getElementById("cycleRange").innerText = "Selecione um período";
        document.getElementById("cyclePoints").innerText = "0";
        return;
    }

    const label = report.period.label || `${new Date(report.period.startDate).toLocaleDateString()} a ${new Date(report.period.endDate).toLocaleDateString()}`;
    document.getElementById("cycleRange").innerText = label;
    document.getElementById("cyclePoints").innerText = report.totalPoints;

    // Render Warning if there are missing days
    if (report.missingDays && report.missingDays.length > 0) {
        const warningDiv = document.createElement("div");
        warningDiv.id = "missingDaysWarning";
        warningDiv.style.background = "#fff3cd"; // Warning yellow
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
        // Show only first 5 to avoid clutter, or all? Let's show all as a comma list
        const dateStrings = report.missingDays.map(d => d.date.toLocaleDateString("pt-BR").slice(0, 5)); // "dd/mm"
        daysList.innerText = dateStrings.join(", ");
        warningDiv.appendChild(daysList);

        const footer = document.createElement("div");
        footer.innerText = "Tem certeza que preencheu certo?";
        footer.style.marginTop = "5px";
        footer.style.fontStyle = "italic";
        footer.style.fontSize = "11px";
        warningDiv.appendChild(footer);

        // Insert before list
        list.parentElement.insertBefore(warningDiv, list);
    }

    if (report.days.length === 0) {
        list.innerHTML = "<li style='justify-content:center; color:var(--text-muted); padding: 15px;'>Nenhum registro no período</li>";
        return;
    }

    report.days.forEach(day => {
        const li = document.createElement("li");
        li.innerHTML = `<span>${day.date.toLocaleDateString("pt-BR")}</span> <strong>${day.points} pts</strong>`;
        list.appendChild(li);
    });
}


// Init
datePicker.value = formatKey(new Date());
datePicker.onchange = () => loadChecklist(datePicker.value);

// Initial Load
loadChecklist(datePicker.value);
// Wait for scripts to load if needed, or run immediately if at bottom of body
initCycleReport();
