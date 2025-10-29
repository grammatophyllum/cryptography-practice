let challenges = [];
let solvedChallenges = [];

const modal = document.getElementById('challenge-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const modalTitle = document.getElementById('modal-title');
const modalTagsContainer = document.getElementById('modal-tags-container');
const modalDescription = document.getElementById('modal-description');
const modalFilesContainer = document.getElementById('modal-files-container');
const flagForm = document.getElementById('flag-form');
const flagInput = document.getElementById('flag-input');
const modalMessage = document.getElementById('modal-message');
const loadingMessage = document.getElementById('loading-message');
const challengesContainer = document.getElementById('challenges-container');

function toTitleCase(str) {
    if (!str) return "";
    str = str.replace('_', ' ')

    return str
        .toLowerCase()
        .split(' ')
        .map(word => {
            if (word.length === 0) {
                return "";
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' '); 
}

let currentChallengeId = null;
document.body.addEventListener('click', (event) => {
    const card = event.target.closest('[data-challenge-id]');
    if (card) {
        currentChallengeId = card.getAttribute('data-challenge-id');
        const challenge = challenges.find(c => c.id === currentChallengeId);
        
        if (!challenge) {
            console.error(`Challenge with ID ${currentChallengeId} not found.`);
            return;
        }

        let pointsColorClass = 'text-yellow-400';
        if (challenge.difficulty === 'easy') {
            pointsColorClass = 'text-green-400';
        } else if (challenge.difficulty === 'hard') {
            pointsColorClass = 'text-red-400';
        }

        modalTitle.innerHTML = `<span class="${pointsColorClass}">[${challenge.points}]</span> ${challenge.name}`;

        const descriptionWithLinks = challenge.description.replace(/{(.*?)\|(.*?)}/g, (match, path, text) => {
            return `<a href="${path}" target="_blank" class="text-blue-400 hover:underline">${text}</a>`;
        });
        modalDescription.innerHTML = descriptionWithLinks;
        
        // File Link
        modalFilesContainer.innerHTML = '';
        const filesLabel = document.createElement('p');
        filesLabel.className = 'font-semibold text-white mb-2';
        filesLabel.textContent = 'Downloads';
        modalFilesContainer.appendChild(filesLabel);
        const fileLink = document.createElement('a');
        fileLink.href = `https://raw.githubusercontent.com/grammatophyllum/cryptography-practice/refs/heads/main/static/${challenge.id}.txt`;
        fileLink.target = '_blank'
        fileLink.textContent = 'out.txt';
        fileLink.className = 'block text-blue-400 hover:underline';
        modalFilesContainer.appendChild(fileLink);

        const solLink = document.createElement('a');
        solLink.href = `https://github.com/grammatophyllum/cryptography-practice/blob/main/solutions/${challenge.id}_solution.py`;
        solLink.target = '_blank'
        solLink.textContent = 'Solutions';
        solLink.className = 'block text-blue-400 hover:underline';
        modalFilesContainer.appendChild(solLink);

        modalTagsContainer.innerHTML = '';
        const allModalTags = [challenge.category, ...challenge.tags];
        if (allModalTags.length > 0) {
            // Updated container class to help fill the space
            modalTagsContainer.className = 'flex flex-wrap gap-3 mb-4'; 
            allModalTags.forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm font-medium';
                tagSpan.textContent = tag.replace('_', ' ');
                modalTagsContainer.appendChild(tagSpan);
            });
        }

        flagForm.reset();
        modalMessage.textContent = '';
        modalMessage.classList.remove('text-green-400', 'text-red-400');
        
        modal.classList.remove('hidden');
    }
});

closeModalBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
});

async function hashString(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
}

flagForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submittedFlag = flagInput.value.trim();
    if (!submittedFlag || !currentChallengeId) {
        return;
    }

    modalMessage.textContent = '';
    modalMessage.classList.remove('text-green-400', 'text-red-400');

    try {
        const hashedFlag = await hashString(submittedFlag);
        
        if (challengesData[currentChallengeId]['flag'] === hashedFlag) {
            modalMessage.textContent = 'Correct flag! You solved the challenge.';
            modalMessage.classList.add('text-green-400');
            
            
            const currentPoints = parseInt(localStorage.getItem('points') || '0');
            const challengePoints = parseInt(challengesData[currentChallengeId]['points']);
            localStorage.setItem('points', (currentPoints + challengePoints).toString());

            
            let solvedIds = [];
            const questionsAnsweredRaw = localStorage.getItem('questions_answered');
            try {
                solvedIds = questionsAnsweredRaw ? JSON.parse(questionsAnsweredRaw) : [];
            } catch (error) {
                console.error("Corrupted 'questions_answered' in localStorage. Resetting.", error);
                solvedIds = [];
            }
            
            
            if (!solvedIds.includes(currentChallengeId)) {
                solvedIds.push(currentChallengeId);
                localStorage.setItem('questions_answered', JSON.stringify(solvedIds));
            }
            
            
            await fetchAndRenderData();

        } else {
            modalMessage.textContent = 'Incorrect flag. Please try again.';
            modalMessage.classList.add('text-red-400');
        }
    } catch (error) {
        console.error('Submission failed:', error);
        modalMessage.textContent = 'An error occurred. Please try again later.';
        modalMessage.classList.add('text-red-400');
    }
});

function addChallengeToPage(challengeDetails, isSolved) {
    const containerId = 'category-' + challengeDetails.category.toLowerCase().replace(/\s/g, '-') + '-challenges';
    const container = document.getElementById(containerId);

    if (!container) {
        console.error(`Container with ID ${containerId} not found.`);
        return;
    }

    let pointsColorClass = 'text-yellow-400';
    if (challengeDetails.difficulty === 'easy') {
        pointsColorClass = 'text-green-400';
    } else if (challengeDetails.difficulty === 'hard') {
        pointsColorClass = 'text-red-400';
    }

    const allTags = [challengeDetails.category, ...challengeDetails.tags];
    const tagsHtml = allTags.map(tag => `<span class="bg-gray-700 text-gray-300 px-2 py-1 rounded-full">${tag.replace('_', ' ')}</span>`).join('');
    
    const solvedCardClass = isSolved ? 'bg-gray-700 border-2 border-green-500' : 'bg-gray-800';
    const solvedStatusHtml = isSolved ? '<p class="text-green-400 font-bold mt-2">SOLVED!</p>' : '';
    
    const cardHtml = `
        <div class="${solvedCardClass} text-white p-6 rounded-lg shadow-md flex flex-col justify-between cursor-pointer hover:bg-gray-700 transition-colors duration-200" data-challenge-id="${challengeDetails.id}" data-solved="${isSolved}">
            <div>
                <h3 class="text-xl font-semibold mb-1">
                    <span class="${pointsColorClass}">[${challengeDetails.points}]</span> ${challengeDetails.name}
                </h3>
                <p class="text-gray-400 text-sm mb-2">Difficulty: ${toTitleCase(challengeDetails.difficulty)}</p>
                <div class="flex flex-wrap gap-2 text-xs mb-4">
                    ${tagsHtml}
                </div>
            </div>
            <div class="text-right">
                ${solvedStatusHtml}
            </div>
        </div>
    `;
    
    container.insertAdjacentHTML('beforeend', cardHtml);
}

async function fetchAndRenderData() {
    loadingMessage.textContent = 'Loading challenges...';
    
    loadingMessage.classList.remove('hidden', 'text-red-400'); 
    loadingMessage.classList.add('text-white');

    try {
        
        if (typeof challengesData === 'undefined') {
             throw new Error("Critical: 'challengesData' is not defined.");
        }

        challenges = Object.keys(challengesData).map(id => ({
            id: id,
            ...challengesData[id]
        }));
        
        challenges.sort((a, b) => {
            if (a.points !== b.points) {
                return a.points - b.points;
            } else {
                return a.name.localeCompare(b.name);
            }
        });

        
        const solvedChallengesRaw = localStorage.getItem('questions_answered');
        try {
             solvedChallenges = solvedChallengesRaw ? JSON.parse(solvedChallengesRaw) : [];
        } catch (e) {
             console.error("Error parsing 'questions_answered' from localStorage. Resetting to empty array.", e);
             solvedChallenges = [];
        }
        
        
        document.getElementById('points').textContent = `${localStorage.getItem('points') || 0} pts`;

        
        challengesContainer.innerHTML = '';
        challengesContainer.appendChild(loadingMessage);

        const categories = [...new Set(challenges.map(c => c.category))];

        categories.forEach(category => {
            const titleElement = document.createElement('h2');
            titleElement.className = 'text-2xl text-white font-semibold mb-4 border-b-2 border-gray-700 pb-2';
            titleElement.textContent = toTitleCase(category);
            challengesContainer.appendChild(titleElement);
            
            const containerElement = document.createElement('div');
            containerElement.id = 'category-' + category.toLowerCase().replace(/\s/g, '-') + '-challenges';
            containerElement.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8';
            challengesContainer.appendChild(containerElement);
        });

        challenges.forEach(challenge => {
            
            const isSolved = solvedChallenges.includes(challenge.id);
            addChallengeToPage(challenge, isSolved);
        });

        
        loadingMessage.classList.add('hidden');
        loadingMessage.classList.remove('text-red-400'); 

    } catch (error) {
        console.error('Error loading data:', error);
        loadingMessage.textContent = 'Failed to load challenges: ' + error.message;
        loadingMessage.classList.remove('hidden', 'text-white');
        loadingMessage.classList.add('text-red-400');
    }
}

window.onload = fetchAndRenderData;