document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const lobbyView = document.getElementById('lobby');
    const chatRoomView = document.getElementById('chatRoom');
    const createRoomBtn = document.getElementById('createRoomBtn');
    const leaveRoomBtn = document.getElementById('leaveRoomBtn');
    const roomList = document.getElementById('roomList');
    const roomNameDisplay = document.getElementById('roomNameDisplay');
    const messagesContainer = document.getElementById('messages');
    const messageInput = document.getElementById('messageInput');
    const usernameInput = document.getElementById('usernameInput');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const themeToggle = document.getElementById('themeToggle');
    const typingIndicator = document.getElementById('typingIndicator');
    const notificationSound = document.getElementById('notificationSound');

    // App State
    let rooms = JSON.parse(localStorage.getItem('neoChatRooms')) || {};
    let currentRoom = null;
    let currentUser = localStorage.getItem('neoChatUsername') || '';
    let isTyping = false;
    let typingTimeout;

    // Initialize App
    function init() {
        usernameInput.value = currentUser;
        renderRoomList();
        setupEventListeners();
        loadThemePreference();
    }

    // Event Listeners
    function setupEventListeners() {
        createRoomBtn.addEventListener('click', createRoom);
        leaveRoomBtn.addEventListener('click', leaveRoom);
        sendMessageBtn.addEventListener('click', sendMessage);
        messageInput.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessage());
        themeToggle.addEventListener('click', toggleTheme);
        messageInput.addEventListener('input', handleTyping);
    }

    // Room Management
    function renderRoomList() {
        roomList.innerHTML = '';
        
        if (Object.keys(rooms).length === 0) {
            roomList.innerHTML = '<div class="empty-state"><i class="fas fa-comments"></i><p>No rooms available</p></div>';
            return;
        }
        
        Object.keys(rooms).forEach(roomName => {
            const roomCard = document.createElement('div');
            roomCard.className = 'room-card';
            roomCard.innerHTML = `
                <h3>${roomName}</h3>
                <p>${rooms[roomName].messages.length} messages</p>
                <button class="delete-room">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            roomCard.addEventListener('click', () => joinRoom(roomName));
            
            const deleteBtn = roomCard.querySelector('.delete-room');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteRoom(roomName);
            });
            
            roomList.appendChild(roomCard);
        });
    }

    function createRoom() {
        const roomName = prompt('Enter room name:');
        if (!roomName) return;
        
        if (rooms[roomName]) {
            alert('Room name already exists!');
            return;
        }
        
        rooms[roomName] = { messages: [] };
        saveRooms();
        renderRoomList();
        animateRoomCreation(roomName);
    }

    function deleteRoom(roomName) {
        if (!confirm(`Delete "${roomName}" permanently?`)) return;
        
        delete rooms[roomName];
        saveRooms();
        renderRoomList();
        
        if (currentRoom === roomName) {
            leaveRoom();
        }
    }

    function joinRoom(roomName) {
        currentRoom = roomName;
        roomNameDisplay.textContent = roomName;
        
        // Switch views
        lobbyView.classList.remove('active');
        chatRoomView.classList.add('active');
        
        // Load messages
        loadMessages();
        
        // Play sound
        notificationSound.play();
        
        // Focus input
        setTimeout(() => messageInput.focus(), 300);
    }

    function leaveRoom() {
        currentRoom = null;
        chatRoomView.classList.remove('active');
        lobbyView.classList.add('active');
    }

    // Message Handling
    function loadMessages() {
        messagesContainer.innerHTML = '';
        
        if (!rooms[currentRoom]?.messages.length) {
            messagesContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comment-dots"></i>
                    <p>No messages yet. Say hello!</p>
                </div>
            `;
            return;
        }
        
        rooms[currentRoom].messages.forEach(msg => {
            addMessageToChat(msg.sender, msg.text, msg.timestamp, msg.sender === currentUser);
        });
        
        scrollToBottom();
    }

    function sendMessage() {
        const text = messageInput.value.trim();
        const username = usernameInput.value.trim();
        
        if (!text) return;
        if (!username) {
            alert('Please enter your name first');
            usernameInput.focus();
            return;
        }
        
        // Save username
        if (username !== currentUser) {
            currentUser = username;
            localStorage.setItem('neoChatUsername', username);
        }
        
        // Create message
        const message = {
            sender: username,
            text: text,
            timestamp: new Date().toISOString()
        };
        
        // Add to room
        if (!rooms[currentRoom]) rooms[currentRoom] = { messages: [] };
        rooms[currentRoom].messages.push(message);
        saveRooms();
        
        // Display message
        addMessageToChat(username, text, message.timestamp, true);
        
        // Clear input
        messageInput.value = '';
        messageInput.focus();
        
        // Clear typing indicator
        clearTyping();
    }

    function addMessageToChat(sender, text, timestamp, isSent) {
        // Remove empty state if exists
        const emptyState = messagesContainer.querySelector('.empty-state');
        if (emptyState) emptyState.remove();
        
        const time = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const messageEl = document.createElement('div');
        messageEl.className = `message ${isSent ? 'sent' : 'received'}`;
        messageEl.innerHTML = `
            <div class="sender">${sender}</div>
            <div class="text">${text}</div>
            <div class="time">${time}</div>
        `;
        
        messagesContainer.appendChild(messageEl);
        scrollToBottom();
    }

    // Typing Indicator
    function handleTyping() {
        if (!isTyping) {
            isTyping = true;
            showTypingIndicator(currentUser || 'Someone');
        }
        
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
            isTyping = false;
            clearTyping();
        }, 1500);
    }

    function showTypingIndicator(username) {
        typingIndicator.textContent = `${username} is typing...`;
    }

    function clearTyping() {
        typingIndicator.textContent = '';
    }

    // Theme Toggle
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('neoChatTheme', newTheme);
        
        // Update icon
        themeToggle.innerHTML = newTheme === 'dark' 
            ? '<i class="fas fa-moon"></i>' 
            : '<i class="fas fa-sun"></i>';
    }

    function loadThemePreference() {
        const savedTheme = localStorage.getItem('neoChatTheme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeToggle.innerHTML = savedTheme === 'dark' 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
    }

    // Animations
    function animateRoomCreation(roomName) {
        const roomCard = document.querySelector(`.room-card h3:contains("${roomName}")`)?.parentElement;
        if (roomCard) {
            roomCard.style.transform = 'scale(0.9)';
            roomCard.style.opacity = '0';
            setTimeout(() => {
                roomCard.style.transform = 'scale(1)';
                roomCard.style.opacity = '1';
            }, 10);
        }
    }

    // Utilities
    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function saveRooms() {
        localStorage.setItem('neoChatRooms', JSON.stringify(rooms));
    }

    // Initialize
    init();
});