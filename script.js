// This program is a version of the game "Palermo".

let totalVotes = 0;
let countdownTimeout = null;
let eliminatedPlayer = null;
let discussionDuration = 0;
let discussionTimerInterval = null;
let discussionTimerRemaining = 0;
let selectedTrack = "track1";
let wakeLock = null;
let defaultVibrationType = "short";
let narrationPaused = false;
let narrationTimeout = null;
let narrationAudio = null;


const musicTracks = [
    "music/Curse_of_the_worgen.mp3",
    "music/Wake_up_Ciri.mp3",
    "music/Revendreth_Sired.mp3",
    "music/Pride_and_Penance.mp3",
    "music/Bramble.mp3"
];

let currentTrackIndex = 0;
let bgMusic = null;

function playNextMusicTrack() {
	if (bgMusic) {
		bgMusic.pause();
		bgMusic = null;
	}

	const track = musicTracks[currentTrackIndex];
	bgMusic = new Audio(track);
	bgMusic.volume = 0.05;
	bgMusic.muted = false;
	bgMusic.loop = false;

	bgMusic.addEventListener("ended", () => {
		currentTrackIndex = (currentTrackIndex + 1) % musicTracks.length;
		playNextMusicTrack();
	});

	bgMusic.play().catch((err) => {
		console.warn("🔇 Δεν επιτράπηκε autoplay:", err);
	});
}



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

function vibrate(duration = 100) {
	if (navigator.vibrate) {
		navigator.vibrate(duration);
	}
}

const vibrationPresets = {
	short: [70],
	doublePulse: [60, 40, 60],
	victory: [100, 50, 150],
	error: [150, 30, 80]
};

function vibratePattern(type = defaultVibrationType) {
	if (navigator.vibrate && vibrationPresets[type]) {
		navigator.vibrate(vibrationPresets[type]);
	}
}

function updateFooterVisibility() {
    const mainMenu = document.getElementById("mainMenu");
    const footer = document.getElementById("github-footer");
    if (mainMenu && footer) {
        footer.style.display = (mainMenu.style.display !== "none") ? "block" : "none";
    }
}

function playSFX(filename) {
	const audio = new Audio(`sfx/${filename}`);
	audio.play().catch(() => {});
}

document.addEventListener("DOMContentLoaded", () => {
	updateFooterVisibility();
	playNextMusicTrack(); // 🎵 Ξεκινά η μουσική μόλις φορτώσει η σελίδα
});

function openInGameMenu() {
	const modal = document.getElementById("inGameMenu");
	if (modal) {
		modal.classList.add("show");
		modal.style.removeProperty("display");	// καθάρισε inline display αν έχει μείνει
		document.body.classList.add("menu-open");
		if (narrationAudio && !narrationAudio.paused) {
			narrationAudio.pause();
			narrationPaused = true;
		}
		if (narrationTimeout) {
			clearTimeout(narrationTimeout);
			narrationTimeout = null;
		}
	}
}

function closeInGameMenu() {
	const modal = document.getElementById("inGameMenu");
	if (modal) {
		modal.classList.remove("show");
		document.body.classList.remove("menu-open");
		if (narrationPaused && narrationAudio) {
			narrationAudio.play().catch(()=>{});
			narrationPaused = false;
		}
	}
}




function initVoteHeaderEvents() {
	const menuBtn = document.getElementById("btnMenu");
	const mayorBtn = document.getElementById("btnMayor");
	const kamikazeBtn = document.getElementById("btnKamikaze");
	const closeBtn = document.getElementById("closeMenuBtn");
	const backdrop = document.querySelector("#inGameMenu .modal-backdrop");

	if (menuBtn) menuBtn.onclick = openInGameMenu;
	if (closeBtn) closeBtn.onclick = closeInGameMenu;
	if (backdrop) backdrop.onclick = closeInGameMenu;

	// placeholders
	if (mayorBtn) mayorBtn.onclick = () => { /* TODO */ };
	if (kamikazeBtn) kamikazeBtn.onclick = () => { /* TODO */ };

	// ➕ νέα κουμπιά με ενέργειες τέλους παιχνιδιού
	const samePlayersBtn = document.getElementById("menuSamePlayers");
	const newPlayersBtn = document.getElementById("menuNewPlayers");

	if (samePlayersBtn) {
		samePlayersBtn.onclick = () => {
			resetGameState(true);		// stop παλιά παρτίδα, κράτα ονόματα
			restartSamePlayers();		// ίδιοι παίκτες, νέα μοιρασιά ρόλων
		};
	}

	if (newPlayersBtn) {
		newPlayersBtn.onclick = () => {
			resetGameState(false);		// stop παλιά παρτίδα, χωρίς ονόματα
			restartNewNames();			// full reset (παραμένει ίδια συνάρτηση)
		};
	}

	// 👉 menu buttons και στη φάση αφήγησης/δολοφονίας
	const menuNight = document.getElementById("btnMenuNight");
	const menuKill = document.getElementById("btnMenuKill");
	if (menuNight) menuNight.onclick = openInGameMenu;
	if (menuKill) menuKill.onclick = openInGameMenu;
}

function applyManyPlayersLayout() {
	const count = Array.isArray(players) ? players.length : 0;
	if (count > 10) {
		document.body.classList.add("many-players");
	} else {
		document.body.classList.remove("many-players");
	}
}



// ===== Hard reset helpers =====
function stopAllTimersAndAudio() {
	// timers
	if (countdownTimeout) {
		clearInterval(countdownTimeout);
		countdownTimeout = null;
	}
	if (discussionTimerInterval) {
		clearInterval(discussionTimerInterval);
		discussionTimerInterval = null;
	}
	if (narrationTimeout) {
		clearTimeout(narrationTimeout);
		narrationTimeout = null;
	}

	// audio
	try {
		if (narrationAudio) {
			narrationAudio.pause();
			narrationAudio.currentTime = 0;
			narrationAudio = null;
		}
	} catch {}
	try {
		if (bgMusic) {
			bgMusic.pause();
			bgMusic = null;
		}
	} catch {}
}

function hideAllPhases() {
	const ids = ["result","nightPhase","dayPhase","nightKillChoice","roleSelection","nameInput"];
	ids.forEach(id => {
		const el = document.getElementById(id);
		if (el) el.style.display = "none";
	});
	const vc = document.getElementById("voteCountdown");
	if (vc) vc.innerHTML = "";
	const killArea = document.getElementById("killSelectionArea");
	if (killArea) killArea.innerHTML = "";
}

function resetGameState(keepNames = false) {
	// κλείσε το menu (αν είναι ανοιχτό)
	closeInGameMenu();

	// σταμάτα τα πάντα
	stopAllTimersAndAudio();
	releaseWakeLock();	// θα ζητηθεί ξανά όταν ξεκινήσει η νέα παρτίδα

	// καθάρισε UI
	hideAllPhases();

	// reset βασικών state
	totalVotes = 0;
	eliminatedPlayer = null;
	currentPlayerIndex = 0;

	// αν ΔΕΝ κρατάμε τα ονόματα, καθάρισε και τους παίκτες/μέτρηση
	if (!keepNames) {
		players = [];
		numPlayers = 0;
	}

	// μικρό safety: άδειασε τυχόν disabled +Ψήφος κουμπιά
	const buttons = document.querySelectorAll("button");
	buttons.forEach(btn => {
		if (btn.textContent === "+ Ψήφος") btn.disabled = false;
	});
}

function playNarrationClip(relPath, onEnd) {
	const url = `audio/${selectedTrack}/${relPath}`;
	narrationAudio = new Audio(url);
	narrationAudio.onended = () => {
		narrationTimeout = setTimeout(() => {
			narrationTimeout = null;
			if (onEnd) onEnd();
		}, 800);
	};
	const tryPlay = () => {
		if (!narrationPaused) {
			narrationAudio.load();
			narrationAudio.play().catch(() => onEnd && onEnd());
		} else {
			setTimeout(tryPlay, 300);
		}
	};
	tryPlay();
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
		this.lives = 1; // default
	}
}

const roleNames = [
	"Citizen",
	"Hidden Killer",
	"Known Killer",
	"Police officer",
	"Snitch",
	"Bulletproof",
	"Lovers",
	"Kamikaze",
	"Madman",
	"MotherTeresa",
	"Mayor"
];
const requiredRoles = ["Citizen", "Citizen", "Hidden Killer", "Known Killer"];

let numPlayers = 0;
let chosenRoles = [];
let players = [];

let currentPlayerIndex = 0;

// Save selected setting when starting game
function startRoleSelection() {
	requestWakeLock();

	const trackSelect = document.getElementById("trackSelect");
	if (trackSelect) {
		selectedTrack = trackSelect.value;
	}

	const select = document.getElementById("discussionTime");
	if (select) {
		discussionDuration = parseInt(select.value);
	}

	numPlayers = parseInt(document.getElementById("numPlayers").value);
	if (numPlayers < 5) {
		alert("You need at least 5 players!");
		return;
	}
	if (numPlayers > 15) {
		alert("Μέγιστος αριθμός παικτών: 15.");
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
		<h3 id="extraRolesHeader">Επίλεξε ${numPlayers - 4} επιπλέον ρόλους:</h3>
	`;

	// Input για πολλαπλούς Citizen
	roleDiv.innerHTML += `
		<label>
			Πολίτης
			<input type="number" id="extraCitizenCount" value="0" min="0" max="${numPlayers - 4}" onchange="updateCitizenSelection()">
		</label><br>
	`;

	// Checkboxes για άλλους ρόλους
	for (let i = 3; i < roleNames.length; i++) {
		if (roleNames[i] === "Citizen") continue;

		if (roleNames[i] === "Lovers") {
			roleDiv.innerHTML += `
				<label>
					<input type="checkbox" id="addLovers" onchange="toggleLovers(this)">
					${translateRole("Lovers")} (2 άτομα)
				</label><br>`;
			continue;
		}

		roleDiv.innerHTML += `
			<label>
				<input type="checkbox" value="${roleNames[i]}" onchange="updateRoleSelection(this)">
				${translateRole(roleNames[i])}
			</label><br>`;
	}

	roleDiv.innerHTML += `<br><button onclick="startNameInput()">Continue</button>`;
	roleDiv.style.display = "block";

	chosenRoles = [...requiredRoles];
	updateChosenRolesList();

	// Προκαθορισμένη ανακατεύθυνση ρόλων πριν την είσοδο ονομάτων
	chosenRoles = shuffleArray(chosenRoles);
}

function updateRemainingRolesText() {
	const header = document.getElementById("extraRolesHeader");
	if (!header) return;

	const remaining = numPlayers - chosenRoles.length;
	header.textContent = `Επίλεξε ${remaining} επιπλέον ρόλους:`;
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

	updateRemainingRolesText();
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
	// Ξεκινάμε με την εισαγωγική αφήγηση
	resultDiv.innerHTML += `<br><button onclick="startIntroduction()">Ξεκινάμε!</button>`;
	resultDiv.style.display = "block";

	// 💘 Σύνδεση ερωτευμένων
	const lovers = players.filter(p => p.role === "Lovers");
	if (lovers.length === 2) {
		lovers[0].linkedPartner = lovers[1];
		lovers[1].linkedPartner = lovers[0];
	}
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



function startIntroduction() {
	setBackground("night");
	document.getElementById("result").style.display = "none";
	document.getElementById("nightPhase").style.display = "block";

	const nightTextDiv = document.getElementById("nightText");
	nightTextDiv.innerHTML = "";
	nightTextDiv.style.opacity = 0;

	const scriptLines = [];
	const audioLines = [];

	// ➤ Εισαγωγή
	scriptLines.push("Μια νύχτα στο Παλέρμο.");
	audioLines.push("intro/intro_palermo1.wav");

	// ➤ Καλή ομάδα
	scriptLines.push("Η ομάδα των καλών αποτελείται από:");
	audioLines.push("intro/intro_good_team_1.wav");

	const goodRoles = [];
	if (chosenRoles.includes("Citizen")) goodRoles.push(["τους Πολίτες,", "intro/intro_citizens_1.wav"]);
	if (chosenRoles.includes("Police officer")) goodRoles.push(["τον Αστυνομικό,", "intro/intro_police.wav"]);
	if (chosenRoles.includes("Kamikaze")) goodRoles.push(["τον Καμικάζι,", "intro/intro_kamikaze.wav"]);
	if (chosenRoles.filter(r => r === "Lovers").length === 2) goodRoles.push(["τους Ερωτευμένους,", "intro/intro_lovers.wav"]);
	if (chosenRoles.includes("Mayor")) goodRoles.push(["τον Δήμαρχο,", "intro/intro_mayor.wav"]);
	if (chosenRoles.includes("Bulletproof")) goodRoles.push(["τον Αλεξίσφαιρο,", "intro/intro_bulletproof.wav"]);
	if (chosenRoles.includes("MotherTeresa")) goodRoles.push(["τη Μητέρα Τερέζα.", "intro/intro_motherteresa.wav"]);

	if (goodRoles.length > 0) {
		for (let i = 0; i < goodRoles.length; i++) {
			// βάλε "και" πριν από τον τελευταίο ρόλο (αν υπάρχουν πάνω από 1)
			if (i === goodRoles.length - 1 && goodRoles.length > 1) {
				scriptLines.push("και");
				audioLines.push("intro/word_and.wav");
			}
			scriptLines.push(goodRoles[i][0]);
			audioLines.push(goodRoles[i][1]);
		}
	}

	// ➤ Κακή ομάδα
	scriptLines.push("Η ομάδα των κακών αποτελείται από:");
	audioLines.push("intro/intro_bad_team.wav");

	const badRoles = [];
	if (chosenRoles.includes("Hidden Killer") || chosenRoles.includes("Known Killer")) {
		badRoles.push(["τους δύο Δολοφόνους,", "intro/intro_two_killers.wav"]);
	}
	if (chosenRoles.includes("Snitch")) {
		badRoles.push(["τον Ρουφιάνο.", "intro/intro_snitch.wav"]);
	}

	if (badRoles.length > 0) {
		for (let i = 0; i < badRoles.length; i++) {
			if (i === badRoles.length - 1 && badRoles.length > 1) {
				scriptLines.push("και");
				audioLines.push("intro/word_and.wav");
			}
			scriptLines.push(badRoles[i][0]);
			audioLines.push(badRoles[i][1]);
		}
	}

	// ➤ Extra ρόλοι (Madman)
	if (chosenRoles.includes("Madman")) {
		scriptLines.push("Επίσης, παίζει και η Τρέλα.");
		audioLines.push("intro/intro_madman.wav");
	}

	// ➤ Κλείσιμο
	scriptLines.push("Καλή επιτυχία σε όλους!");
	audioLines.push("intro/intro_goodluck.wav");

	// --- Προβολή / Αναπαραγωγή ---
	let index = 0;
	function nextLine() {
		if (index >= audioLines.length) {
			// όταν τελειώσει η εισαγωγή → ξεκινάει νύχτα
			setTimeout(() => startNight(), 1000);
			return;
		}

		if (index < scriptLines.length) {
			nightTextDiv.innerHTML += `<div class="fade-line">${scriptLines[index]}</div>`;
			nightTextDiv.style.opacity = 1;
		}

		const url = `audio/${selectedTrack}/${audioLines[index]}`;
		narrationAudio = new Audio(url);
		narrationAudio.onended = () => {
			narrationTimeout = setTimeout(() => {
				narrationTimeout = null;
				index++;
				nextLine();
			}, 800);
		};

		// ✅ χειρισμός pause/resume όπως στη νύχτα
		const playIfNotPaused = () => {
			if (!narrationPaused) {
				narrationAudio.load();
				narrationAudio.play().catch(() => { index++; nextLine(); });
			} else {
				setTimeout(playIfNotPaused, 300);
			}
		};
		playIfNotPaused();
	}

	initVoteHeaderEvents();
	nextLine();
}


function startNight() {
	if (bgMusic) {
		const step = 50;
		const fadeOutInterval = setInterval(() => {
			if (bgMusic.volume > 0.05) {
				bgMusic.volume -= 0.05;
			} else {
				clearInterval(fadeOutInterval);
				bgMusic.pause();
			}
		}, step);
	}

	setBackground("night");
	document.getElementById("result").style.display = "none";
	document.getElementById("nightPhase").style.display = "block";

	const nightTextDiv = document.getElementById("nightText");
	nightTextDiv.innerHTML = "";
	nightTextDiv.style.opacity = 0;

	// ✅ Flags
	const hasSnitch = players.some(p => p.role === "Snitch" && p.isAlive);
	const loversAlive = players.filter(p => p.role === "Lovers" && p.isAlive).length === 2;

	// ✅ Κείμενα στην οθόνη
	const scriptLines = [
		"Μια νύχτα πέφτει στο Παλέρμο κι όλοι κλείνουν τα μάτια τους...",
		"Οι 2 δολοφόνοι ανοίγουν τα μάτια τους και γνωρίζουν ο ένας τον άλλον",
		"Αφού γνωριστούν, κλείνουν τα μάτια τους",
		"Ο φανερός δολοφόνος σηκώνει το χέρι του κι ο αστυνομικός ανοίγει τα μάτια του",
		"Τώρα που ο αστυνομικός έχει δει τον φανερό δολοφόνο, κλείνει τα μάτια του"
	];

	// ✅ Νέα αρχεία ήχου (.wav)
	let audioLines = [
		"night/night_start.wav",
		"night/night_killers_open.wav",
		"night/night_police_phase.wav",
		"night/night_police_sees.wav",
		"night/night_police_close.wav"
	];

	// --- Snitch section ---
	if (hasSnitch) {
		scriptLines.push(
			"Στη συνέχεια σηκώνει το χέρι του και ο κρυφός δολοφόνος",
			"Ο ρουφιάνος ανοίγει τα μάτια του και βλέπει τους 2 δολοφόνους",
			"Αφού πλέον γνωρίζει ποιους πρέπει να καλύψει, κλείνει τα μάτια του",
			"Οι 2 δολοφόνοι κατεβάζουν τα χέρια τους"
		);
		audioLines.push(
			"night/night_snitch_phase.wav",
			// Αν έχεις ξεχωριστό knows clip, βάλ’ το εδώ:
			// "night/night_snitch_knows.wav",
			"night/night_snitch_end.wav",
			"night/night_snitch_end.wav"
		);
	}
	// ❗ Αν δεν υπάρχει Snitch → δεν προσθέτουμε τίποτα εδώ

	// --- Lovers section ---
	if (loversAlive) {
		scriptLines.push(
			"Τέλος ανοίγουν τα μάτια τους και οι ερωτευμένοι για να γνωριστούν.",
			"Αφού ερωτεύτηκαν κεραυνοβόλα μπορούν να κλείσουν τα μάτια τους."
		);
		audioLines.push("night/lovers_open.wav", "night/lovers_close.wav");
	}

	// --- Day start ---
	scriptLines.push("Μια μέρα ξημερώνει στο Παλέρμο και όλοι ανοίγουν τα μάτια τους...");
	audioLines.push("day/day_start.wav");

	// --- Επιπλέον μόνο ήχος (χωρίς κείμενο) για την ψηφοφορία ---
	audioLines.push("day/vote_start.wav");

	// --- Προβολή / Αναπαραγωγή ---
	let index = 0;
	function nextLine() {
		if (index >= audioLines.length) {   // ✅ σταματάμε με βάση τα audio
			setTimeout(() => startDay(), 1000);
			return;
		}

		// εμφανίζουμε κείμενο μόνο αν υπάρχει
		if (index < scriptLines.length) {
			nightTextDiv.innerHTML += `<div class="fade-line">${scriptLines[index]}</div>`;
			nightTextDiv.style.opacity = 1;
		}

		const url = `audio/${selectedTrack}/${audioLines[index]}`;
		narrationAudio = new Audio(url);
		narrationAudio.onended = () => {
			narrationTimeout = setTimeout(() => {
				narrationTimeout = null;
				index++;
				nextLine();
			}, 800);
		};
		narrationAudio.load();
		narrationAudio.play().catch(() => { index++; nextLine(); });
	}

	initVoteHeaderEvents();
	nextLine();
}


// 3. Επέκταση startDay για αλλαγή background
function startDay() {
	setBackground("day");
	document.getElementById("nightPhase").style.display = "none";
	document.getElementById("dayPhase").style.display = "block";
	players.forEach(p => p.votes = 0);

	applyManyPlayersLayout();	// 🔹 ενεργοποιεί το condensed mode αν >10

	renderVotingInterface();
	initVoteHeaderEvents();
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
	votingDiv.innerHTML = ""; // Καθαρίζει προηγούμενα μηνύματα

	applyManyPlayersLayout();	// 🔹 ξαναελέγχει αν αλλάξει κάτι on-the-fly

	totalVotes = 0;

	players.forEach((p, index) => {
		const container = document.createElement("div");
		container.className = "vote-line"; // Χρησιμοποιεί grid 4 στηλών

		let html = "";

		if (!p.isAlive) {
			html += `
				<span class="dead-player"><strong>${p.name}</strong> 🪦</span>
				<span></span>
				<span></span>
				<span></span>
			`;
		} else {
			html += `
				<span><strong>${p.name}</strong></span>
				<span id="votes-${index}">${p.votes}</span>
				<button class="vote-add" onclick="handleAddVote(${index})">+ Ψήφος</button>
				<button class="vote-remove" onclick="handleRemoveVote(${index})">−</button>
			`;
		}

		container.innerHTML = html;
		votingDiv.appendChild(container);
	});

	const countdown = document.createElement("div");
	countdown.id = "voteCountdown";
	countdown.style.marginTop = "20px";
	votingDiv.appendChild(countdown);
}


function handleAddVote(index) {
	const p = players[index];
	const alive = players.filter(p => p.isAlive).length;
	if (totalVotes >= alive) return;

	p.votes++;
	totalVotes++;
	playSFX("vote.mp3");
	updateVotesDisplay(index, p.votes);

	if (totalVotes === alive) {
		disableAllAddButtons();
	}
	checkIfVotingComplete();
}

function handleRemoveVote(index) {
	const p = players[index];
	if (p.votes > 0) {
		p.votes--;
		totalVotes--;
		playSFX("unvote.mp3");
		updateVotesDisplay(index, p.votes);
		cancelCountdown();
	}
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
			if (
				eliminated.role === "Lovers" &&
				eliminated.linkedPartner &&
				eliminated.linkedPartner.isAlive === false
			) {
				votingDiv.innerHTML = `<p>Ο παίκτης <strong>${eliminated.name}</strong> ήταν ερωτευμένος με τον/την <strong>${eliminated.linkedPartner.name}</strong>, επομένως αποχωρεί και το ταίρι του.</p>`;
			} else {
				votingDiv.innerHTML = `<p>Ο παίκτης <strong>${eliminated.name}</strong> αποχωρεί από το παιχνίδι!</p>`;
			}
		} else {
			votingDiv.innerHTML = `<p>Ο παίκτης <strong>${eliminated.name}</strong> ήταν Αλεξίσφαιρος και επέζησε από την απόπειρα ψηφοφορίας! Του απομένει άλλη μία ζωή.</p>`;
		}
	} else {
		const randomIndex = Math.floor(Math.random() * candidates.length);
		eliminated = candidates[randomIndex];
		didDie = eliminatePlayer(eliminated);
		eliminatedPlayer = didDie ? eliminated : null;

		if (didDie) {
			if (
				eliminated.role === "Lovers" &&
				eliminated.linkedPartner &&
				eliminated.linkedPartner.isAlive === false
			) {
				votingDiv.innerHTML = `<p>Υπήρξε ισοψηφία! Ο παίκτης <strong>${eliminated.name}</strong> επιλέχθηκε τυχαία, ήταν ερωτευμένος με τον/την <strong>${eliminated.linkedPartner.name}</strong>, επομένως αποχωρεί και το ταίρι του.</p>`;
			} else {
				votingDiv.innerHTML = `<p>Υπήρξε ισοψηφία! Ο παίκτης <strong>${eliminated.name}</strong> επιλέχθηκε τυχαία και αποχωρεί από το παιχνίδι.</p>`;
			}
		} else {
			votingDiv.innerHTML = `<p>Υπήρξε ισοψηφία! Ο παίκτης <strong>${eliminated.name}</strong> επιλέχθηκε τυχαία, αλλά ήταν Αλεξίσφαιρος και επέζησε από την απόπειρα ψηφοφορίας! Του απομένει άλλη μία ζωή.</p>`;
		}
	}

	setTimeout(() => {
		if (checkForGameEnd()) return;
		startSecondNight();
	}, 4500);
}



function startSecondNight() {
	// καθάρισε ό,τι έπαιζε πριν
	stopAllTimersAndAudio?.();
	narrationPaused = false;

	// UI setup
	const killOverlay = document.getElementById("nightKillChoice");
	if (killOverlay) killOverlay.style.display = "none"; // κρύψε «Δολοφονία»
	document.getElementById("dayPhase").style.display = "none";
	setBackground("night");
	document.getElementById("nightPhase").style.display = "block";

	const nightTextDiv = document.getElementById("nightText");
	nightTextDiv.innerHTML = "";
	nightTextDiv.style.opacity = 0;

	// Γραμμές μέχρι και «…ο παίκτης ανακοινώνει ποιον σκότωσαν οι δολοφόνοι.»
	const scriptLines = [
		"Η ψηφοφορία ολοκληρώθηκε.",
		"Έτσι λοιπόν ο ένοχος βρίσκεται εκτός παιχνιδιού.",
		"Μια νύχτα πέφτει στο Παλέρμο κι οι παίκτες κλείνουν τα μάτια τους.",
		"Ήρθε η σειρά των δολοφόνων να επιλέξουν το πρώτο τους θύμα.",
		"Ο παίκτης που κρίθηκε ένοχος κι οι δύο δολοφόνοι ανοίγουν τα μάτια τους.",
		"Οι δολοφόνοι συνεννοούνται και δείχνουν στον παίκτη εκτός παιχνιδιού ποιο είναι το θύμα τους.",
		"Στη συνέχεια οι δολοφόνοι κλείνουν τα μάτια τους και ο παίκτης ανακοινώνει ποιον σκότωσαν οι δολοφόνοι."
	];

	// Τα 2 audio parts της 2ης νύχτας (στον φάκελο second-night/)
	const audioParts = [
		"second-night/night2_vote_end.wav",
		"second-night/night2_core.wav"
	];

	// ---- Εμφάνιση κειμένων σταδιακά ----
	let textIndex = 0;
	let textTimer = null;
	let showTextActive = true;

	function showNextLine() {
		if (!showTextActive) return;
		if (textIndex >= scriptLines.length) return;

		nightTextDiv.innerHTML += `<div class="fade-line">${scriptLines[textIndex]}</div>`;
		nightTextDiv.style.opacity = 1;

		textIndex++;
		textTimer = setTimeout(showNextLine, 3500); // ρυθμός εμφάνισης
	}

	// ---- Αναπαραγωγή των 2 clips στη σειρά (με pause/resume) ----
	let partIndex = 0;

	function playNextPart() {
		if (partIndex >= audioParts.length) {
			// Τέλος 2ου clip → σταμάτα τα κείμενα & άνοιξε τη «Δολοφονία»
			showTextActive = false;
			if (textTimer) { clearTimeout(textTimer); textTimer = null; }
			showKillChoiceMenu(); // αυτή κρύβει το nightPhase και δείχνει μόνο την «Δολοφονία»
			return;
		}

		// παίζει ένα clip και στο τέλος του πάμε στο επόμενο
		playNarrationClip(audioParts[partIndex], () => {
			partIndex++;
			playNextPart();
		});
	}

	initVoteHeaderEvents();
	showNextLine();
	playNextPart();
}




function showKillChoiceMenu() {
	const container = document.getElementById("killSelectionArea");
	container.innerHTML = "";

	// ✅ Κρύψε την οθόνη αφήγησης για να μην συνυπάρχει με τη «Δολοφονία»
	const nightPhase = document.getElementById("nightPhase");
	if (nightPhase) nightPhase.style.display = "none";

	players.forEach((p) => {
		if (!p.isAlive) return;

		const btn = document.createElement("button");
		btn.className = "kill-choice-btn";
		btn.innerText = p.name;

		btn.onclick = () => {
			// Κλείσε το overlay «Δολοφονία» και γύρνα στην οθόνη νύχτας (μόνο τώρα)
			document.getElementById("nightKillChoice").style.display = "none";
			if (nightPhase) nightPhase.style.display = "block";

			// Εξόντωση θύματος
			const survived = !eliminatePlayer(p, "δολοφονίας");

			// Μήνυμα μετά τη δολοφονία
			const nightTextDiv = document.getElementById("nightText");
			nightTextDiv.innerHTML = "<br><em>Οι δολοφόνοι αποφάσισαν ποιον θέλουν να σκοτώσουν.</em><br>";

			// 👉 Αν είναι Bulletproof και γλίτωσε, καθυστέρησε την αφήγηση
			const delay = (p.role === "Bulletproof" && survived) ? 2500 : 0;

			setTimeout(() => {
				// 🔊 Παίξε ΜΟΝΟ το 3ο κομμάτι της 2ης νύχτας
				playNarrationClip("second-night/night2_after_kill.wav", () => {
					// Όταν τελειώσει το audio → μετάβαση στη μέρα
					nightTextDiv.innerHTML +=
						"Μια νέα μέρα ξημερώνει στο Παλέρμο και όλοι ανοίγουν τα μάτια τους...";
					setTimeout(() => {
						if (checkForGameEnd()) return;
						startDay();
					}, 2000);
				});
			}, delay);
		};

		container.appendChild(btn);
	});

	// ✅ Εμφάνισε το overlay «Δολοφονία» μόνο του (η αφήγηση είναι κρυμμένη)
	document.getElementById("nightKillChoice").style.display = "block";
}



function checkForGameEnd() {
	const alivePlayers = players.filter(p => p.isAlive);
	if (alivePlayers.length === 0) return false; // ασφαλιστική δικλείδα

	// 🤪 Αν η Τρέλα έχει πεθάνει → αυτόματα νικάει
	const madman = players.find(p => p.role === "Madman");
	if (madman && !madman.isAlive) {
		showEndMessage("Η Τρέλα ΚΕΡΔΙΣΕ!", "madman");
		return true;
	}

	const allBad = alivePlayers.every(p => p.role === "Hidden Killer" || p.role === "Known Killer");
	const allGood = alivePlayers.every(p => p.role !== "Hidden Killer" && p.role !== "Known Killer");

	if (allBad) {
		showEndMessage("ΟΙ ΚΑΚΟΙ ΚΕΡΔΙΣΑΝ!", "bad");
		return true;
	}
	if (allGood) {
		showEndMessage("ΟΙ ΚΑΛΟΙ ΚΕΡΔΙΣΑΝ!", "good");
		return true;
	}

	return false;
}


function showEndMessage(message, winnerType = null) {
	releaseWakeLock();
	currentTrackIndex = (currentTrackIndex + 1) % musicTracks.length;

	// 🔊 Παίξε ήχο νίκης ανάλογα με τον τύπο
	let winSound = null;
	if (winnerType === "madman") {
		winSound = "win/madman_win.wav";
	} else if (winnerType === "bad") {
		winSound = "win/bad_win.wav";
	} else {
		winSound = "win/good_win.wav";
	}

	if (winSound) {
		const audio = new Audio(`audio/${selectedTrack}/${winSound}`);
		audio.play().catch(() => {});
	}

	playNextMusicTrack();

	const nightDiv = document.getElementById("nightPhase");
	const dayDiv = document.getElementById("dayPhase");
	const resultDiv = document.getElementById("result");

	nightDiv.style.display = "none";
	dayDiv.style.display = "none";
	resultDiv.style.display = "block";

	let playerListHTML = "<h3>Ρόλοι όλων των παικτών:</h3><ul>";
	players.forEach((p) => {
		let isWinner = false;

		if (winnerType === "madman") {
			isWinner = (p.role === "Madman");
		} else {
			const goodWin = message.toLowerCase()
				.normalize("NFD")
				.replace(/[\u0300-\u036f]/g, "")
				.includes("οι καλοι");

			const killersAlive = players.some(x => x.isAlive && (x.role === "Hidden Killer" || x.role === "Known Killer"));

			isWinner = goodWin
				? (p.role !== "Hidden Killer" && p.role !== "Known Killer" && p.role !== "Snitch" && p.role !== "Madman")
				: ((p.role === "Hidden Killer" || p.role === "Known Killer") ||
				   (p.role === "Snitch" && killersAlive));
		}

		const isDead = !p.isAlive;
		const crown = isWinner ? '<span class="crown-icon">👑</span>' : '';
		const tombstone = isDead ? `<span class="dead-icon${(isWinner ? ' dimmed-icon' : '')}">🪦</span>` : '';

		const playerClass = isWinner ? "winner-player" : "loser-player";
		playerListHTML += `<li class="${playerClass}">${crown}<strong>${p.name}</strong>: ${translateRole(p.role)} ${tombstone}</li>`;
	});
	playerListHTML += "</ul>";

	resultDiv.innerHTML = `
		<h2>${message}</h2>
		${playerListHTML}
	`;

	setTimeout(() => {
		resultDiv.innerHTML += `
			<br><br>
			<button onclick="startNewGameSamePlayers()">Νέο παιχνίδι με ίδιους παίκτες</button>
			<button onclick="startNewGameNewPlayers()">Νέο παιχνίδι με νέους παίκτες</button>
		`;
	}, 3000);
}



function startNewGameSamePlayers() {
	resetGameState(true);   // κρύψε τελική οθόνη, σταμάτα timers/audio, κράτα ονόματα
	restartSamePlayers();   // ίδιοι παίκτες, νέα μοιρασιά
}

function startNewGameNewPlayers() {
	resetGameState(false);  // full reset
	restartNewNames();      // νέα ονόματα
}

function restartSamePlayers() {
	// εδώ μπαίνουμε ΑΦΟΥ έγινε resetGameState(true)
	document.getElementById("pageTitle").textContent = "ΠΑΛΕΡΜΟ";

	const roleDiv = document.getElementById("roleSelection");
	roleDiv.innerHTML = `
		<h3>Έχεις επιλέξει:</h3>
		<ul id="chosenRolesList"></ul>
		<h3 id="extraRolesHeader">Επίλεξε ${numPlayers - 4} επιπλέον ρόλους:</h3>
	`;

	roleDiv.innerHTML += `
		<label>
			Πολίτης
			<input type="number" id="extraCitizenCount" value="${chosenRoles.filter(r => r==='Citizen').length - 2}" 
				min="0" max="${numPlayers - 4}" onchange="updateCitizenSelection()">
		</label><br>
	`;

	for (let i = 3; i < roleNames.length; i++) {
		if (roleNames[i] === "Citizen") continue;

		if (roleNames[i] === "Lovers") {
			const checked = chosenRoles.filter(r => r==="Lovers").length === 2 ? "checked" : "";
			roleDiv.innerHTML += `
				<label>
					<input type="checkbox" id="addLovers" onchange="toggleLovers(this)" ${checked}>
					${translateRole("Lovers")} (2 άτομα)
				</label><br>`;
			continue;
		}

		const checked = chosenRoles.includes(roleNames[i]) ? "checked" : "";
		roleDiv.innerHTML += `
			<label>
				<input type="checkbox" value="${roleNames[i]}" onchange="updateRoleSelection(this)" ${checked}>
				${translateRole(roleNames[i])}
			</label><br>`;
	}

	roleDiv.innerHTML += `<br><button onclick="applyRolesToSamePlayers()">Continue</button>`;

	updateRemainingRolesText();
	updateChosenRolesList();
	roleDiv.style.display = "block";
}

function restartNewNames() {
	// αν δεν θέλεις reload, κάν' το «in-app»:
	resetGameState(false);
	document.getElementById("pageTitle").textContent = "ΠΑΛΕΡΜΟ";
	openNewGame();
	// ή, αν θες σκληρό reset assets/event listeners:
	// location.reload();
}



function applyRolesToSamePlayers() {
	if (chosenRoles.length !== numPlayers) {
		alert(`You need exactly ${numPlayers} roles!`);
		return;
	}

	// Ανακάτεμα ρόλων
	chosenRoles = shuffleArray(chosenRoles);

	// Εφαρμογή νέων ρόλων στους ίδιους παίκτες (ίδια ονόματα)
	players.forEach((p, i) => {
		p.assignRole(chosenRoles[i]);	// reset isAlive, votes, lives γίνεται μέσα στο assignRole
	});

	// Σύνδεση Lovers ξανά αν υπάρχουν
	const lovers = players.filter(p => p.role === "Lovers");
	if (lovers.length === 2) {
		lovers[0].linkedPartner = lovers[1];
		lovers[1].linkedPartner = lovers[0];
	}

	// 👉 Αντί να πάμε κατευθείαν στο αποτέλεσμα,
	// κλείνουμε την επιλογή ρόλων και ξεκινάμε το flow αποκάλυψης ρόλων
	document.getElementById("roleSelection").style.display = "none";

	currentPlayerIndex = 0;				// από τον πρώτο παίκτη
	showNextPlayerRole();				// εμφανίζει "Δες τον νέο ρόλο σου" για κάθε παίκτη με τη σειρά
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
		<h3 id="playerHeader">Player ${currentPlayerIndex + 1} - Επιβεβαίωσε ή άλλαξε το όνομά σου:</h3>
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

	updateRemainingRolesText();
	updateChosenRolesList();
}

function eliminatePlayer(player, source = "ψηφοφορίας") {
	// 👉 Ειδική λογική για Αλεξίσφαιρο
	if (player.role === "Bulletproof" && source === "δολοφονίας") {
		if (player.lives > 0) {
			player.lives = 0; // καίει την ασπίδα του
			const audio = new Audio(`audio/${selectedTrack}/reveal/bulletproof_reveal.wav`);
			audio.play().catch(() => {});
			
			const nightTextDiv = document.getElementById("nightText");
			if (nightTextDiv) {
				nightTextDiv.innerHTML = `
					<p>🛡️ Ο Αλεξίσφαιρος <strong>${player.name}</strong> γλίτωσε από την απόπειρα δολοφονίας!</p>
				`;
			}
			return false; // ❌ δεν πεθαίνει αυτή τη φορά
		}
	}

	// ✅ Κανονικός θάνατος
	player.isAlive = false;

	// 💔 Αν είναι ερωτευμένος και ο/η άλλος/η ζει, πεθαίνει κι αυτός/ή
	if (player.role === "Lovers" && player.linkedPartner && player.linkedPartner.isAlive) {
		player.linkedPartner.isAlive = false;
	}

	return true;
}






function openNewGame() {
	// if (!bgMusic) playNextMusicTrack(); // 🎵 ξεκινά μουσική με 1ο click
    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("setup").style.display = "block";
    document.getElementById("pageTitle").textContent = "ΠΑΛΕΡΜΟ";
    updateFooterVisibility();
}

function openSettings() {
    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("settingsMenu").style.display = "block";
    updateFooterVisibility();
	const updatedEl = document.getElementById("lastUpdated");
	if (updatedEl) {
		const lastUpdate = "27 Αυγούστου 2025 – 21:17"; // 👉 άλλαξέ το χειροκίνητα όταν κάνεις νέα αλλαγή
		updatedEl.textContent = `Τελευταία ενημέρωση: ${lastUpdate}`;
	}

}

function openCredits() {
    window.location.href = "credits.html";
}


function backToMainMenu() {
    releaseWakeLock(); // 👉 Απενεργοποιούμε την προστασία οθόνης

    document.getElementById("settingsMenu").style.display = "none";
    document.getElementById("creditsPage").style.display = "none";
    document.getElementById("mainMenu").style.display = "block";
    document.getElementById("pageTitle").textContent = "Palermo Game";
    updateFooterVisibility();
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
		"Bulletproof": "🛡️",
		"Lovers": "💑",
		"Kamikaze": "🧨",
		"Madman": "🤪",
		"MotherTeresa": "🙏",
		"Mayor": "👔"
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
		"Bulletproof": "Αλεξίσφαιρος",
		"Lovers": "Ερωτευμένος/η",
		"Kamikaze": "Καμικάζι",
		"Madman": "Τρέλα",
		"MotherTeresa": "Μητέρα Τερέζα",
		"Mayor": "Δήμαρχος"
	};
	return translations[role] || role;
}


document.body.addEventListener("click", (e) => {
	if (e.target.tagName === "BUTTON") {
		vibratePattern();
	}
});

function toggleLovers(checkbox) {
	if (checkbox.checked) {
		// Πόσοι ρόλοι απομένουν;
		const remaining = numPlayers - chosenRoles.length;

		if (remaining < 2) {
			checkbox.checked = false; // ξε-τσεκάρουμε το κουμπί
			alert("Δεν υπάρχουν αρκετές διαθέσιμες θέσεις για να προσθέσεις τους Ερωτευμένους.");
			return;
		}

		// Αν υπάρχει χώρος, πρόσθεσέ τους
		chosenRoles.push("Lovers", "Lovers");
	} else {
		// Αφαίρεση των Lovers
		chosenRoles = chosenRoles.filter(r => r !== "Lovers");
	}

	updateChosenRolesList();
	updateRemainingRolesText(); // ✅ Ενημέρωση header
}


let exitPopupShown = false;
let exitPopupTimeout = null;

window.addEventListener("load", () => {
	history.pushState({ page: 1 }, "", "");
});

window.addEventListener("popstate", function () {
	const mainMenu = document.getElementById("mainMenu");
	if (mainMenu && mainMenu.style.display !== "none") {
		return; // στο main menu επιτρέπεται έξοδος
	}

	if (!exitPopupShown) {
		showExitToast();
		exitPopupShown = true;
		history.pushState({ page: 1 }, "", "");

		// Ορίζουμε timeout για ακύρωση μετά από 3 δευτερόλεπτα
		exitPopupTimeout = setTimeout(() => {
			hideExitToast();
			exitPopupShown = false;
		}, 3000);
	} else {
		// 2ο swipe: κανονική έξοδος
		exitPopupShown = false;
		clearTimeout(exitPopupTimeout);
		hideExitToast();
		window.history.back();
	}
});

function showExitToast() {
	const toast = document.getElementById("exitToast");
	if (toast) toast.classList.remove("hidden");
}

function hideExitToast() {
	const toast = document.getElementById("exitToast");
	if (toast) toast.classList.add("hidden");
}
