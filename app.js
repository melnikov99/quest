"use strict";

/*
==========================================
Configuration
==========================================
*/

const STORAGE_KEY = "quest-progress";

const INITIAL_STATE = {
    currentMission: 1,
    rewards: [],
    answers: {}
};

let state = loadState();
validateState();

let viewId = state.currentMission;


/*
==========================================
DOM
==========================================
*/

const missionNumber = document.getElementById("missionNumber");
const missionTitle = document.getElementById("missionTitle");
const missionText = document.getElementById("missionText");

const geoSection = document.getElementById("geoSection");
const geoButton = document.getElementById("geoButton");
const geoStatus = document.getElementById("geoStatus");
const hintBox = document.getElementById("hintBox");
const missionHintBox = document.getElementById("missionHintBox");

const answerInput = document.getElementById("answerInput");
const checkButton = document.getElementById("checkButton");

const message = document.getElementById("message");

const progressFill = document.getElementById("progressFill");
const progressText = document.getElementById("progressText");

const finishScreen = document.getElementById("finishScreen");
const prizeButton = document.getElementById("prizeButton");
const prizeContainer = document.getElementById("prizeContainer");
const restartButton = document.getElementById("restartButton");

const welcomeScreen = document.getElementById("welcomeScreen");
const startButton = document.getElementById("startButton");

const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");

/*
==========================================
Start
==========================================
*/

const isResuming = !!localStorage.getItem(STORAGE_KEY);

if (isResuming) {
    renderMission();
} else {
    welcomeScreen.classList.remove("hidden");
}

startButton.addEventListener("click", () => {
    welcomeScreen.classList.add("hidden");
    renderMission();
});

geoButton.addEventListener("click", checkLocation);

checkButton.addEventListener("click", checkAnswer);

restartButton.addEventListener("click", restartQuest);

prizeButton.addEventListener("click", showPrize);

prevButton.addEventListener("click", () => {

    if (viewId <= 1) {
        return;
    }

    viewId--;

    renderMission();

});

nextButton.addEventListener("click", () => {

    nextMission();

});

answerInput.addEventListener("keydown", e => {

    if (e.key === "Enter") {
        checkAnswer();
    }

});

function loadState() {

    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {

        return structuredClone(INITIAL_STATE);

    }

    try {

        return JSON.parse(raw);

    } catch {

        return structuredClone(INITIAL_STATE);

    }

}

function saveState() {

    localStorage.setItem(

        STORAGE_KEY,

        JSON.stringify(state)

    );

}

function currentMission() {

    return MISSIONS.find(

        mission => mission.id === viewId

    );

}

function nextMission() {

    const nextId = viewId + 1;

    if (nextId > MISSIONS.length) {

        showFinishScreen();

        return;

    }

    if (viewId === state.currentMission) {

        state.currentMission = nextId;

        saveState();

    }

    viewId = nextId;

    const next = MISSIONS.find(m => m.id === viewId);

    if (!next || next.finish) {

        showFinishScreen();

        return;

    }

    renderMission();

}

function hasReward(value) {


    return state.rewards.some(

        item =>
            Number(item) === Number(value)

    );

}

function addReward(value) {


    if (
        hasReward(value)
    ) {

        return;

    }


    state.rewards.push(
        Number(value)
    );


    saveState();

}

function restartQuest() {

    if (

        !confirm(

            "Начать квест заново?"

        )

    ) {

        return;

    }

    localStorage.removeItem(STORAGE_KEY);

    state = structuredClone(INITIAL_STATE);

    viewId = state.currentMission;

    finishScreen.classList.add("hidden");

    welcomeScreen.classList.remove("hidden");

}

function showPrize() {

    prizeButton.classList.add("hidden");

    prizeContainer.classList.remove("hidden");

}

/*
==========================================
Render
==========================================
*/

function renderMission() {

    const mission = currentMission();

    if (!mission) {

        showFinishScreen();

        return;

    }

    if (mission.finish) {

        showFinishScreen();

        return;

    }

    finishScreen.classList.add("hidden");
    missionHintBox.textContent = "";
    missionHintBox.classList.add("hidden");

    missionNumber.textContent =
        `Миссия ${mission.id}`;

    missionTitle.textContent =
        mission.title;

    missionText.textContent =
        mission.text;

    const savedAnswer = state.answers[mission.id];

    answerInput.value = savedAnswer ?? "";

    if (savedAnswer !== undefined) {
        showSuccess("Правильно!");
    } else {
        clearMessage();
    }

    renderGeo(mission);

    renderProgress();

    renderNav(mission);

    if (!savedAnswer) {
        answerInput.focus();
    }

}

function renderGeo(mission) {

    geoStatus.textContent = "";

    hintBox.textContent = "";

    hintBox.classList.add("hidden");

    const isAnswered = state.answers[mission.id] !== undefined;

    if (!mission.geo) {

        geoSection.classList.add("hidden");

        answerInput.disabled = isAnswered;

        checkButton.disabled = isAnswered;

        return;

    }

    geoSection.classList.remove("hidden");

    if (isAnswered) {

        answerInput.disabled = false;

        checkButton.disabled = true;

        return;

    }

    answerInput.disabled = true;

    checkButton.disabled = true;

}

function renderProgress() {

    const total = MISSIONS.filter(

        m => !m.finish

    ).length;

    const current = Math.min(

        state.currentMission,

        total

    );

    const percent = (current / total) * 100;

    progressFill.style.width =
        `${percent}%`;

    progressText.textContent =
        `${current} из ${total}`;

}

function renderNav(mission) {

    prevButton.disabled = viewId <= 1;

    const isCompleted = viewId < state.currentMission;

    if (isCompleted) {
        nextButton.classList.remove("hidden");
    } else {
        nextButton.classList.add("hidden");
    }

}

function showNextButton() {

    nextButton.classList.remove("hidden");

}

function showFinishScreen() {


    finishScreen
        .classList
        .remove("hidden");


    const numbers =
        state.rewards.join(", ");


    console.log(
        "Quest completed:",
        numbers
    );

}

function showSuccess(text) {

    message.textContent = text;

    message.className = "success";

}

function showError(text) {

    message.textContent = text;

    message.className = "error";

}

function clearMessage() {

    message.textContent = "";

    message.className = "";

}

function normalizeAnswer(value) {

    return value

        .trim()

        .replace(/\s+/g, " ")

        .toLowerCase();

}

/*
==========================================
Answer checking
==========================================
*/

function checkAnswer() {

    const mission = currentMission();

    if (!mission) {
        return;
    }


    const userAnswer = normalizeAnswer(
        answerInput.value
    );


    if (!userAnswer) {

        showError(
            "Введите ответ"
        );

        return;

    }


    const correctAnswer = getExpectedAnswer(mission);


    if (
        userAnswer !== correctAnswer
    ) {

        showError(
            "Ответ неверный"
        );

        return;

    }


    completeMission(mission);

}

function processAutomaticReward(mission) {

    if (
        mission.autoReward &&
        mission.reward !== null
    ) {

        addReward(
            mission.reward
        );

    }

}

function completeMission(mission) {

    processAutomaticReward(mission);

    if (
        mission.reward !== null &&
        !mission.autoReward
    ) {
        addReward(mission.reward);
    }

    state.answers[mission.id] = answerInput.value.trim();

    saveState();

    showSuccess("Правильно!");

    if (mission.hint) {

        hintBox.textContent = mission.hint;

        hintBox.classList.remove("hidden");

        hintBox.style.display = "block";

    }

    if (mission.hintAfterAnswer) {
        missionHintBox.textContent = mission.hintAfterAnswer;
        missionHintBox.classList.remove("hidden");
        missionHintBox.style.display = "block";
    }

    showNextButton();

}

function getQuestNumbers() {

    return state.rewards.join("");

}

function getExpectedAnswer(mission) {

    if (mission.id !== 8) {
        return normalizeAnswer(
            mission.answer
        );
    }


    const coordinates = buildCoordinates();


    console.log(coordinates);


    return normalizeAnswer(
        "105215"
    );

}

/*
==========================================
Geolocation
==========================================
*/


function checkLocation() {

    const mission = currentMission();


    if (!mission || !mission.geo) {
        return;
    }


    geoStatus.textContent =
        "Получение координат...";


    if (!navigator.geolocation) {

        geoStatus.textContent =
            "Ваш браузер не поддерживает геолокацию.";

        return;

    }


    navigator.geolocation.getCurrentPosition(

        position => {

            handleLocationSuccess(
                position,
                mission
            );

        },

        error => {

            handleLocationError(
                error
            );

        },

        {
            enableHighAccuracy: true,

            timeout: 10000,

            maximumAge: 0
        }

    );

}

function handleLocationSuccess(
    position,
    mission
) {


    const userLat =
        position.coords.latitude;


    const userLng =
        position.coords.longitude;


    const distance =
        calculateDistance(

            userLat,

            userLng,

            mission.geo.lat,

            mission.geo.lng

        );


    geoStatus.textContent =
        `Расстояние: ${Math.round(distance)} м`;



    if (
        distance <= mission.geo.radius
    ) {


        unlockMissionAnswer(
            mission
        );


    } else {


        showError(
            "Вы находитесь далеко от точки задания."
        );

    }

}

function handleLocationError(error) {


    switch(error.code) {


        case error.PERMISSION_DENIED:

            geoStatus.textContent =
                "Доступ к геолокации запрещен.";

            break;


        case error.POSITION_UNAVAILABLE:

            geoStatus.textContent =
                "Не удалось определить координаты.";

            break;


        case error.TIMEOUT:

            geoStatus.textContent =
                "Истекло время ожидания.";

            break;


        default:

            geoStatus.textContent =
                "Ошибка определения местоположения.";

    }

}

function unlockMissionAnswer(mission) {


    answerInput.disabled = false;

    checkButton.disabled = false;


    geoStatus.textContent =
        "Место найдено.";


    if (mission.hint) {

        hintBox.textContent =
            mission.hint;


        hintBox.classList.remove(
            "hidden"
        );

    }


    answerInput.focus();

}

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {


    const earthRadius = 6371000;


    const toRadians = value =>
        value * Math.PI / 180;



    const dLat =
        toRadians(
            lat2 - lat1
        );


    const dLon =
        toRadians(
            lon2 - lon1
        );



    const a =

        Math.sin(dLat / 2) *
        Math.sin(dLat / 2)

        +

        Math.cos(
            toRadians(lat1)
        )

        *

        Math.cos(
            toRadians(lat2)
        )

        *

        Math.sin(dLon / 2)

        *

        Math.sin(dLon / 2);



    const c =

        2 *

        Math.atan2(

            Math.sqrt(a),

            Math.sqrt(1 - a)

        );



    return earthRadius * c;

}

/*
==========================================
Final logic
==========================================
*/


/*
Проверка состояния приложения
после загрузки
*/

function validateState() {


    if (
        !state.currentMission ||
        state.currentMission < 1
    ) {

        state = structuredClone(
            INITIAL_STATE
        );

        saveState();

    }


    if (
        !Array.isArray(state.rewards)
    ) {

        state.rewards = [];

        saveState();

    }

    if (
        !state.answers ||
        typeof state.answers !== "object"
    ) {

        state.answers = {};

        saveState();

    }

}



function buildCoordinates() {

    const numbers = state.rewards;

    if (numbers.length < 8) {
        return null;
    }


    return {
        latitude:
            `${numbers[0]}.${numbers[1]}${numbers[2]}${numbers[3]}${numbers[4]}`,

        longitude:
            `${numbers[5]}.${numbers[6]}${numbers[7]}${numbers[0]}`
    };

}