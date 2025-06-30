// This program is a version of the game "Palermo".

let totalVotes = 0;
let countdownTimeout = null;

class Player {
	constructor(name) {
		this.name = name;
		this.role = "";
		this.isAlive = true;
		this.votes = 0;
	}

	assignRole(role) {
		this.role = role;
		this.isAlive = true;
		this.votes = 0;
	}
}

const roleNames = ["Citizen", "Hidden Killer", "Known Killer", "Police officer", "Snitch", "Bulletproof"];
const requiredRoles = ["Citizen", "Citizen", "Hidden Killer", "Known Killer"];

let numPlayers = 0;
let chosenRoles = [];
let players = [];

let currentPlayerIndex = 0;

function startRoleSelection() {
	numPlayers = parseInt(document.getElementById("numPlayers").value);
	if (numPlayers < 5) {
		alert("You need at least 5 players!");
		return;
	}

	document.getElementById("setup").style.display = "none";

	const roleDiv = document.getElementById("roleSelection");
	roleDiv.innerHTML = "<h3>Select " + (numPlayers - 4) + " extra roles:</h3>";

	for (let i = 3; i < roleNames.length; i++) {
		roleDiv.innerHTML += `
			<label>
				<input type="checkbox" value="${roleNames[i]}" onchange="updateRoleSelection(this)">
				${roleNames[i]}
			</label><br>`;
	}

	roleDiv.innerHTML += `<br><button onclick="startNameInput()">Continue</button>`;
	roleDiv.style.display = "block";

	chosenRoles = [...requiredRoles];
}

function updateRoleSelection(checkbox) {
	if (checkbox.checked) {
		if (chosenRoles.length < numPlayers) {
			chosenRoles.push(checkbox.value);
		} else {
			checkbox.checked = false;
			alert("You have already selected enough roles!");
		}
	} else {
		const index = chosenRoles.indexOf(checkbox.value);
		if (index !== -1) {
			chosenRoles.splice(index, 1);
		}
	}
}

function startNameInput() {
	if (chosenRoles.length !== numPlayers) {
		alert(`You need exactly ${numPlayers} roles!`);
		return;
	}

	chosenRoles = shuffleArray(chosenRoles);
	document.getElementById("roleSelection").style.display = "none";
	document.getElementById("nameInput").style.display = "block";

	players = [];
	currentPlayerIndex = 0;

	renderNameInputStep();
}

function renderNameInputStep() {
	const nameDiv = document.getElementById("nameInput");
	const playerNumber = currentPlayerIndex + 1;

	nameDiv.innerHTML = `
		<h3>Player ${playerNumber} - Enter your name:</h3>
		<input type="text" id="playerName"><br><br>
		<button onclick="showRole()">Δες τον ρόλο σου</button>
		<div id="roleReveal" style="margin-top:15px; font-weight:bold;"></div>
	`;
}

function showRole() {
	const nameInput = document.getElementById("playerName");
	const name = nameInput.value.trim();
	if (!name) {
		alert("Please enter a name!");
		return;
	}

	const lowerName = name.toLowerCase();
	const nameExists = players.some(p => p.name.toLowerCase() === lowerName);
	if (nameExists) {
		alert("This name has already been used. Please choose a different name.");
		return;
	}

	const role = chosenRoles[currentPlayerIndex];
	const player = new Player(name);
	player.assignRole(role);
	players.push(player);

	const roleDiv = document.getElementById("roleReveal");

	const isLast = currentPlayerIndex === numPlayers - 1;
	const nextButtonLabel = isLast ? "Start Game" : "Επόμενος παίκτης";

	roleDiv.innerHTML = `Ο ρόλος σου είναι: <strong>${role}</strong><br><br>
		<button onclick="nextPlayer()">${nextButtonLabel}</button>`;

	nameInput.disabled = true;
}

function nextPlayer() {
	currentPlayerIndex++;

	if (currentPlayerIndex >= numPlayers) {
		document.getElementById("nameInput").style.display = "none";
		showResults();
	} else {
		renderNameInputStep();
	}
}

function showResults() {
	const resultDiv = document.getElementById("result");
	resultDiv.innerHTML = "<h3>Όλοι οι παίκτες έχουν καταχωρηθεί.</h3><p>Μπορείτε τώρα να ξεκινήσετε το παιχνίδι!</p>";
	resultDiv.innerHTML += `<br><button onclick="startNight()">Ξεκίνα Νύχτα</button>`;
	resultDiv.style.display = "block";
}



function shuffleArray(array) {
	let currentIndex = array.length, temp, randomIndex;

	while (currentIndex !== 0) {
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		temp = array[currentIndex];
		array[currentIndex] = array[randomIndex];
		array[randomIndex] = temp;
	}

	return array;
}

function startNight() {
	document.getElementById("result").style.display = "none";
	document.getElementById("nightPhase").style.display = "block";

	const scriptLines = [
		"Μια νύχτα πέφτει στο Παλέρμο κι όλοι κλείνουν τα μάτια τους...",
		"Οι 2 δολοφόνοι ανοίγουν τα μάτια τους και γνωρίζουν ο ένας τον άλλον",
		"Αφού γνωριστούν, κλείνουν τα μάτια τους",
		"Ο φανερός δολοφόνος σηκώνει το χέρι του κι ο αστυνομικός ανοίγει τα μάτια του",
		"Τώρα που ο αστυνομικός έχει δει τον φανερό δολοφόνο, κλείνει τα μάτια του",
		"Στη συνέχεια σηκώνει το χέρι του και ο κρυφός δολοφόνος",
		"Ο ρουφιάνος ανοίγει τα μάτια του και βλέπει τους 2 δολοφόνους",
		"Αφού πλέον γνωρίζει ποιους πρέπει να καλύψει, κλείνει τα μάτια του",
		"Οι 2 δολοφόνοι κατεβάζουν τα χέρια τους",
		"Μια μέρα ξημερώνει στο Παλέρμο και όλοι ανοίγουν τα μάτια τους...",
	];

	const nightTextDiv = document.getElementById("nightText");
	nightTextDiv.innerHTML = "";

	let index = 0;

	const interval = setInterval(() => {
		if (index >= scriptLines.length) {
			clearInterval(interval);
			return;
		}

		nightTextDiv.innerHTML += scriptLines[index] + "<br>";
		index++;
	}, 2000);

    // Μετά από την τελευταία γραμμή αφήγησης, ξεκινάει η μέρα
    setTimeout(() => {
	    startDay();
    }, scriptLines.length * 2000 + 500); // λίγο delay για ομαλή μετάβαση
}

function startDay() {
	document.getElementById("nightPhase").style.display = "none";
	document.getElementById("dayPhase").style.display = "block";

	players.forEach(p => p.votes = 0); // μηδενισμός ψήφων

	renderVotingInterface();
}

function renderVotingInterface() {
	const votingDiv = document.getElementById("votingArea");
	votingDiv.innerHTML = "<p>Πατήστε [+ Ψήφος] ή [− Ψήφος] για κάθε παίκτη.</p>";

	totalVotes = 0;

	players.forEach((p, index) => {
		if (!p.isAlive) return;

		const container = document.createElement("div");
		container.style.marginBottom = "10px";

		const nameSpan = document.createElement("span");
		nameSpan.innerHTML = `<strong>${p.name}</strong> - Ψήφοι: <span id="votes-${index}">${p.votes}</span> `;
		container.appendChild(nameSpan);

		const addBtn = document.createElement("button");
		addBtn.textContent = "+ Ψήφος";
		addBtn.onclick = () => {
			p.votes++;
			totalVotes++;
			updateVotesDisplay(index, p.votes);
			checkIfVotingComplete();
		};
		container.appendChild(addBtn);

		const removeBtn = document.createElement("button");
		removeBtn.textContent = "− Ψήφος";
		removeBtn.onclick = () => {
			if (p.votes > 0) {
				p.votes--;
				totalVotes--;
				updateVotesDisplay(index, p.votes);
				cancelCountdown(); // ακύρωση αν μειώθηκε ψήφος
			}
		};
		container.appendChild(removeBtn);

		votingDiv.appendChild(container);
	});

	// Περιοχή για αντίστροφη μέτρηση
	const countdown = document.createElement("div");
	countdown.id = "voteCountdown";
	countdown.style.marginTop = "20px";
	votingDiv.appendChild(countdown);
}


function updateVotesDisplay(index, votes) {
	const voteSpan = document.getElementById(`votes-${index}`);
	if (voteSpan) voteSpan.textContent = votes;
}

function checkIfVotingComplete() {
	const alive = players.filter(p => p.isAlive).length;
	if (totalVotes === alive) {
		startCountdown();
	}
}

function startCountdown() {
	const countdownDiv = document.getElementById("voteCountdown");
	let seconds = 3;
	countdownDiv.innerHTML = `Η ψηφοφορία ολοκληρώνεται σε ${seconds}... `;

	const cancelBtn = document.createElement("button");
	cancelBtn.textContent = "Ακύρωση";
	cancelBtn.onclick = cancelCountdown;
	countdownDiv.appendChild(cancelBtn);

	countdownTimeout = setInterval(() => {
		seconds--;
		if (seconds === 0) {
			clearInterval(countdownTimeout);
			finishVoting();
		} else {
			countdownDiv.innerHTML = `Η ψηφοφορία ολοκληρώνεται σε ${seconds}... `;
			countdownDiv.appendChild(cancelBtn);
		}
	}, 1000);
}

function cancelCountdown() {
	clearInterval(countdownTimeout);
	const countdownDiv = document.getElementById("voteCountdown");
	countdownDiv.innerHTML = "";
}

function finishVoting() {
	const votingDiv = document.getElementById("votingArea");

	// Εύρεση παίκτη με τις περισσότερες ψήφους
	let maxVotes = 0;
	let candidates = [];

	players.forEach(p => {
		if (p.isAlive) {
			if (p.votes > maxVotes) {
				maxVotes = p.votes;
				candidates = [p];
			} else if (p.votes === maxVotes) {
				candidates.push(p);
			}
		}
	});

	if (candidates.length === 1) {
		const eliminated = candidates[0];
		eliminated.isAlive = false;
		votingDiv.innerHTML = `<p>Ο παίκτης <strong>${eliminated.name}</strong> αποχωρεί από το παιχνίδι!</p>`;
	} else {
		votingDiv.innerHTML = `<p>Υπάρχει ισοψηφία! Κανείς δεν αποχωρεί προς το παρόν.</p>`;
	}
}