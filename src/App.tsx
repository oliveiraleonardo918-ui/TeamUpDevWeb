import { Route, Routes } from 'react-router';
import { AreaJogador } from './pages/AreaJogador';
import { Avaliar } from './pages/Avaliar';
import { Buscar } from './pages/Buscar';
import { Convites } from './pages/Convites';
import { ContaSuspensa } from './pages/ContaSuspensa';
import { EditarPerfil } from './pages/EditarPerfil';
import { Entrar } from './pages/Entrar';
import { Equipe } from './pages/Equipe';
import { Match } from './pages/Match';
import { Matches } from './pages/Matches';
import { Moderacao } from './pages/Moderacao';
import { NaoEncontrada } from './pages/NaoEncontrada';
import { PerfilJogador } from './pages/PerfilJogador';
import { Privacidade } from './pages/Privacidade';
import { Termos } from './pages/Termos';

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
      <Route path="/matches/:id/avaliar" element={<Avaliar />} />
      <Route path="/moderacao" element={<Moderacao />} />
      <Route path="/moderacao/equipe" element={<Equipe />} />
      <Route path="/termos" element={<Termos />} />
      <Route path="/privacidade" element={<Privacidade />} />
      <Route path="/suspensa" element={<ContaSuspensa />} />
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  );
}
