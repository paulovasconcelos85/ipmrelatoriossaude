import Link from 'next/link';
import { notFound } from 'next/navigation';
import EditarViagemForm from './EditarViagemForm';
import {
  getViagemIpmPorId,
  listTiposTransporte,
  listBarcos,
  listParceiros,
  listProfissionais,
  listComunidades,
  listTiposMissao,
  listAreas,
  listLocais,
  listFuncoesVoluntario,
} from '@/lib/viagens-ipm';

export const dynamic = 'force-dynamic';

export default async function EditarViagem({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [viagem, tiposTransporte, barcos, parceiros, profissionais, comunidades, tiposMissao, areas, locais, funcoesVoluntario] =
    await Promise.all([
      getViagemIpmPorId(id),
      listTiposTransporte(),
      listBarcos(),
      listParceiros(),
      listProfissionais(),
      listComunidades(),
      listTiposMissao(),
      listAreas(),
      listLocais(),
      listFuncoesVoluntario(),
    ]);

  if (!viagem) notFound();

  return (
    <>
      <header className="sticky top-0 z-10 bg-blue-900 px-4 py-4 shadow-md">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-extrabold leading-tight text-white sm:text-2xl">
              Editar viagem
            </h1>
            <Link href="/admin" className="text-sm font-semibold text-blue-100 underline underline-offset-2">
              ← Voltar para a lista
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-6">
        <EditarViagemForm
          viagem={viagem}
          tiposTransporte={tiposTransporte}
          barcos={barcos}
          parceiros={parceiros}
          profissionais={profissionais}
          comunidades={comunidades}
          tiposMissao={tiposMissao}
          areas={areas}
          locais={locais}
          funcoesVoluntario={funcoesVoluntario}
        />
      </main>
    </>
  );
}
