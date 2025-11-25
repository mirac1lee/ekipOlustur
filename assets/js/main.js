const addUserForm = document.querySelector("#addUserForm");
const peopleList = document.querySelector(".people-list");
const saveBtn = document.querySelector("#saveBtn");
const exportBtn = document.querySelector("#exportBtn");
const distributeForm = document.querySelector("#distributeForm");
const teamContainer = document.querySelector("#teamsContainer");
const leaderboardBtn = document.querySelector("#leaderboardBtn");
const modal = document.querySelector("#leaderboardModal");
const closeModalSpan = document.querySelector(".close-modal");
const leaderboardList = document.querySelector("#leaderboardList");
const toggleSortBtn = document.querySelector("#toggleSortBtn");
const themeToggleBtn = document.querySelector("#themeToggle");
const bodyElement = document.body;

let users = localStorage.getItem("data") ? JSON.parse(localStorage.getItem("data")).users : [];
let teams = localStorage.getItem("data") ? JSON.parse(localStorage.getItem("data")).teams : [];

function addUser(username) {
    const trimmed = username.trim();
    
    const exists = users.some(u => u.name.toLowerCase() === trimmed.toLowerCase());

    if (!trimmed || trimmed === "" || exists) {
        return; 
    }

    users.push({
        name: trimmed,
        score: 0
    });
    
    saveToLocalStorage();
    render();
}

function updateScore(userName, newScore) {
    const user = users.find(u => u.name === userName);
    if (user) {
        user.score = parseInt(newScore) || 0;
        saveToLocalStorage();
    }
}

function deleteUserDirectly(userNameToDelete) {
    users = users.filter((user) => user.name !== userNameToDelete);
    saveToLocalStorage();
    render();
}

function render() {
    peopleList.innerHTML = "";
    if (users.length < 1) {
        peopleList.innerHTML = "<span style='opacity:0.6; padding:10px;'>Henüz kimse yok. Ekip oluşturmak için kişi ekleyin.</span>";
        return;
    }
    
    users.forEach(user => {
        const chip = document.createElement("div");
        chip.className = "chip";
        
        const span = document.createElement("span");
        span.textContent = user.name;
        

        const scoreInput = document.createElement("input");
        scoreInput.type = "number";
        scoreInput.className = "score-input";
        scoreInput.value = user.score;
        scoreInput.placeholder = "0";
        scoreInput.addEventListener("input", (e) => updateScore(user.name, e.target.value));


        const icon = document.createElement("div");
        icon.className = "delete-icon";
        icon.innerHTML = "&#10005;";
        icon.title = "Kişiyi Sil";
        icon.addEventListener("click", () => deleteUserDirectly(user.name));
        
        chip.appendChild(span);
        chip.appendChild(scoreInput);
        chip.appendChild(icon);
        peopleList.appendChild(chip);
    });
}

let isDescending = true; 

function showLeaderboard() {
    const sortedUsers = [...users].sort((a, b) => {
        if (isDescending) {
            return b.score - a.score; 
        } else {
            return a.score - b.score;
        }
    });

    leaderboardList.innerHTML = "";

    if (isDescending) {
        leaderboardList.classList.add("high-scores-mode");
    } else {
        leaderboardList.classList.remove("high-scores-mode");
    }

    toggleSortBtn.innerHTML = isDescending 
        ? "🔽 En Yüksekten Düşüğe" 
        : "🔼 En Düşükten Yükseğe";
    
    toggleSortBtn.style.backgroundColor = isDescending ? "#bcdffcff" : "#f9ebfbff";

    if (sortedUsers.length === 0) {
        leaderboardList.innerHTML = "<li style='text-align:center; color:#888;'>Listede kimse yok.</li>";
    } else {
        sortedUsers.forEach((user, index) => {
            const li = document.createElement("li");
            li.className = "leaderboard-item";
            
            let rankLabel = `${index + 1})`;
            
            if (isDescending) {
                if (index === 0) rankLabel = "🥇";
                if (index === 1) rankLabel = "🥈";
                if (index === 2) rankLabel = "🥉";
            }

            li.innerHTML = `
                <span>${rankLabel} ${user.name}</span>
                <span>${user.score} Puan</span>
            `;
            leaderboardList.appendChild(li);
        });
    }

    modal.style.display = "block";
}

leaderboardBtn.addEventListener("click", () => {
    
    showLeaderboard();
});

toggleSortBtn.addEventListener("click", () => {
    isDescending = !isDescending;
    showLeaderboard();
});

closeModalSpan.addEventListener("click", () => { modal.style.display = "none"; });
window.addEventListener("click", (e) => { if (e.target === modal) modal.style.display = "none"; });

addUserForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if(data.username) {
        addUser(data.username);
        e.target.reset();
    }
});

function shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

distributeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    const quantity = parseInt(data.quantity);

    if (data.mode === "teams") {
        distributeByTeams(quantity); 
    } else {
        distributeByTeamSize(quantity);
    }
});

function distributeByTeams(numTeams) {
    if (users.length === 0) { alert("Önce kişi ekleyin!"); return; }
    if (numTeams > users.length) { alert("Takım sayısı kişi sayısından fazla olamaz!"); return; }

    const shuffled = shuffle(users);
    teams = [];

    for (let i = 0; i < numTeams; i++) {
        teams.push({ name: `Ekip ${i + 1}`, members: [] });
    }

    shuffled.forEach((person, index) => {
        teams[index % numTeams].members.push(person);
    });
    
    renderTeams();
    saveToLocalStorage();
}

function distributeByTeamSize(sizePerTeam) {
    if (users.length === 0) { alert("Önce kişi ekleyin!"); return; }

    const shuffled = shuffle(users);
    teams = [];
    
    const teamCount = Math.ceil(users.length / sizePerTeam);

    for(let i=0; i < teamCount; i++){
        const teamMembers = shuffled.slice(i * sizePerTeam, (i + 1) * sizePerTeam);
        teams.push({
            name: `Ekip ${i+1}`,
            members: teamMembers
        });
    }

    renderTeams();
    saveToLocalStorage();
}

function renderTeams() {
    teamContainer.innerHTML = "";
    const ul = document.createElement('ul');
    ul.style.listStyle = "none";
    ul.style.padding = "0";

    ul.innerHTML = teams.map((team) => {
        const totalScore = team.members.reduce((acc, curr) => acc + curr.score, 0);

        return `
        <li class="team-card" style="margin-bottom: 20px; border:1px solid #ddd; padding:15px; border-radius:8px; background:#fff;">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:5px; margin-bottom:10px;">
                <h3 style="margin:0;">${team.name} <small style="font-weight:normal; font-size:0.8em">(${team.members.length} kişi)</small></h3>
                <span style="font-weight:bold; color:#4caf50;">Güç: ${totalScore}</span>
            </div>
            <ul style="margin:0; padding:0; list-style:none;">
                ${team.members.map(member => `
                    <li style="padding: 5px 0; border-bottom: 1px dashed #eee; display:flex; justify-content:space-between;">
                        <span>${member.name}</span>
                        <span style="color:#888; font-size:0.9em; font-weight:500;">${member.score}p</span>
                    </li>
                `).join("")} 
            </ul>
        </li>
    `}).join("");

    teamContainer.appendChild(ul);
}


const currentTheme = localStorage.getItem('theme');

if (currentTheme === 'dark') {
    bodyElement.classList.add('dark-mode');
    themeToggleBtn.textContent = '☀️';
}


themeToggleBtn.addEventListener('click', () => {

    bodyElement.classList.toggle('dark-mode');
    
    
    const isDark = bodyElement.classList.contains('dark-mode');

    
    themeToggleBtn.textContent = isDark ? '☀️' : '🌙';


    localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

function saveToLocalStorage() {
    localStorage.setItem("data", JSON.stringify({ users, teams }));
}

saveBtn.addEventListener("click", () => {
    saveToLocalStorage();
});

function exportJson() {
    const date = new Date();
    const data = { users, teams, exportDate: date.toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    
    a.href = url;
    a.download = `team-builder-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

exportBtn.addEventListener("click", exportJson);

render();
if(teams.length > 0) renderTeams();


//////////----OZAN YAZICIOĞLU POP-UP-------///////


const popup = document.querySelector(".popupOverlay");
const teamListUI = document.querySelector(".teams");
const closeBtn = document.querySelector(".closeBtn");

const shuffleBtn = document.querySelector("#shuffleBtn");


shuffleBtn.addEventListener("click", (e) => {
e.preventDefault();



if (!Array.isArray(teams) || teams.length === 0) return;

loadTeamsToPopup();
popup?.classList.add("active");


});


closeBtn.addEventListener("click", () => {
popup?.classList.remove("active");
});


popup.addEventListener("click", (e) => {
if (e.target === popup) popup?.classList.remove("active");
});


function loadTeamsToPopup() {
teamListUI.innerHTML = teams
.map(
t => `<li><strong>${t.name}:</strong> 
${t.members.map(m => m.name ?? m).join(", ")}</li>
`
)
.join("");
}






































