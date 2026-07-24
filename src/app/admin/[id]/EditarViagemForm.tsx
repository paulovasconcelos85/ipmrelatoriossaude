'use client';

import { useActionState, useEffect, useState, type ChangeEvent } from 'react';
import { useFormStatus } from 'react-dom';
import { atualizarViagemIpm } from '../actions';
import { ATENDIMENTOS_GRUPOS, type ChaveGrupoDinamico } from '@/lib/atendimentos-fields';
import {
  atualizarListaDinamica,
  atualizarListaEstatisticas,
  atualizarFuncaoGrupoVoluntario,
  atualizarPessoaGrupoVoluntario,
  agruparVoluntariosExistentes,
  type LinhaEstatistica,
  type LinhaGrupoVoluntario,
} from '@/lib/campos-dinamicos';
import type { Lookup, Profissional, ViagemIpm } from '@/lib/viagens-ipm';
import Combobox from '@/components/Combobox';

function BotaoSalvar() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-accent-500 px-6 py-3 text-base font-bold text-white shadow-sm transition-all duration-150 hover:bg-accent-600 active:scale-95 disabled:opacity-60 disabled:active:scale-100"
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
  camposEstatisticos,
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
  camposEstatisticos: Record<string, string[]>;
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

  const [lideresEquipeParceiraDigitados, setLideresEquipeParceiraDigitados] = useState<string[]>(
    viagem.lideres_equipe_parceira.length > 0 ? [...viagem.lideres_equipe_parceira, ''] : [''],
  );

  function alterarLiderEquipeParceira(index: number, valor: string) {
    setLideresEquipeParceiraDigitados((atual) => atualizarListaDinamica(atual, index, valor));
  }

  const [comunidadesDigitadas, setComunidadesDigitadas] = useState<string[]>(
    viagem.comunidades.length > 0 ? [...viagem.comunidades, ''] : [''],
  );

  function alterarComunidade(index: number, valor: string) {
    setComunidadesDigitadas((atual) => atualizarListaDinamica(atual, index, valor));
  }

  const [gruposVoluntarios, setGruposVoluntarios] = useState<LinhaGrupoVoluntario[]>(() =>
    agruparVoluntariosExistentes(viagem.voluntarios),
  );

  function alterarFuncaoGrupo(index: number, valor: string) {
    setGruposVoluntarios((atual) => atualizarFuncaoGrupoVoluntario(atual, index, valor));
  }

  function alterarPessoaGrupo(grupoIndex: number, pessoaIndex: number, campo: 'nome' | 'observacao', valor: string) {
    setGruposVoluntarios((atual) => atualizarPessoaGrupoVoluntario(atual, grupoIndex, pessoaIndex, campo, valor));
  }

  function itensIniciais(chave: ChaveGrupoDinamico): LinhaEstatistica[] {
    const itens = viagem.atendimentosExtras
      .filter((item) => item.grupo === chave)
      .map((item) => ({ nome: item.nome, quantidade: String(item.quantidade) }));
    return [...itens, { nome: '', quantidade: '' }];
  }

  const [itensAtividadeSaude, setItensAtividadeSaude] = useState<LinhaEstatistica[]>(() =>
    itensIniciais('atividades_procedimentos_saude'),
  );
  const [itensAssistenciaSocial, setItensAssistenciaSocial] = useState<LinhaEstatistica[]>(() =>
    itensIniciais('assistencia_social_doacoes'),
  );
  const [itensEspecialidadesMedicas, setItensEspecialidadesMedicas] = useState<LinhaEstatistica[]>(() =>
    itensIniciais('especialidades_medicas'),
  );
  const [itensOutrosAtendimentosSaude, setItensOutrosAtendimentosSaude] = useState<LinhaEstatistica[]>(() =>
    itensIniciais('outros_atendimentos_saude'),
  );
  const [itensAtividadesEvangelisticas, setItensAtividadesEvangelisticas] = useState<LinhaEstatistica[]>(() =>
    itensIniciais('atividades_evangelisticas'),
  );

  const itensPorGrupoDinamico: Record<ChaveGrupoDinamico, LinhaEstatistica[]> = {
    atividades_procedimentos_saude: itensAtividadeSaude,
    assistencia_social_doacoes: itensAssistenciaSocial,
    especialidades_medicas: itensEspecialidadesMedicas,
    outros_atendimentos_saude: itensOutrosAtendimentosSaude,
    atividades_evangelisticas: itensAtividadesEvangelisticas,
  };
  const setItensPorGrupoDinamico: Record<ChaveGrupoDinamico, (v: LinhaEstatistica[]) => void> = {
    atividades_procedimentos_saude: setItensAtividadeSaude,
    assistencia_social_doacoes: setItensAssistenciaSocial,
    especialidades_medicas: setItensEspecialidadesMedicas,
    outros_atendimentos_saude: setItensOutrosAtendimentosSaude,
    atividades_evangelisticas: setItensAtividadesEvangelisticas,
  };

  function alterarItemEstatistica(
    chave: ChaveGrupoDinamico,
    index: number,
    campo: keyof LinhaEstatistica,
    valor: string,
  ) {
    const setItens = setItensPorGrupoDinamico[chave];
    setItens(atualizarListaEstatisticas(itensPorGrupoDinamico[chave], index, campo, valor));
  }

  function calcularEnfermagemAutomatica(form: HTMLFormElement) {
    const valor = (nome: string) => {
      const campo = form.elements.namedItem(nome) as HTMLInputElement | null;
      const numero = campo ? parseInt(campo.value, 10) : 0;
      return Number.isNaN(numero) ? 0 : numero;
    };
    const definir = (nome: string, numero: number) => {
      const campo = form.elements.namedItem(nome) as HTMLInputElement | null;
      if (campo) campo.value = String(numero);
    };

    const criancas = valor('criancas_medico') + valor('criancas_odonto');
    const adolescentes = valor('adolescentes_medico') + valor('adolescentes_odonto');
    const adultos = valor('adultos_medico') + valor('adultos_odonto');

    definir('criancas_enfermagem', criancas);
    definir('adolescentes_enfermagem', adolescentes);
    definir('adultos_enfermagem', adultos);
    definir('atendimentos_enfermagem', criancas + adolescentes + adultos);
    definir('procedimentos_enfermagem', criancas * 3 + adolescentes * 3 + adultos * 5);
  }

  function somarFaixasEtarias(e: ChangeEvent<HTMLDivElement>) {
    const alvo = e.target as HTMLInputElement;
    const form = alvo.form;
    if (!form) return;

    const grupo = ATENDIMENTOS_GRUPOS.find((g) => g.somaAutomatica?.parcelas.includes(alvo.name));
    const soma = grupo?.somaAutomatica;
    if (soma) {
      const total = soma.parcelas.reduce((acc, nome) => {
        const campo = form.elements.namedItem(nome) as HTMLInputElement | null;
        const valor = campo ? parseInt(campo.value, 10) : 0;
        return acc + (Number.isNaN(valor) ? 0 : valor);
      }, 0);

      const campoTotal = form.elements.namedItem(soma.total) as HTMLInputElement | null;
      if (campoTotal) campoTotal.value = String(total);
    }

    const grupoOrigem = ATENDIMENTOS_GRUPOS.find((g) => g.campos.some((c) => c.name === alvo.name));
    if (grupoOrigem?.titulo === 'Atendimento médico' || grupoOrigem?.titulo === 'Atendimento odontológico') {
      calcularEnfermagemAutomatica(form);
    }
  }

  function renderListaDinamica(dinamico: { chave: ChaveGrupoDinamico; campoNome: string; campoQtd: string }) {
    return (
      <div className="mt-3 flex flex-col gap-2">
        {itensPorGrupoDinamico[dinamico.chave].map((linha, i) => (
          <div key={i} className="flex gap-2">
            <Combobox
              name={dinamico.campoNome}
              options={camposEstatisticos[dinamico.chave] ?? []}
              value={linha.nome}
              onValueChange={(v) => alterarItemEstatistica(dinamico.chave, i, 'nome', v)}
              placeholder={i === 0 ? 'Nome do item (ex.: Curativos)' : 'Adicionar outro item...'}
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
            />
            <input
              type="number"
              name={dinamico.campoQtd}
              min={0}
              value={linha.quantidade}
              onChange={(e) => alterarItemEstatistica(dinamico.chave, i, 'quantidade', e.target.value)}
              placeholder="Qtd"
              className="w-24 rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900"
            />
          </div>
        ))}
      </div>
    );
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
        <h2 className="mb-4 text-lg font-bold text-primary-900">Dados da viagem</h2>
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
        <h2 className="mb-4 text-lg font-bold text-primary-900">Transporte</h2>
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
        <h2 className="mb-4 text-lg font-bold text-primary-900">Equipe</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-slate-600">Líder(es) da equipe parceira</span>
            {lideresEquipeParceiraDigitados.map((valor, i) => (
              <Combobox
                key={i}
                name="lideres_equipe_parceira"
                options={profissionais.map((p) => p.nome)}
                value={valor}
                onValueChange={(v) => alterarLiderEquipeParceira(i, v)}
                placeholder={i === 0 ? 'Nome do líder da equipe parceira' : 'Adicionar outro líder...'}
              />
            ))}
          </div>
        </div>

        <h3 className="mb-3 mt-6 text-sm font-bold text-slate-700">Profissionais que foram na viagem</h3>
        <p className="mb-3 -mt-2 text-xs text-slate-500">
          Escolha o cargo/função uma vez e adicione todos os nomes que exercem essa função na viagem.
        </p>
        <div className="flex flex-col gap-4">
          {gruposVoluntarios.map((grupo, gi) => {
            const cargoDigitado = grupo.funcao.trim().toLowerCase();
            const profissionaisDoCargo = cargoDigitado
              ? profissionais.filter((p) => p.cargo?.trim().toLowerCase() === cargoDigitado)
              : profissionais;

            return (
              <div key={gi} className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4">
                <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                  Cargo/função
                  <Combobox
                    name={`voluntario_funcao_display_${gi}`}
                    options={funcoesVoluntario}
                    value={grupo.funcao}
                    onValueChange={(v) => alterarFuncaoGrupo(gi, v)}
                    placeholder="Toque para ver os cargos já usados..."
                  />
                </label>
                <div className="flex flex-col gap-3">
                  <span className="text-xs font-semibold text-slate-500">Nome(s)</span>
                  {grupo.pessoas.map((pessoa, pi) => (
                    <div key={pi} className="flex flex-col gap-2 rounded-lg border border-slate-100 p-3">
                      <input type="hidden" name="voluntario_funcao" value={grupo.funcao} />
                      <Combobox
                        name="voluntario_nome"
                        options={profissionaisDoCargo.map((p) => p.nome)}
                        value={pessoa.nome}
                        onValueChange={(v) => alterarPessoaGrupo(gi, pi, 'nome', v)}
                        placeholder={pi === 0 ? 'Escolha o cargo para filtrar os nomes' : 'Adicionar outro nome...'}
                      />
                      <details open={pessoa.observacao.trim() !== ''}>
                        <summary className="cursor-pointer text-xs font-semibold text-primary-700">
                          {pessoa.observacao.trim() !== '' ? 'Observação' : '+ Adicionar observação'}
                        </summary>
                        <textarea
                          name="voluntario_observacao"
                          value={pessoa.observacao}
                          onChange={(e) => alterarPessoaGrupo(gi, pi, 'observacao', e.target.value)}
                          placeholder="Auxiliando na triagem, na Farmácia..."
                          rows={2}
                          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
                        />
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-primary-900">Parceiros</h2>
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
        <h2 className="mb-4 text-lg font-bold text-primary-900">Observações</h2>
        <textarea
          name="observacoes"
          rows={3}
          defaultValue={viagem.observacoes ?? ''}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900"
        />
      </section>

      <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-primary-900">Atendimentos e atividades</h2>
        <div className="flex flex-col gap-3" onChange={somarFaixasEtarias}>
          {ATENDIMENTOS_GRUPOS.map((grupo) => (
            <details
              key={grupo.titulo}
              open={grupo.destaque}
              className={
                grupo.destaque
                  ? 'rounded-xl border-2 border-primary-300 bg-primary-50/50 p-3'
                  : 'rounded-xl border border-slate-200 p-3'
              }
            >
              <summary
                className={
                  grupo.destaque
                    ? 'cursor-pointer text-base font-bold text-primary-900'
                    : 'cursor-pointer text-base font-semibold text-slate-700'
                }
              >
                {grupo.titulo}
              </summary>
              {grupo.dinamico ? (
                renderListaDinamica(grupo.dinamico)
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {grupo.campos.map((campo) => (
                    <label
                      key={campo.name}
                      className={
                        campo.destaque
                          ? 'flex flex-col gap-1 rounded-lg bg-primary-100 px-2 py-1.5 text-xs font-bold text-primary-900'
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
              )}
              {grupo.dinamicoExtra && (
                <div className="mt-4">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                    {grupo.dinamicoExtra.titulo}
                  </h4>
                  {renderListaDinamica(grupo.dinamicoExtra)}
                </div>
              )}
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
