// This program is a version of the game "Palermo".

let totalVotes = 0;
let countdownTimeout = null;
let eliminatedPlayer = null;


class Player {
	constructor(name) {
		this.name = name;
		this.role = "";
		this.isAlive = true;
		this.votes = 0;
		this.lives = 1; // default: 1 ζωή
	}

	assignRole(role) {
		this.role = role;
		this.isAlive = true;
		this.votes = 0;
		this.lives = (role === "Bulletproof") ? 2 : 1;
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
	roleDiv.innerHTML = `
		<h3>Έχεις επιλέξει:</h3>
		<ul id="chosenRolesList">
			<li>Citizen ×2</li>
			<li>Hidden Killer</li>
			<li>Known Killer</li>
		</ul>
		<h3>Επίλεξε ${numPlayers - 4} επιπλέον ρόλους:</h3>
	`;

	// Input για πολλαπλούς Citizen
	roleDiv.innerHTML += `
		<label>
			Citizen
			<input type="number" id="extraCitizenCount" value="0" min="0" max="${numPlayers - 4}" onchange="updateCitizenSelection()">
		</label><br>
	`;

	// Checkboxes για άλλους προαιρετικούς ρόλους (χωρίς δολοφόνους)
	for (let i = 3; i < roleNames.length; i++) {
		if (roleNames[i] === "Citizen") continue; // Citizen τον βάζουμε μόνο με αριθμό
		roleDiv.innerHTML += `
			<label>
				<input type="checkbox" value="${roleNames[i]}" onchange="updateRoleSelection(this)">
				${roleNames[i]}
			</label><br>`;
	}

	roleDiv.innerHTML += `<br><button onclick="startNameInput()">Continue</button>`;
	roleDiv.style.display = "block";

	chosenRoles = [...requiredRoles]; // Βάση 4 απαραίτητων ρόλων
	updateChosenRolesList();
}


function updateRoleSelection(checkbox) {
	const extraAllowed = numPlayers - 4;

	if (checkbox.checked) {
		const role = checkbox.value;
		const currentCount = chosenRoles.length;

		if (currentCount >= numPlayers) {
			checkbox.checked = false;
			alert("Έχεις ήδη επιλέξει τον μέγιστο αριθμό ρόλων.");
			return;
		}

		chosenRoles.push(role);
	} else {
		const index = chosenRoles.indexOf(checkbox.value);
		if (index !== -1) {
			chosenRoles.splice(index, 1);
		}
	}

	updateChosenRolesList();
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

	const nightTextDiv = document.getElementById("nightText");
	nightTextDiv.innerHTML = "";

	// Έλεγχος για παρουσία ρόλων
	const hasSnitch = chosenRoles.includes("Snitch");

	// Δημιουργία αφήγησης
	const scriptLines = [
		"Μια νύχτα πέφτει στο Παλέρμο κι όλοι κλείνουν τα μάτια τους...",
		"Οι 2 δολοφόνοι ανοίγουν τα μάτια τους και γνωρίζουν ο ένας τον άλλον",
		"Αφού γνωριστούν, κλείνουν τα μάτια τους",
		"Ο φανερός δολοφόνος σηκώνει το χέρι του κι ο αστυνομικός ανοίγει τα μάτια του",
		"Τώρα που ο αστυνομικός έχει δει τον φανερό δολοφόνο, κλείνει τα μάτια του"
	];

	if (hasSnitch) {
		scriptLines.push(
			"Στη συνέχεια σηκώνει το χέρι του και ο κρυφός δολοφόνος",
			"Ο ρουφιάνος ανοίγει τα μάτια του και βλέπει τους 2 δολοφόνους",
			"Αφού πλέον γνωρίζει ποιους πρέπει να καλύψει, κλείνει τα μάτια του",
			"Οι 2 δολοφόνοι κατεβάζουν τα χέρια τους"
		);
	} else {
		scriptLines.push("Ο δολοφόνος κατεβάζει το χέρι του");
	}

	scriptLines.push("Μια μέρα ξημερώνει στο Παλέρμο και όλοι ανοίγουν τα μάτια τους...");

	let index = 0;

	const interval = setInterval(() => {
		if (index >= scriptLines.length) {
			clearInterval(interval);
			setTimeout(() => {
				startDay();
			}, 500);
			return;
		}

		nightTextDiv.innerHTML += scriptLines[index] + "<br>";
		index++;
	}, 2000);
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
		const container = document.createElement("div");
		container.style.marginBottom = "10px";

		const nameSpan = document.createElement("span");
		nameSpan.innerHTML = `<strong>${p.name}</strong> - Ψήφοι: <span id="votes-${index}">${p.votes}</span> `;
		if (!p.isAlive) {
			nameSpan.style.opacity = "0.5";
			container.appendChild(nameSpan);
		} else {
			container.appendChild(nameSpan);

			const addBtn = document.createElement("button");
			addBtn.textContent = "+ Ψήφος";
			addBtn.onclick = () => {
				const alive = players.filter(p => p.isAlive).length;
				if (totalVotes >= alive) return; // αποφυγή υπερψήφισης

				p.votes++;
				totalVotes++;
				updateVotesDisplay(index, p.votes);

				if (totalVotes === alive) {
					// Απενεργοποιούμε όλα τα + κουμπιά
					disableAllAddButtons();
				}

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
		}

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

	// Επανενεργοποίηση + Ψήφος αν είχαμε φτάσει το όριο
	const buttons = document.querySelectorAll("button");
	buttons.forEach(btn => {
		if (btn.textContent === "+ Ψήφος") {
			btn.disabled = false;
		}
	});
}

function finishVoting() {
	const votingDiv = document.getElementById("votingArea");

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

	let eliminated;
	let didDie;

	if (candidates.length === 1) {
		eliminated = candidates[0];
		didDie = eliminatePlayer(eliminated);
		eliminatedPlayer = didDie ? eliminated : null;

		if (didDie) {
			votingDiv.innerHTML = `<p>Ο παίκτης <strong>${eliminated.name}</strong> αποχωρεί από το παιχνίδι!</p>`;
		} else {
			votingDiv.innerHTML = `<p>Ο παίκτης <strong>${eliminated.name}</strong> ήταν Αλεξίσφαιρος και επέζησε από την απόπειρα ψηφοφορίας! Του απομένει άλλη μία ζωή.</p>`;
		}
	} else {
		// Ισοψηφία - επιλέγεται τυχαία
		const randomIndex = Math.floor(Math.random() * candidates.length);
		eliminated = candidates[randomIndex];
		didDie = eliminatePlayer(eliminated);
		eliminatedPlayer = didDie ? eliminated : null;

		if (didDie) {
			votingDiv.innerHTML = `<p>Υπήρξε ισοψηφία! Ο παίκτης <strong>${eliminated.name}</strong> επιλέχθηκε τυχαία και αποχωρεί από το παιχνίδι.</p>`;
		} else {
			votingDiv.innerHTML = `<p>Υπήρξε ισοψηφία! Ο παίκτης <strong>${eliminated.name}</strong> επιλέχθηκε τυχαία, αλλά ήταν Αλεξίσφαιρος και επέζησε από την απόπειρα ψηφοφορίας! Του απομένει άλλη μία ζωή.</p>`;
		}
	}

	setTimeout(() => {
		if (checkForGameEnd()) return;
		startSecondNight();
	}, 2000);
}


function startSecondNight() {
	document.getElementById("dayPhase").style.display = "none";
	document.getElementById("nightPhase").style.display = "block";

	const nightTextDiv = document.getElementById("nightText");
	nightTextDiv.innerHTML = "";

	const scriptLines = [
		"Μια νύχτα πέφτει στο Παλέρμο κι όλοι κλείνουν τα μάτια τους...",
		"Οι 2 δολοφόνοι ανοίγουν τα μάτια τους και δείχνουν στον παίκτη εκτός παιχνιδιού ποιον παίκτη θέλουν να σκοτώσουν."
	];

	let index = 0;

	const interval = setInterval(() => {
		if (index >= scriptLines.length) {
			clearInterval(interval);
			setTimeout(() => {
				showKillChoiceMenu();
			}, 1000);
			return;
		}

		nightTextDiv.innerHTML += scriptLines[index] + "<br>";
		index++;
	}, 2000);
}

function showKillChoiceMenu() {
	document.getElementById("nightPhase").style.display = "none";
	document.getElementById("nightKillChoice").style.display = "block";

	const container = document.getElementById("killSelectionArea");
	container.innerHTML = "<p>Επέλεξε παίκτη για να σκοτωθεί:</p>";

	players.forEach((p, index) => {
		const btn = document.createElement("button");
		btn.textContent = p.name;

		if (!p.isAlive || p === eliminatedPlayer) {
			btn.disabled = true;
			btn.style.opacity = "0.5";
		} else {
			btn.onclick = () => {
				let seconds = 3;
				const countdownDiv = document.getElementById("voteCountdown");
				countdownDiv.innerHTML = `Ολοκλήρωση σε ${seconds}...`;

				const cancelBtn = document.createElement("button");
				cancelBtn.textContent = "Ακύρωση";
				cancelBtn.onclick = () => {
					clearInterval(countdownTimeout);
					countdownDiv.innerHTML = "";
				};
				countdownDiv.appendChild(cancelBtn);

				countdownTimeout = setInterval(() => {
					seconds--;
					if (seconds === 0) {
						clearInterval(countdownTimeout);
						eliminatePlayer(p, "δολοφονίας");
						document.getElementById("nightKillChoice").style.display = "none";

						document.getElementById("nightPhase").style.display = "block";
						const nightTextDiv = document.getElementById("nightText");
						nightTextDiv.innerHTML = "<br><em>Οι δολοφόνοι αποφάσισαν ποιον θέλουν να σκοτώσουν.</em><br>";
						setTimeout(() => {
							nightTextDiv.innerHTML += "Μια νέα μέρα ξημερώνει στο Παλέρμο και όλοι ανοίγουν τα μάτια τους...";
							setTimeout(() => {
								if (checkForGameEnd()) return;
								startDay();
							}, 2000);
						}, 1500);
					} else {
						countdownDiv.innerHTML = `Ολοκλήρωση σε ${seconds}...`;
						countdownDiv.appendChild(cancelBtn);
					}
				}, 1000);
			};
		}

		container.appendChild(btn);
		container.appendChild(document.createElement("br"));
	});

	const countdownDiv = document.createElement("div");
	countdownDiv.id = "voteCountdown";
	countdownDiv.style.marginTop = "20px";
	container.appendChild(countdownDiv);
}

function checkForGameEnd() {
	const alivePlayers = players.filter(p => p.isAlive);
	if (alivePlayers.length === 0) return false; // ασφαλιστική δικλείδα

	const allBad = alivePlayers.every(p => p.role === "Hidden Killer" || p.role === "Known Killer");
	const allGood = alivePlayers.every(p => p.role !== "Hidden Killer" && p.role !== "Known Killer");

	if (allBad) {
		showEndMessage("Οι κακοί κέρδισαν!");
		return true;
	}
	if (allGood) {
		showEndMessage("Οι καλοί κέρδισαν!");
		return true;
	}

	return false;
}

function showEndMessage(message) {
	const nightDiv = document.getElementById("nightPhase");
	const dayDiv = document.getElementById("dayPhase");
	const resultDiv = document.getElementById("result");

	nightDiv.style.display = "none";
	dayDiv.style.display = "none";
	resultDiv.style.display = "block";

	resultDiv.innerHTML = `<h2>${message}</h2>`;

	setTimeout(() => {
		resultDiv.innerHTML += `
			<br><br>
			<button onclick="restartSameNames()">Νέο παιχνίδι με ίδια ονόματα</button>
			<button onclick="restartNewNames()">Νέο παιχνίδι με νέα ονόματα</button>
		`;
	}, 3000);
}

function restartSameNames() {
	// Ανακατεύουμε ξανά τους ρόλους
	chosenRoles = shuffleArray([...chosenRoles]);

	// Ξαναδίνουμε ρόλους στους υπάρχοντες παίκτες
	players.forEach((p, i) => {
		p.assignRole(chosenRoles[i]);
	});

	currentPlayerIndex = 0;

	// Κρύβουμε το αποτέλεσμα
	document.getElementById("result").style.display = "none";

	// Επανεκκίνηση με ίδιο name input, αλλά χωρίς αλλαγή ονομάτων
	showNextPlayerRole();
}

function showNextPlayerRole() {
	const nameDiv = document.getElementById("nameInput");
	nameDiv.style.display = "block";

	const player = players[currentPlayerIndex];

	nameDiv.innerHTML = `
		<h3>Player ${currentPlayerIndex + 1} - Επιβεβαίωσε ή άλλαξε το όνομά σου:</h3>
		<input type="text" id="playerName" value="${player.name}"><br><br>
		<button onclick="revealRestartedRole()">Δες τον νέο ρόλο σου</button>
		<div id="roleReveal" style="margin-top:15px; font-weight:bold;"></div>
	`;
}

function revealRestartedRole() {
	const nameInput = document.getElementById("playerName");
	const name = nameInput.value.trim();

	if (!name) {
		alert("Παρακαλώ εισάγετε όνομα!");
		return;
	}

	const lowerName = name.toLowerCase();
	const nameExists = players.some((p, i) =>
		i !== currentPlayerIndex && p.name.toLowerCase() === lowerName
	);

	if (nameExists) {
		alert("Αυτό το όνομα χρησιμοποιείται ήδη. Διάλεξε άλλο.");
		return;
	}

	const player = players[currentPlayerIndex];
	player.name = name;

	const role = player.role;

	const roleDiv = document.getElementById("roleReveal");

	const isLast = currentPlayerIndex === numPlayers - 1;
	const nextButtonLabel = isLast ? "Start Game" : "Επόμενος παίκτης";

	roleDiv.innerHTML = `Ο νέος ρόλος σου είναι: <strong>${role}</strong><br><br>
		<button onclick="nextRestartedPlayer()">${nextButtonLabel}</button>`;

	nameInput.disabled = true;
}

function restartNewNames() {
	location.reload();
}

function nextRestartedPlayer() {
	currentPlayerIndex++;

	if (currentPlayerIndex >= numPlayers) {
		document.getElementById("nameInput").style.display = "none";
		showResults();
	} else {
		showNextPlayerRole();
	}
}

function disableAllAddButtons() {
	const buttons = document.querySelectorAll("button");
	buttons.forEach(btn => {
		if (btn.textContent === "+ Ψήφος") {
			btn.disabled = true;
		}
	});
}

function updateChosenRolesList() {
	const list = document.getElementById("chosenRolesList");
	const counts = {};

	// Μέτρησε τις εμφανίσεις κάθε ρόλου
	chosenRoles.forEach(role => {
		if (!counts[role]) counts[role] = 0;
		counts[role]++;
	});

	list.innerHTML = "";
	for (const role in counts) {
		const count = counts[role];
		const label = count > 1 ? `${role} ×${count}` : role;
		list.innerHTML += `<li>${label}</li>`;
	}
}

function updateCitizenSelection() {
	const input = document.getElementById("extraCitizenCount");
	let count = parseInt(input.value);

	if (isNaN(count) || count < 0) count = 0;

	// Υπολογίζουμε πόσους extra ρόλους έχουμε ήδη επιλέξει εκτός Citizen
	const nonCitizenExtras = chosenRoles.slice(4).filter(role => role !== "Citizen").length;

	const maxExtraCitizens = numPlayers - 4 - nonCitizenExtras;

	// Κόβουμε αν ο χρήστης έβαλε παραπάνω από το επιτρεπτό
	if (count > maxExtraCitizens) {
		count = maxExtraCitizens;
		input.value = count;
	}

	// Αφαιρούμε όλους τους Citizen που είναι πέρα από τους 2 αρχικούς
	chosenRoles = chosenRoles.filter((role, index) => {
		// κρατάμε όλους εκτός των Citizen πέρα από τους δύο πρώτους
		if (role === "Citizen") {
			// κρατάμε τους 2 πρώτους Citizen (index < 2 για αρχικούς)
			const citizenIndex = chosenRoles
				.map((r, i) => ({ r, i }))
				.filter(obj => obj.r === "Citizen")
				.map(obj => obj.i);
			return citizenIndex.indexOf(index) < 2;
		}
		return true;
	});

	// Προσθέτουμε όσους χρειάζεται
	const currentCitizens = chosenRoles.filter(r => r === "Citizen").length;
	const extraNeeded = 2 + count - currentCitizens;
	for (let i = 0; i < extraNeeded; i++) {
		chosenRoles.push("Citizen");
	}

	updateChosenRolesList();
}

function eliminatePlayer(player, source = "ψηφοφορίας") {
	if (player.lives > 1) {
		player.lives--;
		return false; // Δεν πέθανε
	} else {
		player.isAlive = false;
		return true; // Πέθανε
	}
}

