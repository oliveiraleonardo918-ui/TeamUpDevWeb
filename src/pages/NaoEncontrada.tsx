import { Link } from 'react-router';
import { Layout } from '../components/Layout';

export function NaoEncontrada() {
  return (
    <Layout>
      <section className="flex flex-col items-center gap-4 pt-16 text-center">
        <h1 className="text-2xl font-bold">Página não encontrada</h1>
        <p className="text-md text-texto-suave">O endereço que você abriu não existe.</p>
        <Link to="/" className="font-bold text-destaque underline-offset-4 hover:underline">
          Voltar para o início
        </Link>
      </section>
    </Layout>
  );
}
