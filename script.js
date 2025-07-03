// This program is a version of the game "Palermo".

let totalVotes = 0;
let countdownTimeout = null;
let eliminatedPlayer = null;
let discussionDuration = 0;
let discussionTimerInterval = null;
let discussionTimerRemaining = 0;
let selectedTrack = "track1";
let wakeLock = null;

async function requestWakeLock() {
	try {
		if ('wakeLock' in navigator) {
			wakeLock = await navigator.wakeLock.request('screen');
			console.log("🔒 Wake Lock ενεργό");
			wakeLock.addEventListener('release', () => {
				console.log("🔓 Wake Lock αποδεσμεύτηκε");
			});
		}
	} catch (err) {
		console.error(`Wake Lock error: ${err.name}, ${err.message}`);
	}
}

function releaseWakeLock() {
	if (wakeLock) {
		wakeLock.release();
		wakeLock = null;
		console.log("🔓 Wake Lock απενεργοποιήθηκε");
	}
}

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

// Save selected setting when starting game
function startRoleSelection() {

	requestWakeLock(); // 👉 Ενεργοποιεί Wake Lock από εδώ και πέρα

	const trackSelect = document.getElementById("trackSelect");
	if (trackSelect) {
		selectedTrack = trackSelect.value;
	}

	// Save discussion setting
	const select = document.getElementById("discussionTime");
	if (select) {
		discussionDuration = parseInt(select.value);
	}

	numPlayers = parseInt(document.getElementById("numPlayers").value);
	if (numPlayers < 5) {
		alert("You need at least 5 players!");
		return;
	}

	if (numPlayers > 10) {
		alert("Μέγιστος αριθμός παικτών: 10.");
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
			Πολίτης
			<input type="number" id="extraCitizenCount" value="0" min="0" max="${numPlayers - 4}" onchange="updateCitizenSelection()">
		</label><br>
	`;


	// Checkboxes για άλλους προαιρετικούς ρόλους (χωρίς δολοφόνους)
	for (let i = 3; i < roleNames.length; i++) {
		if (roleNames[i] === "Citizen") continue; // Citizen τον βάζουμε μόνο με αριθμό
			roleDiv.innerHTML += `
				<label>
					<input type="checkbox" value="${roleNames[i]}" onchange="updateRoleSelection(this)">
					${translateRole(roleNames[i])}
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
	nameDiv.innerHTML = `
		<h3 id="playerHeader">Παίκτη ${currentPlayerIndex + 1} - Γράψε το όνομα σου:</h3>
		<input type="text" id="playerName" maxlength="15"><br><br>
		<button onclick="showRole()">Δες τον ρόλο σου</button>
		<div id="roleReveal" style="margin-top:15px; font-weight:bold;"></div>
	`;
}


function showRole() {
	const nameInput = document.getElementById("playerName");
	const name = nameInput.value.trim();
	const button = document.querySelector("#nameInput button");

	if (!name) {
		if (button) {
			button.disabled = true;
			button.textContent = "Εισάγετε όνομα πρώτα!";
			setTimeout(() => {
				button.disabled = false;
				button.textContent = "Δες τον ρόλο σου";
			}, 2000);
		}
		return;
	}

	const lowerName = name.toLowerCase();
	const nameExists = players.some(p => p.name.toLowerCase() === lowerName);
	if (nameExists) {
		if (button) {
			button.disabled = true;
			button.textContent = "Όνομα ήδη χρησιμοποιείται!";
			setTimeout(() => {
				button.disabled = false;
				button.textContent = "Δες τον ρόλο σου";
			}, 2000);
		}
		return;
	}

	const role = chosenRoles[currentPlayerIndex];
	const player = new Player(name);
	player.assignRole(role);
	players.push(player);

	const roleDiv = document.getElementById("roleReveal");
	const isLast = currentPlayerIndex === numPlayers - 1;
	const nextButtonLabel = isLast ? "Ολοκλήρωση" : "Επόμενος παίκτης";

	roleDiv.innerHTML = `
	<div class="fade-in-role role-card">
		<div class="role-icon">${getRoleIcon(role)}</div>
		<div class="role-text">Ο ρόλος σου είναι: <br><strong>${translateRole(role)}</strong></div>
		<br><button onclick="nextPlayer()">${nextButtonLabel}</button>
	</div>`;


	nameInput.disabled = true;

	if (button) {
		button.disabled = true;
	}
}

function nextPlayer() {
	const roleDiv = document.getElementById("roleReveal");
	roleDiv.classList.add("fade-out");

	setTimeout(() => {
		currentPlayerIndex++;

		if (currentPlayerIndex >= numPlayers) {
			document.getElementById("nameInput").style.display = "none";
			showResults();
		} else {
			// Αλλάζουμε μόνο το κείμενο και καθαρίζουμε
			document.getElementById("playerHeader").textContent = `Παίκτη ${currentPlayerIndex + 1} - Γράψε το όνομα σου:`;
			const input = document.getElementById("playerName");
			input.value = "";
			input.disabled = false;

			const button = document.querySelector("#nameInput button");
			button.disabled = false;
			button.textContent = "Δες τον ρόλο σου";

			const roleDiv = document.getElementById("roleReveal");
			roleDiv.classList.remove("fade-out");
			roleDiv.innerHTML = "";
		}
	}, 400);
}

function showResults() {
	const resultDiv = document.getElementById("result");
	resultDiv.innerHTML = "<h3>Όλοι οι παίκτες έχουν καταχωρηθεί.</h3><p>Μπορείτε τώρα να ξεκινήσετε το παιχνίδι!</p>";
	resultDiv.innerHTML += `<br><button onclick="startNight()">Η Νύχτα Πέφτει...</button>`;
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

// 2. Επέκταση startNight ώστε να αλλάζει background
function startNight() {
    setBackground("night");
    document.getElementById("result").style.display = "none";
    document.getElementById("nightPhase").style.display = "block";

    const nightTextDiv = document.getElementById("nightText");
    nightTextDiv.innerHTML = "";
    nightTextDiv.style.opacity = 0;

    const hasSnitch = chosenRoles.includes("Snitch");

    const scriptLines = [
        "Μια νύχτα πέφτει στο Παλέρμο κι όλοι κλείνουν τα μάτια τους...",
        "Οι 2 δολοφόνοι ανοίγουν τα μάτια τους και γνωρίζουν ο ένας τον άλλον",
        "Αφού γνωριστούν, κλείνουν τα μάτια τους",
        "Ο φανερός δολοφόνος σηκώνει το χέρι του κι ο αστυνομικός ανοίγει τα μάτια του",
        "Τώρα που ο αστυνομικός έχει δει τον φανερό δολοφόνο, κλείνει τα μάτια του"
    ];

    const audioLines = [
        "line1.mp3", "line2.mp3", "line3.mp3", "line4.mp3", "line5.mp3"
    ];

    if (hasSnitch) {
        scriptLines.push(
            "Στη συνέχεια σηκώνει το χέρι του και ο κρυφός δολοφόνος",
            "Ο ρουφιάνος ανοίγει τα μάτια του και βλέπει τους 2 δολοφόνους",
            "Αφού πλέον γνωρίζει ποιους πρέπει να καλύψει, κλείνει τα μάτια του",
            "Οι 2 δολοφόνοι κατεβάζουν τα χέρια τους"
        );
        audioLines.push("line6.mp3", "line7.mp3", "line8.mp3", "line9.mp3");
    } else {
        scriptLines.push("Ο δολοφόνος κατεβάζει το χέρι του");
        audioLines.push("line10.mp3");
    }

    scriptLines.push("Μια μέρα ξημερώνει στο Παλέρμο και όλοι ανοίγουν τα μάτια τους...");
    audioLines.push("line11.mp3");

    let index = 0;

    function nextLine() {
        if (index >= scriptLines.length) {
            setTimeout(() => {
                startDay();
            }, 1000);
            return;
        }

        nightTextDiv.innerHTML += `<div class="fade-line">${scriptLines[index]}</div>`;
        const audio = new Audio(`audio/${selectedTrack}/${audioLines[index]}`);
        audio.load();
        audio.oncanplaythrough = () => audio.play();

        nightTextDiv.style.opacity = 1;
        setTimeout(() => {
            index++;
            nextLine();
        }, 8000);
    }

    nextLine();
}






// 3. Επέκταση startDay για αλλαγή background
function startDay() {
    setBackground("day");
    document.getElementById("nightPhase").style.display = "none";
    document.getElementById("dayPhase").style.display = "block";
    players.forEach(p => p.votes = 0);
    renderVotingInterface();
    startDiscussionTimer();
}

function startDiscussionTimer() {
	const countdownDiv = document.getElementById("voteCountdown");

	if (discussionDuration === 0) return;

	discussionTimerRemaining = discussionDuration;
	clearInterval(discussionTimerInterval);

	countdownDiv.innerHTML = `Χρόνος συζήτησης: ${formatTime(discussionTimerRemaining)}`;

	discussionTimerInterval = setInterval(() => {
		discussionTimerRemaining--;

		if (discussionTimerRemaining <= 0) {
			clearInterval(discussionTimerInterval);

			// Εμφάνιση μηνύματος και καθυστέρηση 5 δευτ. πριν το έξτρα λεπτό
			countdownDiv.innerHTML = "Ο χρόνος συζήτησης τελείωσε! Έχετε 1 λεπτό για να ψηφίσετε.";

			setTimeout(() => {
				let votingTimeLeft = 60;

				discussionTimerInterval = setInterval(() => {
					votingTimeLeft--;

					if (votingTimeLeft <= 0) {
						clearInterval(discussionTimerInterval);
						countdownDiv.innerHTML = "Η ψηφοφορία ολοκληρώνεται!";
						disableAllAddButtons();
						startCountdown();
					} else {
						countdownDiv.innerHTML = `Ψηφοφορία: Απομένει ${votingTimeLeft} δευτ.`;
					}
				}, 1000);
			}, 5000); // 5 δευτερόλεπτα παύση
		} else {
			countdownDiv.innerHTML = `Χρόνος συζήτησης: ${formatTime(discussionTimerRemaining)}`;
		}
	}, 1000);
}


function renderVotingInterface() {
	const votingDiv = document.getElementById("votingArea");
	// votingDiv.innerHTML = "<p>Πατήστε [+ Ψήφος] ή [− Ψήφος] για κάθε παίκτη.</p>";

	totalVotes = 0;

	players.forEach((p, index) => {
		const container = document.createElement("div");
		container.className = "vote-row";

		// Ετικέτα με όνομα και ψήφους
		const label = document.createElement("div");
		label.className = "vote-label";
		label.innerHTML = `<strong>${p.name}</strong> – Ψήφοι: <span id="votes-${index}">${p.votes}</span>`;
		container.appendChild(label);

		// Αν είναι ζωντανός ο παίκτης, προσθέτουμε κουμπιά
		if (p.isAlive) {
			const addBtn = document.createElement("button");
			addBtn.textContent = "+ Ψήφος";
			addBtn.onclick = () => {
				const alive = players.filter(p => p.isAlive).length;
				if (totalVotes >= alive) return;

				p.votes++;
				totalVotes++;
				updateVotesDisplay(index, p.votes);

				if (totalVotes === alive) {
					disableAllAddButtons();
				}

				checkIfVotingComplete();
			};

			const removeBtn = document.createElement("button");
			removeBtn.textContent = "− Ψήφος";
			removeBtn.onclick = () => {
				if (p.votes > 0) {
					p.votes--;
					totalVotes--;
					updateVotesDisplay(index, p.votes);
					cancelCountdown();
				}
			};

			const buttonRow = document.createElement("div");
			buttonRow.className = "vote-buttons";
			buttonRow.appendChild(addBtn);
			buttonRow.appendChild(removeBtn);

			container.appendChild(buttonRow);
		}

		votingDiv.appendChild(container);
	});

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
	clearInterval(countdownTimeout);
	clearInterval(discussionTimerInterval); // <-- Σταματάμε το μεγάλο χρονόμετρο

	const countdownDiv = document.getElementById("voteCountdown");
	let seconds = 3;
	countdownDiv.innerHTML = `Ολοκλήρωση σε ${seconds} `;

	const cancelButton = document.createElement("button");
	cancelButton.textContent = "Ακύρωση";
	cancelButton.className = "cancel-vote-button";
	cancelButton.onclick = cancelCountdown;  // ✅ Σωστό όνομα μεταβλητής
	countdownDiv.appendChild(cancelButton);

	countdownTimeout = setInterval(() => {
		seconds--;
		if (seconds === 0) {
			clearInterval(countdownTimeout);
			countdownDiv.innerHTML = "";
			finishVoting();
		} else {
			countdownDiv.innerHTML = `Ολοκλήρωση σε ${seconds} `;
			countdownDiv.appendChild(cancelButton);
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

	const audioLines = [
		"night2_1.mp3",
		"night2_2.mp3"
	];

	let index = 0;

	function nextLine() {
		if (index >= scriptLines.length) {
			setTimeout(() => {
				showKillChoiceMenu();
			}, 1000);
			return;
		}

		nightTextDiv.innerHTML += scriptLines[index] + "<br>";

		const audio = new Audio(`audio/${selectedTrack}/${audioLines[index]}`);
		audio.load();
		audio.oncanplaythrough = () => {
			audio.play();
		};

		setTimeout(() => {
			index++;
			nextLine();
		}, 7000);
	}

	nextLine();
}


function showKillChoiceMenu() {
	document.getElementById("nightPhase").style.display = "none";
	document.getElementById("nightKillChoice").style.display = "block";

	const container = document.getElementById("killSelectionArea");
	container.innerHTML = "";
	container.style.display = "grid";                 // ➕ Grid layout
	container.style.gridTemplateColumns = "1fr 1fr";  // ➕ Δύο στήλες ίσου πλάτους
	container.style.gap = "10px";                     // ➕ Απόσταση ανάμεσα στα κουμπιά
	container.style.justifyItems = "center";          // ➕ Κεντράρισμα περιεχομένου

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
				countdownDiv.innerHTML = `Ολοκλήρωση σε ${seconds} `;

				const cancelBtn = document.createElement("button");
				cancelBtn.textContent = "Ακύρωση";
				cancelBtn.className = "cancel-vote-button";
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
						countdownDiv.innerHTML = `Ολοκλήρωση σε ${seconds} `;
						countdownDiv.appendChild(cancelBtn);
					}
				}, 1000);
			};
		}

		container.appendChild(btn);
	});

	const countdownDiv = document.createElement("div");
	countdownDiv.id = "voteCountdown";
	countdownDiv.style.gridColumn = "1 / -1"; // ➕ Το countdown πιάνει όλο το πλάτος
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
	releaseWakeLock(); // 👉 Η οθόνη επιτρέπεται να σβήσει τώρα

	const nightDiv = document.getElementById("nightPhase");
	const dayDiv = document.getElementById("dayPhase");
	const resultDiv = document.getElementById("result");

	nightDiv.style.display = "none";
	dayDiv.style.display = "none";
	resultDiv.style.display = "block";

	let playerListHTML = "<h3>Ρόλοι όλων των παικτών:</h3><ul>";
	players.forEach(p => {
		const status = p.isAlive ? "(ζωντανός)" : "(νεκρός)";
		playerListHTML += `<li><strong>${p.name}</strong>: ${translateRole(p.role)} ${status}</li>`;
	});
	playerListHTML += "</ul>";

	resultDiv.innerHTML = `
		<h2>${message}</h2>
		${playerListHTML}
	`;

	setTimeout(() => {
		resultDiv.innerHTML += `
			<br><br>
			<button onclick="restartSameNames()">Νέο παιχνίδι με ίδια ονόματα</button>
			<button onclick="restartNewNames()">Νέο παιχνίδι με νέα ονόματα</button>
		`;
	}, 3000);
}


function restartSameNames() {
	requestWakeLock(); // Ξανά ενεργοποίηση Wake Lock σε νέα παρτίδα

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
		<input type="text" id="playerName" value="${player.name}" maxlength="15"><br><br>
		<button onclick="revealRestartedRole()">Δες τον νέο ρόλο σου</button>
		<div id="roleReveal" style="margin-top:15px; font-weight:bold;"></div>
	`;
}

function revealRestartedRole() {
	const nameInput = document.getElementById("playerName");
	const name = nameInput.value.trim();
	const button = document.querySelector("#nameInput button");

	if (!name) {
		if (button) {
			button.disabled = true;
			button.textContent = "Εισάγετε όνομα πρώτα!";
			setTimeout(() => {
				button.disabled = false;
				button.textContent = "Δες τον νέο ρόλο σου";
			}, 2000);
		}
		return;
	}

	const lowerName = name.toLowerCase();
	const nameExists = players.some((p, i) =>
		i !== currentPlayerIndex && p.name.toLowerCase() === lowerName
	);

	if (nameExists) {
		if (button) {
			button.disabled = true;
			button.textContent = "Όνομα ήδη χρησιμοποιείται!";
			setTimeout(() => {
				button.disabled = false;
				button.textContent = "Δες τον νέο ρόλο σου";
			}, 2000);
		}
		return;
	}

	const player = players[currentPlayerIndex];
	player.name = name;

	const role = player.role;

	const roleDiv = document.getElementById("roleReveal");
	const isLast = currentPlayerIndex === numPlayers - 1;
	const nextButtonLabel = isLast ? "Start Game" : "Επόμενος παίκτης";

	roleDiv.innerHTML = `
		<div class="fade-in-role role-card">
			<div class="role-icon">${getRoleIcon(role)}</div>
			<div class="role-text">Ο ρόλος σου είναι: <br><strong>${translateRole(role)}</strong></div>
			<br><button onclick="nextRestartedPlayer()">${nextButtonLabel}</button>
		</div>`;

	nameInput.disabled = true;
	if (button) button.disabled = true;
}

function restartNewNames() {
	location.reload();
}

function nextRestartedPlayer() {
	const roleDiv = document.getElementById("roleReveal");
	roleDiv.classList.add("fade-out");

	setTimeout(() => {
		currentPlayerIndex++;

		if (currentPlayerIndex >= numPlayers) {
			document.getElementById("nameInput").style.display = "none";
			showResults();
		} else {
			const player = players[currentPlayerIndex];

			document.getElementById("playerHeader").textContent = `Player ${currentPlayerIndex + 1} - Επιβεβαίωσε ή άλλαξε το όνομά σου:`;

			const nameInput = document.getElementById("playerName");
			nameInput.value = player.name;
			nameInput.disabled = false;

			const button = document.querySelector("#nameInput button");
			button.disabled = false;
			button.textContent = "Δες τον νέο ρόλο σου";

			roleDiv.classList.remove("fade-out");
			roleDiv.innerHTML = "";
		}
	}, 400);
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
		const translated = translateRole(role);
		const label = count > 1 ? `${translated} ×${count}` : translated;
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

function openNewGame() {
	document.getElementById("mainMenu").style.display = "none";
	document.getElementById("setup").style.display = "block";
	document.getElementById("pageTitle").textContent = "ΠΑΛΕΡΜΟ";
}

function openSettings() {
	document.getElementById("mainMenu").style.display = "none";
	document.getElementById("settingsMenu").style.display = "block";
}

function openCredits() {
	document.getElementById("mainMenu").style.display = "none";
	document.getElementById("creditsPage").style.display = "block";
}

function backToMainMenu() {
	releaseWakeLock(); // 👉 Απενεργοποιούμε την προστασία οθόνης

	document.getElementById("settingsMenu").style.display = "none";
	document.getElementById("creditsPage").style.display = "none";
	document.getElementById("mainMenu").style.display = "block";
	document.getElementById("pageTitle").textContent = "Palermo Game";
}

function formatTime(seconds) {
	const min = Math.floor(seconds / 60);
	const sec = seconds % 60;
	return `${min}:${sec.toString().padStart(2, '0')}`;
}

// === Εφαρμογή Εφέ και Background ανά Φάση ===

// 1. Δυναμική αλλαγή φόντου ανά φάση
function setBackground(phase) {
    const body = document.body;
    switch (phase) {
        case "night":
            // Μένει ως έχει
            break;
        case "day":
            // Δεν αλλάζουμε τίποτα — κρατάμε το ίδιο background
            break;
        default:
            // Αν θέλεις, βάλε ενα fallback χρώμα
            body.style.backgroundImage = "none";
            body.style.backgroundColor = "#111";
            break;
    }
}


// 4. Προσθήκη εικονιδίου στον ρόλο (μέσα στο showRole και revealRestartedRole)
// Παράδειγμα μόνο:
function getRoleIcon(role) {
    const map = {
        "Citizen": "🧍‍♂️",
        "Hidden Killer": "🗡️",
        "Known Killer": "🔪",
        "Police officer": "👮",
        "Snitch": "👀",
        "Bulletproof": "🛡️"
    };
    return map[role] || "❓";
}

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(() => console.log('✅ Service Worker Registered'))
    .catch(err => console.error('❌ Service Worker registration failed:', err));
}

function translateRole(role) {
	const translations = {
		"Citizen": "Πολίτης",
		"Hidden Killer": "Κρυφός Δολοφόνος",
		"Known Killer": "Φανερός Δολοφόνος",
		"Police officer": "Αστυνομικός",
		"Snitch": "Ρουφιάνος",
		"Bulletproof": "Αλεξίσφαιρος"
	};
	return translations[role] || role;
}
