#!/usr/bin/env node
/**
 * Gera o hash bcrypt de uma senha, pelo MESMO caminho que a API usa.
 *
 * O custo vem de `SALT_ROUNDS` do .env (padrao 10), igual a `BcryptUtils`. Se
 * o utilitario usasse um custo fixo, o hash continuaria valido (o custo fica
 * gravado dentro do proprio hash), mas deixaria de refletir a configuracao do
 * ambiente — e mudar SALT_ROUNDS passaria a nao valer para senha criada aqui.
 *
 * O .env e resolvido a partir da PASTA DO SCRIPT, nao do diretorio atual:
 * assim funciona chamando de qualquer lugar do servidor.
 *
 *   node scripts/hash-password.js 'minhaSenha'     # direto
 *   node scripts/hash-password.js                  # pergunta sem exibir
 *   echo -n 'minhaSenha' | node scripts/hash-password.js
 *   node scripts/hash-password.js --check 'minhaSenha' '$2b$15$...'
 */
const path = require('path');
require('dotenv').config({
  path: path.resolve(__dirname, '..', '.env'),
  quiet: true,
});

const bcrypt = require('bcrypt');
const readline = require('readline');

const CUSTO = parseInt(process.env.SALT_ROUNDS || '10', 10);

/** bcrypt ignora silenciosamente o que passar de 72 bytes. */
const LIMITE_BYTES = 72;

function uso() {
  console.log(`
Uso:
  node scripts/hash-password.js 'senha'                  gera o hash
  node scripts/hash-password.js                          pergunta a senha (sem eco)
  echo -n 'senha' | node scripts/hash-password.js        le da entrada padrao
  node scripts/hash-password.js --check 'senha' 'hash'   confere se batem
`);
}

/** Pergunta sem ecoar. Passar a senha como argumento a deixa no histórico do shell. */
function perguntarSenha(rotulo) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });

    process.stdout.write(rotulo);
    // Escreve o rotulo ANTES de silenciar: `_writeToOutput` engole tudo,
    // inclusive o proprio prompt. E API interna do readline, mas e a forma
    // usual de esconder digitacao em Node sem dependencia extra.
    rl._writeToOutput = () => {};

    rl.question('', (resposta) => {
      rl.close();
      process.stdout.write('\n');
      resolve(resposta);
    });
  });
}

function lerEntradaPadrao() {
  return new Promise((resolve) => {
    let dados = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (pedaco) => (dados += pedaco));
    // Tira apenas a quebra final que o `echo` acrescenta — espacos no meio ou
    // nas pontas podem ser parte legitima da senha.
    process.stdin.on('end', () => resolve(dados.replace(/\r?\n$/, '')));
  });
}

async function obterSenha(argumento) {
  if (argumento !== undefined) return argumento;
  return process.stdin.isTTY ? perguntarSenha('Senha: ') : lerEntradaPadrao();
}

function validar(senha) {
  if (!senha) {
    console.error('Erro: senha vazia.');
    process.exit(1);
  }

  const bytes = Buffer.byteLength(senha, 'utf8');
  if (bytes > LIMITE_BYTES) {
    console.error(
      `Erro: a senha tem ${bytes} bytes e o bcrypt so considera os primeiros ` +
        `${LIMITE_BYTES}. O restante seria ignorado em silencio.`,
    );
    process.exit(1);
  }
}

async function gerar(senha) {
  validar(senha);

  const inicio = Date.now();
  const salt = await bcrypt.genSalt(CUSTO);
  const hash = await bcrypt.hash(senha, salt);
  const decorrido = Date.now() - inicio;

  console.log('');
  console.log(hash);
  console.log('');
  console.log(`custo (SALT_ROUNDS): ${CUSTO}   tempo: ${decorrido} ms`);
  if (decorrido > 1000) {
    console.log(
      'Aviso: cada login gasta esse mesmo tempo comparando a senha. ' +
        'Custo 12 ja e considerado forte.',
    );
  }
}

async function conferir(senha, hash) {
  if (!senha || !hash) {
    console.error('Erro: --check exige a senha e o hash.');
    uso();
    process.exit(1);
  }

  const confere = await bcrypt.compare(senha, hash);
  console.log(confere ? 'CONFERE' : 'NAO CONFERE');
  process.exit(confere ? 0 : 1);
}

async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--help' || args[0] === '-h') return uso();
  if (args[0] === '--check') return conferir(args[1], args[2]);

  return gerar(await obterSenha(args[0]));
}

main().catch((erro) => {
  console.error('Falhou:', erro.message);
  process.exit(1);
});
