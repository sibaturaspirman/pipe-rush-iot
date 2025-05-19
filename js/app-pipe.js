// AUDIO
var bgsound = new Howl({
    src: ['./assets/audios/bgm.mp3'],
    loop: true,
    autoplay: true,
    volume: 0.6,
});
var wrongSound = new Howl({
    src: ['./assets/audios/wrong.mp3']
});
var perfectSound = new Howl({
    src: ['./assets/audios/add_point.mp3']
});
var btnSound = new Howl({
    src: ['./assets/audios/click.mp3']
});

let playerName = ''
let pageStatus = 'home'
let angle = 0;
let isRotating = false;
let gameStarted = false;
let countdownStep = 3;
let targetAngle = 0;
const margin = 3;
let lives = 4;
let bestTime = null;
let totalPipes = 4;
let currentPipe = 1;

const stageSpeeds = [1.2, 1.2, 1.4, 1.6]; // misalnya pipa 1 sampai 4
let rotationSpeed = 0.5;
let maxSpeed = stageSpeeds[0]; // awal = speed pipa 1
const acceleration = 0.95;

let timer = 60000;
let startTime = null;
let pausedTime = 0;       // total waktu yang di-pause
let pauseStart = null;
let interval = null;

const pipe1 = document.getElementById("part1");
const pipe2 = document.getElementById("part2");
const pipe3 = document.getElementById("part3");
const pipe4 = document.getElementById("part4");
const overlayGame = document.getElementById("overlayGame");
const timerGame = document.getElementById("timerGame");
const timerGame2 = document.getElementById("timerGame2");
const timerGame3 = document.getElementById("timerGame3");
const livesDisplay = document.getElementById("lives");
const bestTimeDisplay = document.getElementById("bestTime");
const stageDisplay = document.getElementById("stage");

currentPipe = 1;
stageDisplay.textContent = `Pipes: ${currentPipe} / ${totalPipes}`;

function updateRotation() {
    if (isRotating) {
        rotationSpeed = Math.min(rotationSpeed + acceleration, maxSpeed);
        angle = (angle + rotationSpeed) % 360;

        if(currentPipe == 1){
            pipe1.style.transform = `rotate(${angle}deg)`;
        }else if(currentPipe == 2){
            pipe2.style.transform = `rotate(${angle}deg)`;
            
            pipe1.style.transform = `rotate(0}deg)`;
        }else if(currentPipe == 3){
            pipe3.style.transform = `rotate(${angle}deg)`;

            pipe1.style.transform = `rotate(0}deg)`;
            pipe2.style.transform = `rotate(0}deg)`;
        }else if(currentPipe == 4){
            pipe4.style.transform = `rotate(${angle}deg)`;

            pipe1.style.transform = `rotate(0}deg)`;
            pipe2.style.transform = `rotate(0}deg)`;
            pipe3.style.transform = `rotate(0}deg)`;
        }
        // console.log(angle)
    }
}

function updateTimer() {
    const now = Date.now();
    const elapsed = now - startTime - pausedTime;
    const left = Math.max(0, timer - elapsed);

    const minutes = String(Math.floor(left / 60000)).padStart(2, '0');
    const seconds = String(Math.floor((left % 60000) / 1000)).padStart(2, '0');
    const ms = String(left % 1000).padStart(3, '0');

    timerGame.textContent = `${minutes}:${seconds}:${ms}`;
    timerGame2.textContent = `${minutes}:${seconds}:${ms}`;
    timerGame3.textContent = `${minutes}:${seconds}:${ms}`;

    if (left <= 0) {
      isRotating = false;
      clearInterval(interval);
      checkResult();
    }
}

function formatTime(ms) {
    const minutes = String(Math.floor(ms / 60000)).padStart(2, '0');
    const seconds = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
    const millis = String(ms % 1000).padStart(3, '0');
    return `${minutes}:${seconds}:${millis}`;
}

function startGame() {
    isRotating = true;
    gameStarted = true;
    if (!startTime) {
      startTime = Date.now(); // ✅ waktu mulai disimpan hanya sekali
    }

    // Hitung waktu jeda yang dihabiskan
    if (pauseStart !== null) {
        pausedTime += Date.now() - pauseStart;
        pauseStart = null;
    }
    
    interval = setInterval(() => {
      updateRotation();
      updateTimer();
    }, 2);
}

function checkResult() {
    const diff = Math.abs(angle - targetAngle);
    const success = diff <= margin || Math.abs(diff - 360) <= margin;
  
    if (success) {
    //   result.textContent = "✅ PERFECT!";

        perfectSound.play()
        $("#result .block-image:first-child").show()
        $("#result .block-image:last-child").hide()
        const thisTime = Date.now() - startTime;
        if (!bestTime || thisTime < bestTime) {
            bestTime = thisTime;
            bestTimeDisplay.textContent = "Best Time: " + formatTime(thisTime);
        }

        if(currentPipe == 1){
            $("#part1 .block-image:first-child").hide()
            $("#part1 .block-image:last-child").show()
        }else if(currentPipe == 2){
            $("#part2 .block-image:first-child").hide()
            $("#part2 .block-image:last-child").show()
        }else if(currentPipe == 3){
            $("#part3 .block-image:first-child").hide()
            $("#part3 .block-image:last-child").show()
        }else if(currentPipe == 4){
            $("#part4 .block-image:first-child").hide()
            $("#part4 .block-image:last-child").show()
        }
  
      if (currentPipe < totalPipes) {
        currentPipe++;
        stageDisplay.textContent = `Pipa: ${currentPipe} / ${totalPipes}`;

        maxSpeed = stageSpeeds[currentPipe - 1];

        if(currentPipe == 2){
            $("#part1 .block-image:first-child").hide()
            $("#part1 .block-image:last-child").show()

            $("#part2").show()
        }else if(currentPipe == 3){
            $("#part2 .block-image:first-child").hide()
            $("#part2 .block-image:last-child").show()

            $("#part3").show()
        }else if(currentPipe == 4){
            $("#part3 .block-image:first-child").hide()
            $("#part3 .block-image:last-child").show()

            $("#part4").show()
        }

        pauseStart = Date.now(); 
        setTimeout(() => {
            angle = 0;
            rotationSpeed = 0.5;
        //   result.textContent = "";
            $("#result .block-image:first-child").hide()
            $("#result .block-image:last-child").hide()
          startCountdown();
        }, 1500);
      } else {
        // overlayGame.textContent = "🎉 Semua Pipa Selesai!";
        const finalTime = Date.now() - startTime - pausedTime;
        const timeLeft = Math.max(0, timer - finalTime);
        updateLeaderboard(finalTime, playerName, timeLeft);

        setTimeout(() => {
            perfectSound.play()
            $("#sectionGameplay").addClass("hide")
            $("#sectionWin").removeClass("hide")

            setTimeout(() => {
                pageStatus = 'leaderboard'
                $("#sectionWin").addClass("hide")
                $("#sectionLeaderboard").removeClass("hide")
            }, 3000);
        }, 1800);
      }
  
    } else {
        $(".pipa-area").addClass("shake");
        setTimeout(() => {
            $(".pipa-area").removeClass("shake");
        }, 1500);
        wrongSound.play()
        // result.textContent = "❌ MISS!";
        $("#result .block-image:first-child").hide()
        $("#result .block-image:last-child").show()
        lives--;
        livesDisplay.textContent = "❤️".repeat(lives);

        if(lives == 3){
            $(".nyawa .block-image").hide()
            $(".nyawa .block-image:nth-child(2)").show()
        }else if(lives == 2){
            $(".nyawa .block-image").hide()
            $(".nyawa .block-image:nth-child(3)").show()
        }else if(lives == 1){
            $(".nyawa .block-image").hide()
            $(".nyawa .block-image:nth-child(4)").show()
        }else if(lives == 0){
            $(".nyawa .block-image").hide()
            $(".nyawa .block-image:nth-child(5)").show()
        }
        
        if (lives <= 0) {
            wrongSound.play()
            overlayGame.textContent = "Game Over!";
            $(".ld-you").hide()

            setTimeout(() => {
                $("#sectionGameplay").addClass("hide")
                $("#sectionLose").removeClass("hide")

                setTimeout(() => {
                    pageStatus = 'leaderboard'
                    $("#sectionLose").addClass("hide")
                    $("#sectionLeaderboard").removeClass("hide")
                }, 3000);
            }, 1800);
        } else {
            // Retry this same pipe
            pauseStart = Date.now(); 
            setTimeout(() => {
                angle = 0;
                rotationSpeed = 0.5;
                maxSpeed = stageSpeeds[currentPipe - 1]; 
                // result.textContent = "";
                startCountdown();

                $("#result .block-image:first-child").hide()
                $("#result .block-image:last-child").hide()
            }, 1500);
        }
    }
}
  

function startCountdown() {
    if(!gameStarted){
        $("#overlayGame").removeClass("hide")
    }
    overlayGame.textContent = countdownStep;
    const countdown = setInterval(() => {
        countdownStep--;
        if (countdownStep > 0) {
            overlayGame.textContent = countdownStep;
        } else if (countdownStep === 0) {
            overlayGame.textContent = "GO!";
        } else {
            clearInterval(countdown);
            $("#overlayGame").addClass("hide")
            stageDisplay.textContent = `Pipes: ${currentPipe} / ${totalPipes}`;
            startGame();
        }
    }, 1000);
}

function pageStart(){
    pageStatus = 'fill'
    $("#sectionHome").addClass("hide")
    $("#sectionFill").removeClass("hide")

    $("#fillName").focus()
}

function fillName(){
    let fillNameVal = $("#fillName").val()
    if(fillNameVal != ''){
        pageStatus = 'howto';
        $("#fillName").blur()
        $("#errorName").hide()

        playerName = fillNameVal

        $("#sectionFill").addClass("hide")
        $("#sectionHowto").removeClass("hide")
    }else{
        $("#errorName").show()
    }
}

function playTheGame(){
    console.log("START GAME")
    pageStatus = 'gameon';
    $("#sectionHowto").addClass("hide")
    $("#sectionGameplay").removeClass("hide")
    startCountdown()
}


// CONTROL THE GAME with ENTER
window.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        console.log(pageStatus)
        if(pageStatus == 'home'){
            btnSound.play()
            pageStart()
        }else if(pageStatus == 'fill'){
            btnSound.play()
            fillName()
        }else if(pageStatus == 'howto'){
            btnSound.play()
            playTheGame()
        }else if(pageStatus == 'gameon'){
            btnSound.play()
            if(isRotating) {
                isRotating = false;
                clearInterval(interval);
                checkResult();
            }
        
        }else if(pageStatus == 'leaderboard'){
            btnSound.play()
            backToHome()

        }
    }

    // ⌨️ 1 → Reset
    if (e.key === "1") {
        resetLeaderboard();
    }

    // ⌨️ 2 to Export
    if (e.key  === "2") {
        exportLeaderboard();
    }
});

// LEADERBOARD
function updateLeaderboard(timeMs, playerName, timeLeftMs) {
    let scores = JSON.parse(localStorage.getItem("pipeLeaderboard") || "[]");
  
    scores.push({
      name: playerName,
      time: timeMs,
      timeLeft: timeLeftMs
    });
  
    scores = scores
      .sort((a, b) => a.time - b.time);
  
    localStorage.setItem("pipeLeaderboard", JSON.stringify(scores));
    renderLeaderboard();
}
  

function renderLeaderboard() {
    const list = document.getElementById("leaderboardList");
    list.innerHTML = "";
  
    const scores = JSON.parse(localStorage.getItem("pipeLeaderboard") || "[]").slice(0, 5);
    if (scores.length === 0) {
      list.innerHTML = `<li><div class="block-image"><img src="./assets/images/BG-LD.png" alt="Kalbe"></div>
                    <div class="leaderboard-area">
                        <div class="leaderboard-name"><span>0</span> <span>NONAME</span></div>
                        <div class="leaderboard-time"><div class="block-image"><img src="./assets/images/TIMER.png" alt="Kalbe"></div> <span>00:00:00</span></div>
                    </div></li>`;
      return;
    }
  
    scores.forEach(({ name, time, timeLeft }, index) => {
      const li = document.createElement("li");
      li.innerHTML = `<div class="block-image"><img src="./assets/images/BG-LD.png" alt="Kalbe"></div>
                    <div class="leaderboard-area">
                        <div class="leaderboard-name"><span>${index + 1}.</span> <span>${name}</span></div>
                        <div class="leaderboard-time"><div class="block-image"><img src="./assets/images/TIMER.png" alt="Kalbe"></div> <span>${formatTime(timeLeft)}</span></div>
                    </div>`;
      list.appendChild(li);

    //   ${name} — ${formatTime(time)} (sisa: ${formatTime(timeLeft)})
    });
}  
renderLeaderboard();

function exportLeaderboard() {
    const scores = JSON.parse(localStorage.getItem("pipeLeaderboard") || "[]");
    const blob = new Blob([JSON.stringify(scores, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement("a");
    a.href = url;
    a.download = "leaderboard.json";
    a.click();
  
    URL.revokeObjectURL(url); // cleanup
}

function resetLeaderboard() {
    if (confirm("Yakin ingin menghapus semua skor?")) {
      localStorage.removeItem("pipeLeaderboard");
      renderLeaderboard();
    }
}

function backToHome(){
    btnSound.play()
    location.reload()
}