import { Route, Routes } from 'react-router';
import { AreaJogador } from './pages/AreaJogador';
import { Buscar } from './pages/Buscar';
import { Convites } from './pages/Convites';
import { ContaSuspensa } from './pages/ContaSuspensa';
import { EditarPerfil } from './pages/EditarPerfil';
import { Entrar } from './pages/Entrar';
import { Match } from './pages/Match';
import { Matches } from './pages/Matches';
import { NaoEncontrada } from './pages/NaoEncontrada';
import { PerfilJogador } from './pages/PerfilJogador';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Entrar />} />
      <Route path="/jogador" element={<AreaJogador />} />
      <Route path="/perfil/:etapa" element={<EditarPerfil />} />
      <Route path="/buscar" element={<Buscar />} />
      <Route path="/jogadores/:id" element={<PerfilJogador />} />
      <Route path="/convites" element={<Convites />} />
      <Route path="/matches" element={<Matches />} />
      <Route path="/matches/:id" element={<Match />} />
      <Route path="/suspensa" element={<ContaSuspensa />} />
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  );
}
