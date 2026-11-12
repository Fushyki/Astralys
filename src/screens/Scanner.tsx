/** Aba Scanner: explica, passo a passo, o programa que lê os artefatos na tela do jogo e gera o arquivo para importar. */
import { Link } from 'react-router-dom';
import { AppHeader } from '../app/AppHeader';
import '../design/design.css';
import './scanner.css';

const VOCE_FAZ = [
  'Abra o Genshin Impact em modo janela ou janela sem bordas (tela cheia exclusiva não pode ser lida).',
  'Deixe o jogo no idioma que o scanner aceita (veja "Idioma" abaixo).',
  'Abra o Inventário e entre na aba de Artefatos, com a lista na primeira linha, sem nenhum artefato selecionado.',
  'Execute o scanner como administrador e escolha os filtros (nível mínimo, raridade, sets).',
  'Clique em Iniciar e tire as mãos do mouse e do teclado até o fim.',
  'Quando terminar, o scanner salva o arquivo, apaga a si mesmo e você importa o arquivo no Inventário do Astralys.',
];

const PROGRAMA_FAZ = [
  'Encontra a janela do jogo e mede o tamanho dela (funciona em qualquer resolução e proporção).',
  'Tira um print do artefato selecionado e lê o texto: set, posição, atributo principal, substatus, nível e estrelas.',
  'Lê também quem está com o artefato equipado.',
  'Descarta o artefato se ele não passar nos seus filtros.',
  'Clica no próximo artefato da lista e repete.',
  'Ao chegar ao fim da tela, rola a lista e continua até o último artefato.',
  'Grava tudo num arquivo, apaga a si mesmo e fecha.',
];

const AVISOS = [
  'Não mexa no mouse nem no teclado enquanto o scanner roda: os cliques dele e os seus se misturam e a leitura sai errada.',
  'Não troque de janela nem deixe outro programa passar por cima do jogo.',
  'Para parar, use a tecla de emergência mostrada na tela do scanner.',
  'O scanner só olha a imagem da tela e clica, como você faria. Ele não lê a memória, não altera arquivos do jogo e não se conecta à sua conta.',
  'Mesmo assim, programas que automatizam cliques ficam numa zona cinzenta dos termos do jogo. Use por sua conta e risco.',
];

/** Mensagens que o programa mostra antes de iniciar (verificação) e o que o usuário deve fazer. */
const ERROS: { erro: string; solucao: string }[] = [
  { erro: 'Não encontrei o jogo.', solucao: 'Abra o Genshin Impact e deixe a janela aberta (não minimizada).' },
  { erro: 'O jogo está em tela cheia exclusiva.', solucao: 'Nas configurações gráficas, troque para Janela ou Janela sem bordas.' },
  { erro: 'Sem permissão para clicar no jogo.', solucao: 'Feche o scanner e abra de novo com "Executar como administrador".' },
  { erro: 'Não achei a tela de Artefatos.', solucao: 'Abra o Inventário, entre na aba Artefatos e deixe a lista visível, sem nenhum artefato aberto em outra tela.' },
  { erro: 'Não consegui ler o texto do artefato.', solucao: 'Confira se o jogo está em inglês, com a janela inteira visível e sem outro programa por cima.' },
  { erro: 'A janela do jogo é pequena demais.', solucao: 'Aumente a janela do jogo (o mínimo é mostrado na mensagem).' },
  { erro: 'O scanner parou: a tela mudou no meio da leitura.', solucao: 'Você mexeu no mouse ou no teclado, ou outra janela passou por cima. Volte ao início da lista e inicie de novo.' },
];

function Lista({ itens, numerada }: { itens: string[]; numerada?: boolean }) {
  const Tag = numerada ? 'ol' : 'ul';
  return <Tag className="sc-list">{itens.map((t) => <li key={t}>{t}</li>)}</Tag>;
}

const DOWNLOAD = 'https://github.com/Fushyki/Astralys/releases/download/scanner-v0.1.0-beta/AstralysScanner.exe'
const FONTE = 'https://github.com/Fushyki/Astralys/tree/main/scanner'
const HASH = '2ee609a61fcec1bd7f71ae940f344792c739043f7d317d8aa5976fc477186a06'

export default function Scanner() {
  return (
    <div className="dz">
      <AppHeader />
      <main className="dz-page sc-page">
        <section className="dz-pagehead">
          <div className="titles">
            <h1 className="h1">Scanner de artefatos</h1>
            <span className="muted">Lê todos os artefatos direto da tela do jogo e leva para o seu Inventário.</span>
          </div>
          <div className="actions">
            <a className="dz-btn gold" href={DOWNLOAD} download>Baixar scanner (beta)</a>
            <Link className="dz-btn" to="/inventario">Importar arquivo</Link>
          </div>
        </section>

        <section className="dz-panel sc-warn">
          <h2 className="h2">Versão beta</h2>
          <p className="muted">Esta versão ainda está em teste: pode errar a leitura de alguns artefatos (ela marca os duvidosos no arquivo) e só foi calibrada em 1600x900. O Windows pode mostrar “editor desconhecido” (SmartScreen) porque o programa não tem certificado pago. Ele não usa a internet; o código está aberto em <a href={FONTE} target="_blank" rel="noreferrer">GitHub</a>. Confira o arquivo baixado (SHA-256): <code>{HASH}</code></p>
        </section>

        <div className="sc-grid">
          <section className="dz-panel"><h2 className="h2">O que você faz</h2><Lista itens={VOCE_FAZ} numerada /></section>
          <section className="dz-panel"><h2 className="h2">O que o programa faz na sua tela</h2><Lista itens={PROGRAMA_FAZ} numerada /></section>
          <section className="dz-panel sc-warn"><h2 className="h2">Avisos</h2><Lista itens={AVISOS} /></section>
          <section className="dz-panel">
            <h2 className="h2">Idioma e tamanho de tela</h2>
            <Lista itens={[
              'Idioma: a primeira versão lê o jogo em inglês. Outros idiomas entram depois, um a um.',
              'Tamanho de tela: o scanner mede a janela do jogo e se adapta. Se não achar a interface, ele diz o que ajustar.',
              'Sempre baixe aqui: o site serve a versão mais nova, e versões antigas são recusadas na importação.',
            ]} />
          </section>
          <section className="dz-panel sc-erros">
            <h2 className="h2">Se der erro</h2>
            <p className="muted">Antes de começar, o scanner confere tudo isso e só inicia quando estiver certo. Se parar no meio, mostra o motivo na tela e grava um arquivo de registro ao lado dele.</p>
            <ul className="sc-list">
              {ERROS.map((e) => <li key={e.erro}><strong>{e.erro}</strong> {e.solucao}</li>)}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
