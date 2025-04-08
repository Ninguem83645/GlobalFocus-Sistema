// Configurações fixas
const USERNAME = "admin";
const PASSWORD = "senha123";
const GIST_FILENAME = "user-data.json";
const GITHUB_TOKEN = "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"; // Seu token integrado

// Elementos DOM
const loginContainer = document.getElementById('login-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const welcomeUser = document.getElementById('welcome-user');
const dataInput = document.getElementById('data-input');
const saveBtn = document.getElementById('save-btn');
const logoutBtn = document.getElementById('logout-btn');
const statusMessage = document.getElementById('status-message');

// Estado da aplicação
let gistId = localStorage.getItem('gistId') || '';

// Event Listeners
loginForm.addEventListener('submit', handleLogin);
saveBtn.addEventListener('click', saveData);
logoutBtn.addEventListener('click', logout);

// Verificar se já está logado ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('loggedIn') === 'true') {
        showApp();
        loadData();
    }
});

// Funções
async function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username !== USERNAME || password !== PASSWORD) {
        showStatus('Usuário ou senha incorretos', 'error');
        return;
    }
    
    localStorage.setItem('loggedIn', 'true');
    showApp();
    loadData();
}

function showApp() {
    loginContainer.style.display = 'none';
    appContainer.style.display = 'block';
    welcomeUser.textContent = USERNAME;
}

async function loadData() {
    try {
        // Tenta carregar do GitHub primeiro
        if (gistId) {
            const response = await fetch(`https://api.github.com/gists/${gistId}`, {
                headers: {
                    'Authorization': `token ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (response.ok) {
                const gist = await response.json();
                const content = gist.files[GIST_FILENAME].content;
                dataInput.value = content;
                localStorage.setItem('localData', content);
                return;
            }
        }
        
        // Fallback para dados locais
        dataInput.value = localStorage.getItem('localData') || '';
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        dataInput.value = localStorage.getItem('localData') || '';
        showStatus('Falha ao carregar dados do GitHub. Usando dados locais.', 'error');
    }
}

async function saveData() {
    const content = dataInput.value;
    
    // Salva localmente em qualquer caso
    localStorage.setItem('localData', content);
    
    try {
        let response;
        
        if (gistId) {
            // Atualiza Gist existente
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
            // Cria novo Gist
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
            
            if (response.ok) {
                const gist = await response.json();
                gistId = gist.id;
                localStorage.setItem('gistId', gistId);
            }
        }
        
        if (!response.ok) throw new Error('Falha ao salvar dados');
        
        showStatus('Dados salvos com sucesso e sincronizados com GitHub!', 'success');
    } catch (error) {
        console.error('Erro ao salvar dados:', error);
        showStatus('Falha ao sincronizar com GitHub. Dados salvos localmente.', 'error');
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
