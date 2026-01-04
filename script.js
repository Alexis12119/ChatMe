// Web-Based AI Chatbot Mini Project - ITPROFEL5
// JavaScript Chatbot Logic with Google Gemini API Integration

class ChatBuddy {
  constructor() {
    this.chatbotName = "ChatMe";
    this.chatbotPersonality = "friendly, helpful, and fun";
    this.lastTopic = null;
    this.conversationHistory = [];
    this.storageKey = "chatme-history";

    // Google Gemini API Configuration
    this.apiKey = "";
    this.apiUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";

    // Initialize DOM elements
    this.chatMessages = document.getElementById("chatMessages");
    this.userInput = document.getElementById("userInput");
    this.sendButton = document.getElementById("sendButton");
    this.typingIndicator = document.getElementById("typingIndicator");

    // Knowledge base - Simulated ChatGPT responses
    this.knowledgeBase = {
      greetings: [
        "Hello! I'm ChatBuddy, your friendly AI assistant! 😊",
        "Hi there! Ready to chat and learn together?",
        "Hey! I'm here to help you with anything you need!",
        "Greetings! How can I make your day better?",
      ],

      weather: [
        "I don't have access to real-time weather data, but I can tell you it's always a great day to learn something new! ☀️",
        "While I can't check the current weather, I hope it's sunny wherever you are! Remember to stay hydrated!",
        "Weather's looking good from my perspective - perfect weather for studying! 📚",
        "I wish I could tell you the weather, but I'm stuck inside this computer! Maybe check a weather app?",
      ],

      jokes: [
        "Why don't scientists trust atoms? Because they make up everything! 😄",
        "What do you call a fake noodle? An impasta! 🍝",
        "Why did the scarecrow win an award? He was outstanding in his field! 🌾",
        "What do you call a bear with no teeth? A gummy bear! 🐻",
        "Why don't eggs tell jokes? They'd crack each other up! 🥚",
        "What's the best thing about Switzerland? I don't know, but the flag is a big plus! 🇨🇭",
      ],

      studyTips: [
        "Here's a great study tip: Use the Pomodoro Technique! Study for 25 minutes, then take a 5-minute break. 🍅",
        "Try active recall! Instead of just re-reading notes, try to recall information from memory. It's super effective! 🧠",
        "Create mind maps to connect ideas visually. They help with understanding complex topics! 🗺️",
        "Teach someone else what you're learning! If you can explain it simply, you truly understand it. 👨‍🏫",
        "Take regular breaks and stay hydrated! Your brain works best when you're well-rested. 💧",
        "Use flashcards for memorization. Digital or physical, they work wonders! 🃏",
      ],

      faqs: [
        "I'm ChatBuddy, an AI assistant created to help students and make learning fun! I'm here to chat, tell jokes, and share study tips.",
        "I work using keyword matching and rule-based responses - think of me as a simplified version of ChatGPT!",
        "You can ask me about weather, jokes, study tips, or just chat! I'm always ready to help.",
        "I was created for a college mini project to demonstrate AI conversation flow and user interaction.",
      ],

      help: [
        "I can help you with: 🌤️ Weather chat, 😄 Jokes and fun, 📚 Study tips, ❓ FAQs about me, or just friendly conversation!",
        "Try asking me: 'Tell me a joke', 'How's the weather?', 'Give me study tips', or 'Who are you?'",
        "I'm your friendly study buddy! Ask me anything from jokes to learning advice.",
      ],

      fallback: [
        "I'm not sure about that, but I'll try to help! Can you ask me about weather, jokes, or study tips instead? 🤔",
        "Hmm, that's a bit beyond my current knowledge! How about a joke to cheer you up? 😊",
        "I'm still learning! Try asking me about weather, jokes, or study tips - I'm great at those!",
        "I didn't quite understand that. Remember, I'm ChatBuddy - here to help with weather, jokes, and studying!",
        "Interesting! I'm not familiar with that topic. Want to chat about something I know well?",
        "I'm not sure I follow. Can you rephrase that or ask me about weather, jokes, or study tips?",
        "That's beyond my current knowledge! But I'm always eager to learn! Want to try a different topic?",
      ],
    };

    this.init();
  }

  // Initialize chatbot
  init() {
    this.loadMessageHistory();
    this.setupEventListeners();
    if (this.conversationHistory.length === 0) {
      this.sendGreeting();
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Send button click
    this.sendButton.addEventListener("click", () => this.sendMessage());

    // Enter key press
    this.userInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        this.sendMessage();
      }
    });

    // Input validation
    this.userInput.addEventListener("input", () => {
      this.sendButton.disabled = !this.userInput.value.trim();
    });

    // Delete button click
    const deleteButton = document.getElementById("deleteButton");
    deleteButton.addEventListener("click", () => this.clearConversation());
  }

  // Send greeting message
  sendGreeting() {
    const greeting = `Hello! I'm ${this.chatbotName}, your friendly AI assistant! 😊`;
    this.addMessage("bot", greeting);
    this.lastTopic = "greeting";
  }

  // Send user message
  sendMessage() {
    const message = this.userInput.value.trim();
    if (!message) return;

    // Add user message to chat
    this.addMessage("user", message);

    // Clear input
    this.userInput.value = "";
    this.sendButton.disabled = true;

    // Show typing indicator
    this.showTypingIndicator();

    // Process and respond with Gemini API
    this.callGeminiAPI(message)
      .then((response) => {
        this.hideTypingIndicator();
        this.addMessage("bot", response);
      })
      .catch((error) => {
        this.hideTypingIndicator();
        console.error("Gemini API error:", error);
        // Fallback to local processing if API fails
        this.processUserMessageLocally(message);
      });
  }

  // Call Google Gemini API
  async callGeminiAPI(message) {
    try {
      // Build conversation context for Gemini
      const context = this.buildGeminiContext();

      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${context}\n\nUser: ${message}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const geminiResponse = data.candidates[0].content.parts[0].text;

      // Clean up response and ensure it follows our personality
      return this.cleanGeminiResponse(geminiResponse);
    } catch (error) {
      console.error("Gemini API call failed:", error);
      throw error;
    }
  }

  // Build context for Gemini API
  buildGeminiContext() {
    const personality = `You are ChatBuddy, a friendly, helpful, and fun AI assistant designed for college students. 
        Your personality is warm, encouraging, and slightly playful. You use emojis occasionally but not excessively.
        You should be helpful, educational, and engaging. Keep responses concise but thorough.`;

    const capabilities = `You can help with: general conversation, study tips, educational content, jokes, weather chat, 
        and student life advice. Always be supportive and positive.`;

    let conversationHistory = "";
    if (this.conversationHistory.length > 0) {
      // Get last few messages for context
      const recentMessages = this.conversationHistory.slice(-4);
      conversationHistory = recentMessages
        .map(
          (msg) =>
            `${msg.sender === "user" ? "User" : "ChatBuddy"}: ${msg.message}`,
        )
        .join("\n");
    }

    return `${personality}\n\n${capabilities}\n\n${conversationHistory}`;
  }

  // Clean and format Gemini response
  cleanGeminiResponse(response) {
    // Remove any excessive formatting but preserve Markdown
    let cleaned = response.trim();

    // Remove any "ChatBuddy:" prefix that might come from API
    cleaned = cleaned.replace(/^ChatBuddy:\s*/, "");

    return cleaned;
  }

  // Fallback to local processing if API fails
  processUserMessageLocally(message) {
    const lowerMessage = message.toLowerCase().trim();
    let response = "";
    let topic = "";

    // Use existing keyword matching logic as fallback
    if (
      this.containsKeywords(lowerMessage, ["hello", "hi", "hey", "greetings"])
    ) {
      response =
        "Hello! I'm ChatBuddy! 😊 I'm having some trouble with my AI connection, but I'm still here to help!";
      topic = "greeting";
    } else if (
      this.containsKeywords(lowerMessage, ["joke", "funny", "laugh"])
    ) {
      response =
        "Why don't scientists trust atoms? Because they make up everything! 😄 (I'm using my backup jokes right now!)";
      topic = "jokes";
    } else if (
      this.containsKeywords(lowerMessage, ["study", "learn", "tips"])
    ) {
      response =
        "Here's a great study tip: Use the Pomodoro Technique! Study for 25 minutes, then take a 5-minute break. 🍅";
      topic = "study";
    } else {
      response =
        "I'm having some technical difficulties with my AI brain, but I'm still here to chat! How can I help you? 🤖";
      topic = "fallback";
    }

    this.addMessage("bot", response);
    this.lastTopic = topic;
  }

  // Handle short responses like "ye", "ok", etc.
  isShortResponse(message) {
    return (
      message.length <= 3 &&
      !this.containsKeywords(message, ["bye", "yes", "no"])
    );
  }

  // Handle short conversational responses
  handleShortResponse(message) {
    const responses = {
      ye: [
        "Awesome! 😊 What would you like to talk about?",
        "Great! Want to hear a joke or get some study tips?",
        "Cool! I'm here to help - what's on your mind?",
      ],
      ok: [
        "Sounds good! 👍 How can I help you today?",
        "Okay! What would you like to chat about?",
        "Got it! I'm ready when you are!",
      ],
      ya: [
        "Yeah! 😊 What's up?",
        "Cool! Want to hear something interesting?",
        "Awesome! Let's chat!",
      ],
      hm: [
        "Hmm? What's on your mind? 🤔",
        "Thinking about something? I'm here to help!",
        "What are you pondering?",
      ],
    };

    return responses[message]
      ? responses[message][
          Math.floor(Math.random() * responses[message].length)
        ]
      : [
          "Interesting! Tell me more! 😊",
          "Cool! What would you like to discuss?",
          "Great! How can I help you today?",
        ][Math.floor(Math.random() * 3)];
  }

  // Handle agreement responses
  handleAgreement(message) {
    const contextResponses = {
      jokes: [
        "Great! Here's another one: Why don't scientists trust atoms? Because they make up everything! 😄",
        "Awesome! Want another joke?",
        "Perfect! Jokes are the best!",
      ],
      weather: [
        "Cool! Weather is always interesting to talk about! ☀️",
        "Awesome! I wish I could check the real weather for you!",
        "Great! Always good weather for learning!",
      ],
      study: [
        "Perfect! Knowledge is power! 📚",
        "Awesome! Learning is the key to success!",
        "Great! Let's make studying fun!",
      ],
      help: [
        "Great! I'm always here to assist! 🤖",
        "Awesome! Helping others is what I do!",
        "Perfect! How can I help you today?",
      ],
    };

    const lastTopic = this.lastTopic;
    if (lastTopic && contextResponses[lastTopic]) {
      return contextResponses[lastTopic][
        Math.floor(Math.random() * contextResponses[lastTopic].length)
      ];
    }

    return [
      "Awesome! 😊 What would you like to talk about?",
      "Great! I'm here to help!",
      "Perfect! What's on your mind?",
    ][Math.floor(Math.random() * 3)];
  }

  // Handle disagreement responses
  handleDisagreement(message) {
    return [
      "No worries! We can talk about something else! 😊",
      "That's okay! What would you prefer to discuss?",
      "No problem! I'm here to chat about anything!",
    ][Math.floor(Math.random() * 3)];
  }

  // Handle laughter
  handleLaughter(message) {
    return [
      "Haha! Glad I could make you smile! 😄",
      "LOL! Want to hear another joke?",
      "Hehe! I love making people laugh! Want more fun?",
    ][Math.floor(Math.random() * 3)];
  }

  // Handle questions
  handleQuestion(message) {
    if (this.containsKeywords(message, ["how are you", "how you doing"])) {
      return [
        "I'm doing great, thanks for asking! 😊 Ready to chat and help!",
        "I'm awesome! Always happy to help people like you!",
        "Doing fantastic! What can I help you with today?",
      ];
    }
    if (this.containsKeywords(message, ["what are you doing", "what's up"])) {
      return [
        "Just here chatting with you! 🤖 It's what I love to do!",
        "Hanging out and helping people! Best job ever!",
        "Being an awesome chatbot! How about you?",
      ];
    }
    if (this.containsKeywords(message, ["why", "how come"])) {
      return [
        "That's a great question! 🤔 Can you tell me more about what you're asking?",
        "Interesting! Why do you think that is?",
        "Good question! Let me think about that...",
      ];
    }

    return [
      "That's a thoughtful question! 🤔",
      "Interesting point! Tell me more!",
      "Great question! I'm here to help you find answers!",
    ][Math.floor(Math.random() * 3)];
  }

  // Get topic from context
  getTopicFromContext() {
    return this.lastTopic || "general";
  }

  // Save message history to localStorage
  saveMessageHistory() {
    try {
      // Keep only last 50 messages to avoid storage limits
      const limitedHistory = this.conversationHistory.slice(-50);
      localStorage.setItem(this.storageKey, JSON.stringify(limitedHistory));
    } catch (error) {
      console.warn("Could not save message history:", error);
    }
  }

  // Load message history from localStorage
  loadMessageHistory() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        this.conversationHistory = JSON.parse(saved);
        this.displayMessageHistory();
      }
    } catch (error) {
      console.warn("Could not load message history:", error);
      this.conversationHistory = [];
    }
  }
  // Clear conversation history
  clearConversation() {
    if (
      confirm(
        "Are you sure you want to clear the entire conversation? This cannot be undone.",
      )
    ) {
      // Clear from memory
      this.conversationHistory = [];

      // Clear from UI
      this.chatMessages.innerHTML = "";

      // Clear from localStorage
      localStorage.removeItem(this.storageKey);

      // Show new greeting
      this.sendGreeting();
    }
  }
  // Display loaded message history
  displayMessageHistory() {
    this.conversationHistory.forEach((messageData) => {
      const messageDiv = document.createElement("div");
      messageDiv.className = `message ${messageData.sender}`;

      // Parse markdown for bot messages
      const processedMessage =
        messageData.sender === "bot"
          ? this.parseMarkdown(messageData.message)
          : messageData.message;

      messageDiv.innerHTML = `
                <div class="message-avatar">${messageData.sender === "bot" ? "🤖" : "👤"}</div>
                <div class="message-content">
                    <div class="message-username">${messageData.sender === "bot" ? "ChatMe" : "You"}</div>
                    <div class="message-text">${processedMessage}</div>
                    <div class="message-timestamp">${messageData.timestamp}</div>
                </div>
            `;

      this.chatMessages.appendChild(messageDiv);
    });

    this.scrollToBottom();
  }

  // Check if message contains specific keywords
  containsKeywords(message, keywords) {
    return keywords.some((keyword) => message.includes(keyword));
  }

  // Get random response from knowledge base
  getRandomResponse(category) {
    const responses = this.knowledgeBase[category];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // Add contextual response based on previous topic
  addContextualResponse(response, lastTopic) {
    const contextualAdditions = {
      weather: " By the way, I hope the weather's nice for studying!",
      jokes: " Speaking of jokes, I hope I made you smile earlier!",
      study: " Remember those study tips we discussed?",
      help: " Is there anything specific I can help you with?",
    };

    const addition = contextualAdditions[lastTopic];
    return addition ? response + addition : response;
  }

  // Add message to chat
  addMessage(sender, message) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Parse markdown for bot messages
    const processedMessage =
      sender === "bot" ? this.parseMarkdown(message) : message;

    messageDiv.innerHTML = `
            <div class="message-avatar">${sender === "bot" ? "🤖" : "👤"}</div>
            <div class="message-content">
                <div class="message-username">${sender === "bot" ? "ChatMe" : "You"}</div>
                <div class="message-text">${processedMessage}</div>
                <div class="message-timestamp">${timestamp}</div>
            </div>
        `;

    this.chatMessages.appendChild(messageDiv);
    this.scrollToBottom();

    // Add to conversation history
    const messageData = { sender, message, timestamp };
    this.conversationHistory.push(messageData);
    this.saveMessageHistory();
  }

  // Parse basic markdown to HTML
  parseMarkdown(text) {
    let html = text;

    // Bold text **text** -> <strong>text</strong>
    html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Italic text *text* -> <em>text</em>
    html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

    // Numbered lists 1. item -> <ol><li>item</li></ol>
    html = html.replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/s, "<ol>$1</ol>");

    // Bullet lists - item -> <ul><li>item</li></ul>
    html = html.replace(/^-\s+(.+)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>");

    // Headers ### -> <h3>
    html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");

    // Line breaks
    html = html.replace(/\n\n/g, "</p><p>");
    html = html.replace(/\n/g, "<br>");
    html = `<p>${html}</p>`;

    // Clean up nested lists
    html = html.replace(/<\/ol>\s*<ol>/g, "");
    html = html.replace(/<\/ul>\s*<ul>/g, "");

    return html;
  }

  // Show typing indicator
  showTypingIndicator() {
    this.typingIndicator.classList.add("active");
    setTimeout(() => this.scrollToBottom(), 100);
  }

  // Hide typing indicator
  hideTypingIndicator() {
    this.typingIndicator.classList.remove("active");
    this.scrollToBottom();
  }

  // Scroll to bottom of chat
  scrollToBottom() {
    requestAnimationFrame(() => {
      this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    });
  }
}

// Initialize chatbot when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.chatBuddy = new ChatBuddy();

  // Add some console info for debugging
  console.log("🤖 ChatMe initialized successfully!");
  console.log(
    "ChatMe is powered by Google Gemini AI API for intelligent conversations.",
  );
  console.log("Fallback system available for offline functionality.");
});

// Error handling
window.addEventListener("error", (e) => {
  console.error("ChatMe encountered an error:", e.error);
});

/*
GOOGLE GEMINI API INTEGRATION:
---------------------------------
This chatbot uses Google's Gemini AI API for intelligent responses:

1. Real AI Responses: Uses Gemini 1.5 Flash model for natural conversation
2. Context Awareness: Maintains conversation history for contextual responses
3. Personality Injection: Shapes Gemini responses to match ChatBuddy's friendly personality
4. Fallback System: Local keyword matching if API is unavailable
5. Error Handling: Graceful degradation when API calls fail

API Configuration:
- Model: gemini-1.5-flash
- Temperature: 0.7 (balanced creativity)
- Max Tokens: 1024 (concise responses)
- Top K: 40, Top P: 0.95 (quality filtering)

Benefits:
- Natural, intelligent conversations
- Real-time AI responses
- Contextual understanding
- Educational content generation
- Personality consistency

Fallback Benefits:
- Works offline when API unavailable
- Reliable basic functionality
- Fast response times
- No single point of failure

Security Note:
- API key is included for demo purposes
- In production, use server-side proxy for API calls
- Consider rate limiting and usage monitoring
*/
