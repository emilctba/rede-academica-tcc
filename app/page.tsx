"use client";

import { useState } from "react";

export default function Home() {
  const [pagina, setPagina] = useState("inicio");
  const [nome, setNome] = useState("Estudante");
  const [publicacoes, setPublicacoes] = useState([
    {
      id: 1,
      autor: "Yasmin Alves",
      texto: "Alguém está utilizando Scrum no desenvolvimento do TCC?",
      curtidas: 5,
    },
  ]);

  const [texto, setTexto] = useState("");

  const [tccs, setTccs] = useState<
    { titulo: string; autor: string; arquivo: string }[]
  >([]);

  const [questionarios, setQuestionarios] = useState<
    { titulo: string; link: string }[]
  >([]);

  const [tituloTcc, setTituloTcc] = useState("");
  const [autorTcc, setAutorTcc] = useState("");
  const [arquivoTcc, setArquivoTcc] = useState<File | null>(null);

  const [tituloPesquisa, setTituloPesquisa] = useState("");
  const [linkPesquisa, setLinkPesquisa] = useState("");

  function publicar() {
    if (!texto.trim()) return;

    setPublicacoes([
      {
        id: Date.now(),
        autor: nome,
        texto,
        curtidas: 0,
      },
      ...publicacoes,
    ]);

    setTexto("");
  }

  function cadastrarTcc() {
    if (!tituloTcc || !autorTcc || !arquivoTcc) {
      alert("Preencha todos os campos!");
      return;
    }

    if (arquivoTcc.type !== "application/pdf") {
      alert("Envie somente arquivos PDF!");
      return;
    }

    if (arquivoTcc.size > 15 * 1024 * 1024) {
      alert("O PDF deve ter no máximo 15 MB!");
      return;
    }

    const url = URL.createObjectURL(arquivoTcc);

    setTccs([
      ...tccs,
      {
        titulo: tituloTcc,
        autor: autorTcc,
        arquivo: url,
      },
    ]);

    setTituloTcc("");
    setAutorTcc("");
    setArquivoTcc(null);

    alert("TCC cadastrado!");
  }

  function divulgarPesquisa() {
    if (!tituloPesquisa || !linkPesquisa) {
      alert("Preencha todos os campos!");
      return;
    }

    setQuestionarios([
      ...questionarios,
      {
        titulo: tituloPesquisa,
        link: linkPesquisa,
      },
    ]);

    setTituloPesquisa("");
    setLinkPesquisa("");

    alert("Questionário divulgado!");
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <span>✦</span>
          <div>
            <h2>REDE ACADÊMICA</h2>
            <p>PLATAFORMA TCC</p>
          </div>
        </div>

        <div className="campus">
          IF BAIANO • URUÇUCA
        </div>

        <nav>
          <button onClick={() => setPagina("inicio")}>
            ◈ Visão geral
          </button>

          <button onClick={() => setPagina("feed")}>
            ▤ Feed acadêmico
          </button>

          <button onClick={() => setPagina("tccs")}>
            ▣ Repositório de TCCs
          </button>

          <button onClick={() => setPagina("pesquisas")}>
            ▥ Questionários
          </button>

          <button onClick={() => setPagina("perfil")}>
            ◉ Meu perfil
          </button>
        </nav>

        <div className="sidebar-footer">
          <strong>{nome}</strong>
          <p>Estudante pesquisador</p>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <span>IF BAIANO / </span>
            <strong>
              {pagina === "inicio"
                ? "Visão geral"
                : pagina === "feed"
                ? "Feed acadêmico"
                : pagina === "tccs"
                ? "Repositório TCCs"
                : pagina === "pesquisas"
                ? "Questionários"
                : "Meu perfil"}
            </strong>
          </div>

          <div className="top-user">
            <span>●</span>
            {nome}
          </div>
        </header>

        <section className="content">

          {pagina === "inicio" && (
            <>
              <div className="welcome">
                <span>COMUNIDADE ACADÊMICA</span>
                <h1>Olá, {nome}!</h1>
                <h2>Vamos desenvolver conhecimento?</h2>
                <p>
                  Compartilhe ideias, encontre pesquisas e
                  acompanhe projetos acadêmicos.
                </p>

                <button onClick={() => setPagina("feed")}>
                  Explorar comunidade →
                </button>
              </div>

              <div className="stats">
                <div>
                  <strong>{publicacoes.length}</strong>
                  <span>Publicações</span>
                </div>

                <div>
                  <strong>{tccs.length}</strong>
                  <span>TCCs cadastrados</span>
                </div>

                <div>
                  <strong>{questionarios.length}</strong>
                  <span>Questionários</span>
                </div>
              </div>

              <h2 className="section-title">
                Últimas publicações
              </h2>

              {publicacoes.slice(0, 3).map((p) => (
                <article className="card" key={p.id}>
                  <strong>{p.autor}</strong>
                  <p>{p.texto}</p>
                  <span>♡ {p.curtidas} curtidas</span>
                </article>
              ))}
            </>
          )}

          {pagina === "feed" && (
            <>
              <h1>Feed acadêmico</h1>
              <p className="subtitle">
                Converse com outros estudantes e compartilhe
                suas experiências.
              </p>

              <div className="card">
                <h3>Nova publicação</h3>

                <textarea
                  placeholder="O que você deseja compartilhar?"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                />

                <button onClick={publicar}>
                  Publicar
                </button>
              </div>

              {publicacoes.map((p) => (
                <article className="card" key={p.id}>
                  <strong>{p.autor}</strong>
                  <p>{p.texto}</p>
                  <button
                    onClick={() =>
                      setPublicacoes(
                        publicacoes.map((item) =>
                          item.id === p.id
                            ? {
                                ...item,
                                curtidas: item.curtidas + 1,
                              }
                            : item
                        )
                      )
                    }
                  >
                    ♡ Curtir ({p.curtidas})
                  </button>
                </article>
              ))}
            </>
          )}

          {pagina === "tccs" && (
            <>
              <h1>Repositório de TCCs</h1>
              <p className="subtitle">
                Compartilhe trabalhos acadêmicos autorizados.
              </p>

              <div className="card">
                <h3>Cadastrar novo TCC</h3>

                <input
                  placeholder="Título do trabalho"
                  value={tituloTcc}
                  onChange={(e) => setTituloTcc(e.target.value)}
                />

                <input
                  placeholder="Nome dos autores"
                  value={autorTcc}
                  onChange={(e) => setAutorTcc(e.target.value)}
                />

                <label className="file-upload">
                  📄 Selecionar arquivo PDF

                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) =>
                      setArquivoTcc(e.target.files?.[0] || null)
                    }
                  />
                </label>

                {arquivoTcc && (
                  <p>Arquivo: {arquivoTcc.name}</p>
                )}

                <button onClick={cadastrarTcc}>
                  Enviar trabalho
                </button>
              </div>

              <h2 className="section-title">
                Trabalhos disponíveis
              </h2>

              {tccs.map((tcc, i) => (
                <article className="card" key={i}>
                  <h3>{tcc.titulo}</h3>
                  <p>Autores: {tcc.autor}</p>

                  <a
                    href={tcc.arquivo}
                    target="_blank"
                    rel="noreferrer"
                  >
                    📄 Abrir PDF
                  </a>
                </article>
              ))}
            </>
          )}

          {pagina === "pesquisas" && (
            <>
              <h1>Questionários</h1>
              <p className="subtitle">
                Divulgue suas pesquisas acadêmicas.
              </p>

              <div className="card">
                <h3>Nova pesquisa</h3>

                <input
                  placeholder="Título da pesquisa"
                  value={tituloPesquisa}
                  onChange={(e) => setTituloPesquisa(e.target.value)}
                />

                <input
                  placeholder="Link do Google Forms"
                  value={linkPesquisa}
                  onChange={(e) => setLinkPesquisa(e.target.value)}
                />

                <button onClick={divulgarPesquisa}>
                  Divulgar questionário
                </button>
              </div>

              {questionarios.map((q, i) => (
                <article className="card" key={i}>
                  <h3>{q.titulo}</h3>
                  <a href={q.link} target="_blank" rel="noreferrer">
                    Responder pesquisa →
                  </a>
                </article>
              ))}
            </>
          )}

          {pagina === "perfil" && (
            <>
              <h1>Meu perfil</h1>

              <div className="card profile">
                <div className="profile-avatar">
                  {nome.substring(0, 2).toUpperCase()}
                </div>

                <h2>{nome}</h2>
                <p>Estudante do IF Baiano</p>

                <label>Nome do estudante</label>

                <input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />

                <button onClick={() => alert("Perfil atualizado!")}>
                  Salvar perfil
                </button>
              </div>
            </>
          )}

        </section>

        <footer>
          Rede Acadêmica TCC • IF Baiano Campus Uruçuca
        </footer>
      </main>
    </div>
  );
}
