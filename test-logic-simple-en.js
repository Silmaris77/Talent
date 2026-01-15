// Test Logic - Simple Knowledge Test
let testQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = {}; // { questionId: selectedAnswerIndex }
let testStartTime = null;
let testEndTime = null;
let timerInterval = null;
let timeLeft = 10 * 60; // 10 minutes in seconds

// Load test questions from JSON
async function loadQuestions() {
    try {
        const response = await fetch('test-questions-en.json');
        const data = await response.json();
        testQuestions = data.questions;
        document.getElementById('totalQuestions').textContent = testQuestions.length;
        console.log('✅ Loaded', testQuestions.length, 'questions');
        return true;
    } catch (error) {
        console.error('Error loading questions:', error);
        alert('Error loading questions. Please refresh the page.');
        return false;
    }
}

// Start test
async function startTest() {
    // Load questions first
    const loaded = await loadQuestions();
    if (!loaded) return;

    // Hide start screen
    document.getElementById('startScreen').classList.add('hidden');
    
    // Show timer and test container
    document.getElementById('timer').classList.remove('hidden');
    document.getElementById('testContainer').classList.remove('hidden');
    
    // Initialize test state
    testStartTime = new Date();
    currentQuestionIndex = 0;
    userAnswers = {};
    
    // Render first question
    renderQuestion(currentQuestionIndex);
    
    // Start timer
    startTimer();
}

// Timer function
function startTimer() {
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();
        
        // Warning at 2 minutes
        if (timeLeft === 120) {
            document.getElementById('timer').classList.add('warning');
        }
        
        // Time's up
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            submitTest();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timeDisplay').textContent = display;
}

// Render question
function renderQuestion(index) {
    const question = testQuestions[index];
    const questionCard = document.getElementById('questionCard');
    
    // Update progress
    document.getElementById('currentQuestion').textContent = index + 1;
    
    // Build HTML
    let html = `
        <div class="question-category">${question.category}</div>
        <div class="question-text">${question.text}</div>
        <div class="answers">
    `;
    
    question.answers.forEach((answer, answerIndex) => {
        const isSelected = userAnswers[question.id] === answerIndex;
        
        html += `
            <label class="answer-option ${isSelected ? 'selected' : ''}" 
                   data-question="${question.id}" 
                   data-answer="${answerIndex}">
                <input type="radio" 
                       name="${question.id}" 
                       value="${answerIndex}" 
                       ${isSelected ? 'checked' : ''}>
                ${answer.text}
            </label>
        `;
    });
    
    html += `</div>`;
    questionCard.innerHTML = html;
    
    // Add event listeners
    document.querySelectorAll('.answer-option').forEach(option => {
        option.addEventListener('click', function() {
            const questionId = this.dataset.question;
            const answerIndex = parseInt(this.dataset.answer);
            
            // Save answer
            userAnswers[questionId] = answerIndex;
            
            // Update visual selection
            document.querySelectorAll(`label[data-question="${questionId}"]`).forEach(label => {
                label.classList.remove('selected');
            });
            this.classList.add('selected');
            
            // Check radio button
            this.querySelector('input[type="radio"]').checked = true;
        });
    });
    
    // Update navigation buttons
    updateNavigationButtons();
}

// Navigate between questions
function navigateQuestion(direction) {
    const newIndex = currentQuestionIndex + direction;
    
    if (newIndex >= 0 && newIndex < testQuestions.length) {
        currentQuestionIndex = newIndex;
        renderQuestion(currentQuestionIndex);
    }
}

// Update navigation buttons
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    // Previous button
    prevBtn.disabled = currentQuestionIndex === 0;
    
    // Next/Submit button
    const isLastQuestion = currentQuestionIndex === testQuestions.length - 1;
    
    if (isLastQuestion) {
        nextBtn.classList.add('hidden');
        submitBtn.classList.remove('hidden');
    } else {
        nextBtn.classList.remove('hidden');
        submitBtn.classList.add('hidden');
    }
}

// Submit test
function submitTest() {
    // Stop timer
    clearInterval(timerInterval);
    testEndTime = new Date();
    
    // Calculate results
    const results = calculateResults();
    
    // Hide test container
    document.getElementById('timer').classList.add('hidden');
    document.getElementById('testContainer').classList.add('hidden');
    
    // Show results
    showResults(results);
}

// Calculate results
function calculateResults() {
    let correctCount = 0;
    const details = [];
    
    testQuestions.forEach(question => {
        const userAnswer = userAnswers[question.id];
        const correctAnswerIndex = question.answers.findIndex(a => a.correct);
        const isCorrect = userAnswer === correctAnswerIndex;
        
        if (isCorrect) correctCount++;
        
        details.push({
            question: question,
            userAnswer: userAnswer,
            correctAnswer: correctAnswerIndex,
            isCorrect: isCorrect
        });
    });
    
    const score = Math.round((correctCount / testQuestions.length) * 100);
    const timeSpent = Math.floor((testEndTime - testStartTime) / 1000);
    const passed = score >= 80;
    
    return {
        score: score,
        correctCount: correctCount,
        totalQuestions: testQuestions.length,
        timeSpent: timeSpent,
        passed: passed,
        details: details
    };
}

// Show results
function showResults(results) {
    const resultsScreen = document.getElementById('resultsScreen');
    const scoreDisplay = document.getElementById('scoreDisplay');
    const resultMessage = document.getElementById('resultMessage');
    const correctAnswers = document.getElementById('correctAnswers');
    const timeSpent = document.getElementById('timeSpent');
    const questionReview = document.getElementById('questionReview');
    
    // Show results screen
    resultsScreen.classList.remove('hidden');
    
    // Display score
    scoreDisplay.textContent = `${results.score}%`;
    scoreDisplay.className = 'score-display ' + (results.passed ? 'pass' : 'fail');
    
    // Display message
    if (results.passed) {
        resultMessage.innerHTML = `
            <div style="color: #4CAF50;">✅ Congratulations! Test passed!</div>
            <p style="font-size: 1rem; color: #666; margin-top: 10px;">
                You can proceed to the practical case studies calibration.
            </p>
        `;
    } else {
        resultMessage.innerHTML = `
            <div style="color: #F44336;">❌ Unfortunately, test failed</div>
            <p style="font-size: 1rem; color: #666; margin-top: 10px;">
                Required minimum: 80%. Review the answers and try again.
            </p>
        `;
    }
    
    // Display stats
    correctAnswers.textContent = `${results.correctCount}/${results.totalQuestions}`;
    const minutes = Math.floor(results.timeSpent / 60);
    const seconds = results.timeSpent % 60;
    timeSpent.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    // Display question review
    let reviewHTML = '<h3 style="margin-bottom: 20px;">📋 Review of answers:</h3>';
    
    results.details.forEach((detail, index) => {
        const question = detail.question;
        const userAnswerText = detail.userAnswer !== undefined 
            ? question.answers[detail.userAnswer].text 
            : 'No answer';
        const correctAnswerText = question.answers[detail.correctAnswer].text;
        
        reviewHTML += `
            <div class="review-item ${detail.isCorrect ? 'correct' : 'incorrect'}">
                <div style="font-weight: 700; margin-bottom: 10px;">
                    ${detail.isCorrect ? '✅' : '❌'} Question ${index + 1}: ${question.text}
                </div>
                <div style="margin-bottom: 8px;">
                    <strong>Your answer:</strong> ${userAnswerText}
                </div>
                ${!detail.isCorrect ? `
                    <div style="margin-bottom: 8px; color: #4CAF50;">
                        <strong>Correct answer:</strong> ${correctAnswerText}
                    </div>
                ` : ''}
                <div class="explanation">
                    💡 <strong>Explanation:</strong> ${question.explanation}
                </div>
            </div>
        `;
    });
    
    questionReview.innerHTML = reviewHTML;
}

// Retake test
function retakeTest() {
    // Reset everything
    timeLeft = 10 * 60;
    document.getElementById('timer').classList.remove('warning');
    
    // Hide results
    document.getElementById('resultsScreen').classList.add('hidden');
    
    // Show start screen
    document.getElementById('startScreen').classList.remove('hidden');
}

// Go to calibration
function goToCalibration() {
    window.location.href = 'calibration-en.html';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Knowledge test - ready to start');
});
