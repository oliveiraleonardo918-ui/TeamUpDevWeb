import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { ApiError, buscarMe, type Me } from './api';

/** Usuário logado, para telas que exigem sessão. Sem sessão vai para a entrada; banido (RN07) para /suspensa. */
export function useUsuario(): Me | null {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Me | null>(null);

  useEffect(() => {
    let ativo = true;
    buscarMe()
      .then((u) => ativo && setUsuario(u))
      .catch((e: unknown) => {
        if (!ativo) return;
        const suspensa = e instanceof ApiError && e.status === 403;
        navigate(suspensa ? '/suspensa' : '/', { replace: true });
      });
    return () => {
      ativo = false;
    };
  }, [navigate]);

  return usuario;
}
