
"use client";

import { useState } from "react";

type Reply = {
  id: number;
  author: string;
  text: string;
};

type Post = {
  id: number;
  author: string;
  text: string;
  likes: number;
  likedBy: string[];
  replies: Reply[];
  date: string;
};

type TCC = {
  id: number;
  title: string;
  author: string;
  fileName: string;
  url: string;
};

type Questionnaire = {
  id: number;
  title: string;
  description: string;
  link: string;
};

export default function Home() {
  const [page, setPage] = useState("inicio");
  const [studentName, setStudentName] = useState("Estudante Pesquisador");

  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      author: "Yasmin Alves",
      text: "Alguém está utilizando Scrum no desenvolvimento do TCC? Gostaria de trocar experiências sobre organização e levantamento de requisitos!",
      likes: 5,
      likedBy: [],
      replies: [
        {
          id: 1,
          author: "Emil Fiedler",
          text: "Estamos utilizando uma abordagem incremental no nosso projeto!",
        },
      ],
      date: "Publicação demonstrativa",
    },
  ]);

  const [postText, setPostText] = useState("");
  const [replyTexts, setReplyTexts] = useState<Record<number, string>>({});
  const [expandedReplies, setExpandedReplies] = useState<number[]>([1]);

  const [tccs, setTccs] = useState<TCC[]>([]);
  const [tccTitle, setTccTitle] = useState("");
  const [tccAuthors, setTccAuthors] = useState("");
  const [tccFile, setTccFile] = useState<File | null>(null);

  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [qTitle, setQTitle] = useState("");
  const [qDescription, setQDescription] = useState("");
  const [qLink, setQLink] = useState("");

  function publishPost() {
    if (!postText.trim()) return;

    const newPost: Post = {
      id: Date.now(),
      author: studentName,
      text: postText.trim(),
      likes: 0,
      likedBy: [],
      replies: [],
      date: "Agora mesmo",
    };

    setPosts((old) => [newPost, ...old]);
    setPostText("");
  }

  function toggleLike(postId: number) {
    if (!studentName.trim()) {
      alert("Informe seu nome no perfil primeiro.");
      return;
    }

    setPosts((old) =>
      old.map((post) => {
        if (post.id !== postId) return post;

        const alreadyLiked = post.likedBy.includes(studentName);

        if (alreadyLiked) {
          return {
            ...post,
            likes: Math.max(0, post.likes - 1),
            likedBy: post.likedBy.filter(
              (name) => name !== studentName
            ),
          };
        }

        return {
          ...post,
          likes: post.likes + 1,
          likedBy: [...post.likedBy, studentName],
        };
      })
    );
  }

  function addReply(postId: number) {
    const text = replyTexts[postId]?.trim();

    if (!text) return;

    setPosts((old) =>
      old.map((post) =>
        post.id === postId
          ? {
              ...post,
              replies: [
                ...post.replies,
                {
                  id: Date.now(),
                  author: studentName,
                  text,
                },
              ],
            }
          : post
      )
    );

    setReplyTexts((old) => ({
      ...old,
      [postId]: "",
    }));

    setExpandedReplies((old) =>
      old.includes(postId) ? old : [...old, postId]
    );
  }

  function addTCC() {
    if (!tccTitle.trim() || !tccAuthors.trim() || !tccFile) {
      alert("Preencha todos os campos e selecione o PDF.");
      return;
    }

    if (tccFile.type !== "application/pdf") {
      alert("Envie somente arquivos PDF.");
      return;
    }

    const url = URL.createObjectURL(tccFile);

    setTccs((old) => [
      {
        id: Date.now(),
        title: tccTitle,
        author: tccAuthors,
        fileName: tccFile.name,
        url,
      },
      ...old,
    ]);

    setTccTitle("");
    setTccAuthors("");
    setTccFile(null);

    alert("TCC adicionado à demonstração!");
  }

  function addQuestionnaire() {
    if (!qTitle.trim() || !qDescription.trim() || !qLink.trim()) {
      alert("Preencha todos os campos.");
      return;
    }

    try {
      const url = new URL(qLink);

      if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("Link inválido");
      }

      setQuestionnaires((old) => [
        {
          id: Date.now(),
          title: qTitle,
          description: qDescription,
          link: url.toString(),
        },
        ...old,
      ]);

      setQTitle("");
      setQDescription("");
      setQLink("");

      alert("Questionário divulgado!");
    } catch {
      alert("Informe um link válido.");
    }
  }

  const menu = [
    { id: "inicio", icon: "🏠", label: "Início" },
    { id: "feed", icon: "💬", label: "Feed acadêmico" },
    { id: "tccs", icon: "📚", label: "Repositório de TCCs" },
    { id: "questionarios", icon: "📊", label: "Questionários" },
    { id: "perfil", icon: "👤", label: "Meu perfil" },
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <span>🎓</span>
          <div>
            <h2>REDE ACADÊMICA</h2>
            <p>PLATAFORMA TCC</p>
          </div>
        </div>

        <div className="campus">
          IF BAIANO • CAMPUS URUÇUCA
        </div>

        <nav>
          {menu.map((item) => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              style={{
                background: page === item.id ? "#e7f5ec" : "transparent",
                color: page === item.id ? "#176b3a" : "#718078",
                fontWeight: page === item.id ? 800 : 600,
              }}
            >
              {item.icon} &nbsp; {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <strong>🎓 {studentName}</strong>
          <p>Comunidade acadêmica</p>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <strong>Rede Acadêmica TCC</strong>
          <div className="top-user">
            <span>●</span> Ambiente demonstrativo
          </div>
        </header>

        <main className="content">

          {page === "inicio" && (
            <>
              <section className="welcome">
                <span>IF BAIANO • CAMPUS URUÇUCA</span>
                <h1>Olá, estudante! 👋</h1>
                <h2>Bem-vindo à Rede Acadêmica.</h2>
                <p>
                  Um espaço para compartilhar conhecimentos,
                  divulgar pesquisas, encontrar referências
                  e colaborar com outros estudantes na
                  construção dos Trabalhos de Conclusão de Curso.
                </p>

                <button onClick={() => setPage("feed")}>
                  Explorar comunidade →
                </button>
              </section>

              <div className="stats">
                <div>
                  <strong>{posts.length}</strong>
                  <span>Publicações</span>
                </div>
                <div>
                  <strong>{tccs.length}</strong>
                  <span>TCCs cadastrados</span>
                </div>
                <div>
                  <strong>{questionnaires.length}</strong>
                  <span>Questionários</span>
                </div>
              </div>

              <h2 className="section-title">Acesse a plataforma</h2>

              <div className="card">
                <strong>💬 Feed acadêmico</strong>
                <p>Compartilhe ideias, tire dúvidas e interaja com outros pesquisadores.</p>
                <button onClick={() => setPage("feed")}>Acessar feed</button>
              </div>

              <div className="card">
                <strong>📚 Repositório de TCCs</strong>
                <p>Consulte trabalhos acadêmicos e disponibilize suas pesquisas autorizadas.</p>
                <button onClick={() => setPage("tccs")}>Acessar repositório</button>
              </div>

              <div className="card">
                <strong>📊 Questionários</strong>
                <p>Divulgue pesquisas e participe das coletas de dados da comunidade.</p>
                <button onClick={() => setPage("questionarios")}>Acessar questionários</button>
              </div>
            </>
          )}

          {page === "feed" && (
            <>
              <h1>Feed acadêmico 💬</h1>
              <p className="subtitle">
                Compartilhe ideias, dúvidas e novidades sobre seus projetos.
              </p>

              <div className="card">
                <h3>✍️ Criar publicação</h3>
                <textarea
                  placeholder="O que você gostaria de compartilhar?"
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                />
                <button onClick={publishPost}>Publicar →</button>
              </div>

              <h2 className="section-title">Mural da comunidade</h2>

              {posts.map((post) => {
                const liked = post.likedBy.includes(studentName);
                const expanded = expandedReplies.includes(post.id);

                return (
                  <article className="card" key={post.id}>
                    <div className="post-author">
                      <div className="profile-avatar">
                        {post.author.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong>{post.author}</strong>
                        <p>{post.date}</p>
                      </div>
                    </div>

                    <p>{post.text}</p>

                    <div className="post-actions">
                      <button
                        onClick={() => toggleLike(post.id)}
                        style={{
                          background: liked ? "#e7f5ec" : "#176b3a",
                          color: liked ? "#176b3a" : "white",
                        }}
                      >
                        {liked ? "♥ Curtido" : "♡ Curtir"} · {post.likes}
                      </button>

                      <button
                        onClick={() =>
                          setExpandedReplies((old) =>
                            old.includes(post.id)
                              ? old.filter((id) => id !== post.id)
                              : [...old, post.id]
                          )
                        }
                      >
                        💬 Responder · {post.replies.length}
                      </button>
                    </div>

                    {expanded && (
                      <div className="replies">
                        <h4>Respostas da publicação</h4>
                        {post.replies.map((reply) => (
                          <div className="reply" key={reply.id}>
                            <strong>{reply.author}</strong>
                            <p>{reply.text}</p>
                          </div>
                        ))}

                        <div className="reply-form">
                          <input
                            placeholder="Escreva sua resposta..."
                            value={replyTexts[post.id] || ""}
                            onChange={(e) =>
                              setReplyTexts((old) => ({
                                ...old,
                                [post.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") addReply(post.id);
                            }}
                          />
                          <button onClick={() => addReply(post.id)}>
                            Enviar
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </>
          )}

          {page === "tccs" && (
            <>
              <h1>Repositório de TCCs 📚</h1>
              <p className="subtitle">
                Compartilhe trabalhos acadêmicos autorizados
                e consulte pesquisas de outros estudantes.
              </p>

              <div className="card">
                <h3>📤 Cadastrar novo TCC</h3>

                <input
                  placeholder="Título completo do trabalho"
                  value={tccTitle}
                  onChange={(e) => setTccTitle(e.target.value)}
                />

                <input
                  placeholder="Nome dos autores"
                  value={tccAuthors}
                  onChange={(e) => setTccAuthors(e.target.value)}
                />

                <label className="file-upload">
                  📄 Selecionar arquivo PDF
                  <input
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) =>
                      setTccFile(e.target.files?.[0] || null)
                    }
                  />
                  {tccFile && <p>{tccFile.name}</p>}
                </label>

                <p>
                  Envie apenas trabalhos autorizados para divulgação.
                </p>

                <button onClick={addTCC}>
                  Disponibilizar trabalho
                </button>
              </div>

              <h2 className="section-title">Trabalhos disponíveis</h2>

              {tccs.length === 0 && (
                <div className="card">
                  <p>Nenhum TCC cadastrado nesta demonstração.</p>
                </div>
              )}

              {tccs.map((tcc) => (
                <div className="card" key={tcc.id}>
                  <span>📘 TCC AUTORIZADO</span>
                  <h3>{tcc.title}</h3>
                  <p>Autores: {tcc.author}</p>
                  <p>Arquivo: {tcc.fileName}</p>
                  <a href={tcc.url} target="_blank" rel="noreferrer">
                    📄 Abrir documento PDF →
                  </a>
                </div>
              ))}
            </>
          )}

          {page === "questionarios" && (
            <>
              <h1>Questionários 📊</h1>
              <p className="subtitle">
                Divulgue suas pesquisas e participe das investigações acadêmicas.
              </p>

              <div className="card">
                <h3>📢 Divulgar questionário</h3>

                <input
                  placeholder="Título da pesquisa"
                  value={qTitle}
                  onChange={(e) => setQTitle(e.target.value)}
                />

                <textarea
                  placeholder="Descreva o objetivo do questionário..."
                  value={qDescription}
                  onChange={(e) => setQDescription(e.target.value)}
                />

                <input
                  type="url"
                  placeholder="Link do Google Forms"
                  value={qLink}
                  onChange={(e) => setQLink(e.target.value)}
                />

                <button onClick={addQuestionnaire}>
                  Divulgar pesquisa
                </button>
              </div>

              <h2 className="section-title">Pesquisas disponíveis</h2>

              {questionnaires.length === 0 && (
                <div className="card">
                  <p>Nenhuma pesquisa cadastrada.</p>
                </div>
              )}

              {questionnaires.map((q) => (
                <div className="card" key={q.id}>
                  <span>📊 COLETA DE DADOS</span>
                  <h3>{q.title}</h3>
                  <p>{q.description}</p>
                  <a href={q.link} target="_blank" rel="noreferrer">
                    Responder pesquisa →
                  </a>
                </div>
              ))}
            </>
          )}

          {page === "perfil" && (
            <>
              <h1>Meu perfil 👤</h1>
              <p className="subtitle">
                Informações do estudante.
              </p>

              <div className="card profile">
                <div className="profile-avatar">
                  {studentName.charAt(0).toUpperCase()}
                </div>

                <h2>{studentName}</h2>
                <p>Estudante pesquisador</p>

                <label>Nome do estudante</label>

                <input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Digite seu nome"
                />

                <p>
                  Instituição: IF Baiano – Campus Uruçuca
                </p>

                <p>Curso: Técnico em Informática</p>

                <p>
                  Publicações realizadas:{" "}
                  {posts.filter((p) => p.author === studentName).length}
                </p>

                <p>
                  Curtidas realizadas:{" "}
                  {posts.filter((p) => p.likedBy.includes(studentName)).length}
                </p>
              </div>
            </>
          )}

          <footer>
            Rede Acadêmica TCC • IF Baiano Campus Uruçuca
            <br />
            Plataforma de colaboração e pesquisa acadêmica.
          </footer>
        </main>
      </div>
    </div>
  );
}
