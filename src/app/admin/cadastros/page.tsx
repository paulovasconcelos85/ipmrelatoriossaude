import Link from 'next/link';
import ListaSimples from './ListaSimples';
import ListaParceiros from './ListaParceiros';
import ListaProfissionais from './ListaProfissionais';
import {
  listTiposTransporte,
  listBarcos,
  listComunidades,
  listParceirosCompletos,
  listProfissionais,
} from '@/lib/viagens-ipm';

export const dynamic = 'force-dynamic';

export default async function CadastrosAdmin() {
  const [tiposTransporte, barcos, comunidades, parceiros, profissionais] = await Promise.all([
    listTiposTransporte(),
    listBarcos(),
    listComunidades(),
    listParceirosCompletos(),
    listProfissionais(),
  ]);

  return (
    <>
      <header className="sticky top-0 z-10 bg-primary-900 px-4 py-4 shadow-md sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">Cadastros</h1>
          <Link href="/" className="text-sm font-semibold text-primary-100 underline underline-offset-2">
            ← Voltar para viagens
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 pb-16 pt-6">
        <ListaProfissionais itens={profissionais} />
        <ListaParceiros itens={parceiros} />
        <ListaSimples tabela="barcos" titulo="Barcos" itens={barcos} />
        <ListaSimples tabela="tipos_transporte" titulo="Tipos de transporte" itens={tiposTransporte} />
        <ListaSimples tabela="comunidades" titulo="Comunidades / locais atendidos" itens={comunidades} />
      </main>
    </>
  );
}
