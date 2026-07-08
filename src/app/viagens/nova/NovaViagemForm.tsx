'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { criarViagemIpm } from '../actions';
import { ATENDIMENTOS_GRUPOS } from '@/lib/atendimentos-fields';
import type { Lookup, Profissional } from '@/lib/viagens-ipm';

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-blue-900 px-6 py-3 text-base font-bold text-white shadow-sm disabled:opacity-60"
    >
      {pending ? 'Salvando...' : 'Salvar viagem'}
    </button>
  );
}

function rotuloProfissional(p: Profissional): string {
  return p.cargo ? `${p.nome} (${p.cargo})` : p.nome;
}

export default function NovaViagemForm({
  tiposTransporte,
  barcos,
  parceiros,
  profissionais,
}: {
  tiposTransporte: Lookup[];
  barcos: Lookup[];
  parceiros: Lookup[];
  profissionais: Profissional[];
}) {
  const [estado, formAction] = useActionState(criarViagemIpm, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {estado?.erro && (
        <p className="rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3 text-base text-red-900">
          {estado.erro}
        </p>
      )}

      <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-blue-900">Dados da viagem</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Data de saída *
            <input
              type="date"
              name="data_saida"
              required
              className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Data de chegada
            <input
              type="date"
              name="data_chegada"
              className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Dias em missão
            <input
              type="number"
              name="dias_missao"
              min={0}
              className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Tipo de missão
            <input
              type="text"
              name="tipo_missao"
              placeholder="Viagem de barco, Avanço Missionário, Ação missionária..."
              className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Área
            <input
              type="text"
              name="area"
              placeholder="Rio Negro, Baixo Amazonas..."
              className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Local
            <input
              type="text"
              name="local"
              className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-blue-900">Transporte</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Tipo de transporte
            <select
              name="tipo_transporte_id"
              className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
              defaultValue=""
            >
              <option value="">Selecione...</option>
              {tiposTransporte.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Barco (se houver)
            <select
              name="barco_id"
              className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
              defaultValue=""
            >
              <option value="">Selecione...</option>
              {barcos.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600 sm:col-span-2">
            Ou cadastre um barco novo
            <input
              type="text"
              name="novo_barco"
              placeholder="Nome do barco (deixe vazio se selecionou um acima)"
              className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-blue-900">Equipe</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Coordenador
            <select
              name="coordenador_id"
              className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
              defaultValue=""
            >
              <option value="">Selecione...</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>
                  {rotuloProfissional(p)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Ou novo coordenador
            <input
              type="text"
              name="novo_coordenador"
              className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Líder da equipe de saúde
            <select
              name="lider_saude_id"
              className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
              defaultValue=""
            >
              <option value="">Selecione...</option>
              {profissionais.map((p) => (
                <option key={p.id} value={p.id}>
                  {rotuloProfissional(p)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Ou novo líder de saúde
            <input
              type="text"
              name="novo_lider"
              className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
            />
          </label>
        </div>
      </section>

      <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-blue-900">Parceiros</h2>
        {parceiros.length > 0 && (
          <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
            {parceiros.map((p) => (
              <label key={p.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" name="parceiros" value={p.id} />
                {p.nome}
              </label>
            ))}
          </div>
        )}
        <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
          Novos parceiros (separados por vírgula)
          <input
            type="text"
            name="novos_parceiros"
            placeholder="Amazon Outreach, Igreja Sal da Terra"
            className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
          />
        </label>
      </section>

      <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-blue-900">Observações</h2>
        <textarea
          name="observacoes"
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
        />
      </section>

      <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-blue-900">Atendimentos e atividades</h2>
        <div className="flex flex-col gap-3">
          {ATENDIMENTOS_GRUPOS.map((grupo, i) => (
            <details key={grupo.titulo} open={i === 0} className="rounded-xl border border-slate-200 p-3">
              <summary className="cursor-pointer text-base font-semibold text-slate-700">
                {grupo.titulo}
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {grupo.campos.map((campo) => (
                  <label key={campo.name} className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                    {campo.label}
                    <input
                      type="number"
                      name={campo.name}
                      min={0}
                      defaultValue={0}
                      className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
                    />
                  </label>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <BotaoSalvar />
      </div>
    </form>
  );
}
