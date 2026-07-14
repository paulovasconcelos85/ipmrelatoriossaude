'use client';

import { useActionState, useState, type ChangeEvent } from 'react';
import { useFormStatus } from 'react-dom';
import { criarViagemIpm } from '../actions';
import { ATENDIMENTOS_GRUPOS } from '@/lib/atendimentos-fields';
import { atualizarListaDinamica, atualizarListaVoluntarios, type LinhaVoluntario } from '@/lib/campos-dinamicos';
import type { Lookup, Profissional } from '@/lib/viagens-ipm';

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-blue-900 px-6 py-3 text-base font-bold text-white shadow-sm transition-all duration-150 hover:bg-blue-800 active:scale-95 disabled:opacity-60 disabled:active:scale-100"
    >
      {pending ? 'Salvando...' : 'Salvar viagem'}
    </button>
  );
}

export default function NovaViagemForm({
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
  const [estado, formAction] = useActionState(criarViagemIpm, undefined);
  const [tipoTransporte, setTipoTransporte] = useState('');
  const ehTransporteAquatico = tipoTransporte.trim().toLowerCase() === 'barco';

  const [parceirosDigitados, setParceirosDigitados] = useState<string[]>(['']);

  function alterarParceiro(index: number, valor: string) {
    setParceirosDigitados((atual) => atualizarListaDinamica(atual, index, valor));
  }

  const [coordenadoresDigitados, setCoordenadoresDigitados] = useState<string[]>(['']);

  function alterarCoordenador(index: number, valor: string) {
    setCoordenadoresDigitados((atual) => atualizarListaDinamica(atual, index, valor));
  }

  const [lideresDigitados, setLideresDigitados] = useState<string[]>(['']);

  function alterarLider(index: number, valor: string) {
    setLideresDigitados((atual) => atualizarListaDinamica(atual, index, valor));
  }

  const [comunidadesDigitadas, setComunidadesDigitadas] = useState<string[]>(['']);

  function alterarComunidade(index: number, valor: string) {
    setComunidadesDigitadas((atual) => atualizarListaDinamica(atual, index, valor));
  }

  const [voluntariosDigitados, setVoluntariosDigitados] = useState<LinhaVoluntario[]>([
    { nome: '', funcao: '', observacao: '' },
  ]);

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
            Tipo de missão
            <input
              type="text"
              name="tipo_missao"
              list="lista-tipos-missao"
              placeholder="Viagem de barco, Avanço Missionário, Ação missionária..."
              autoComplete="off"
              className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
            />
            <datalist id="lista-tipos-missao">
              {tiposMissao.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Área
            <input
              type="text"
              name="area"
              list="lista-areas"
              placeholder="Rio Negro, Baixo Amazonas..."
              autoComplete="off"
              className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
            />
            <datalist id="lista-areas">
              {areas.map((a) => (
                <option key={a} value={a} />
              ))}
            </datalist>
          </label>
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Local
            <input
              type="text"
              name="local"
              list="lista-locais"
              autoComplete="off"
              className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
            />
            <datalist id="lista-locais">
              {locais.map((l) => (
                <option key={l} value={l} />
              ))}
            </datalist>
          </label>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <span className="text-sm font-semibold text-slate-600">Comunidades atendidas</span>
            {comunidadesDigitadas.map((valor, i) => (
              <input
                key={i}
                type="text"
                name="comunidades"
                list="lista-comunidades"
                value={valor}
                onChange={(e) => alterarComunidade(i, e.target.value)}
                placeholder={i === 0 ? 'Nome da comunidade, vila...' : 'Adicionar outra comunidade...'}
                autoComplete="off"
                className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
              />
            ))}
            <datalist id="lista-comunidades">
              {comunidades.map((c) => (
                <option key={c.id} value={c.nome} />
              ))}
            </datalist>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-blue-900">Transporte</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
            Tipo de transporte
            <input
              type="text"
              name="tipo_transporte"
              list="lista-tipos-transporte"
              autoComplete="off"
              value={tipoTransporte}
              onChange={(e) => setTipoTransporte(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
            />
            <datalist id="lista-tipos-transporte">
              {tiposTransporte.map((t) => (
                <option key={t.id} value={t.nome} />
              ))}
            </datalist>
          </label>
          {ehTransporteAquatico && (
            <label className="flex flex-col gap-1 text-sm font-semibold text-slate-600">
              Barco
              <input
                type="text"
                name="barco"
                list="lista-barcos"
                autoComplete="off"
                className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
              />
              <datalist id="lista-barcos">
                {barcos.map((b) => (
                  <option key={b.id} value={b.nome} />
                ))}
              </datalist>
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
              <input
                key={i}
                type="text"
                name="coordenadores"
                list="lista-profissionais"
                value={valor}
                onChange={(e) => alterarCoordenador(i, e.target.value)}
                placeholder={i === 0 ? 'Nome do coordenador' : 'Adicionar outro coordenador...'}
                autoComplete="off"
                className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
              />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-600">Líder(es) da equipe de saúde</span>
            {lideresDigitados.map((valor, i) => (
              <input
                key={i}
                type="text"
                name="lideres_saude"
                list="lista-profissionais"
                value={valor}
                onChange={(e) => alterarLider(i, e.target.value)}
                placeholder={i === 0 ? 'Nome do líder de saúde' : 'Adicionar outro líder...'}
                autoComplete="off"
                className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
              />
            ))}
          </div>
          <datalist id="lista-profissionais">
            {profissionais.map((p) => (
              <option key={p.id} value={p.nome} />
            ))}
          </datalist>
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
                    <div className="relative">
                      <input
                        type="text"
                        name="voluntario_funcao"
                        list="lista-funcoes-voluntario"
                        value={linha.funcao}
                        onChange={(e) => alterarVoluntario(i, 'funcao', e.target.value)}
                        placeholder="Toque para ver os cargos já usados..."
                        autoComplete="off"
                        className="w-full rounded-lg border border-slate-300 py-2 pl-3 pr-8 text-base text-slate-900"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        aria-label="Ver cargos já usados"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as
                            | (HTMLInputElement & { showPicker?: () => void })
                            | null;
                          input?.focus();
                          input?.showPicker?.();
                        }}
                        className="absolute inset-y-0 right-0 flex w-8 items-center justify-center text-slate-400"
                      >
                        ▾
                      </button>
                    </div>
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                    Nome
                    <input
                      type="text"
                      name="voluntario_nome"
                      list={`lista-profissionais-voluntario-${i}`}
                      value={linha.nome}
                      onChange={(e) => alterarVoluntario(i, 'nome', e.target.value)}
                      placeholder="Escolha o cargo para filtrar os nomes"
                      autoComplete="off"
                      className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
                    />
                    <datalist id={`lista-profissionais-voluntario-${i}`}>
                      {profissionaisDoCargo.map((p) => (
                        <option key={p.id} value={p.nome} />
                      ))}
                    </datalist>
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
        <datalist id="lista-funcoes-voluntario">
          {funcoesVoluntario.map((f) => (
            <option key={f} value={f} />
          ))}
        </datalist>
      </section>

      <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-blue-900">Parceiros</h2>
        <div className="flex flex-col gap-2">
          {parceirosDigitados.map((valor, i) => (
            <input
              key={i}
              type="text"
              name="parceiros"
              list="lista-parceiros"
              value={valor}
              onChange={(e) => alterarParceiro(i, e.target.value)}
              placeholder={i === 0 ? 'Nome do parceiro' : 'Adicionar outro parceiro...'}
              autoComplete="off"
              className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
            />
          ))}
        </div>
        <datalist id="lista-parceiros">
          {parceiros.map((p) => (
            <option key={p.id} value={p.nome} />
          ))}
        </datalist>
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
