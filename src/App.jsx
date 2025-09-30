import './index.css';
import { useGoogleLogin } from '@react-oauth/google';
import { useState, useMemo } from 'react';
import logo from './assets/logo.png';

// --- DICIONÁRIOS DE DADOS ---
const obras = { 'REB': '3Z Rebouças' };
const disciplinas = { 'HID': 'Hidráulica', 'ELE': 'Elétrica', 'LEE': 'Leed' };
const tiposDocumento = { 'PE': 'Projeto Executivo' };

function App() {
  const [accessToken, setAccessToken] = useState(null);
  const [allFiles, setAllFiles] = useState([]);
  const [filtroObra, setFiltroObra] = useState('');
  const [filtroDisciplina, setFiltroDisciplina] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [termoBusca, setTermoBusca] = useState(''); // Estado para a barra de pesquisa

  const login = useGoogleLogin({
    onSuccess: (tokenResponse) => {
      setAccessToken(tokenResponse.access_token);
      fetchFiles(tokenResponse.access_token);
    },
    scope: 'https://www.googleapis.com/auth/drive',
  } );

  const fetchFiles = async (token) => {
    const folderId = '1k0xPyN3MMCdGhJZZJEIVwHYlQ8ETRvDF'; 
    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    
    // Garantindo que 'thumbnailLink' está na lista de campos
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink,thumbnailLink )`;

    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await response.json();
    setAllFiles(data.files || []);
  };

  const arquivosFiltrados = useMemo(() => {
    return allFiles
      .map(file => {
        const parts = file.name.split('-');
        return {
          ...file,
          obraCode: parts[0],
          disciplinaCode: parts[1],
          tipoCode: parts[2],
        };
      })
      .filter(file => {
        // Filtros de dropdown
        const passaFiltroObra = !filtroObra || file.obraCode === filtroObra;
        const passaFiltroDisciplina = !filtroDisciplina || file.disciplinaCode === filtroDisciplina;
        const passaFiltroTipo = !filtroTipo || file.tipoCode === filtroTipo;

        // Filtro de busca por texto
        const passaFiltroBusca = !termoBusca || file.name.toLowerCase().includes(termoBusca.toLowerCase());

        return passaFiltroObra && passaFiltroDisciplina && passaFiltroTipo && passaFiltroBusca;
      });
  }, [allFiles, filtroObra, filtroDisciplina, filtroTipo, termoBusca]); // Adicionado termoBusca aqui

  return (
    <div className="container">
      <header className="header">
        <img src={logo} alt="Logo EasyDocs" />
      </header>
      
      {!accessToken && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button className="login-button" onClick={() => login()}>
            <span>🚀</span> Fazer Login com o Google
          </button>
        </div>
      )}

      {accessToken && (
        <div>
          <div className="filtros">
            <input
              type="text"
              placeholder="🔎 Pesquisar por nome..."
              className="barra-pesquisa"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
            />
            <select onChange={(e) => setFiltroObra(e.target.value)} value={filtroObra}>
              <option value="">Todas as Obras</option>
              {Object.entries(obras).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>

            <select onChange={(e) => setFiltroDisciplina(e.target.value)} value={filtroDisciplina}>
              <option value="">Todas as Disciplinas</option>
              {Object.entries(disciplinas).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>

            <select onChange={(e) => setFiltroTipo(e.target.value)} value={filtroTipo}>
              <option value="">Todos os Tipos</option>
              {Object.entries(tiposDocumento).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>

          <div className="grid-arquivos">
            {arquivosFiltrados.map((file) => (
              <a
                key={file.id}
                href={file.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="item-arquivo"
              >
                <div className="card-arquivo">
                  {file.thumbnailLink ? (
                    <img src={file.thumbnailLink} alt={`Pré-visualização de ${file.name}`} />
                  ) : (
                    <div style={{ padding: '10px', fontSize: '0.8rem', color: '#888' }}>
                      Sem pré-visualização
                    </div>
                  )}
                </div>
                <div className="nome-arquivo">
                  {file.name}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
