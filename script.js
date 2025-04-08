// Configurações fixas
const USERNAME = "admin";
const PASSWORD = "senha123";
const GIST_FILENAME = "user-data.json";
const GITHUB_TOKEN = "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";

// Elementos DOM
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const welcomeUser = document.getElementById('welcome-user');
const dataInput = document.getElementById('data-input');
const saveBtn = document.getElementById('save-btn');
const logoutBtn = document.getElementById('logout-btn');
const statusMessage = document.getElementById('status-message');

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
saveBtn.addEventListener('click', saveData);
logoutBtn.addEventListener('click', logout);

// Verificar se já está logado ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('loggedIn') === 'true') {
        showApp();
        loadData();
    }
});

// Funções
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === USERNAME && password === PASSWORD) {
        localStorage.setItem('loggedIn', 'true');
        showApp();
        loadData();
    } else {
        showStatus('Usuário ou senha incorretos', 'error');
    }
}

function showApp() {
    loginContainer.style.display = 'none';
    appContainer.style.display = 'block';
    welcomeUser.textContent = USERNAME;
}

async function loadData() {
    try {
        // Tenta carregar do localStorage primeiro
        const localData = localStorage.getItem('localData');
        if (localData) {
            dataInput.value = localData;
        }

        // Depois tenta sincronizar com GitHub
        if (localStorage.getItem('gistId')) {
            const response = await fetch(`https://api.github.com/gists/${localStorage.getItem('gistId')}`, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const gist = await response.json();
                const remoteData = gist.files[GIST_FILENAME].content;
                
                // Atualiza apenas se os dados remotos forem diferentes
                if (remoteData !== localData) {
                    dataInput.value = remoteData;
                    localStorage.setItem('localData', remoteData);
                }
            }
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        showStatus('Falha ao carregar dados do GitHub. Usando dados locais.', 'error');
    }
}

async function saveData() {
    const content = dataInput.value;
    
    // Salva localmente primeiro
    localStorage.setItem('localData', content);
    showStatus('Dados salvos localmente', 'success');
    
    // Tenta salvar no GitHub
    try {
        let response;
        const gistId = localStorage.getItem('gistId');
        
        if (gistId) {
            response = await fetch(`https://api.github.com/gists/${gistId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    files: {
                        [GIST_FILENAME]: {
                            content: content
                        }
                    }
                })
            });
        } else {
            response = await fetch('https://api.github.com/gists', {
                method: 'POST',
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    description: 'Dados do usuário',
                    public: false,
                    files: {
                        [GIST_FILENAME]: {
                            content: content
                        }
                    }
                })
            });
            
            const gist = await response.json();
            localStorage.setItem('gistId', gist.id);
        }
        
        showStatus('Dados sincronizados com GitHub!', 'success');
    } catch (error) {
        console.error('Erro ao salvar no GitHub:', error);
        showStatus('Falha ao sincronizar com GitHub', 'error');
    }
}

function logout() {
    localStorage.removeItem('loggedIn');
    loginContainer.style.display = 'block';
    appContainer.style.display = 'none';
    loginForm.reset();
}

function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = type;
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 5000);
}
