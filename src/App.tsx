import { Route, Routes } from 'react-router';
import { AreaJogador } from './pages/AreaJogador';
import { ContaSuspensa } from './pages/ContaSuspensa';
import { Entrar } from './pages/Entrar';
import { NaoEncontrada } from './pages/NaoEncontrada';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Entrar />} />
      <Route path="/jogador" element={<AreaJogador />} />
      <Route path="/suspensa" element={<ContaSuspensa />} />
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  );
}
