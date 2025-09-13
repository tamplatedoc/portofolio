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

// PETA KORDINAT UNTUK PETAK
const plotPositions = [];
for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
        plotPositions.push(new THREE.Vector3(i * 2 - 4, 0, j * 2 - 4));
    }
}
let plotCounter = 0;

// ====== LOGIKA GAME =======
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
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('game-canvas') });
renderer.setSize(window.innerWidth, window.innerHeight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 5;
controls.maxDistance = 20;
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = Math.PI / 2;

// Menambahkan lampu untuk menerangi scene
const light = new THREE.AmbientLight(0x404040); 
scene.add(light);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 5);
scene.add(directionalLight);

// ---- Objek 3D Latar Belakang: Tanah Kosong ----
const groundGeometry = new THREE.PlaneGeometry(25, 25);
const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground); 

// ---- Fungsi untuk membuat model 3D tanaman ----
function createRiceModel() {
    const ricePlant = new THREE.Group();
    const stalk = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 1, 0.1),
        new THREE.MeshLambertMaterial({ color: 0x64814d })
    );
    stalk.position.y = 0.5;
    ricePlant.add(stalk);
    return ricePlant;
}

function createCornModel() {
    const cornPlant = new THREE.Group();
    const stalk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8),
        new THREE.MeshLambertMaterial({ color: 0x485f39 })
    );
    stalk.position.y = 0.6;
    cornPlant.add(stalk);
    
    const corn = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 0.6, 8),
        new THREE.MeshLambertMaterial({ color: 0xfdd835 })
    );
    corn.position.y = 0.8;
    corn.rotation.x = Math.PI / 2;
    cornPlant.add(corn);
    return cornPlant;
}

// ---- Fungsi untuk menambahkan petak 3D baru ----
function add3DPlot(type) {
    let plot;
    if (type === 'beras') {
        plot = createRiceModel();
    } else if (type === 'jagung') {
        plot = createCornModel();
    }
    
    if (plotCounter < plotPositions.length) {
        const pos = plotPositions[plotCounter];
        plot.position.set(pos.x, pos.y + 0.5, pos.z);
        scene.add(plot);
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
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Tambahkan petak awal
add3DPlot('jagung');
add3DPlot('beras');

// Atur posisi kamera awal
camera.position.set(0, 10, 5);
camera.lookAt(0, 0, 0);

// Mulai game
setInterval(harvest, 60000); // 1 menit
animate();
updateUI();
