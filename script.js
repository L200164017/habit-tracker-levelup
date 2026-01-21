// State
let gameState = {
    user: {
        level: 1,
        xp: 0,
        xpNeeded: 100
    },
    habits: [],
    todos: []
};

// Selectors
const userLevelEl = document.getElementById('user-level');
const xpBarFill = document.getElementById('xp-bar-fill');
const xpText = document.getElementById('xp-text');
const habitsList = document.getElementById('habits-list');
const todosList = document.getElementById('todos-list');
const habitInput = document.getElementById('habit-input');
const todoInput = document.getElementById('todo-input');
const addHabitBtn = document.getElementById('add-habit-btn');
const addTodoBtn = document.getElementById('add-todo-btn');
const celebContainer = document.getElementById('celebration-container');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    checkHabitStreaks(); // Check for missed days
    renderAll();
});

// Event Listeners
addHabitBtn.addEventListener('click', addHabit);
addTodoBtn.addEventListener('click', addTodo);
habitInput.addEventListener('keypress', (e) => e.key === 'Enter' && addHabit());
todoInput.addEventListener('keypress', (e) => e.key === 'Enter' && addTodo());

habitsList.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('button');
    if (!actionBtn) return;

    const id = Number(actionBtn.dataset.id);
    if (actionBtn.classList.contains('check-btn')) {
        toggleHabit(id);
    } else if (actionBtn.classList.contains('delete-btn')) {
        deleteHabit(id);
    }
});

todosList.addEventListener('click', (e) => {
    const actionBtn = e.target.closest('button');
    if (!actionBtn) return;

    const id = Number(actionBtn.dataset.id);
    if (actionBtn.classList.contains('check-btn')) {
        toggleTodo(id);
    } else if (actionBtn.classList.contains('delete-btn')) {
        deleteTodo(id);
    }
});

// Core Functions
function loadData() {
    const saved = localStorage.getItem('habitQuestData');
    if (saved) {
        gameState = JSON.parse(saved);
    }
}

function saveData() {
    localStorage.setItem('habitQuestData', JSON.stringify(gameState));
}

function checkHabitStreaks() {
    const today = new Date().setHours(0, 0, 0, 0);
    const oneDay = 86400000; // ms

    gameState.habits.forEach(habit => {
        if (!habit.lastCompleted) return;

        const lastDate = new Date(habit.lastCompleted).setHours(0, 0, 0, 0);
        const diff = today - lastDate;

        // Reset completedToday if it's a new day
        if (diff > 0) {
            habit.completedToday = false;
        }

        // Break streak if missed more than 1 day (i.e., didn't do it yesterday)
        if (diff > oneDay) {
            habit.streak = 0;
        }
    });
    saveData();
}

// Gamification Logic
function addXP(amount) {
    gameState.user.xp += amount;

    // Check Level Up
    if (gameState.user.xp >= gameState.user.xpNeeded) {
        levelUp();
    }

    saveData();
    renderUserStats();
}

function removeXP(amount) {
    gameState.user.xp = Math.max(0, gameState.user.xp - amount);
    saveData();
    renderUserStats();
}

function levelUp() {
    gameState.user.xp -= gameState.user.xpNeeded;
    gameState.user.level++;
    gameState.user.xpNeeded = Math.floor(gameState.user.xpNeeded * 1.2);

    triggerConfetti();
    document.getElementById('user-level').classList.add('level-up-anim');
    setTimeout(() => document.getElementById('user-level').classList.remove('level-up-anim'), 1000);
    saveData();
    renderUserStats();
}

// Habits
function addHabit() {
    const text = habitInput.value.trim();
    if (!text) return;

    const newHabit = {
        id: Date.now(),
        text: text,
        streak: 0,
        completedToday: false,
        lastCompleted: null
    };

    gameState.habits.push(newHabit);
    habitInput.value = '';
    saveData();
    renderHabits();
}

function toggleHabit(id) {
    const habit = gameState.habits.find(h => h.id === id);
    if (!habit) return;

    if (!habit.completedToday) {
        habit.completedToday = true;
        habit.streak++;
        habit.lastCompleted = new Date().toISOString();
        addXP(20);
    } else {
        habit.completedToday = false;
        habit.streak--;
        removeXP(20);
    }
    saveData();
    renderHabits();
}

function deleteHabit(id) {
    if (confirm('Delete this habit?')) {
        gameState.habits = gameState.habits.filter(h => h.id !== id);
        saveData();
        renderHabits();
    }
}

// Todos
function addTodo() {
    const text = todoInput.value.trim();
    if (!text) return;

    const newTodo = {
        id: Date.now(),
        text: text,
        completed: false
    };

    gameState.todos.push(newTodo);
    todoInput.value = '';
    saveData();
    renderTodos();
}

function toggleTodo(id) {
    const todo = gameState.todos.find(t => t.id === id);
    if (!todo) return;

    todo.completed = !todo.completed;
    if (todo.completed) {
        addXP(10);
    } else {
        removeXP(10);
    }
    saveData();
    renderTodos();
}

function deleteTodo(id) {
    gameState.todos = gameState.todos.filter(t => t.id !== id);
    saveData();
    renderTodos();
}

// Renderers
function renderUserStats() {
    userLevelEl.textContent = `Level ${gameState.user.level}`;
    const percentage = Math.min(100, (gameState.user.xp / gameState.user.xpNeeded) * 100);
    xpBarFill.style.width = `${percentage}%`;
    xpText.textContent = `${gameState.user.xp} / ${gameState.user.xpNeeded} XP`;
}

function renderHabits() {
    habitsList.innerHTML = '';
    if (gameState.habits.length === 0) {
        habitsList.innerHTML = '<div class="empty-state">No habits tracked yet. Start today!</div>';
        return;
    }

    gameState.habits.forEach(habit => {
        const div = document.createElement('div');
        div.className = `item-card ${habit.completedToday ? 'completed' : ''}`;
        div.innerHTML = `
            <div class="item-left">
                <button class="check-btn" data-id="${habit.id}">
                    <i class="fa-solid fa-check"></i>
                </button>
                <div class="item-info">
                    <span class="item-text">${habit.text}</span>
                    <span class="streak-badge">
                        <i class="fa-solid fa-fire"></i> ${habit.streak}
                    </span>
                </div>
            </div>
            <div class="actions">
                <button class="delete-btn" data-id="${habit.id}">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        habitsList.appendChild(div);
    });
}

function renderTodos() {
    todosList.innerHTML = '';
    if (gameState.todos.length === 0) {
        todosList.innerHTML = '<div class="empty-state">Quest log empty.</div>';
        return;
    }

    const sortedTodos = [...gameState.todos].sort((a, b) => a.completed - b.completed);

    sortedTodos.forEach(todo => {
        const div = document.createElement('div');
        div.className = `item-card ${todo.completed ? 'completed' : ''}`;
        div.innerHTML = `
            <div class="item-left">
                <button class="check-btn" data-id="${todo.id}">
                    <i class="fa-solid fa-check"></i>
                </button>
                <span class="item-text">${todo.text}</span>
            </div>
            <div class="actions">
                <button class="delete-btn" data-id="${todo.id}">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        todosList.appendChild(div);
    });
}

function renderAll() {
    renderUserStats();
    renderHabits();
    renderTodos();
}

// Effects
function triggerConfetti() {
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.top = '-10px';
        confetti.style.width = Math.random() * 10 + 5 + 'px';
        confetti.style.height = Math.random() * 5 + 5 + 'px';
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 70%)`;
        confetti.style.borderRadius = '2px';
        confetti.style.zIndex = '9999';
        confetti.style.pointerEvents = 'none';

        const duration = Math.random() * 3 + 2;
        confetti.style.animation = `fall ${duration}s linear forwards`;

        celebContainer.appendChild(confetti);

        setTimeout(() => confetti.remove(), duration * 1000);
    }
}

// Add simplistic fall animation dynamically
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes fall {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
.empty-state {
    text-align: center;
    color: var(--text-muted);
    font-size: 0.9rem;
    padding: 1rem;
    font-style: italic;
}
`;
document.head.appendChild(styleSheet);
