import { Route, Routes } from 'react-router';
import { AreaJogador } from './pages/AreaJogador';
import { Buscar } from './pages/Buscar';
import { ContaSuspensa } from './pages/ContaSuspensa';
import { EditarPerfil } from './pages/EditarPerfil';
import { Entrar } from './pages/Entrar';
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
      <Route path="/suspensa" element={<ContaSuspensa />} />
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  );
}
