// Configurações atualizadas
const USERNAME = "admin";
const PASSWORD = "senha123";
const GIST_FILENAME = "user-data.json";
const GITHUB_TOKEN = "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"; // Novo token

// Elementos DOM (mantido igual)
// ... [código anterior permanece igual até a função loadData]

async function loadData() {
    // Primeiro carrega dos dados locais
    const localData = localStorage.getItem('localData') || '';
    dataInput.value = localData;
    
    // Tenta sincronizar com GitHub se tiver conexão
    if (!navigator.onLine) {
        showStatus('Você está offline. Usando dados locais.', 'error');
        return;
    }

    try {
        // Verifica se temos um gistId salvo
        const savedGistId = localStorage.getItem('gistId');
        if (!savedGistId) {
            showStatus('Dados locais carregados. Nenhum Gist encontrado para sincronizar.', 'success');
            return;
        }

        const response = await fetch(`https://api.github.com/gists/${savedGistId}`, {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const gist = await response.json();
        const remoteData = gist.files[GIST_FILENAME].content;

        // Atualiza apenas se os dados remotos forem diferentes
        if (remoteData !== localData) {
            dataInput.value = remoteData;
            localStorage.setItem('localData', remoteData);
            showStatus('Dados sincronizados com sucesso do GitHub!', 'success');
        }
    } catch (error) {
        console.error('Erro na sincronização:', error);
        showStatus(`Falha na sincronização: ${error.message}`, 'error');
    }
}

async function saveData() {
    const content = dataInput.value;
    
    // Salva localmente primeiro
    localStorage.setItem('localData', content);
    
    // Verifica conexão antes de tentar sincronizar
    if (!navigator.onLine) {
        showStatus('Você está offline. Dados salvos localmente.', 'error');
        return;
    }

    try {
        // Verifica validade do token
        const tokenCheck = await fetch('https://api.github.com/user', {
            headers: {
                'Authorization': `token ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!tokenCheck.ok) {
            throw new Error('Token GitHub inválido ou expirado');
        }

        let response;
        const savedGistId = localStorage.getItem('gistId');

        if (savedGistId) {
            // Atualiza Gist existente
            response = await fetch(`https://api.github.com/gists/${savedGistId}`, {
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

            const gist = await response.json();
            localStorage.setItem('gistId', gist.id);
        }

        if (!response.ok) {
            throw new Error('Falha ao salvar no GitHub');
        }

        showStatus('Dados salvos localmente e sincronizados com GitHub!', 'success');
    } catch (error) {
        console.error('Erro ao salvar:', error);
        showStatus(`Dados salvos localmente. Erro no GitHub: ${error.message}`, 'error');
    }
}

// ... [restante do código permanece igual]
