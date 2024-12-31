const taskForm = document.getElementById('task-form');
const taskList = document.getElementById('task-list');
let taskArray = [];

let taskTimers = {};  // Object to store the interval timers for each task

taskForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const title = document.getElementById('task-title').value.trim().toLowerCase();
  const reminder = document.getElementById('task-reminder').value;
  const editingIndex = document.getElementById('editing-index').value;

  // Prevent adding expired tasks
  if (new Date(reminder) < new Date()) {
      showToast("Cannot add a task with an expired reminder time.", "error");
      return;
  }

  // If editing, update the task; else, add a new task
  if (editingIndex === '') {
      addTask(title, reminder);
      showToast("Task created successfully.", "success");
  } else {
      updateTask(editingIndex, title, reminder);
      showToast("Task updated successfully.", "success");
  }

  taskForm.reset();
  document.getElementById('editing-index').value = '';
});

// Add your other functions with showToast used instead of alert

function addTask(title, reminder) {
    const createdDate = new Date();
    const task = {
        title,
        reminder: new Date(reminder).toISOString(),
        createdAt: new Date().toISOString(),
        completed: false,
        timeTaken: null // Track time taken to complete the task
    };
    taskArray.push(task);
    renderTasks();
    saveTasks();
}

function updateTask(index, title, reminder) {
    taskArray[index].title = title;
    taskArray[index].reminder = reminder;
    renderTasks();
    saveTasks();
}

function deleteTask(index) {
    // Clear any active interval timer when the task is deleted
    if (taskTimers[index]) {
        clearInterval(taskTimers[index]);
    }
    taskArray.splice(index, 1);
    renderTasks();
    saveTasks();
    showToast("Task deleted successfully.", "error");
}

function completeTask(index) {
    const task = taskArray[index];
    if (!task.completed) {
        const timeTaken = calculateTimeTaken(task.createdAt);
        task.timeTaken = timeTaken;
        task.completed = true;

        // Stop the dynamic timer for the completed task
        if (taskTimers[index]) {
            clearInterval(taskTimers[index]);
        }

        // Show success toast when task is completed
        showToast("Task completed successfully.", "success");
    }
    renderTasks();
    saveTasks();
}


function editTask(index) {
    const task = taskArray[index];
    document.getElementById('task-title').value = task.title;
    document.getElementById('task-reminder').value = task.reminder;
    document.getElementById('editing-index').value = index;
}

function renderTasks() {
    taskList.innerHTML = '';

    if (taskArray.length === 0) {
        taskList.innerHTML = `
            <h3 class="no-tasks" style="
                font-size: 18px;
                color: white;
                font-weight: bold;
                text-align: center;
                background: orangered;
                padding: 20px;
                border-radius: 5px;
                width: 100%;
                margin: 0 auto;
                box-sizing: border-box;
                text-transform: capitalize;
            ">
                Please add/assign tasks for today.
            </h3>
        `;
        return;
    }

    taskArray.forEach((task, index) => {
        const li = document.createElement('li');
        li.className = 'task';

        const remainingTime = calculateRemainingTime(task.reminder);
        let taskClass = '';

        if (task.completed) {
            taskClass = 'completed';
            li.style.textTransform = "capitalize"; // Applying text capitalization
            li.style.backgroundColor = "#50C878	"; // Light green for completed task
        } else {
            const timeLeft = calculateRemainingTimeInMinutes(task.reminder);
            if (timeLeft <= 30) {
                taskClass = 'high-priority';
                li.style.textTransform = "capitalize"; // Capitalize the text
                li.style.backgroundColor = "red"; // Red for high priority
            } else if (timeLeft <= 60) {
                taskClass = 'medium-priority';
                li.style.textTransform = "capitalize"; // Applying text capitalization
                li.style.backgroundColor = "orange"; // orange for medium priority
            } else if (timeLeft <= 120) {
                taskClass = 'low-priority';
                li.style.textTransform = "capitalize"; // Applying text capitalization
                li.style.backgroundColor = "blue"; // blue for low priority
            }
        }

        li.classList.add(taskClass);

        li.innerHTML = `
            <div>
                <strong>${task.title}</strong>
                <span>${task.completed ? 'Completed' : remainingTime}</span>
            </div>
            <div class="task-buttons">
                <button onclick="editTask(${index})">Edit</button>
                <button onclick="deleteTask(${index})">Delete</button>
                <button onclick="completeTask(${index})">Complete</button>
            </div>
        `;

        taskList.appendChild(li);

        // Dynamic time update for incomplete tasks
        if (!task.completed) {
            const interval = setInterval(() => {
                const updatedTime = calculateRemainingTime(task.reminder);
                if (updatedTime === 'Not completed on time') {
                    clearInterval(interval);  // Clear the interval once expired
                    li.querySelector('span').textContent = 'Not completed on time';  // Show "Not completed on time"
                    li.classList.remove('high-priority', 'medium-priority', 'low-priority');
                    li.classList.add('high-priority'); // Assign red color (high priority) for expired task
                    renderTasks(); // Re-render to reflect the change
                } else {
                    li.querySelector('span').textContent = updatedTime;
                }
            }, 1000);

            // Store the interval so it can be cleared later
            taskTimers[index] = interval;
        }
    });
}

function calculateRemainingTime(reminder) {
    const now = new Date();
    const taskTime = new Date(reminder);
    const diff = taskTime - now;

    if (diff <= 0) return 'Not completed on time'; // Show this message when time expired
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
}

function calculateRemainingTimeInMinutes(reminder) {
    const now = new Date();
    const taskTime = new Date(reminder);
    const diff = taskTime - now;
    return diff > 0 ? Math.floor(diff / 60000) : 0;
}

function calculateTimeTaken(createdAt) {
    const startTime = new Date(createdAt);
    const endTime = new Date();
    const timeDiff = endTime - startTime;
    return Math.floor(timeDiff / 60000); // Time in minutes
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(taskArray));
}

function loadTasks() {
    const storedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    taskArray = storedTasks;
    renderTasks();
}

function exportTasks() {
  if (taskArray.length === 0) {
    showToast("No tasks to export.", "error");
      return;
  }

  const tasksForExport = taskArray.map((task, index) => {
      const isCompletedOnTime = task.completed && !isTaskExpired(task.reminder);
      const timeCompleted = task.completed ? formatDateForExport(task.completedAt) : 'Not Completed';
      const reason = task.completed && !isCompletedOnTime ? 'Expired' : '';  // Reason for non-completion

      return {
          'SI NO': index + 1,  // Serial number (index + 1)
          'Date': formatDateForExport(task.createdAt),  // Task creation date
          'Time on Created Task': formatTimeForExport(task.createdAt),  // Task creation time
          'Time on Completed Task': timeCompleted,  // Completion time
          'Completed On Time': isCompletedOnTime ? 'Yes' : 'No',  // Whether completed on time
          'Reason if not completed on time': reason  // Reason if not completed
      };
  });

  // Take the first task's reminder date to form the filename
  const firstTaskReminder = new Date(taskArray[0].reminder);
  const reminderDateString = firstTaskReminder.toLocaleString().replace(/[^\w\s]/gi, '-'); // Format date
  const currentDateString = new Date().toLocaleString().replace(/[^\w\s]/gi, '-'); // Current date for download time

  // Filename format: TaskReminder_yyyy-MM-dd_hh-mm-ss.xlsx
  const filename = `TaskReminder_${reminderDateString}_${currentDateString}.xlsx`;

  const ws = XLSX.utils.json_to_sheet(tasksForExport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Tasks');

  // Export the Excel file with dynamic filename
  XLSX.writeFile(wb, filename);
}

// Helper function to format dates
function formatDateForExport(date) {
  const taskDate = new Date(date);
  return taskDate.toLocaleDateString(); // Only show the date, without time
}

// Helper function to format time (hh:mm:ss)
function formatTimeForExport(date) {
  const taskDate = new Date(date);
  const hours = String(taskDate.getHours()).padStart(2, '0');
  const minutes = String(taskDate.getMinutes()).padStart(2, '0');
  const seconds = String(taskDate.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

// Helper function to check if the task is expired
function isTaskExpired(reminder) {
  const taskTime = new Date(reminder);
  return taskTime < new Date();
}

// Function to show toast notifications
function showToast(message, type) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 100);

  setTimeout(() => {
    toast.classList.remove('show');
    document.body.removeChild(toast);
  }, 4000);
}

// Ensure tasks are loaded when the page loads
document.addEventListener('DOMContentLoaded', loadTasks); 
