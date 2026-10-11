import { Route, Routes } from 'react-router';
import { Entrar } from './pages/Entrar';
import { NaoEncontrada } from './pages/NaoEncontrada';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Entrar />} />
      <Route path="*" element={<NaoEncontrada />} />
    </Routes>
  );
}
