let currentDate = new Date();
let selectedDate = null;
let events = JSON.parse(localStorage.getItem('calendarEvents')) || {};

// 确保每个日期的事件是数组
Object.keys(events).forEach(date => {
    if (!Array.isArray(events[date])) {
        events[date] = [events[date]];
    }
});

function initCalendar() {
    const monthDisplay = document.getElementById('monthDisplay');
    const calendar = document.getElementById('calendar');
    
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    renderCalendar();
    setupEventHandlers();
}

function renderCalendar() {
    const calendar = document.getElementById('calendar');
    const monthDisplay = document.getElementById('monthDisplay');
    calendar.innerHTML = '';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    monthDisplay.textContent = `${year}年${month + 1}月`;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    let startingDay = firstDay.getDay() - 1;
    if (startingDay === -1) startingDay = 6;
    
    const totalDays = lastDay.getDate();
    
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty-day';
        calendar.appendChild(emptyDay);
    }
    
    for (let day = 1; day <= totalDays; day++) {
        const dayElement = createDayElement(day);
        const dateString = `${year}-${month + 1}-${day}`;
        if (events[dateString]) {
            dayElement.classList.add('has-event');
        }
        calendar.appendChild(dayElement);
    }
}

function createDayElement(day) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    const today = new Date();
    if (today.getFullYear() === currentDate.getFullYear() &&
        today.getMonth() === currentDate.getMonth() &&
        today.getDate() === day) {
        dayElement.classList.add('today');
    }
    
    const dateNumber = document.createElement('div');
    dateNumber.textContent = day;
    dayElement.appendChild(dateNumber);
    
    const dateString = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${day}`;
    if (events[dateString]) {
        events[dateString].forEach(event => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'event-title';
            eventDiv.textContent = event.title;
            dayElement.appendChild(eventDiv);
        });
        dayElement.classList.add('has-event');
    }
    
    dayElement.addEventListener('click', () => openEventModal(day));
    return dayElement;
}

function setupEventHandlers() {
    const modal = document.getElementById('eventModal');
    const closeModal = document.getElementById('closeModal');
    const saveEvent = document.getElementById('saveEvent');
    const clearAllEvents = document.getElementById('clearAllEvents');
    const batchAddEvents = document.getElementById('batchAddEvents');
    const batchModal = document.getElementById('batchEventModal');
    const closeBatchModal = document.getElementById('closeBatchModal');
    const addRow = document.getElementById('addRow');
    const saveBatchEvents = document.getElementById('saveBatchEvents');
    const deleteMonthEvents = document.getElementById('deleteMonthEvents');
    const backToToday = document.getElementById('backToToday');
    
    clearAllEvents.addEventListener('click', () => {
        if (confirm('确定要删除所有事件吗？此操作不可恢复！')) {
            events = {};
            localStorage.setItem('calendarEvents', JSON.stringify(events));
            renderCalendar();
        }
    });
    
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    saveEvent.addEventListener('click', saveEventHandler);
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    batchAddEvents.addEventListener('click', () => {
        const tbody = document.querySelector('#batchEventTable tbody');
        tbody.innerHTML = `
            <tr>
                <td><input type="date" class="date-input"></td>
                <td><input type="text" class="title-input"></td>
                <td><textarea class="description-input" rows="2"></textarea></td>
                <td><button class="remove-row">删除</button></td>
            </tr>
        `;
        batchModal.style.display = 'block';
    });
    
    closeBatchModal.addEventListener('click', () => {
        batchModal.style.display = 'none';
    });
    
    addRow.addEventListener('click', addNewRow);
    
    saveBatchEvents.addEventListener('click', saveBatchEventsHandler);
    
    document.getElementById('batchEventTable').addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-row')) {
            const row = e.target.closest('tr');
            if (document.querySelectorAll('#batchEventTable tbody tr').length > 1) {
                row.remove();
            }
        }
    });
    
    deleteMonthEvents.addEventListener('click', () => {
        if (confirm('确定要删除当月所有事件吗？此操作不可恢复！')) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth() + 1;
            
            // 遍历所有事件，删除当月的事件
            Object.keys(events).forEach(dateString => {
                const [eventYear, eventMonth] = dateString.split('-');
                if (parseInt(eventYear) === year && parseInt(eventMonth) === month) {
                    delete events[dateString];
                }
            });
            
            localStorage.setItem('calendarEvents', JSON.stringify(events));
            renderCalendar();
        }
    });
    
    // 添加删除单个事件的处理
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-event')) {
            const index = e.target.dataset.index;
            events[selectedDate].splice(index, 1);
            if (events[selectedDate].length === 0) {
                delete events[selectedDate];
            }
            localStorage.setItem('calendarEvents', JSON.stringify(events));
            openEventModal(selectedDate.split('-')[2]); // 重新打开模态框
            renderCalendar();
        }
    });
    
    backToToday.addEventListener('click', () => {
        currentDate = new Date();
        renderCalendar();
    });
}

function openEventModal(day) {
    const modal = document.getElementById('eventModal');
    const eventTitle = document.getElementById('eventTitle');
    const eventDescription = document.getElementById('eventDescription');
    
    selectedDate = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${day}`;
    
    // 清空输入框，准备添加新事件
    eventTitle.value = '';
    eventDescription.value = '';
    
    // 显示当天已有的事件列表
    const existingEvents = document.createElement('div');
    existingEvents.className = 'existing-events';
    if (events[selectedDate] && events[selectedDate].length > 0) {
        events[selectedDate].forEach((event, index) => {
            const eventDiv = document.createElement('div');
            eventDiv.className = 'existing-event';
            eventDiv.innerHTML = `
                <div class="event-info">
                    <strong>${event.title}</strong>
                    <p>${event.description || ''}</p>
                </div>
                <button class="delete-event" data-index="${index}">删除</button>
            `;
            existingEvents.appendChild(eventDiv);
        });
    }
    
    // 替换或添加事件列表到模态框
    const oldEventsList = modal.querySelector('.existing-events');
    if (oldEventsList) {
        oldEventsList.remove();
    }
    modal.querySelector('.modal-content').insertBefore(existingEvents, modal.querySelector('input'));
    
    modal.style.display = 'block';
}

function saveEventHandler() {
    const eventTitle = document.getElementById('eventTitle').value;
    const eventDescription = document.getElementById('eventDescription').value;
    
    if (eventTitle.trim()) {
        if (!events[selectedDate]) {
            events[selectedDate] = [];
        }
        events[selectedDate].push({
            title: eventTitle,
            description: eventDescription
        });
        localStorage.setItem('calendarEvents', JSON.stringify(events));
        document.getElementById('eventModal').style.display = 'none';
        renderCalendar();
    }
}

function addNewRow() {
    const tbody = document.querySelector('#batchEventTable tbody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
        <td><input type="date" class="date-input"></td>
        <td><input type="text" class="title-input"></td>
        <td><textarea class="description-input" rows="2"></textarea></td>
        <td><button class="remove-row">删除</button></td>
    `;
    tbody.appendChild(newRow);
}

function saveBatchEventsHandler() {
    const rows = document.querySelectorAll('#batchEventTable tbody tr');
    let hasError = false;
    
    rows.forEach(row => {
        const dateInput = row.querySelector('.date-input').value;
        const titleInput = row.querySelector('.title-input').value;
        const descriptionInput = row.querySelector('.description-input').value;
        
        if (dateInput && titleInput) {
            const [year, month, day] = dateInput.split('-');
            const dateString = `${year}-${parseInt(month)}-${parseInt(day)}`;
            
            // 确保日期的事件是数组
            if (!events[dateString]) {
                events[dateString] = [];
            } else if (!Array.isArray(events[dateString])) {
                events[dateString] = [events[dateString]];
            }
            
            // 添加新事件到数组
            events[dateString].push({
                title: titleInput,
                description: descriptionInput || ''
            });
        } else if (dateInput || titleInput) {
            hasError = true;
        }
    });
    
    if (hasError) {
        alert('请确保填写的每一行都包含日期和标题，或者删除空行');
        return;
    }
    
    localStorage.setItem('calendarEvents', JSON.stringify(events));
    document.getElementById('batchEventModal').style.display = 'none';
    renderCalendar();
}

document.addEventListener('DOMContentLoaded', initCalendar); 