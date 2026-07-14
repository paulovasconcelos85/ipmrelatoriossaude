'use client';

import { useActionState, useEffect, useState, type ChangeEvent } from 'react';
import { useFormStatus } from 'react-dom';
import { atualizarViagemIpm } from '../actions';
import { ATENDIMENTOS_GRUPOS } from '@/lib/atendimentos-fields';
import { atualizarListaDinamica, atualizarListaVoluntarios, type LinhaVoluntario } from '@/lib/campos-dinamicos';
import type { Lookup, Profissional, ViagemIpm } from '@/lib/viagens-ipm';
import Combobox from '@/components/Combobox';

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-blue-900 px-6 py-3 text-base font-bold text-white shadow-sm transition-all duration-150 hover:bg-blue-800 active:scale-95 disabled:opacity-60 disabled:active:scale-100"
    >
      {pending ? 'Salvando...' : 'Salvar alterações'}
    </button>
  );
}

export default function EditarViagemForm({
  viagem,
  tiposTransporte,
  barcos,
  parceiros,
  profissionais,
  comunidades,
  tiposMissao,
  areas,
  locais,
  funcoesVoluntario,
}: {
  viagem: ViagemIpm;
  tiposTransporte: Lookup[];
  barcos: Lookup[];
  parceiros: Lookup[];
  profissionais: Profissional[];
  comunidades: Lookup[];
  tiposMissao: string[];
  areas: string[];
  locais: string[];
  funcoesVoluntario: string[];
}) {
  const [estado, formAction] = useActionState(atualizarViagemIpm, undefined);

  useEffect(() => {
    if (estado?.sucesso) {
      window.alert('Alterações salvas com sucesso!');
    }
  }, [estado?.salvoEm, estado?.sucesso]);

  const [tipoTransporte, setTipoTransporte] = useState(viagem.tipo_transporte ?? '');
  const ehTransporteAquatico = tipoTransporte.trim().toLowerCase() === 'barco';

  const [parceirosDigitados, setParceirosDigitados] = useState<string[]>(
    viagem.parceiros.length > 0 ? [...viagem.parceiros, ''] : [''],
  );

  function alterarParceiro(index: number, valor: string) {
    setParceirosDigitados((atual) => atualizarListaDinamica(atual, index, valor));
  }

  const [coordenadoresDigitados, setCoordenadoresDigitados] = useState<string[]>(
    viagem.coordenadores.length > 0 ? [...viagem.coordenadores, ''] : [''],
  );

  function alterarCoordenador(index: number, valor: string) {
    setCoordenadoresDigitados((atual) => atualizarListaDinamica(atual, index, valor));
  }

  const [lideresDigitados, setLideresDigitados] = useState<string[]>(
    viagem.lideres_saude.length > 0 ? [...viagem.lideres_saude, ''] : [''],
  );

  function alterarLider(index: number, valor: string) {
    setLideresDigitados((atual) => atualizarListaDinamica(atual, index, valor));
  }

  const [comunidadesDigitadas, setComunidadesDigitadas] = useState<string[]>(
    viagem.comunidades.length > 0 ? [...viagem.comunidades, ''] : [''],
  );

  function alterarComunidade(index: number, valor: string) {
    setComunidadesDigitadas((atual) => atualizarListaDinamica(atual, index, valor));
  }

  const [voluntariosDigitados, setVoluntariosDigitados] = useState<LinhaVoluntario[]>(
    viagem.voluntarios.length > 0
      ? [
          ...viagem.voluntarios.map((v) => ({ nome: v.nome, funcao: v.funcao ?? '', observacao: v.observacao ?? '' })),
          { nome: '', funcao: '', observacao: '' },
        ]
      : [{ nome: '', funcao: '', observacao: '' }],
  );

  function alterarVoluntario(index: number, campo: keyof LinhaVoluntario, valor: string) {
    setVoluntariosDigitados((atual) => atualizarListaVoluntarios(atual, index, campo, valor));
  }

  function somarFaixasEtarias(e: ChangeEvent<HTMLDivElement>) {
    const alvo = e.target as HTMLInputElement;
    const grupo = ATENDIMENTOS_GRUPOS.find((g) => g.somaAutomatica?.parcelas.includes(alvo.name));
    const soma = grupo?.somaAutomatica;
    const form = alvo.form;
    if (!soma || !form) return;

    const total = soma.parcelas.reduce((acc, nome) => {
      const campo = form.elements.namedItem(nome) as HTMLInputElement | null;
      const valor = campo ? parseInt(campo.value, 10) : 0;
      return acc + (Number.isNaN(valor) ? 0 : valor);
    }, 0);

    const campoTotal = form.elements.namedItem(soma.total) as HTMLInputElement | null;
    if (campoTotal) campoTotal.value = String(total);
  }

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="viagem_id" value={viagem.id} />

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
              defaultValue={viagem.data_saida}
              className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Data de chegada
            <input
              type="date"
              name="data_chegada"
              defaultValue={viagem.data_chegada ?? ''}
              className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Tipo de missão
            <Combobox
              name="tipo_missao"
              options={tiposMissao}
              defaultValue={viagem.tipo_missao ?? ''}
              placeholder="Viagem de barco, Avanço Missionário, Ação missionária..."
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Área
            <Combobox
              name="area"
              options={areas}
              defaultValue={viagem.area ?? ''}
              placeholder="Rio Negro, Baixo Amazonas..."
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Local
            <Combobox name="local" options={locais} defaultValue={viagem.local ?? ''} />
          </label>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-sm font-semibold text-slate-600">Comunidades atendidas</span>
            {comunidadesDigitadas.map((valor, i) => (
              <Combobox
                key={i}
                name="comunidades"
                options={comunidades.map((c) => c.nome)}
                value={valor}
                onValueChange={(v) => alterarComunidade(i, v)}
                placeholder={i === 0 ? 'Nome da comunidade, vila...' : 'Adicionar outra comunidade...'}
              />
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-600 sm:col-span-2">
            <input type="checkbox" name="cancelada" defaultChecked={viagem.cancelada} />
            Viagem cancelada
          </label>
        </div>
      </section>

      <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-blue-900">Transporte</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Tipo de transporte
            <Combobox
              name="tipo_transporte"
              options={tiposTransporte.map((t) => t.nome)}
              value={tipoTransporte}
              onValueChange={setTipoTransporte}
            />
          </label>
          {ehTransporteAquatico && (
            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
              Barco
              <Combobox name="barco" options={barcos.map((b) => b.nome)} defaultValue={viagem.barco ?? ''} />
            </label>
          )}
        </div>
      </section>

      <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-blue-900">Equipe</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-600">Coordenador(es)</span>
            {coordenadoresDigitados.map((valor, i) => (
              <Combobox
                key={i}
                name="coordenadores"
                options={profissionais.map((p) => p.nome)}
                value={valor}
                onValueChange={(v) => alterarCoordenador(i, v)}
                placeholder={i === 0 ? 'Nome do coordenador' : 'Adicionar outro coordenador...'}
              />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-600">Líder(es) da equipe de saúde</span>
            {lideresDigitados.map((valor, i) => (
              <Combobox
                key={i}
                name="lideres_saude"
                options={profissionais.map((p) => p.nome)}
                value={valor}
                onValueChange={(v) => alterarLider(i, v)}
                placeholder={i === 0 ? 'Nome do líder de saúde' : 'Adicionar outro líder...'}
              />
            ))}
          </div>
        </div>

        <h3 className="mb-3 mt-6 text-sm font-bold text-slate-700">Profissionais que foram na viagem</h3>
        <div className="flex flex-col gap-4">
          {voluntariosDigitados.map((linha, i) => {
            const cargoDigitado = linha.funcao.trim().toLowerCase();
            const profissionaisDoCargo = cargoDigitado
              ? profissionais.filter((p) => p.cargo?.trim().toLowerCase() === cargoDigitado)
              : profissionais;

            return (
              <div key={i} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                    Cargo/função
                    <Combobox
                      name="voluntario_funcao"
                      options={funcoesVoluntario}
                      value={linha.funcao}
                      onValueChange={(v) => alterarVoluntario(i, 'funcao', v)}
                      placeholder="Toque para ver os cargos já usados..."
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                    Nome
                    <Combobox
                      name="voluntario_nome"
                      options={profissionaisDoCargo.map((p) => p.nome)}
                      value={linha.nome}
                      onValueChange={(v) => alterarVoluntario(i, 'nome', v)}
                      placeholder="Escolha o cargo para filtrar os nomes"
                    />
                  </label>
                </div>
                <details open={linha.observacao.trim() !== ''}>
                  <summary className="cursor-pointer text-xs font-semibold text-blue-700">
                    {linha.observacao.trim() !== '' ? 'Observação' : '+ Adicionar observação'}
                  </summary>
                  <textarea
                    name="voluntario_observacao"
                    value={linha.observacao}
                    onChange={(e) => alterarVoluntario(i, 'observacao', e.target.value)}
                    placeholder="Auxiliando na triagem, na Farmácia..."
                    rows={2}
                    className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
                  />
                </details>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-blue-900">Parceiros</h2>
        <div className="flex flex-col gap-2">
          {parceirosDigitados.map((valor, i) => (
            <Combobox
              key={i}
              name="parceiros"
              options={parceiros.map((p) => p.nome)}
              value={valor}
              onValueChange={(v) => alterarParceiro(i, v)}
              placeholder={i === 0 ? 'Nome do parceiro' : 'Adicionar outro parceiro...'}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-blue-900">Observações</h2>
        <textarea
          name="observacoes"
          rows={3}
          defaultValue={viagem.observacoes ?? ''}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
        />
      </section>

      <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-blue-900">Atendimentos e atividades</h2>
        <div className="flex flex-col gap-3" onChange={somarFaixasEtarias}>
          {ATENDIMENTOS_GRUPOS.map((grupo) => (
            <details
              key={grupo.titulo}
              open={grupo.destaque}
              className={
                grupo.destaque
                  ? 'rounded-xl border-2 border-blue-300 bg-blue-50/50 p-3'
                  : 'rounded-xl border border-slate-200 p-3'
              }
            >
              <summary
                className={
                  grupo.destaque
                    ? 'cursor-pointer text-base font-bold text-blue-900'
                    : 'cursor-pointer text-base font-semibold text-slate-700'
                }
              >
                {grupo.titulo}
              </summary>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {grupo.campos.map((campo) => (
                  <label
                    key={campo.name}
                    className={
                      campo.destaque
                        ? 'flex flex-col gap-1 rounded-lg bg-blue-100 px-2 py-1.5 text-xs font-bold text-blue-900'
                        : 'flex flex-col gap-1 text-xs font-semibold text-slate-500'
                    }
                  >
                    {campo.label}
                    <input
                      type="number"
                      name={campo.name}
                      min={0}
                      defaultValue={viagem.atendimentos[campo.name] ?? 0}
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
