import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiError } from './api';

/**
 * Carrega dados de uma rota que exige sessão. Sem sessão vai para a entrada; banido (RN07) para /suspensa.
 * `buscar` precisa ser estável (função de módulo, não criada a cada render).
 */
export function useProtegido<T>(buscar: () => Promise<T>) {
  const navigate = useNavigate();
  const [dados, setDados] = useState<T | null>(null);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    buscar()
      .then((d) => ativo && setDados(d))
      .catch((e: unknown) => {
        if (!ativo) return;
        if (e instanceof ApiError && e.status === 401) navigate('/', { replace: true });
        else if (e instanceof ApiError && e.status === 403) navigate('/suspensa', { replace: true });
        else setErro(true);
      });
    return () => {
      ativo = false;
    };
  }, [buscar, navigate, tentativa]);

  function recarregar() {
    setErro(false);
    setTentativa((n) => n + 1);
  }

  return { dados, erro, recarregar };
}
