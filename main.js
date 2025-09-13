// ====== IMPOR LIBRARY =======
import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/jsm/loaders/GLTFLoader.js';

// ====== SETUP GAME UTAMA =======
let resources = { beras: 0, jagung: 0, gandum: 0 };
let plots = { beras: 1, jagung: 1, gandum: 0 };
let level = 1;

const elements = {
    berasCount: document.getElementById('beras-count'),
    jagungCount: document.getElementById('jagung-count'),
    gandumCount: document.getElementById('gandum-count'),
    gandumDisplay: document.getElementById('gandum-display'),
    gandumButton: document.getElementById('gandum-button'),
    levelDisplay: document.getElementById('level'),
    gameMessage: document.getElementById('game-message'),
};

const costs = {
    'jagung': { beras: 2 },
    'beras': { jagung: 2 },
    'gandum': { beras: 3, jagung: 3 }
};
const upgradeCost = {
    level1: { beras: 10, jagung: 10 }
};

const plotPositions = [];
for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
        plotPositions.push(new THREE.Vector3(i * 2 - 4, 0, j * 2 - 4));
    }
}
let plotCounter = 0;
const loadedModels = {}; // Untuk menyimpan model yang sudah dimuat

// ====== LOGIKA GAME =======
window.buyPlot = buyPlot;
window.upgradeTownHall = upgradeTownHall;

function updateUI() {
    elements.berasCount.textContent = resources.beras;
    elements.jagungCount.textContent = resources.jagung;
    elements.gandumCount.textContent = resources.gandum;
    elements.levelDisplay.textContent = level;
}

function showMessage(msg) {
    elements.gameMessage.textContent = msg;
    setTimeout(() => { elements.gameMessage.textContent = ''; }, 3000);
}

function harvest() {
    resources.beras += plots.beras;
    resources.jagung += plots.jagung;
    resources.gandum += plots.gandum;
    showMessage(`Panen! Anda mendapatkan ${plots.beras} beras dan ${plots.jagung} jagung.`);
    updateUI();
}

function buyPlot(type) {
    if (plotCounter >= plotPositions.length) {
        showMessage("Lahan sudah penuh!");
        return;
    }

    const cost = costs[type];
    let canBuy = true;
    for (const res in cost) {
        if (resources[res] < cost[res]) {
            canBuy = false;
            showMessage(`${res} tidak cukup!`);
            break;
        }
    }

    if (canBuy) {
        for (const res in cost) { resources[res] -= cost[res]; }
        plots[type]++;
        showMessage(`Berhasil membeli petak ${type}!`);
        add3DPlot(type);
        updateUI();
    }
}

function upgradeTownHall() {
    if (level === 1) {
        if (resources.beras >= upgradeCost.level1.beras && resources.jagung >= upgradeCost.level1.jagung) {
            resources.beras -= upgradeCost.level1.beras;
            resources.jagung -= upgradeCost.level1.jagung;
            level = 2;
            showMessage("Town Hall di-upgrade ke Level 2! Gandum sekarang tersedia!");
            elements.gandumDisplay.classList.remove('hidden');
            elements.gandumButton.classList.remove('hidden');
            updateUI();
        } else {
            showMessage("Sumber daya tidak cukup untuk Level 2!");
        }
    } else {
        showMessage("Town Hall sudah mencapai level maksimum.");
    }
}

// ====== SETUP 3D DENGAN THREE.JS =======
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 5;
controls.maxDistance = 20;
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = Math.PI / 2;

const ambientLight = new THREE.AmbientLight(0x404040, 2);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
directionalLight.castShadow = true;
scene.add(directionalLight);

const groundGeometry = new THREE.PlaneGeometry(25, 25);
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// --- Menggunakan GLTFLoader untuk memuat model ---
const loader = new GLTFLoader();

function loadModels() {
    const modelsToLoad = ['jagung.gltf', 'padi.gltf'];
    let modelsLoaded = 0;

    modelsToLoad.forEach(modelName => {
        loader.load(
            `assets/models/${modelName}`, // Pastikan jalur ini benar
            (gltf) => {
                const model = gltf.scene;
                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                loadedModels[modelName.split('.')[0]] = model;
                modelsLoaded++;
                if (modelsLoaded === modelsToLoad.length) {
                    console.log("Semua model berhasil dimuat!");
                    initializeGame();
                }
            },
            (xhr) => {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            (error) => {
                console.error(`Error loading model ${modelName}:`, error);
            }
        );
    });
}

function add3DPlot(type) {
    if (plotCounter < plotPositions.length) {
        let model;
        if (type === 'beras' && loadedModels.padi) {
            model = loadedModels.padi.clone();
        } else if (type === 'jagung' && loadedModels.jagung) {
            model = loadedModels.jagung.clone();
        } else {
            console.warn(`Model untuk ${type} belum dimuat.`);
            return;
        }

        const pos = plotPositions[plotCounter];
        model.position.set(pos.x, pos.y, pos.z);
        scene.add(model);
        plotCounter++;
    }
}

// ====== GAME LOOP =======
function animate() {
    requestAnimationFrame(animate);
    controls.update(); 
    renderer.render(scene, camera);
}

// ====== INISIALISASI GAME =======
function initializeGame() {
    add3DPlot('jagung');
    add3DPlot('beras');

    camera.position.set(0, 10, 5);
    camera.lookAt(0, 0, 0);

    setInterval(harvest, 60000);
    animate();
    updateUI();
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

loadModels();
